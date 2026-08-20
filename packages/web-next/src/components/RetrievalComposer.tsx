/**
 * RetrievalComposer — Codex-style prompt box for retrieval.
 *
 * Card container with auto-growing textarea, bottom-left scope/strategy
 * controls and bottom-right voice + send actions. Reads theme tokens
 * (--ph-*) so it works on both dark and light palettes.
 */

import { useEffect, useRef, useState } from 'react';
import { Button, Dropdown, Popover, Tooltip } from 'antd';
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
import { matchesCombo, useHotkeys } from '../hotkeys/index.js';
import DatasetScopePanel from './composer/DatasetScopePanel.js';
import { useVoiceInput } from './composer/useVoiceInput.js';

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
  const { hotkeys } = useHotkeys();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scopeOpen, setScopeOpen] = useState(false);

  // ── Auto-growing textarea ──
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const capped = el.scrollHeight > MAX_TEXTAREA_HEIGHT;
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    el.style.overflowY = capped ? 'auto' : 'hidden';
  }, [value]);

  // ── Voice input (Web Speech API, best effort) ──
  const { listening, toggle: toggleVoice } = useVoiceInput({
    onResult: onValueChange,
    unsupportedMessage: t('retrieval.voiceUnsupported'),
  });

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
          // Enter sends; the configured newline combo (default ⌘/Ctrl+Enter)
          // or Shift+Enter inserts a newline. Only Shift+Enter is native in
          // browsers, so insert the break manually (execCommand keeps the
          // undo stack; fall back to value splice).
          if (e.shiftKey || matchesCombo(e, hotkeys.composerNewline)) {
            e.preventDefault();
            const el = e.currentTarget;
            const inserted = document.execCommand('insertLineBreak');
            if (!inserted) {
              const { selectionStart, selectionEnd, value: val } = el;
              onValueChange(`${val.slice(0, selectionStart)}\n${val.slice(selectionEnd)}`);
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
