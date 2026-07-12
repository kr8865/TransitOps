import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, ShieldAlert } from 'lucide-react';

const AccessGuard = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const isAuthorized = allowedRoles.includes(user.role);

  if (!isAuthorized) {
    // Determine where this user should go based on their role
    const getRoleHome = () => {
      switch (user.role) {
        case 'Fleet Manager':
          return '/fleet';
        case 'Dispatcher':
          return '/dashboard';
        case 'Safety Officer':
          return '/drivers';
        case 'Financial Analyst':
          return '/expenses';
        default:
          return '/';
      }
    };

    return (
      <div className="access-denied-container">
        <div className="access-denied-card">
          <div className="access-denied-header">
            <ShieldAlert size={48} className="warning-icon" />
            <h2>Access Scoped by Role</h2>
          </div>
          
          <div className="access-denied-body">
            <p className="restriction-text">
              In accordance with TransitOps RBAC guidelines, this page is restricted.
            </p>
            <div className="role-comparison">
              <div className="role-box current">
                <span className="label">Your Role</span>
                <span className="value">{user.role}</span>
              </div>
              <div className="role-box required">
                <span className="label">Required Role(s)</span>
                <span className="value">{allowedRoles.join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="access-denied-actions">
            <button 
              className="btn btn-primary"
              onClick={() => navigate(getRoleHome())}
            >
              Go to Your Dashboard
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/settings')}
            >
              Switch Role Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AccessGuard;
