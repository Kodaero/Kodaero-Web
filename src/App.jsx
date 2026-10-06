import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import KoyeonMap from './koyeon/main.jsx';
function LegacyPub() {
    const { id } = useParams();
    return <Navigate to={`/?pub=${encodeURIComponent(id)}`} replace />;
}
export default function App() {
    // Re-enable explicitly for the next rivalry season.
    if (import.meta.env.VITE_KOYEON_ENABLED !== 'true') return <main style={{minHeight:'100dvh',display:'grid',placeItems:'center',padding:24,fontFamily:'Pretendard, sans-serif',background:'#fff',color:'#424242'}}><div style={{textAlign:'center'}}><h1 style={{fontSize:22,marginBottom:12}}>고연전 무료주점 운영이 종료되었습니다</h1><p style={{fontSize:14,color:'#767676',marginBottom:24}}>다음 고연전 시즌에 다시 만나요.</p><a href="https://kodaero.co.kr" style={{display:'inline-block',padding:'12px 20px',borderRadius:10,background:'#F85C5C',color:'#fff'}}>고대로 홈으로</a></div></main>;
    return <HashRouter><Routes>
        <Route path="/" element={<KoyeonMap />} />
        <Route path="/menu/:id" element={<LegacyPub />} />
        <Route path="/search" element={<KoyeonMap />} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></HashRouter>;
}
