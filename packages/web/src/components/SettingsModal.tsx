/**
 * SettingsModal — language and shortcut configuration.
 *
 * Draft-based: edits (language pick, shortcut re-records, reset) go to
 * a local draft first. Save applies + persists and clears the draft;
 * Discard throws it away. Accidental closes (Esc, mask click) keep
 * the draft — it also persists to localStorage so unsaved edits
 * survive reloads. Language previews live while the modal is open.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Button, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useI18n } from '../i18n/index.js';
import {
  DEFAULT_HOTKEYS,
  comboFromEvent,
  formatCombo,
  useHotkeys,
  type HotkeyAction,
} from '../hotkeys/index.js';
import { loadDraft, saveDraft, clearDraft, type SettingsSnapshot } from '../settings/index.js';

type Recording = { action: HotkeyAction } | null;

const HOTKEY_ROWS: { action: HotkeyAction; labelKey: 'settings.hotkeySearch' }[] = [
  { action: 'openSearch', labelKey: 'settings.hotkeySearch' },
];

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, savedLocale, previewLocale, setLocale } = useI18n();
  const { hotkeys: liveHotkeys, applyAll } = useHotkeys();
  const [recording, setRecording] = useState<Recording>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [draft, setDraft] = useState<SettingsSnapshot | null>(null);

  // Snapshot the modal is editing: saved draft > committed settings.
  const current: SettingsSnapshot = draft ?? { locale: savedLocale, hotkeys: liveHotkeys };
  const dirty =
    draft !== null &&
    (draft.locale !== savedLocale ||
      (Object.keys(draft.hotkeys) as HotkeyAction[]).some(
        (a) => draft.hotkeys[a] !== liveHotkeys[a],
      ));

  // Keep the latest snapshot readable inside stable event listeners.
  const currentRef = useRef(current);
  currentRef.current = current;

  const updateDraft = useCallback((next: SettingsSnapshot) => {
    setDraft(next);
    saveDraft(next);
  }, []);

  // ── Lifecycle: load draft on open, drop preview on close ──
  useEffect(() => {
    if (open) {
      setDraft(loadDraft());
      setRecording(null);
      setConflict(null);
    } else {
      previewLocale(null);
    }
  }, [open, previewLocale]);

  // Live language preview while a draft locale exists.
  const draftLocale = draft?.locale;
  useEffect(() => {
    if (open && draftLocale) previewLocale(draftLocale);
  }, [open, draftLocale, previewLocale]);

  // ── Recording: any mod-combo commits to the draft, Esc cancels ──
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
      const snap = currentRef.current;
      const owner = (Object.keys(snap.hotkeys) as HotkeyAction[]).find(
        (a) => a !== recording.action && snap.hotkeys[a] === combo,
      );
      if (owner) {
        setConflict(t('settings.hotkeysConflict', { action: formatCombo(combo) }));
        return;
      }
      updateDraft({ ...snap, hotkeys: { ...snap.hotkeys, [recording.action]: combo } });
      setRecording(null);
      setConflict(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [recording, updateDraft, t]);

  // ── Actions ──
  const handleSave = () => {
    if (dirty && draft) {
      setLocale(draft.locale);
      applyAll(draft.hotkeys);
    }
    clearDraft();
    setDraft(null);
    onClose();
  };

  const handleDiscard = () => {
    clearDraft();
    setDraft(null);
    setRecording(null);
    setConflict(null);
    previewLocale(null);
    onClose();
  };

  const handleReset = () => {
    // Reset writes defaults into the draft, not the live map.
    updateDraft({ ...currentRef.current, hotkeys: { ...DEFAULT_HOTKEYS } });
  };

  return (
    <Modal
      title={t('settings.title')}
      open={open}
      onCancel={onClose}
      width={480}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {dirty && (
            <Tooltip title={t('common.discard')} placement="top">
              <Button onClick={handleDiscard}>{t('common.cancel')}</Button>
            </Tooltip>
          )}
          <Button type="primary" onClick={handleSave} disabled={!dirty}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      {/* Language — click previews the draft locale live */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel>{t('settings.language')}</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['zh', 'en'] as const).map((l) => (
            <Button
              key={l}
              type={current.locale === l ? 'primary' : 'default'}
              onClick={() => updateDraft({ ...current, locale: l })}
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
            onClick={handleReset}
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
            const changed = current.hotkeys[action] !== liveHotkeys[action];
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
                  {changed && !isRecording && (
                    <span style={{ color: 'var(--ph-accent)', fontSize: 12 }}>*</span>
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
                    {isRecording
                      ? t('settings.hotkeysRecord')
                      : formatCombo(current.hotkeys[action])}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Draft hint */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--ph-border-subtle)',
          color: 'var(--ph-text-tertiary)',
          fontSize: 12,
        }}
      >
        {t('settings.draftHint')}
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
