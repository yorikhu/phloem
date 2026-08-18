import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout.js';
import DatasetsPage from './pages/Datasets.js';
import DocumentsPage from './pages/Documents.js';
import RetrievalPage from './pages/Retrieval.js';
import ChatPage from './pages/Chat.js';
import ModelsSettingsPage from './pages/ModelsSettings.js';
import AccountSettingsPage from './pages/AccountSettings.js';
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
        <Route path="/settings/models" element={<ModelsSettingsPage />} />
        <Route path="/settings/account" element={<AccountSettingsPage />} />
      </Routes>
    </AppLayout>
  );
}
