import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout.js';
import SettingsLayout from './components/SettingsLayout.js';
import DatasetsPage from './pages/Datasets.js';
import DocumentsPage from './pages/Documents.js';
import RetrievalPage from './pages/Retrieval.js';
import ChatPage from './pages/Chat.js';
import ModelsSettingsPage from './pages/ModelsSettings.js';
import AccountSettingsPage from './pages/AccountSettings.js';
import TeamSettingsPage from './pages/TeamSettings.js';
import McpSettingsPage from './pages/McpSettings.js';
import SourcesSettingsPage from './pages/SourcesSettings.js';
import ChannelsSettingsPage from './pages/ChannelsSettings.js';
import DocumentDetailPage from './pages/DocumentDetail.js';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DatasetsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:docId" element={<DocumentDetailPage />} />
        <Route path="/retrieval" element={<RetrievalPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsLayout />}>
          <Route path="account" element={<AccountSettingsPage />} />
          <Route path="models" element={<ModelsSettingsPage />} />
          <Route path="team" element={<TeamSettingsPage />} />
          <Route path="sources" element={<SourcesSettingsPage />} />
          <Route path="channels" element={<ChannelsSettingsPage />} />
          <Route path="mcp" element={<McpSettingsPage />} />
        </Route>
      </Routes>
    </AppLayout>
  );
}
