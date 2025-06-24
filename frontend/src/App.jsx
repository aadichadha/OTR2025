import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';

function App() {
  return (
    <Router>
      <div>
        <header style={{ padding: '1rem', background: '#222', color: '#fff' }}>
          <h1 style={{ margin: 0 }}>OTR Baseball Analytics</h1>
          <nav style={{ marginTop: '0.5rem' }}>
            <Link to="/" style={{ color: '#fff', marginRight: '1rem' }}>Home</Link>
            <Link to="/upload" style={{ color: '#fff', marginRight: '1rem' }}>Upload</Link>
            <Link to="/login" style={{ color: '#fff', marginRight: '1rem' }}>Login</Link>
            <Link to="/register" style={{ color: '#fff' }}>Register</Link>
          </nav>
        </header>
        <main style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/upload" element={<Upload />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
