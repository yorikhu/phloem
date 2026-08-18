/**
 * CommandPalette — global floating search, centered on screen.
 *
 * Opens via the configurable openSearch hotkey or the sidebar button.
 * Searches: navigation pages, datasets, documents. Any unmatched
 * query falls back to "Ask ..." which routes to Retrieval.
 *
 * Keyboard: ↑/↓ navigate, Enter select, Esc close.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  SearchOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  EnterOutlined,
} from '@ant-design/icons';
import { api } from '../api/index.js';
import { useI18n } from '../i18n/index.js';
import { formatCombo, useHotkeys } from '../hotkeys/index.js';
import type { Dataset, Document } from '@phloem/shared';

type PaletteItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
  hint?: string | undefined;
  group: 'Navigate' | 'Datasets' | 'Documents' | 'Ask';
  action: () => void;
};

type PaletteGroup = PaletteItem['group'];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { hotkeys } = useHotkeys();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Group labels are translated at render time
  const groupLabel = useCallback(
    (g: PaletteGroup): string =>
      ({
        Navigate: t('palette.groupNavigate'),
        Datasets: t('palette.groupDatasets'),
        Documents: t('palette.groupDocuments'),
        Ask: t('palette.groupAsk'),
      })[g],
    [t],
  );

  // ── Data (from react-query cache, already fetched by pages) ──
  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => api.datasets.list(),
    enabled: open,
    staleTime: 30_000,
  });
  const datasets: Dataset[] = datasetsData?.data ?? [];

  const { data: documentsData } = useQuery({
    queryKey: ['all-documents'],
    queryFn: async () => {
      const results = await Promise.all(
        datasets.map((d) => api.documents.list(d.id).then((r) => r.data)),
      );
      return results.flat();
    },
    enabled: open && datasets.length > 0,
    staleTime: 30_000,
  });
  const documents: Document[] = documentsData ?? [];

  // ── Reset on open ──
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus after mount
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // ── Build filtered items ──
  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (s: string) => s.toLowerCase().includes(q);

    const navItems: PaletteItem[] = (
      [
        {
          key: 'nav-datasets',
          icon: <DatabaseOutlined />,
          label: t('nav.datasets'),
          hint: t('common.page'),
          group: 'Navigate',
          action: () => navigate('/'),
        },
        {
          key: 'nav-documents',
          icon: <FileTextOutlined />,
          label: t('nav.documents'),
          hint: t('common.page'),
          group: 'Navigate',
          action: () => navigate('/documents'),
        },
        {
          key: 'nav-retrieval',
          icon: <SearchOutlined />,
          label: t('nav.retrieval'),
          hint: t('common.page'),
          group: 'Navigate',
          action: () => navigate('/retrieval'),
        },
      ] as PaletteItem[]
    ).filter((item) => !q || match(item.label));

    const datasetItems: PaletteItem[] = datasets
      .filter((d) => !q || match(d.name) || (d.description && match(d.description)))
      .slice(0, 5)
      .map((d) => ({
        key: `ds-${d.id}`,
        icon: <DatabaseOutlined />,
        label: d.name,
        hint: t('palette.hintDocs', { count: d.documentCount }),
        group: 'Datasets' as const,
        action: () => navigate(`/documents?datasetId=${d.id}`),
      }));

    const documentItems: PaletteItem[] = documents
      .filter((doc) => q && match(doc.name))
      .slice(0, 5)
      .map((doc) => {
        const ds = datasets.find((d) => d.id === doc.datasetId);
        return {
          key: `doc-${doc.id}`,
          icon: <FileTextOutlined />,
          label: doc.name,
          hint: ds?.name,
          group: 'Documents' as const,
          action: () => navigate(`/documents?datasetId=${doc.datasetId}`),
        };
      });

    const askItem: PaletteItem[] =
      q.length > 0
        ? [
            {
              key: 'ask',
              icon: <ArrowRightOutlined />,
              label: t('palette.ask', { query: query.trim() }),
              hint: t('nav.retrieval'),
              group: 'Ask',
              action: () => navigate(`/retrieval?q=${encodeURIComponent(query.trim())}`),
            },
          ]
        : [];

    return [...navItems, ...datasetItems, ...documentItems, ...askItem];
  }, [query, datasets, documents, navigate, t]);

  // ── Clamp active index when list shrinks ──
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(items.length - 1, 0)));
  }, [items.length]);

  // ── Keyboard handling ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (items.length === 0 ? 0 : (i + 1) % items.length));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (items.length === 0 ? 0 : (i - 1 + items.length) % items.length));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[activeIndex];
        if (item) {
          item.action();
          onClose();
        }
      }
    },
    [items, activeIndex, onClose],
  );

  // ── Scroll active item into view ──
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // ── Group items for rendering ──
  const groups = useMemo(() => {
    const map = new Map<PaletteGroup, { item: PaletteItem; index: number }[]>();
    items.forEach((item, index) => {
      const list = map.get(item.group) ?? [];
      list.push({ item, index });
      map.set(item.group, list);
    });
    return [...map.entries()];
  }, [items]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        // Panel sits slightly above vertical center
        paddingTop: '18vh',
        background: 'var(--ph-scrim)',
        backdropFilter: 'blur(2px)',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('sidebar.search')}
        onKeyDown={handleKeyDown}
        style={{
          width: 'min(640px, calc(100vw - 48px))',
          maxHeight: 'min(420px, 70vh)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--ph-bg-elevated)',
          border: '1px solid var(--ph-border-default)',
          borderRadius: 'var(--ph-radius)',
          boxShadow: 'var(--ph-shadow-popup)',
          overflow: 'hidden',
          animation: 'ph-palette-in 140ms ease',
        }}
      >
        {/* Input row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid var(--ph-border-subtle)',
          }}
        >
          <SearchOutlined style={{ color: 'var(--ph-text-tertiary)', fontSize: 16 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder={t('palette.placeholder')}
            spellCheck={false}
            autoComplete="off"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--ph-text-primary)',
              fontSize: 15,
              fontFamily: 'inherit',
            }}
          />
          <kbd
            style={{
              fontSize: 11,
              fontFamily: 'var(--ph-font-mono)',
              color: 'var(--ph-text-tertiary)',
              border: '1px solid var(--ph-border-subtle)',
              borderRadius: 4,
              padding: '2px 6px',
              lineHeight: 1.4,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} role="listbox" style={{ overflowY: 'auto', padding: '8px 0', flex: 1 }}>
          {groups.length === 0 ? (
            <div
              style={{
                padding: '32px 0',
                textAlign: 'center',
                color: 'var(--ph-text-tertiary)',
                fontSize: 13,
              }}
            >
              {t('palette.noMatches', { query: query.trim() })}
            </div>
          ) : (
            groups.map(([group, list]) => (
              <div key={group}>
                <div
                  style={{
                    padding: '8px 18px 4px',
                    fontSize: 11,
                    fontFamily: 'var(--ph-font-mono)',
                    color: 'var(--ph-text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {groupLabel(group)}
                </div>
                {list.map(({ item, index }) => {
                  const active = index === activeIndex;
                  return (
                    <div
                      key={item.key}
                      data-index={index}
                      role="option"
                      aria-selected={active}
                      tabIndex={-1}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '9px 18px',
                        cursor: 'pointer',
                        background: active ? 'var(--ph-bg-hover)' : 'transparent',
                        borderLeft: `2px solid ${active ? 'var(--ph-accent)' : 'transparent'}`,
                        color: 'var(--ph-text-primary)',
                      }}
                    >
                      <span
                        style={{
                          color: active ? 'var(--ph-accent)' : 'var(--ph-text-tertiary)',
                          fontSize: 14,
                          width: 16,
                          display: 'inline-flex',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.label}
                      </span>
                      {item.hint && (
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--ph-text-tertiary)',
                            fontFamily: 'var(--ph-font-mono)',
                          }}
                        >
                          {item.hint}
                        </span>
                      )}
                      {active && (
                        <EnterOutlined style={{ color: 'var(--ph-text-tertiary)', fontSize: 12 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '8px 18px',
            borderTop: '1px solid var(--ph-border-subtle)',
            fontSize: 11,
            color: 'var(--ph-text-tertiary)',
            fontFamily: 'var(--ph-font-mono)',
          }}
        >
          <span>{t('palette.footerNavigate')}</span>
          <span>{t('palette.footerOpen')}</span>
          <span>{t('palette.footerClose')}</span>
          <span style={{ marginLeft: 'auto' }}>{formatCombo(hotkeys.openSearch)}</span>
        </div>
      </div>
    </div>
  );
}
