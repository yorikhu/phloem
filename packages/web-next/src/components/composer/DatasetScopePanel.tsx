/**
 * DatasetScopePanel — shared scope selector for composer components.
 *
 * Search row on top, checkable dataset list below. Search filters
 * the list live; empty selection means "all datasets".
 */
import { useState } from 'react';
import { Button, Checkbox, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Dataset } from '@phloem/shared';
import { useI18n } from '../../i18n/index.js';

const SCOPE_LIST_MAX_HEIGHT = 264;

export interface DatasetScopePanelProps {
  datasets: Dataset[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function DatasetScopePanel({
  datasets,
  selected,
  onChange,
}: DatasetScopePanelProps) {
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
