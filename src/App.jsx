
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import SlskTool from './pages/SlskTool/SlskTool';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/slsk-tool" element={<SlskTool />} />
        {/* Any unknown URL falls back to the homepage. The SPA fallback
            in public/_redirects keeps the URL unchanged so React Router
            can match it; if no <Route> matches, we send the user home. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;