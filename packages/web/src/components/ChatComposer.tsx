/**
 * ChatComposer — Codex-style prompt box for chat.
 *
 * Shares the same visual language and keyboard shortcuts as
 * RetrievalComposer: card container, auto-growing textarea,
 * dataset scope (left), voice + send (right).
 */

import { useEffect, useRef, useState } from 'react';
import { Button, Popover, Tooltip } from 'antd';
import { ArrowUpOutlined, AudioOutlined, DatabaseOutlined } from '@ant-design/icons';
import type { Dataset } from '@phloem/shared';
import { useI18n } from '../i18n/index.js';
import { matchesCombo, useHotkeys } from '../hotkeys/index.js';
import DatasetScopePanel from './composer/DatasetScopePanel.js';
import { useVoiceInput } from './composer/useVoiceInput.js';

const MAX_TEXTAREA_HEIGHT = 200;

interface ChatComposerProps {
  datasets: Dataset[];
  selectedDatasets: string[];
  onSelectedDatasetsChange: (ids: string[]) => void;
  value: string;
  onValueChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
}

export default function ChatComposer({
  datasets,
  selectedDatasets,
  onSelectedDatasetsChange,
  value,
  onValueChange,
  onSend,
  sending,
}: ChatComposerProps) {
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

  // ── Voice input ──
  const { listening, toggle: toggleVoice } = useVoiceInput({
    onResult: onValueChange,
    unsupportedMessage: t('retrieval.voiceUnsupported'),
  });

  const scopeLabel =
    selectedDatasets.length === 0
      ? t('retrieval.scopeAll')
      : t('retrieval.scopeN', { count: selectedDatasets.length });

  const canSend = value.trim().length > 0 && !sending;

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
          // or Shift+Enter inserts a newline. IME composing is respected.
          if (e.nativeEvent.isComposing || e.shiftKey || matchesCombo(e, hotkeys.composerNewline)) {
            if (!e.nativeEvent.isComposing) {
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
            }
            return;
          }
          e.preventDefault();
          if (canSend) onSend();
        }}
        placeholder={t('chat.placeholder')}
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
        {/* Bottom-left: scope */}
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
          <Tooltip title={t('chat.sendHint')}>
            <Button
              size="small"
              type="primary"
              shape="circle"
              icon={<ArrowUpOutlined />}
              disabled={!canSend}
              onClick={onSend}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
