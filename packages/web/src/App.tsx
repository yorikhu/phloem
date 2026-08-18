import { Routes, Route, Link } from 'react-router-dom';

export default function App() {
  return (
    <div style={{ padding: '24px' }}>
      <nav style={{ marginBottom: '24px' }}>
        <Link to="/">Datasets</Link> | <Link to="/documents">Documents</Link> |{' '}
        <Link to="/retrieval">Retrieval</Link>
      </nav>
      <Routes>
        <Route path="/" element={<div>Datasets Page (scaffold)</div>} />
        <Route path="/documents" element={<div>Documents Page (scaffold)</div>} />
        <Route path="/retrieval" element={<div>Retrieval Page (scaffold)</div>} />
      </Routes>
    </div>
  );
}
