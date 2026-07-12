import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api';
import { AlertCircle, CheckCircle, Navigation, Play, XCircle, Check, X, ShieldAlert } from 'lucide-react';

const TripDispatcher = () => {
  const { user } = useAuth();
  
  // Data lists
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states (Create Trip)
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [revenue, setRevenue] = useState('');
  const [createStatus, setCreateStatus] = useState('Draft'); // Draft or Dispatched

  // Active selected trip state for stepper / tracking
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Completion modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingTripId, setCompletingTripId] = useState('');
  const [actualOdometerEnd, setActualOdometerEnd] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [completeRevenue, setCompleteRevenue] = useState('');
  const [minOdometer, setMinOdometer] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('transitops_token');

      // Fetch vehicles, drivers, and trips
      const [vehRes, drvRes, tripRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vehicles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/drivers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/trips`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const vehData = await vehRes.json();
      const drvData = await drvRes.json();
      const tripData = await tripRes.json();

      if (vehRes.ok && drvRes.ok && tripRes.ok) {
        setVehicles(vehData);
        setDrivers(drvData);
        setTrips(tripData);
        if (tripData.length > 0) {
          setSelectedTrip(tripData[0]);
        }
      } else {
        throw new Error('Failed to fetch dispatcher assets');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          source,
          destination,
          vehicleId: vehicleId || null,
          driverId: driverId || null,
          cargoWeight: Number(cargoWeight),
          plannedDistance: Number(plannedDistance),
          status: createStatus,
          revenue: Number(revenue)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTrips([data, ...trips]);
        setSelectedTrip(data);
        alert(`Trip ${data.tripCode} created in "${data.status}" status!`);
        fetchData(); // refresh vehicle & driver availability statuses
      } else {
        throw new Error(data.message || 'Failed to create trip');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDispatchTrip = async (tripId) => {
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/dispatch`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTrips(trips.map(t => t._id === tripId ? data : t));
        if (selectedTrip?._id === tripId) setSelectedTrip(data);
        alert('Trip dispatched successfully!');
        fetchData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTrips(trips.map(t => t._id === tripId ? data : t));
        if (selectedTrip?._id === tripId) setSelectedTrip(data);
        alert('Trip cancelled!');
        fetchData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const openCompleteModal = (trip) => {
    setCompletingTripId(trip._id);
    // Find vehicle current odometer
    const currentOdo = trip.vehicle?.odometer || 0;
    setMinOdometer(currentOdo);
    setActualOdometerEnd(currentOdo + trip.plannedDistance);
    setFuelConsumed('');
    setFuelCost('');
    setCompleteRevenue(trip.revenue || '');
    setShowCompleteModal(true);
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/trips/${completingTripId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          actualOdometerEnd: Number(actualOdometerEnd),
          fuelConsumed: Number(fuelConsumed),
          fuelCost: Number(fuelCost),
          revenue: Number(completeRevenue)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTrips(trips.map(t => t._id === completingTripId ? data : t));
        if (selectedTrip?._id === completingTripId) setSelectedTrip(data);
        setShowCompleteModal(false);
        alert('Trip completed successfully!');
        fetchData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Helper validation variables
  const selectedVehicle = vehicles.find(v => v._id === vehicleId);
  const selectedDriver = drivers.find(d => d._id === driverId);

  const isCapacityExceeded = selectedVehicle && Number(cargoWeight) > selectedVehicle.maxCapacity;
  const capacityDiff = selectedVehicle ? Number(cargoWeight) - selectedVehicle.maxCapacity : 0;

  const isDriverSuspended = selectedDriver && selectedDriver.status === 'Suspended';
  const isDriverLicenseExpired = selectedDriver && new Date(selectedDriver.licenseExpiryDate) < new Date();

  // Filters for dropdown selection (only show Available vehicles/drivers, or allow seeing assigned if draft)
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const availableDrivers = drivers.filter(d => {
    const isLicenseValid = new Date(d.licenseExpiryDate) >= new Date();
    return d.status === 'Available' && isLicenseValid;
  });

  const isDispatcher = user?.role === 'Dispatcher';

  if (loading) {
    return <div className="page-container"><h2>Loading trip dispatcher board...</h2></div>;
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>Trip Dispatcher</h1>
          <p>Create routes, audit vehicle capacity and driver license validity, and complete logs.</p>
        </div>
      </div>

      <div className="split-layout">
        {/* Left Panel: Create Trip Form */}
        <div className="dashboard-panel">
          <h3 className="panel-title">Trip Lifecycle & Stepper</h3>

          {/* Stepper (Draft -> Dispatched -> Completed or Cancelled) */}
          {selectedTrip ? (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <span>Active Code: <strong>{selectedTrip.tripCode}</strong></span>
                <span>Route: {selectedTrip.source} → {selectedTrip.destination}</span>
              </div>
              <div className="stepper-container">
                <div className="stepper-line">
                  <div 
                    className="stepper-line-fill" 
                    style={{ 
                      width: selectedTrip.status === 'Draft' ? '0%' : 
                             selectedTrip.status === 'Dispatched' ? '50%' : '100%',
                      backgroundColor: selectedTrip.status === 'Cancelled' ? 'var(--color-danger)' : 'var(--color-info)'
                    }}
                  ></div>
                </div>

                <div className={`step-node ${['Draft', 'Dispatched', 'Completed'].includes(selectedTrip.status) ? 'completed' : ''} ${selectedTrip.status === 'Draft' ? 'active' : ''}`}>
                  <div className="step-dot">1</div>
                  <span className="step-label">Draft</span>
                </div>

                <div className={`step-node ${['Dispatched', 'Completed'].includes(selectedTrip.status) ? 'completed' : ''} ${selectedTrip.status === 'Dispatched' ? 'active' : ''}`}>
                  <div className="step-dot">2</div>
                  <span className="step-label">Dispatched</span>
                </div>

                <div className={`step-node ${selectedTrip.status === 'Completed' ? 'completed' : ''} ${selectedTrip.status === 'Cancelled' ? 'cancelled' : ''} ${['Completed', 'Cancelled'].includes(selectedTrip.status) ? 'active' : ''}`}>
                  <div className="step-dot">3</div>
                  <span className="step-label">{selectedTrip.status === 'Cancelled' ? 'Cancelled' : 'Completed'}</span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>No trips registered. Start creating a trip below.</p>
          )}

          {isDispatcher ? (
            <form onSubmit={handleCreateTrip}>
              <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>CREATE TRIP</h4>
              
              <div className="form-group">
                <label>SOURCE</label>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>DESTINATION</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>VEHICLE (AVAILABLE ONLY)</label>
                  <select required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                    <option value="">-- Select Vehicle --</option>
                    {availableVehicles.map(v => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.regNo}) - Max: {v.maxCapacity} kg
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>DRIVER (AVAILABLE & VALID LICENSE)</label>
                  <select required value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                    <option value="">-- Select Driver --</option>
                    {availableDrivers.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.licenseCategory})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>CARGO WEIGHT (KG)</label>
                  <input
                    type="number"
                    required
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>PLANNED DISTANCE (KM)</label>
                  <input
                    type="number"
                    required
                    value={plannedDistance}
                    onChange={(e) => setPlannedDistance(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>ESTIMATED REVENUE (₹)</label>
                  <input
                    type="number"
                    required
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>INITIAL DISPATCH STATE</label>
                  <select value={createStatus} onChange={(e) => setCreateStatus(e.target.value)}>
                    <option value="Draft">Draft (Save only)</option>
                    <option value="Dispatched">Dispatched (Launch immediately)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic validation error box */}
              {selectedVehicle && (
                <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                    <span>Vehicle Max Capacity: <strong>{selectedVehicle.maxCapacity} kg</strong></span>
                    <br />
                    <span>Selected Cargo Weight: <strong>{cargoWeight} kg</strong></span>
                  </div>

                  {isCapacityExceeded && (
                    <div className="alert-box alert-danger" style={{ marginTop: '0.5rem' }}>
                      <AlertCircle size={16} />
                      <div>
                        <strong>Capacity Exceeded by {capacityDiff} kg</strong>
                        <p>Dispatch blocked. Please reduce cargo weight or select a larger vehicle.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isDriverSuspended && (
                <div className="alert-box alert-danger">
                  <AlertCircle size={16} />
                  <div>
                    <strong>Driver Suspended</strong>
                    <p>Cannot dispatch trip with a suspended driver.</p>
                  </div>
                </div>
              )}

              {isDriverLicenseExpired && (
                <div className="alert-box alert-danger">
                  <AlertCircle size={16} />
                  <div>
                    <strong>Driver License Expired</strong>
                    <p>Driver has an expired license and cannot legally operate fleet vehicles.</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isCapacityExceeded || isDriverSuspended || isDriverLicenseExpired}
                  style={{ flex: 1 }}
                >
                  Confirm & Create Trip
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setVehicleId(''); setDriverId(''); }}>
                  Clear Fields
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <ShieldAlert size={28} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', display: 'inline-block' }} />
              <p>Trip creation is scoped to the <strong>Dispatcher</strong> role profile.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Log in or switch profile in Settings to create and dispatch operational routes.</p>
            </div>
          )}
        </div>

        {/* Right Panel: Live Board */}
        <div className="dashboard-panel">
          <h3 className="panel-title">Operations Live Board</h3>
          <div className="live-board-list">
            {trips.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No trips logged in the system.</p>
            ) : (
              trips.map((trip) => {
                const isSelected = selectedTrip?._id === trip._id;
                return (
                  <div 
                    key={trip._id} 
                    className="live-card" 
                    style={{ 
                      borderColor: isSelected ? 'var(--color-info)' : 'var(--border-color)',
                      background: isSelected ? 'rgba(59, 130, 246, 0.03)' : '',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedTrip(trip)}
                  >
                    <div className="live-card-header">
                      <span className="live-card-code">{trip.tripCode}</span>
                      <span className={`badge badge-${trip.status.toLowerCase()}`}>{trip.status}</span>
                    </div>

                    <div className="live-card-route">
                      {trip.source} → {trip.destination}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Vehicle: <strong>{trip.vehicle ? trip.vehicle.name : 'Unassigned'}</strong>
                      <span style={{ margin: '0 8px' }}>|</span>
                      Driver: <strong>{trip.driver ? trip.driver.name : 'Unassigned'}</strong>
                    </div>

                    <div className="live-card-footer">
                      <span>ETA: {trip.eta}</span>
                      {isDispatcher && (
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          {trip.status === 'Draft' && (
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                              onClick={(e) => { e.stopPropagation(); handleDispatchTrip(trip._id); }}
                            >
                              Dispatch
                            </button>
                          )}
                          {trip.status === 'Dispatched' && (
                            <>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '3px 8px', fontSize: '0.7rem', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                                onClick={(e) => { e.stopPropagation(); openCompleteModal(trip); }}
                              >
                                Complete
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '3px 8px', fontSize: '0.7rem', color: 'var(--color-danger)' }}
                                onClick={(e) => { e.stopPropagation(); handleCancelTrip(trip._id); }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Complete Trip Modal */}
      {showCompleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log Trip Completion details</h3>
              <button className="modal-close" onClick={() => setShowCompleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCompleteTrip}>
              <div className="form-group">
                <label>FINAL ODOMETER READING (KM) - Must be ≥ {minOdometer} km</label>
                <input
                  type="number"
                  required
                  min={minOdometer}
                  value={actualOdometerEnd}
                  onChange={(e) => setActualOdometerEnd(e.target.value)}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>FUEL CONSUMED (LITERS)</label>
                  <input
                    type="number"
                    required
                    value={fuelConsumed}
                    onChange={(e) => setFuelConsumed(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>TOTAL FUEL COST (₹)</label>
                  <input
                    type="number"
                    required
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>TOTAL REVENUE EARNED (₹)</label>
                <input
                  type="number"
                  required
                  value={completeRevenue}
                  onChange={(e) => setCompleteRevenue(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompleteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                  Complete & Release Assets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDispatcher;
