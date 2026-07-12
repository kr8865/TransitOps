import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AccessGuard from './components/AccessGuard';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VehicleRegistry from './pages/VehicleRegistry';
import DriverManagement from './pages/DriverManagement';
import TripDispatcher from './pages/TripDispatcher';
import MaintenanceLogs from './pages/MaintenanceLogs';
import FuelExpenses from './pages/FuelExpenses';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

const AppLayout = ({ children, searchTerm, setSearchTerm }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        {children}
      </div>
    </div>
  );
};

const MainRoutes = () => {
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyItems: 'center', background: '#0b0f19', color: '#fff' }}>
        <h2 style={{ margin: 'auto' }}>TransitOps is preparing environment...</h2>
      </div>
    );
  }

  // Helper for root redirect based on role
  const getRoleHome = (role) => {
    switch (role) {
      case 'Fleet Manager':
        return '/fleet';
      case 'Dispatcher':
        return '/dashboard';
      case 'Safety Officer':
        return '/drivers';
      case 'Financial Analyst':
        return '/expenses';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to={getRoleHome(user.role)} replace /> : <Login />} 
      />

      <Route
        path="/dashboard"
        element={
          user ? (
            <AppLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}>
              <AccessGuard allowedRoles={['Dispatcher', 'Fleet Manager', 'Safety Officer', 'Financial Analyst']}>
                <Dashboard searchTerm={searchTerm} />
              </AccessGuard>
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/fleet"
        element={
          user ? (
            <AppLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}>
              <AccessGuard allowedRoles={['Fleet Manager', 'Dispatcher', 'Financial Analyst']}>
                <VehicleRegistry searchTerm={searchTerm} />
              </AccessGuard>
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/drivers"
        element={
          user ? (
            <AppLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}>
              <AccessGuard allowedRoles={['Fleet Manager', 'Safety Officer']}>
                <DriverManagement searchTerm={searchTerm} />
              </AccessGuard>
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/trips"
        element={
          user ? (
            <AppLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}>
              <AccessGuard allowedRoles={['Dispatcher', 'Safety Officer']}>
                <TripDispatcher />
              </AccessGuard>
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/maintenance"
        element={
          user ? (
            <AppLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}>
              <AccessGuard allowedRoles={['Fleet Manager']}>
                <MaintenanceLogs />
              </AccessGuard>
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/expenses"
        element={
          user ? (
            <AppLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}>
              <AccessGuard allowedRoles={['Financial Analyst']}>
                <FuelExpenses />
              </AccessGuard>
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/analytics"
        element={
          user ? (
            <AppLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}>
              <AccessGuard allowedRoles={['Fleet Manager', 'Financial Analyst']}>
                <Analytics />
              </AccessGuard>
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/settings"
        element={
          user ? (
            <AppLayout searchTerm={searchTerm} setSearchTerm={setSearchTerm}>
              <Settings />
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/"
        element={<Navigate to={user ? getRoleHome(user.role) : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={user ? getRoleHome(user.role) : "/login"} replace />}
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <MainRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
