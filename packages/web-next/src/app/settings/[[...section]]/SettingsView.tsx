'use client';

import SettingsLayout from '@/src/components/SettingsLayout.js';
import AccountSettingsPage from '@/src/views/AccountSettings.js';
import ModelsSettingsPage from '@/src/views/ModelsSettings.js';
import TeamSettingsPage from '@/src/views/TeamSettings.js';
import SourcesSettingsPage from '@/src/views/SourcesSettings.js';
import ChannelsSettingsPage from '@/src/views/ChannelsSettings.js';
import ApiKeysSettingsPage from '@/src/views/ApiKeysSettings.js';
import McpSettingsPage from '@/src/views/McpSettings.js';

const SECTION_MAP: Record<string, React.ComponentType> = {
  account: AccountSettingsPage,
  models: ModelsSettingsPage,
  team: TeamSettingsPage,
  sources: SourcesSettingsPage,
  channels: ChannelsSettingsPage,
  apikeys: ApiKeysSettingsPage,
  mcp: McpSettingsPage,
};

export default function SettingsView({ section }: { section: string }) {
  const Page = SECTION_MAP[section] ?? AccountSettingsPage;
  return (
    <SettingsLayout>
      <Page />
    </SettingsLayout>
  );
}
