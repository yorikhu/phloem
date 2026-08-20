/**
 * Settings catch-all route — pre-renders all 7 sections for static export.
 * Server Component: owns generateStaticParams, delegates UI to SettingsView.
 */

import SettingsView from './SettingsView';

export function generateStaticParams() {
  return [
    { section: [] },
    { section: ['account'] },
    { section: ['models'] },
    { section: ['team'] },
    { section: ['sources'] },
    { section: ['channels'] },
    { section: ['apikeys'] },
    { section: ['mcp'] },
  ];
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = await params;
  const sectionStr = section?.[0] ?? 'account';
  return <SettingsView section={sectionStr} />;
}
