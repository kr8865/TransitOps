import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api';
import { AlertTriangle, ShieldAlert, Check, Calendar, Wrench, Trash2 } from 'lucide-react';

const MaintenanceLogs = () => {
  const { user } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('Active');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('transitops_token');
      
      const [logsRes, vehRes] = await Promise.all([
        fetch(`${API_BASE_URL}/maintenance`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/vehicles`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const logsData = await logsRes.json();
      const vehData = await vehRes.json();

      if (logsRes.ok && vehRes.ok) {
        setLogs(logsData);
        setVehicles(vehData);
      } else {
        throw new Error('Failed to load maintenance services');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!vehicleId) {
      alert('Please select a vehicle');
      return;
    }
    
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId,
          description,
          cost: Number(cost),
          startDate
        })
      });

      const data = await res.json();
      if (res.ok) {
        setLogs([data, ...logs]);
        setVehicleId('');
        alert('Maintenance record saved! Vehicle status set to "In Shop".');
        fetchData(); // refresh vehicle list statuses
      } else {
        throw new Error(data.message || 'Failed to save maintenance record');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCloseLog = async (logId) => {
    if (!window.confirm('Are you sure you want to close this maintenance record?')) return;
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/maintenance/${logId}/close`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setLogs(logs.map(l => l._id === logId ? data : l));
        alert('Maintenance closed. Vehicle is now Available.');
        fetchData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Only show Available vehicles to go into shop
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const isFleetManager = user?.role === 'Fleet Manager';

  if (loading) {
    return <div className="page-container"><h2>Loading maintenance services...</h2></div>;
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>Maintenance Management</h1>
          <p>Schedule service logs, monitor vehicle shop statuses, and clear repair records.</p>
        </div>
      </div>

      <div className="split-layout">
        {/* Left Form Panel */}
        <div className="dashboard-panel">
          <h3 className="panel-title">Log, Service Record</h3>
          
          {isFleetManager ? (
            <form onSubmit={handleSaveLog}>
              <div className="form-group">
                <label>VEHICLE</label>
                <select required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  <option value="">-- Select Vehicle --</option>
                  {availableVehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.regNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>SERVICE TYPE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oil Change, Engine Repair"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>COST</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2500"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>DATE</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>STATUS</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Active">Active (In Shop)</option>
                  <option value="Closed">Closed (Resolved)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem', padding: '0.65rem' }}>
                Save Record
              </button>
            </form>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <ShieldAlert size={28} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', display: 'inline-block' }} />
              <p>Maintenance creations are restricted to the <strong>Fleet Manager</strong>.</p>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--color-success)', fontWeight: 'bold', marginBottom: '4px' }}>
              <span>Available</span>
              <span>→ creating active record →</span>
              <span style={{ color: 'var(--color-warning)' }}>In Shop</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--color-warning)', fontWeight: 'bold', marginBottom: '8px' }}>
              <span>In Shop</span>
              <span>→ closing record →</span>
              <span style={{ color: 'var(--color-success)' }}>Available</span>
            </div>
            <p>Note: In Shop vehicles are automatically removed from the active dispatch selection pool.</p>
          </div>
        </div>

        {/* Right List Panel */}
        <div className="dashboard-panel">
          <h3 className="panel-title">Service Log</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service</th>
                  <th>Cost</th>
                  <th>Status</th>
                  {isFleetManager && <th style={{ textAlign: 'right' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={isFleetManager ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No service records logged.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ fontWeight: '600' }}>
                        {log.vehicle ? log.vehicle.name : 'Removed'}
                      </td>
                      <td>{log.description}</td>
                      <td>₹{log.cost.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${log.status === 'Active' ? 'badge-inshop' : 'badge-completed'}`}>
                          {log.status === 'Active' ? 'In Shop' : 'Completed'}
                        </span>
                      </td>
                      {isFleetManager && (
                        <td style={{ textAlign: 'right' }}>
                          {log.status === 'Active' ? (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '2px 8px', fontSize: '0.7rem', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                              onClick={() => handleCloseLog(log._id)}
                            >
                              Close Log
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Closed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceLogs;
