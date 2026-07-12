import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit3, X, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api';

const DriverManagement = ({ searchTerm }) => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('LMV');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [safetyScore, setSafetyScore] = useState('100');
  const [status, setStatus] = useState('Available');
  const [editId, setEditId] = useState(null);

  // Local filters
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDrivers(data);
      } else {
        throw new Error(data.message || 'Failed to fetch drivers');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          licenseNo,
          licenseCategory,
          licenseExpiryDate,
          contactNo,
          safetyScore: Number(safetyScore),
          status
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDrivers([data, ...drivers]);
        setShowAddModal(false);
        resetForm();
      } else {
        throw new Error(data.message || 'Failed to add driver');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditDriver = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/drivers/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          licenseNo,
          licenseCategory,
          licenseExpiryDate,
          contactNo,
          safetyScore: Number(safetyScore),
          status
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDrivers(drivers.map(d => d._id === editId ? data : d));
        setShowEditModal(false);
        resetForm();
      } else {
        throw new Error(data.message || 'Failed to update driver');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm('Are you sure you want to remove this driver?')) return;
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/drivers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDrivers(drivers.filter(d => d._id !== id));
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete driver');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleDriverStatus = async (driver, nextStatus) => {
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/drivers/${driver._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...driver, status: nextStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setDrivers(drivers.map(d => d._id === driver._id ? data : d));
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (driver) => {
    setEditId(driver._id);
    setName(driver.name);
    setLicenseNo(driver.licenseNo);
    setLicenseCategory(driver.licenseCategory);
    setLicenseExpiryDate(new Date(driver.licenseExpiryDate).toISOString().split('T')[0]);
    setContactNo(driver.contactNo);
    setSafetyScore(driver.safetyScore);
    setStatus(driver.status);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName('');
    setLicenseNo('');
    setLicenseCategory('LMV');
    setLicenseExpiryDate('');
    setContactNo('');
    setSafetyScore('100');
    setStatus('Available');
    setEditId(null);
  };

  const checkLicenseStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    if (expiry < today) {
      return { label: 'EXPIRED', class: 'expired-lic' };
    }
    // Check if within 30 days
    const diffTime = Math.abs(expiry - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      return { label: 'EXPIRING SOON', class: 'expiring-lic' };
    }
    return null;
  };

  if (loading) {
    return <div className="page-container"><h2>Loading driver management...</h2></div>;
  }

  // Filter drivers list
  const filteredDrivers = drivers.filter(d => {
    const activeSearch = (searchTerm || localSearchTerm).toLowerCase();
    if (activeSearch) {
      const nameMatch = d.name?.toLowerCase().includes(activeSearch);
      const licMatch = d.licenseNo?.toLowerCase().includes(activeSearch);
      if (!nameMatch && !licMatch) return false;
    }

    if (statusFilter !== 'All' && d.status !== statusFilter) return false;

    return true;
  });

  const isSafetyOfficer = user?.role === 'Safety Officer' || user?.role === 'Fleet Manager';

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>Drivers & Safety Profiles</h1>
          <p>Verify driver credentials, license expirations, safety compliance records, and active trips.</p>
        </div>
        {isSafetyOfficer && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            Add Driver
          </button>
        )}
      </div>

      {/* Filter and search bars */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Search Name / License:</label>
          <input
            type="text"
            placeholder="Search driver profiles..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Drivers Profiles Table */}
      <div className="dashboard-panel" style={{ width: '100%' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>License No.</th>
                <th>Category</th>
                <th>Expiry Date</th>
                <th>Contact</th>
                <th>Trip Compl.</th>
                <th>Safety Score</th>
                <th>Status</th>
                {isSafetyOfficer && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={isSafetyOfficer ? 9 : 8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No drivers found.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => {
                  const licAlert = checkLicenseStatus(driver.licenseExpiryDate);
                  return (
                    <tr key={driver._id}>
                      <td style={{ fontWeight: '600' }}>{driver.name}</td>
                      <td>{driver.licenseNo}</td>
                      <td>{driver.licenseCategory}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{new Date(driver.licenseExpiryDate).toLocaleDateString('en-GB')}</span>
                          {licAlert && (
                            <span 
                              style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: '700', 
                                color: licAlert.label === 'EXPIRED' ? 'var(--color-danger)' : 'var(--color-warning)',
                                marginTop: '2px'
                              }}
                            >
                              ⚠️ {licAlert.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{driver.contactNo}</td>
                      <td>{driver.tripsCompleted || 0}</td>
                      <td>
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: driver.safetyScore >= 90 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: driver.safetyScore >= 90 ? 'var(--color-success)' : 'var(--color-danger)',
                            border: driver.safetyScore >= 90 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                          }}
                        >
                          {driver.safetyScore}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${driver.status.toLowerCase().replace(' ', '')}`}>
                          {driver.status}
                        </span>
                      </td>
                      {isSafetyOfficer && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.5rem' }}
                              onClick={() => openEditModal(driver)}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.5rem' }}
                              onClick={() => handleDeleteDriver(driver._id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toggle driver status footer section (matching Excalidraw mockup UI) */}
      {isSafetyOfficer && filteredDrivers.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <h4 style={{ marginBottom: '1rem', color: '#fff', fontSize: '0.9rem' }}>QUICK STATUS TOGGLE (Select driver from table or search to toggle)</h4>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {filteredDrivers.slice(0, 4).map(d => (
              <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 0, 0, 0.2)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{d.name}:</span>
                <button 
                  className={`btn`} 
                  style={{ padding: '2px 8px', fontSize: '0.7rem', background: d.status === 'Available' ? 'var(--color-success)' : 'transparent', color: '#fff', border: '1px solid var(--border-color)' }}
                  onClick={() => toggleDriverStatus(d, 'Available')}
                  disabled={d.status === 'On Trip'}
                >
                  Available
                </button>
                <button 
                  className={`btn`} 
                  style={{ padding: '2px 8px', fontSize: '0.7rem', background: d.status === 'Off Duty' ? 'var(--text-secondary)' : 'transparent', color: '#fff', border: '1px solid var(--border-color)' }}
                  onClick={() => toggleDriverStatus(d, 'Off Duty')}
                  disabled={d.status === 'On Trip'}
                >
                  Off Duty
                </button>
                <button 
                  className={`btn`} 
                  style={{ padding: '2px 8px', fontSize: '0.7rem', background: d.status === 'Suspended' ? 'var(--color-warning)' : 'transparent', color: '#fff', border: '1px solid var(--border-color)' }}
                  onClick={() => toggleDriverStatus(d, 'Suspended')}
                  disabled={d.status === 'On Trip'}
                >
                  Suspend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
        <AlertCircle size={14} />
        <span>Rule Validation: Expired driving licenses or Suspended driver status block trip assignments.</span>
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Driver</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddDriver}>
              <div className="form-grid">
                <div className="form-group">
                  <label>FULL NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>LICENSE NUMBER</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-88213"
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>LICENSE CATEGORY</label>
                  <select value={licenseCategory} onChange={(e) => setLicenseCategory(e.target.value)}>
                    <option value="LMV">LMV (Light Motor Vehicle)</option>
                    <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>LICENSE EXPIRY DATE</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiryDate}
                    onChange={(e) => setLicenseExpiryDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>CONTACT NUMBER</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>SAFETY SCORE (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    placeholder="e.g. 95"
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label>INITIAL STATUS</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Available">Available</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Driver Details</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditDriver}>
              <div className="form-grid">
                <div className="form-group">
                  <label>FULL NAME</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>LICENSE NUMBER</label>
                  <input
                    type="text"
                    required
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>LICENSE CATEGORY</label>
                  <select value={licenseCategory} onChange={(e) => setLicenseCategory(e.target.value)}>
                    <option value="LMV">LMV (Light Motor Vehicle)</option>
                    <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>LICENSE EXPIRY DATE</label>
                  <input
                    type="date"
                    required
                    value={licenseExpiryDate}
                    onChange={(e) => setLicenseExpiryDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>CONTACT NUMBER</label>
                  <input
                    type="text"
                    required
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>SAFETY SCORE (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label>STATUS</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
