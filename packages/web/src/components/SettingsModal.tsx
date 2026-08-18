/**
 * SettingsModal — language and shortcut configuration.
 *
 * Language: instant switch, persisted via i18n core.
 * Shortcuts: list of actions with current combo; click a row to start
 * recording, press a new mod-combo to save (conflicts rejected inline).
 */

import { useEffect, useState } from 'react';
import { Modal, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useI18n } from '../i18n/index.js';
import { comboFromEvent, formatCombo, useHotkeys, type HotkeyAction } from '../hotkeys/index.js';

type Recording = { action: HotkeyAction } | null;

const HOTKEY_ROWS: { action: HotkeyAction; labelKey: 'settings.hotkeySearch' }[] = [
  { action: 'openSearch', labelKey: 'settings.hotkeySearch' },
];

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale, setLocale } = useI18n();
  const { hotkeys, setCombo, findConflict, reset } = useHotkeys();
  const [recording, setRecording] = useState<Recording>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setRecording(null);
      setConflict(null);
    }
  }, [open]);

  // Capture keys while recording: any mod-combo commits, Esc cancels.
  useEffect(() => {
    if (!recording) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setRecording(null);
        setConflict(null);
        return;
      }
      const combo = comboFromEvent(e);
      if (!combo) return; // keep listening until a valid combo arrives
      const owner = findConflict(combo, recording.action);
      if (owner) {
        setConflict(t('settings.hotkeysConflict', { action: formatCombo(combo) }));
        return;
      }
      setCombo(recording.action, combo);
      setRecording(null);
      setConflict(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [recording, setCombo, findConflict, t]);

  return (
    <Modal title={t('settings.title')} open={open} onCancel={onClose} footer={null} width={480}>
      {/* Language */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel>{t('settings.language')}</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['zh', 'en'] as const).map((l) => (
            <Button
              key={l}
              type={locale === l ? 'primary' : 'default'}
              onClick={() => setLocale(l)}
            >
              {t(l === 'zh' ? 'settings.languageZh' : 'settings.languageEn')}
            </Button>
          ))}
        </div>
      </div>

      {/* Shortcuts */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <SectionLabel>{t('settings.hotkeys')}</SectionLabel>
          <Button
            size="small"
            type="text"
            icon={<ReloadOutlined />}
            onClick={reset}
            style={{ color: 'var(--ph-text-tertiary)', fontSize: 12 }}
          >
            {t('settings.hotkeysReset')}
          </Button>
        </div>
        <div style={{ color: 'var(--ph-text-tertiary)', fontSize: 12, marginBottom: 12 }}>
          {t('settings.hotkeysHint')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {HOTKEY_ROWS.map(({ action, labelKey }) => {
            const isRecording = recording?.action === action;
            return (
              <div
                key={action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--ph-bg-surface)',
                  border: `1px solid ${
                    isRecording ? 'var(--ph-accent)' : 'var(--ph-border-subtle)'
                  }`,
                  borderRadius: 'var(--ph-radius-small)',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--ph-text-primary)' }}>{t(labelKey)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {conflict && isRecording && (
                    <span style={{ color: 'var(--ph-error)', fontSize: 12 }}>{conflict}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setConflict(null);
                      setRecording(isRecording ? null : { action });
                    }}
                    style={{
                      minWidth: 64,
                      textAlign: 'center',
                      padding: '3px 10px',
                      fontFamily: 'var(--ph-font-mono)',
                      fontSize: 12,
                      color: isRecording ? 'var(--ph-accent)' : 'var(--ph-text-secondary)',
                      background: 'var(--ph-bg-elevated)',
                      border: `1px solid ${
                        isRecording ? 'var(--ph-accent)' : 'var(--ph-border-default)'
                      }`,
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    {isRecording ? t('settings.hotkeysRecord') : formatCombo(hotkeys[action])}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontFamily: 'var(--ph-font-mono)',
        color: 'var(--ph-text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}
