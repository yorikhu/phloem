/**
 * RetrievalComposer — Codex-style prompt box.
 *
 * Card container with auto-growing textarea, bottom-left scope/strategy
 * controls and bottom-right voice + send actions. Reads theme tokens
 * (--ph-*) so it works on both dark and light palettes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Dropdown, Input, Popover, Tooltip, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  ArrowUpOutlined,
  AudioOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  SearchOutlined,
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
const SCOPE_LIST_MAX_HEIGHT = 264;

/**
 * Scope panel content: search row on top, checkable dataset list below.
 * Search filters the list live; empty selection means "all datasets".
 */
function DatasetScopePanel({
  datasets,
  selected,
  onChange,
}: {
  datasets: Dataset[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useI18n();
  const [keyword, setKeyword] = useState('');

  const normalized = keyword.trim().toLowerCase();
  const filtered = normalized
    ? datasets.filter((d) => d.name.toLowerCase().includes(normalized))
    : datasets;

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Input
        size="small"
        allowClear
        prefix={<SearchOutlined style={{ color: 'var(--ph-text-tertiary)' }} />}
        placeholder={t('retrieval.scopeSearch')}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div
        style={{
          maxHeight: SCOPE_LIST_MAX_HEIGHT,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          marginTop: 2,
        }}
      >
        {filtered.length === 0 ? (
          <div className="ph-scope-empty">{t('retrieval.scopeNoMatch')}</div>
        ) : (
          filtered.map((d) => (
            <div
              key={d.id}
              className="ph-scope-item"
              onClick={() => toggle(d.id)}
              role="option"
              aria-selected={selected.includes(d.id)}
            >
              <Checkbox checked={selected.includes(d.id)} tabIndex={-1} />
              <span className="ph-scope-item-name" title={d.name}>
                {d.name}
              </span>
              <span className="ph-scope-count">{d.documentCount}</span>
            </div>
          ))
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--ph-border-subtle)',
          paddingTop: 6,
          marginTop: 2,
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--ph-text-tertiary)' }}>
          {selected.length === 0
            ? t('retrieval.scopeAll')
            : t('retrieval.scopeSelected', { count: selected.length })}
        </span>
        {selected.length > 0 && (
          <Button size="small" type="text" style={{ fontSize: 11 }} onClick={() => onChange([])}>
            {t('retrieval.scopeClear')}
          </Button>
        )}
      </div>
    </div>
  );
}

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
  const [scopeOpen, setScopeOpen] = useState(false);

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
        borderRadius: 'var(--ph-radius-lg)',
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
          if (e.key !== 'Enter') return;
          // Enter sends; Ctrl/Cmd/Shift+Enter inserts a newline. Only
          // Shift+Enter is native in browsers, so insert the break manually
          // (execCommand keeps the undo stack; fall back to value splice).
          if (e.ctrlKey || e.metaKey || e.shiftKey) {
            e.preventDefault();
            const el = e.currentTarget;
            const inserted = document.execCommand('insertLineBreak');
            if (!inserted) {
              const { selectionStart, selectionEnd, value } = el;
              onValueChange(`${value.slice(0, selectionStart)}\n${value.slice(selectionEnd)}`);
              requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = selectionStart + 1;
              });
            }
            return;
          }
          e.preventDefault();
          if (canSend) onSearch();
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
          <Popover
            trigger="click"
            placement="topLeft"
            open={scopeOpen}
            onOpenChange={setScopeOpen}
            styles={{ body: { padding: 8, width: 280 } }}
            content={
              <DatasetScopePanel
                datasets={datasets}
                selected={selectedDatasets}
                onChange={onSelectedDatasetsChange}
              />
            }
          >
            <Button size="small" type="text" icon={<DatabaseOutlined />}>
              <span style={{ fontSize: 12, color: 'var(--ph-text-secondary)' }}>{scopeLabel}</span>
            </Button>
          </Popover>

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
