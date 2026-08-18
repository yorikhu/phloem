/**
 * RetrievalComposer — Codex-style prompt box.
 *
 * Card container with auto-growing textarea, bottom-left scope/strategy
 * controls and bottom-right voice + send actions. Reads theme tokens
 * (--ph-*) so it works on both dark and light palettes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Tooltip, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  ArrowUpOutlined,
  AudioOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { Dataset, RetrievalStrategy } from '@phloem/shared';
import { useI18n } from '../i18n/index.js';

const STRATEGY_ICON: Record<RetrievalStrategy, React.ReactNode> = {
  hybrid: <ExperimentOutlined />,
  vector: <ArrowUpOutlined rotate={45} />,
  keyword: <StopOutlined rotate={45} />,
};

/** Capitalized strategy key → i18n key suffix (hybrid → Hybrid). */
function strategyKeySuffix(s: RetrievalStrategy): string {
  return `${s[0]!.toUpperCase()}${s.slice(1)}`;
}

const MAX_TEXTAREA_HEIGHT = 200;

interface RetrievalComposerProps {
  datasets: Dataset[];
  selectedDatasets: string[];
  onSelectedDatasetsChange: (ids: string[]) => void;
  strategy: RetrievalStrategy;
  onStrategyChange: (s: RetrievalStrategy) => void;
  value: string;
  onValueChange: (v: string) => void;
  onSearch: () => void;
  searching: boolean;
}

export default function RetrievalComposer({
  datasets,
  selectedDatasets,
  onSelectedDatasetsChange,
  strategy,
  onStrategyChange,
  value,
  onValueChange,
  onSearch,
  searching,
}: RetrievalComposerProps) {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Auto-growing textarea ──
  // Two-line minimum (rows=2), grows with content up to MAX, then scrolls.
  // Scrollbar only appears once the cap is hit — never on init.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const capped = el.scrollHeight > MAX_TEXTAREA_HEIGHT;
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    el.style.overflowY = capped ? 'auto' : 'hidden';
  }, [value]);

  // ── Voice input (Web Speech API, best effort) ──
  const speechRef = useRef<{ recognition: SpeechRecognitionLike | null; active: boolean }>({
    recognition: null,
    active: false,
  });
  const [listening, setListening] = useState(false);
  const speechSupported = useMemo(() => {
    const w = window as typeof window & {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }, []);

  const toggleVoice = useCallback(() => {
    if (!speechSupported) {
      void message.warning(t('retrieval.voiceUnsupported'));
      return;
    }
    if (speechRef.current.active) {
      speechRef.current.recognition?.stop();
      return;
    }
    const w = window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = navigator.language || 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i]?.[0]?.transcript ?? '';
      }
      onValueChange(text);
    };
    recognition.onend = () => {
      speechRef.current.active = false;
      setListening(false);
    };
    recognition.onerror = () => {
      speechRef.current.active = false;
      setListening(false);
    };
    speechRef.current = { recognition, active: true };
    setListening(true);
    recognition.start();
  }, [speechSupported, onValueChange, t]);

  const scopeLabel =
    selectedDatasets.length === 0
      ? t('retrieval.scopeAll')
      : t('retrieval.scopeN', { count: selectedDatasets.length });

  const strategyLabel = (s: RetrievalStrategy) =>
    t(`retrieval.strategy${strategyKeySuffix(s)}` as never);

  const strategyMenu: MenuProps['items'] = (['hybrid', 'vector', 'keyword'] as const).map((s) => ({
    key: s,
    label: (
      <span style={{ fontSize: 13 }}>
        {STRATEGY_ICON[s]} {strategyLabel(s)}
      </span>
    ),
  }));

  const canSend = value.trim().length > 0 && !searching;

  return (
    <div
      className="ph-composer"
      style={{
        background: 'var(--ph-bg-surface)',
        border: '1px solid var(--ph-border-default)',
        borderRadius: 'var(--ph-radius)',
        boxShadow: 'var(--ph-shadow-popup)',
        padding: '12px 12px 8px',
        transition: 'border-color var(--ph-transition-fast)',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends; Ctrl/Cmd+Enter (or Shift+Enter) inserts a newline.
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.shiftKey)) {
            return; // native newline
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            if (canSend) onSearch();
          }
        }}
        placeholder={t('retrieval.placeholder')}
        rows={2}
        style={{
          display: 'block',
          width: '100%',
          resize: 'none',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'var(--ph-text-primary)',
          fontSize: 14,
          lineHeight: 1.6,
          padding: '6px 6px 16px',
          fontFamily: 'inherit',
          minHeight: 0,
          maxHeight: MAX_TEXTAREA_HEIGHT,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Bottom-left: scope + strategy */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
          <Dropdown
            trigger={['click']}
            menu={{
              selectable: true,
              multiple: true,
              items: datasets.map((d) => ({
                key: d.id,
                label: <span style={{ fontSize: 13 }}>{d.name}</span>,
              })),
              selectedKeys: selectedDatasets,
              // Selecting items toggles scope; closing menu keeps whatever is
              // checked (empty selection = all datasets).
              onClick: ({ key }) => {
                const next = selectedDatasets.includes(key)
                  ? selectedDatasets.filter((id) => id !== key)
                  : [...selectedDatasets, key];
                onSelectedDatasetsChange(next);
              },
            }}
          >
            <Button size="small" type="text" icon={<DatabaseOutlined />}>
              <span style={{ fontSize: 12, color: 'var(--ph-text-secondary)' }}>{scopeLabel}</span>
            </Button>
          </Dropdown>

          <Dropdown
            trigger={['click']}
            menu={{
              items: strategyMenu,
              selectedKeys: [strategy],
              onClick: ({ key }) => onStrategyChange(key as RetrievalStrategy),
            }}
          >
            <Button size="small" type="text" icon={STRATEGY_ICON[strategy]}>
              <span style={{ fontSize: 12, color: 'var(--ph-text-secondary)' }}>
                {strategyLabel(strategy)}
              </span>
            </Button>
          </Dropdown>
        </div>

        {/* Bottom-right: voice + send */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Tooltip title={listening ? t('retrieval.voiceStop') : t('retrieval.voiceStart')}>
            <Button
              size="small"
              type="text"
              danger={listening}
              icon={<AudioOutlined className={listening ? 'ph-voice-listening' : undefined} />}
              onClick={toggleVoice}
            />
          </Tooltip>
          <Tooltip title={t('retrieval.sendHint')}>
            <Button
              size="small"
              type="primary"
              shape="circle"
              icon={<ArrowUpOutlined />}
              disabled={!canSend}
              onClick={onSearch}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

/** Minimal structural type for the Web Speech API (not in lib.dom for all targets). */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
