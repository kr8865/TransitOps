import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Car,
  Users,
  MapPin,
  Wrench,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Lock
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleRoutes = {
    'Fleet Manager': ['/dashboard', '/fleet', '/drivers', '/maintenance', '/analytics'],
    'Dispatcher': ['/dashboard', '/fleet', '/trips'],
    'Safety Officer': ['/dashboard', '/drivers', '/trips'],
    'Financial Analyst': ['/dashboard', '/fleet', '/expenses', '/analytics'],
  };

  const isAllowed = (path) => {
    if (!user) return false;
    // Allow settings for everyone
    if (path === '/settings') return true;
    
    const allowedPaths = roleRoutes[user.role] || [];
    // Custom handling for specific routes matching subpaths
    if (path === '/dashboard') return allowedPaths.includes('/dashboard');
    if (path === '/fleet') return allowedPaths.includes('/fleet');
    if (path === '/drivers') return allowedPaths.includes('/drivers');
    if (path === '/trips') return allowedPaths.includes('/trips');
    if (path === '/maintenance') return allowedPaths.includes('/maintenance');
    if (path === '/expenses') return allowedPaths.includes('/expenses');
    if (path === '/analytics') return allowedPaths.includes('/analytics');
    return false;
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Fleet', path: '/fleet', icon: Car },
    { name: 'Drivers', path: '/drivers', icon: Users },
    { name: 'Trips', path: '/trips', icon: MapPin },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Fuel & Expenses', path: '/expenses', icon: DollarSign },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🚀</span>
        <h2>TransitOps</h2>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          const allowed = isAllowed(item.path);

          return (
            <div
              key={item.name}
              className={`menu-item ${active ? 'active' : ''} ${!allowed ? 'restricted' : ''}`}
              onClick={() => {
                navigate(item.path);
              }}
            >
              <div className="menu-item-left">
                <Icon size={18} className="menu-icon" />
                <span>{item.name}</span>
              </div>
              {!allowed && <Lock size={12} className="lock-icon" title="Locked for your current role" />}
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="user-badge-container">
          <div className="avatar-circle">
            {user ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
          </div>
          <div className="user-badge-info">
            <p className="user-badge-name">{user ? user.name : 'Guest User'}</p>
            <p className="user-badge-role">{user ? user.role : 'Guest'}</p>
          </div>
        </div>
        <button onClick={logout} className="logout-btn">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
