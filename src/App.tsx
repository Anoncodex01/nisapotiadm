import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/ui/sidebar';
import Login from '@/pages/login';
import { Dashboard } from '@/pages/dashboard';
import { Creators } from '@/pages/creators';
import Supporters from '@/pages/supporters';
import { Transactions } from '@/pages/transactions';
import { Settings } from '@/pages/settings';
import { Wishlist } from '@/pages/wishlist';
import { Toaster } from 'sonner';
import { useState } from 'react';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppLayout = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      {!isLoginPage && (
        <div className="sm:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">Nisapoti</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none" aria-label="Open menu">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      )}
      {/* Sidebar */}
      {!isLoginPage && (
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      <div className={!isLoginPage ? "sm:ml-80 p-2 sm:p-8 transition-all" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Navigate to="/dashboard" />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/creators"
            element={
              <PrivateRoute>
                <Creators />
              </PrivateRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <PrivateRoute>
                <Wishlist />
              </PrivateRoute>
            }
          />
          <Route
            path="/supporters"
            element={
              <PrivateRoute>
                <Supporters />
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
      <Toaster position="top-right" richColors />
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AppLayout />
      </div>
    </Router>
  );
}

export default App;