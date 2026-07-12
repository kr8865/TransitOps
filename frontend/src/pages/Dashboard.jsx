import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api';
import { Car, MapPin, Users, Activity, BarChart2, ShieldAlert } from 'lucide-react';

const Dashboard = ({ searchTerm }) => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [vehicleType, setVehicleType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('transitops_token');
      
      // Fetch analytics
      const analyticRes = await fetch(`${API_BASE_URL}/expenses/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const analytics = await analyticRes.json();

      // Fetch trips
      const tripsRes = await fetch(`${API_BASE_URL}/trips`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tripsList = await tripsRes.json();

      if (analyticRes.ok && tripsRes.ok) {
        setAnalyticsData(analytics);
        setTrips(tripsList);
      } else {
        throw new Error(analytics.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-container"><h2>Loading operational dashboard...</h2></div>;
  }

  if (error) {
    return <div className="page-container"><div className="alert-box alert-danger">Error: {error}</div></div>;
  }

  const kpis = analyticsData?.kpis || {
    activeVehicles: 0,
    availableVehicles: 0,
    vehiclesInMaintenance: 0,
    activeTrips: 0,
    pendingTrips: 0,
    driversOnDuty: 0,
    fleetUtilization: 0,
    totalVehicles: 0
  };

  const vehicleAnalytics = analyticsData?.vehicleAnalytics || [];
  
  // Calculate status counts for progress bars
  const statusCounts = {
    Available: vehicleAnalytics.filter(v => v.status === 'Available').length,
    'On Trip': vehicleAnalytics.filter(v => v.status === 'On Trip').length,
    'In Shop': vehicleAnalytics.filter(v => v.status === 'In Shop').length,
    Retired: vehicleAnalytics.filter(v => v.status === 'Retired').length,
  };
  const totalVehiclesCount = vehicleAnalytics.length || 1;

  // Filter recent trips based on top controls and sidebar global search
  const filteredTrips = trips.filter(trip => {
    // Search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const codeMatch = trip.tripCode?.toLowerCase().includes(s);
      const vehicleMatch = trip.vehicle?.regNo?.toLowerCase().includes(s);
      const driverMatch = trip.driver?.name?.toLowerCase().includes(s);
      const sourceMatch = trip.source?.toLowerCase().includes(s);
      const destMatch = trip.destination?.toLowerCase().includes(s);
      if (!codeMatch && !vehicleMatch && !driverMatch && !sourceMatch && !destMatch) return false;
    }

    // Vehicle Type filter
    if (vehicleType !== 'All') {
      if (trip.vehicle?.type !== vehicleType) return false;
    }

    // Status filter
    if (statusFilter !== 'All') {
      if (trip.status !== statusFilter) return false;
    }

    // Region filter based on vehicle region metadata
    if (regionFilter !== 'All') {
      if (!trip.vehicle || trip.vehicle.region !== regionFilter) return false;
    }

    return true;
  });

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>Operations Dashboard</h1>
          <p>Real-time overview of active trips, vehicle allocation, and driver utility.</p>
        </div>
      </div>

      {/* Top filters bar */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Vehicle Type:</label>
          <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
            <option value="All">All Types</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Mini">Mini</option>
            <option value="Bus">Bus</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Region:</label>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            <option value="All">All Regions</option>
            <option value="North">North Depot</option>
            <option value="South">South Hub</option>
            <option value="East">East Terminal</option>
            <option value="West">West Coast</option>
            <option value="Central">Central Fleet</option>
            <option value="Other">Other Region</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>Active Vehicles</span>
            <Car size={16} className="stat-icon" style={{ color: 'var(--color-info)' }} />
          </div>
          <div className="stat-value">{kpis.activeVehicles}</div>
          <div className="stat-footer">Fleet vehicles on active routes</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Available Vehicles</span>
            <Car size={16} className="stat-icon" style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value">{kpis.availableVehicles}</div>
          <div className="stat-footer">Ready for assignment</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Vehicles in Maintenance</span>
            <Activity size={16} className="stat-icon" style={{ color: 'var(--color-warning)' }} />
          </div>
          <div className="stat-value">{kpis.vehiclesInMaintenance}</div>
          <div className="stat-footer">Currently in shop</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Active Trips</span>
            <MapPin size={16} className="stat-icon" style={{ color: 'var(--color-info)' }} />
          </div>
          <div className="stat-value">{kpis.activeTrips}</div>
          <div className="stat-footer">Dispatched operations</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Pending Trips</span>
            <MapPin size={16} className="stat-icon" style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-value">{kpis.pendingTrips}</div>
          <div className="stat-footer">Draft / unscheduled trips</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Drivers On Duty</span>
            <Users size={16} className="stat-icon" style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value">{kpis.driversOnDuty}</div>
          <div className="stat-footer">Active driver profiles</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Fleet Utilization</span>
            <BarChart2 size={16} className="stat-icon" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="stat-value">{kpis.fleetUtilization}%</div>
          <div className="stat-footer">Percentage of vehicles active</div>
        </div>
      </div>

      {/* Main split panels: Recent Trips & Status Breakdown */}
      <div className="dashboard-grid">
        {/* Recent Trips Table */}
        <div className="dashboard-panel">
          <h3 className="panel-title">Recent Trips</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No recent trips found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.slice(0, 10).map((trip) => (
                    <tr key={trip._id}>
                      <td style={{ fontWeight: '700' }}>{trip.tripCode}</td>
                      <td>{trip.vehicle ? `${trip.vehicle.name} (${trip.vehicle.regNo})` : '--'}</td>
                      <td>{trip.driver ? trip.driver.name : '--'}</td>
                      <td>{trip.source} → {trip.destination}</td>
                      <td>
                        <span className={`badge badge-${trip.status.toLowerCase()}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td style={{ color: trip.status === 'Dispatched' ? 'var(--color-info)' : 'var(--text-muted)' }}>
                        {trip.eta}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Breakdown */}
        <div className="dashboard-panel">
          <h3 className="panel-title">Vehicle Status Summary</h3>
          <div className="progress-list">
            <div className="progress-item">
              <div className="progress-item-label">
                <span>Available</span>
                <span>{statusCounts.Available} ({Math.round((statusCounts.Available / totalVehiclesCount) * 100)}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-bar" 
                  style={{ width: `${(statusCounts.Available / totalVehiclesCount) * 100}%`, backgroundColor: 'var(--color-success)' }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-item-label">
                <span>On Trip</span>
                <span>{statusCounts['On Trip']} ({Math.round((statusCounts['On Trip'] / totalVehiclesCount) * 100)}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-bar" 
                  style={{ width: `${(statusCounts['On Trip'] / totalVehiclesCount) * 100}%`, backgroundColor: 'var(--color-info)' }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-item-label">
                <span>In Shop (Maintenance)</span>
                <span>{statusCounts['In Shop']} ({Math.round((statusCounts['In Shop'] / totalVehiclesCount) * 100)}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-bar" 
                  style={{ width: `${(statusCounts['In Shop'] / totalVehiclesCount) * 100}%`, backgroundColor: 'var(--color-warning)' }}
                ></div>
              </div>
            </div>

            <div className="progress-item">
              <div className="progress-item-label">
                <span>Retired</span>
                <span>{statusCounts.Retired} ({Math.round((statusCounts.Retired / totalVehiclesCount) * 100)}%)</span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-bar" 
                  style={{ width: `${(statusCounts.Retired / totalVehiclesCount) * 100}%`, backgroundColor: 'var(--color-danger)' }}
                ></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.5rem', fontWeight: '600', color: '#fff' }}>
              <ShieldAlert size={14} style={{ color: 'var(--color-warning)' }} />
              Operational Rule Reminder:
            </div>
            Retired or In Shop vehicles are automatically removed from the active dispatcher selection pool.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
