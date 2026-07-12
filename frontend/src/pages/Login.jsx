import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Users, AlertTriangle, User } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    let result;
    if (isSignUp) {
      result = await register(name, email, password, role);
    } else {
      result = await login(email, password, role);
    }
    
    setIsSubmitting(false);

    if (result.success) {
      // Redirect based on role
      if (role === 'Dispatcher') navigate('/dashboard');
      else if (role === 'Fleet Manager') navigate('/fleet');
      else if (role === 'Safety Officer') navigate('/drivers');
      else if (role === 'Financial Analyst') navigate('/expenses');
      else navigate('/');
    } else {
      setLocalError(result.error);
    }
  };

  const handleQuickFill = (selectedRole) => {
    setRole(selectedRole);
    if (!isSignUp) {
      if (selectedRole === 'Fleet Manager') {
        setEmail('manager@transitops.com');
      } else if (selectedRole === 'Dispatcher') {
        setEmail('dispatcher@transitops.com');
      } else if (selectedRole === 'Safety Officer') {
        setEmail('safety@transitops.com');
      } else if (selectedRole === 'Financial Analyst') {
        setEmail('finance@transitops.com');
      }
      setPassword('password123');
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel */}
      <div className="login-left">
        <div className="login-left-logo">
          <h1>🚀 TransitOps</h1>
          <p>Smart Transport Operations Platform</p>
        </div>

        <div className="login-roles-info">
          <h3>One login, four roles:</h3>
          <div className="login-roles-list">
            <div 
              className={`login-role-card ${role === 'Fleet Manager' ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleQuickFill('Fleet Manager')}
            >
              <div className="login-role-dot"></div>
              <div>
                <span>Fleet Manager</span>
                <p>Oversees fleet assets, lifecycle, and maintenance logs</p>
              </div>
            </div>

            <div 
              className={`login-role-card ${role === 'Dispatcher' ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleQuickFill('Dispatcher')}
            >
              <div className="login-role-dot"></div>
              <div>
                <span>Dispatcher</span>
                <p>Creates trips, handles vehicle/driver assignments, live board</p>
              </div>
            </div>

            <div 
              className={`login-role-card ${role === 'Safety Officer' ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleQuickFill('Safety Officer')}
            >
              <div className="login-role-dot"></div>
              <div>
                <span>Safety Officer</span>
                <p>Driver registry, safety profiles, license compliance logs</p>
              </div>
            </div>

            <div 
              className={`login-role-card ${role === 'Financial Analyst' ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleQuickFill('Financial Analyst')}
            >
              <div className="login-role-dot"></div>
              <div>
                <span>Financial Analyst</span>
                <p>Fuel details, Toll/Permit records, and ROI charts</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          TRANSITOPS © 2026 • SECURE RBAC PORTAL
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>{isSignUp ? 'Create your account' : 'Sign in to your account'}</h2>
            <p>{isSignUp ? 'Fill in details to register standard profile' : 'Enter your credentials to continue'}</p>
          </div>

          {localError && (
            <div className="alert-box alert-danger">
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Error State</strong>
                <p>{localError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="form-group">
                <label>FULL NAME</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '36px', width: '100%' }}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>EMAIL</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>ROLE (RBAC)</label>
              <div style={{ position: 'relative' }}>
                <Users size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%', appearance: 'none' }}
                >
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                </select>
              </div>
            </div>

            {!isSignUp && (
              <div className="login-options">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <a href="#forgot" className="login-forgot" onClick={(e) => { e.preventDefault(); alert("Please contact system admin to reset password."); }}>
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', marginTop: isSignUp ? '1rem' : '0' }}
            >
              {isSubmitting ? (isSignUp ? 'Creating...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setLocalError(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer', outline: 'none', fontSize: '0.85rem' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </span>
          </div>

          <p className="login-footer-text" style={{ marginTop: '2rem' }}>
            Access is scoped by role after login:
            <br />
            Fleet Manager → Fleet, Maintenance
            <br />
            Dispatcher → Dashboard, Trips
            <br />
            Safety Officer → Drivers, Compliance
            <br />
            Financial Analyst → Fuel & Expenses, Analytics
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
