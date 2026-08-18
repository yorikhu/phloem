import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout.js';
import DatasetsPage from './pages/Datasets.js';
import DocumentsPage from './pages/Documents.js';
import RetrievalPage from './pages/Retrieval.js';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DatasetsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/retrieval" element={<RetrievalPage />} />
      </Routes>
    </AppLayout>
  );
}
