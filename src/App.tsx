import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ContestList from './components/ContestList';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';
import { motion } from 'framer-motion';
import { useMousePosition } from './hooks/useMousePosition';
import { useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const mousePosition = useMousePosition();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Redirect to home if authenticated user tries to access /auth
  if (isAuthenticated && location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <motion.div
        className="cursor"
        style={{
          position: 'fixed',
          left: mousePosition.x - 20,
          top: mousePosition.y - 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid #000',
          pointerEvents: 'none',
          zIndex: 9999,
          mixBlendMode: 'difference'
        }}
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y - 20,
          scale: [1, 1.2, 1],
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 28,
        }}
      />
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <ContestList />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;