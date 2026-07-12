import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit3, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api';

const VehicleRegistry = ({ searchTerm }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form fields
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Van');
  const [region, setRegion] = useState('Central');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [odometer, setOdometer] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [status, setStatus] = useState('Available');
  const [editId, setEditId] = useState(null);
  
  // Local filters
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setVehicles(data);
      } else {
        throw new Error(data.message || 'Failed to fetch vehicles');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          regNo,
          name,
          type,
          region,
          maxCapacity: Number(maxCapacity),
          odometer: Number(odometer),
          acquisitionCost: Number(acquisitionCost),
          status
        })
      });

      const data = await res.json();
      if (res.ok) {
        setVehicles([data, ...vehicles]);
        setShowAddModal(false);
        resetForm();
      } else {
        throw new Error(data.message || 'Failed to add vehicle');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditVehicle = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/vehicles/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          regNo,
          name,
          type,
          region,
          maxCapacity: Number(maxCapacity),
          odometer: Number(odometer),
          acquisitionCost: Number(acquisitionCost),
          status
        })
      });

      const data = await res.json();
      if (res.ok) {
        setVehicles(vehicles.map(v => v._id === editId ? data : v));
        setShowEditModal(false);
        resetForm();
      } else {
        throw new Error(data.message || 'Failed to update vehicle');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setVehicles(vehicles.filter(v => v._id !== id));
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete vehicle');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (vehicle) => {
    setEditId(vehicle._id);
    setRegNo(vehicle.regNo);
    setName(vehicle.name);
    setType(vehicle.type);
    setRegion(vehicle.region || 'Central');
    setMaxCapacity(vehicle.maxCapacity);
    setOdometer(vehicle.odometer);
    setAcquisitionCost(vehicle.acquisitionCost);
    setStatus(vehicle.status);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setRegNo('');
    setName('');
    setType('Van');
    setRegion('Central');
    setMaxCapacity('');
    setOdometer('');
    setAcquisitionCost('');
    setStatus('Available');
    setEditId(null);
  };

  if (loading) {
    return <div className="page-container"><h2>Loading vehicle registry...</h2></div>;
  }

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    // Top-bar search & local input search
    const activeSearch = (searchTerm || localSearchTerm).toLowerCase();
    if (activeSearch) {
      const regMatch = v.regNo?.toLowerCase().includes(activeSearch);
      const nameMatch = v.name?.toLowerCase().includes(activeSearch);
      if (!regMatch && !nameMatch) return false;
    }

    // Type filter
    if (typeFilter !== 'All' && v.type !== typeFilter) return false;

    // Region filter
    if (regionFilter !== 'All' && v.region !== regionFilter) return false;

    // Status filter
    if (statusFilter !== 'All' && v.status !== statusFilter) return false;

    return true;
  });

  const isFleetManager = user?.role === 'Fleet Manager';

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>Vehicle Registry</h1>
          <p>Master registry of fleet vehicles, capacities, odometer logs, and life cycles.</p>
        </div>
        {isFleetManager && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            Add Vehicle
          </button>
        )}
      </div>

      {/* Filtering & Searching Controls */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Search Reg No:</label>
          <input
            type="text"
            placeholder="Search registration..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All">All Types</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Mini">Mini</option>
            <option value="Bus">Bus</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Region:</label>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            <option value="All">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="Central">Central</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="dashboard-panel" style={{ width: '100%' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Reg. No. (Unique)</th>
                <th>Name / Model</th>
                <th>Type</th>
                <th>Region</th>
                <th>Capacity (kg)</th>
                <th>Odometer (km)</th>
                <th>Acq. Cost</th>
                <th>Status</th>
                {isFleetManager && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={isFleetManager ? 9 : 8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No vehicles found in registry.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle._id}>
                    <td style={{ fontWeight: '700' }}>{vehicle.regNo}</td>
                    <td>{vehicle.name}</td>
                    <td>{vehicle.type}</td>
                    <td>{vehicle.region || 'Central'}</td>
                    <td>{vehicle.maxCapacity.toLocaleString()} kg</td>
                    <td>{vehicle.odometer.toLocaleString()} km</td>
                    <td>₹{vehicle.acquisitionCost.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${vehicle.status.toLowerCase().replace(' ', '')}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    {isFleetManager && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.5rem' }}
                            onClick={() => openEditModal(vehicle)}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '0.3rem 0.5rem' }}
                            onClick={() => handleDeleteVehicle(vehicle._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
        <AlertTriangle size={14} />
        <span>Rule Reminder: Registration numbers are strictly unique • Retired or In Shop vehicles will not show up in the trip dispatcher.</span>
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Vehicle</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddVehicle}>
              <div className="form-grid">
                <div className="form-group">
                  <label>REGISTRATION NO.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GJ01AB452"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>NAME / MODEL</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Van-05"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>VEHICLE TYPE</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Mini">Mini</option>
                    <option value="Bus">Bus</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>REGION</label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="Central">Central</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>MAX CAPACITY (KG)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>ODOMETER (KM)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 74000"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>ACQUISITION COST</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 620000"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label>INITIAL STATUS</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Available">Available</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Vehicle Details</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditVehicle}>
              <div className="form-grid">
                <div className="form-group">
                  <label>REGISTRATION NO.</label>
                  <input
                    type="text"
                    required
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>NAME / MODEL</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>VEHICLE TYPE</label>
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Mini">Mini</option>
                    <option value="Bus">Bus</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>REGION</label>
                  <select value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="Central">Central</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>MAX CAPACITY (KG)</label>
                  <input
                    type="number"
                    required
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>ODOMETER (KM)</label>
                  <input
                    type="number"
                    required
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>ACQUISITION COST</label>
                  <input
                    type="number"
                    required
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label>STATUS</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleRegistry;
