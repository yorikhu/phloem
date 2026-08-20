/**
 * SettingsModal — language, theme, and shortcut configuration.
 *
 * Draft-based: edits (language pick, theme pick, shortcut re-records,
 * reset) go to a local draft first. Save applies + persists and clears
 * the draft; Discard throws it away. Accidental closes (Esc, mask
 * click) keep the draft — it also persists to localStorage so unsaved
 * edits survive reloads. The modal previews its own labels in the
 * draft language; the rest of the app stays on committed settings
 * until Save commits them.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Button, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useI18n, translate, type DictKey } from '../i18n/index.js';
import { useTheme } from '../theme/index.js';
import {
  DEFAULT_HOTKEYS,
  comboFromEvent,
  formatCombo,
  useHotkeys,
  type HotkeyAction,
} from '../hotkeys/index.js';
import { loadDraft, saveDraft, clearDraft, type SettingsSnapshot } from '../settings/index.js';

type Recording = { action: HotkeyAction } | null;

const HOTKEY_ROWS: { action: HotkeyAction; labelKey: DictKey }[] = [
  { action: 'openSearch', labelKey: 'settings.hotkeySearch' },
  { action: 'composerNewline', labelKey: 'settings.hotkeyNewline' },
];

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, setLocale } = useI18n();
  const { theme: liveTheme, setTheme } = useTheme();
  const { hotkeys: liveHotkeys, applyAll } = useHotkeys();
  const [recording, setRecording] = useState<Recording>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [draft, setDraft] = useState<SettingsSnapshot | null>(null);

  // Snapshot the modal is editing: saved draft > committed settings.
  const current: SettingsSnapshot = draft ?? { locale, theme: liveTheme, hotkeys: liveHotkeys };
  const dirty =
    draft !== null &&
    (draft.locale !== locale ||
      draft.theme !== liveTheme ||
      (Object.keys(draft.hotkeys) as HotkeyAction[]).some(
        (a) => draft.hotkeys[a] !== liveHotkeys[a],
      ));

  // In-modal language preview: labels render in the draft locale while
  // the rest of the app keeps the committed one.
  const t = useCallback(
    (key: DictKey, params?: Record<string, string | number>) =>
      translate(current.locale, key, params),
    [current.locale],
  );

  // Keep the latest snapshot readable inside stable event listeners.
  const currentRef = useRef(current);
  currentRef.current = current;

  // Committed theme readable inside the open-effect.
  const liveThemeRef = useRef(liveTheme);
  liveThemeRef.current = liveTheme;

  const updateDraft = useCallback((next: SettingsSnapshot) => {
    setDraft(next);
    saveDraft(next);
  }, []);

  // ── Lifecycle: reset transient state on open ──
  useEffect(() => {
    if (open) {
      setDraft(loadDraft(liveThemeRef.current));
      setRecording(null);
      setConflict(null);
    }
  }, [open]);

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
      setTheme(draft.theme);
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

      {/* Theme — save-scoped like language; palette dots hint each mode */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel>{t('settings.theme')}</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['dark', 'light'] as const).map((m) => (
            <Button
              key={m}
              type={current.theme === m ? 'primary' : 'default'}
              onClick={() => updateDraft({ ...current, theme: m })}
              icon={
                <span
                  aria-hidden
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    marginRight: 6,
                    verticalAlign: '-1px',
                    background:
                      m === 'dark'
                        ? 'linear-gradient(135deg, #161616 50%, #6b8cff 50%)'
                        : 'linear-gradient(135deg, #ffffff 50%, #4c6af0 50%)',
                    border: '1px solid var(--ph-border-default)',
                  }}
                />
              }
            >
              {t(m === 'dark' ? 'settings.themeDark' : 'settings.themeLight')}
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
