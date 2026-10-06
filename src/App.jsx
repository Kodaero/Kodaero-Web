import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import KoyeonMap from './koyeon/main.jsx';
function LegacyPub() {
    const { id } = useParams();
    return <Navigate to={`/?pub=${encodeURIComponent(id)}`} replace />;
}
export default function App() {
    // While disabled, use the existing landing page without a separate notice.
    if (import.meta.env.VITE_KOYEON_ENABLED !== 'true') {
        window.location.replace('/');
        return null;
    }
    return <HashRouter><Routes>
        <Route path="/" element={<KoyeonMap />} />
        <Route path="/menu/:id" element={<LegacyPub />} />
        <Route path="/search" element={<KoyeonMap />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></HashRouter>;
}
