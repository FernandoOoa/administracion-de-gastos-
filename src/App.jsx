import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegistroRapido from './pages/RegistroRapido';
import Custodia from './pages/Custodia';
import Apartados from './pages/Apartados';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes wrapped in MainLayout */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/registro" element={<RegistroRapido />} />
            <Route path="/custodia" element={<Custodia />} />
            <Route path="/apartados" element={<Apartados />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
