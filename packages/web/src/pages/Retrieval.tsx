/**
 * Retrieval page — query input + result cards.
 *
 * Style: large centered input, monospace scores,
 * minimal result cards with content preview.
 */

import { useState, useEffect, useRef } from 'react';
import { Input, Button, Select, Spin, Empty, Typography, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/index.js';
import { useI18n } from '../i18n/index.js';
import type { RetrievalChunk } from '@phloem/shared';

const { Text, Paragraph } = Typography;

export default function RetrievalPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const initialQuestion = searchParams.get('q') ?? '';

  const [question, setQuestion] = useState(initialQuestion);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => api.datasets.list(),
  });

  const datasets = datasetsData?.data ?? [];

  const retrieveMutation = useMutation({
    mutationFn: (q: string) =>
      api.retrieval.retrieve({
        question: q,
        datasetIds: selectedDatasets.length > 0 ? selectedDatasets : datasets.map((d) => d.id),
        topK: 10,
      }),
  });

  const results: RetrievalChunk[] = retrieveMutation.data?.results ?? [];

  const handleSearch = () => {
    if (!question.trim()) return;
    retrieveMutation.mutate(question.trim());
  };

  // Deep link support: /retrieval?q=... auto-runs the search
  // (e.g. from the global command palette)
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (initialQuestion && !autoRanRef.current && datasets.length > 0) {
      autoRanRef.current = true;
      retrieveMutation.mutate(initialQuestion);
    }
  }, [initialQuestion, datasets.length]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            marginBottom: 8,
          }}
        >
          {t('retrieval.title')}
        </h1>
        <Text style={{ color: 'var(--ph-text-secondary)', fontSize: 13 }}>
          {t('retrieval.subtitle')}
        </Text>
      </div>

      {/* Dataset filter */}
      {datasets.length > 0 && (
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Select
            mode="multiple"
            allowClear
            placeholder={t('retrieval.datasetFilter')}
            value={selectedDatasets}
            onChange={setSelectedDatasets}
            style={{ minWidth: 320, maxWidth: 480 }}
            options={datasets.map((d) => ({ label: d.name, value: d.id }))}
            maxTagCount="responsive"
          />
        </div>
      )}

      {/* Search input */}
      <Input.Search
        size="large"
        placeholder={t('retrieval.placeholder')}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onPressEnter={handleSearch}
        enterButton={
          <Button type="primary" icon={<SearchOutlined />} loading={retrieveMutation.isPending}>
            {t('retrieval.search')}
          </Button>
        }
        style={{ marginBottom: 32 }}
      />

      {/* Results */}
      {retrieveMutation.isPending ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin tip={t('retrieval.retrieving')} />
        </div>
      ) : results.length > 0 ? (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: 'var(--ph-text-tertiary)',
                fontSize: 12,
                fontFamily: 'var(--ph-font-mono)',
              }}
            >
              {t('retrieval.results', { count: results.length })}
            </Text>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((chunk, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--ph-bg-surface)',
                  border: '1px solid var(--ph-border-subtle)',
                  borderRadius: 'var(--ph-radius)',
                  padding: '16px 20px',
                }}
              >
                {/* Metadata bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Tag
                      style={{
                        background: 'var(--ph-accent-dim)',
                        border: 'none',
                        color: 'var(--ph-accent)',
                        fontSize: 11,
                        fontFamily: 'var(--ph-font-mono)',
                      }}
                    >
                      {chunk.score.toFixed(2)}
                    </Tag>
                    <Text
                      style={{
                        color: 'var(--ph-text-secondary)',
                        fontSize: 12,
                      }}
                    >
                      {chunk.documentName ?? chunk.documentId}
                    </Text>
                    {chunk.pageNumber && (
                      <Text
                        style={{
                          color: 'var(--ph-text-tertiary)',
                          fontSize: 11,
                          fontFamily: 'var(--ph-font-mono)',
                        }}
                      >
                        p.{chunk.pageNumber}
                      </Text>
                    )}
                  </div>
                </div>

                {/* Content */}
                <Paragraph
                  style={{
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: 'var(--ph-text-primary)',
                    margin: 0,
                  }}
                >
                  {chunk.content}
                </Paragraph>
              </div>
            ))}
          </div>
        </div>
      ) : retrieveMutation.isIdle ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: 'var(--ph-text-tertiary)' }}>{t('retrieval.emptyIdle')}</span>
          }
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: 'var(--ph-text-tertiary)' }}>{t('retrieval.emptyNone')}</span>
          }
        />
      )}
    </div>
  );
}
