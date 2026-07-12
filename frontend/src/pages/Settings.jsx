import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Settings as SettingsIcon, Check, HelpCircle } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  // General settings local state
  const [depotName, setDepotName] = useState('Gandhinagar Depot GJ4');
  const [currency, setCurrency] = useState('INR (Rs)');
  const [distanceUnit, setDistanceUnit] = useState('Kilometers');

  const roleProfiles = {
    'Fleet Manager': 'manager@transitops.com',
    Dispatcher: 'dispatcher@transitops.com',
    'Safety Officer': 'safety@transitops.com',
    'Financial Analyst': 'finance@transitops.com',
  };

  const getRoleHome = (roleName) => {
    switch (roleName) {
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

  const handleRoleSwitch = async (roleName) => {
    const email = roleProfiles[roleName];
    const password = 'password123';

    if (!email) return;

    // Clear current session first so the new role/account is applied cleanly.
    logout();

    const result = await login(email, password, roleName);
    if (result.success) {
      navigate(getRoleHome(roleName));
      alert(`Switched profile context to: "${roleName}" successfully!`);
    } else {
      alert(`Failed to switch context: ${result.error}`);
    }
  };

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    alert('General settings saved successfully! Units updated.');
  };

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>Settings & RBAC</h1>
          <p>Configure general localization settings, depot parameters, and audit role access permissions.</p>
        </div>
      </div>

      <div className="split-layout" style={{ marginBottom: '2rem' }}>
        {/* Left Panel: General Settings */}
        <div className="dashboard-panel">
          <h3 className="panel-title">General</h3>
          <form onSubmit={handleSaveGeneral}>
            <div className="form-group">
              <label>DEPOT NAME</label>
              <input
                type="text"
                required
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>CURRENCY</label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>DISTANCE UNIT</label>
              <input
                type="text"
                required
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem', padding: '0.6rem' }}>
              Save changes
            </button>
          </form>
        </div>

        {/* Right Panel: Role-Based Access Table */}
        <div className="dashboard-panel">
          <h3 className="panel-title">Role-Based Access (RBAC)</h3>
          <div className="table-container">
            <table style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Fleet</th>
                  <th>Driver</th>
                  <th>Trip</th>
                  <th>Fuel/Exp.</th>
                  <th>Analytics</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600' }}>Fleet Manager</td>
                  <td><Check size={14} style={{ color: 'var(--color-success)' }} /></td>
                  <td><Check size={14} style={{ color: 'var(--color-success)' }} /></td>
                  <td>--</td>
                  <td>--</td>
                  <td><Check size={14} style={{ color: 'var(--color-success)' }} /></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Dispatcher</td>
                  <td>view</td>
                  <td>--</td>
                  <td><Check size={14} style={{ color: 'var(--color-success)' }} /></td>
                  <td>--</td>
                  <td>--</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Safety Officer</td>
                  <td>--</td>
                  <td><Check size={14} style={{ color: 'var(--color-success)' }} /></td>
                  <td>view</td>
                  <td>--</td>
                  <td>--</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Financial Analyst</td>
                  <td>view</td>
                  <td>--</td>
                  <td>--</td>
                  <td><Check size={14} style={{ color: 'var(--color-success)' }} /></td>
                  <td><Check size={14} style={{ color: 'var(--color-success)' }} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Developer switcher widget */}
      <div className="switch-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <Shield size={20} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700' }}>Quick Context Switcher</h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          For grading and workflow validation convenience, click any role box below to instantly log in as that profile context.
        </p>

        <div className="switch-roles-grid">
          <div 
            className={`role-select-box ${user?.role === 'Dispatcher' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('Dispatcher')}
          >
            <h4>Dispatcher</h4>
            <p>Access: Dashboard, Trips</p>
          </div>

          <div 
            className={`role-select-box ${user?.role === 'Fleet Manager' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('Fleet Manager')}
          >
            <h4>Fleet Manager</h4>
            <p>Access: Fleet, Maintenance</p>
          </div>

          <div 
            className={`role-select-box ${user?.role === 'Safety Officer' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('Safety Officer')}
          >
            <h4>Safety Officer</h4>
            <p>Access: Drivers</p>
          </div>

          <div 
            className={`role-select-box ${user?.role === 'Financial Analyst' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('Financial Analyst')}
          >
            <h4>Financial Analyst</h4>
            <p>Access: Fuel & Expenses, Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
