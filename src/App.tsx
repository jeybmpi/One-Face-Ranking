import { Navigate, Route, Routes } from 'react-router-dom';
import Admin from './pages/Admin';
import Ranking from './pages/Ranking';

export default function App() {
  return (
    <Routes>
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/ranking" replace />} />
    </Routes>
  );
}
