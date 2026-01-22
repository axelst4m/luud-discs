
import { Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Tu peux ajouter d'autres routes ici */}
      </Routes>
    </div>
  );
}

export default App;