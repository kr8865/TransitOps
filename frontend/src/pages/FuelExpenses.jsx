import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api';
import { Plus, X, Fuel, Wallet, AlertTriangle, ShieldAlert } from 'lucide-react';

const FuelExpenses = () => {
  const { user } = useAuth();
  
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal control
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState('');

  const [expenseVehicleId, setExpenseVehicleId] = useState('');
  const [expenseType, setExpenseType] = useState('Toll');
  const [expenseCost, setExpenseCost] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('transitops_token');

      const [analRes, vehRes, fuelRes, expRes] = await Promise.all([
        fetch(`${API_BASE_URL}/expenses/analytics`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/vehicles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/expenses/fuel`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/expenses/other`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const analData = await analRes.json();
      const vehData = await vehRes.json();
      const fuelData = await fuelRes.json();
      const expData = await expRes.json();

      if (analRes.ok && vehRes.ok && fuelRes.ok && expRes.ok) {
        setAnalytics(analData);
        setVehicles(vehData);
        setFuelLogs(fuelData);
        setOtherExpenses(expData);
      } else {
        throw new Error('Failed to fetch expenses database');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFuel = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/expenses/fuel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId,
          liters: Number(liters),
          cost: Number(fuelCost),
          date: fuelDate
        })
      });

      if (res.ok) {
        setShowFuelModal(false);
        setVehicleId('');
        alert('Fuel log entered successfully!');
        fetchData();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to log fuel');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch(`${API_BASE_URL}/expenses/other`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: expenseVehicleId,
          type: expenseType,
          cost: Number(expenseCost),
          description: expenseDescription,
          date: expenseDate
        })
      });

      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseVehicleId('');
        alert('Expense recorded!');
        fetchData();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to record expense');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="page-container"><h2>Loading operational ledger...</h2></div>;
  }

  const isFinancialAnalyst = user?.role === 'Financial Analyst';

  // Calculate Toll, Other, Maintenance columns for formatting
  const formattedExpenses = otherExpenses.map((e) => {
    const isMaint = e.description?.toLowerCase().includes('maintenance');
    const isToll = e.type === 'Toll';

    const toll = isToll ? e.cost : 0;
    const maint = isMaint ? e.cost : 0;
    const other = (!isToll && !isMaint) ? e.cost : 0;

    return {
      _id: e._id,
      tripCode: e.description?.split(':')[0]?.startsWith('TR') ? e.description.split(':')[0] : 'TR00',
      regNo: e.vehicle ? e.vehicle.regNo : 'Removed',
      vehicleName: e.vehicle ? e.vehicle.name : '--',
      toll,
      other,
      maint,
      total: e.cost,
      status: e.vehicle ? e.vehicle.status : 'Available'
    };
  });

  const totalOperationalCost = analytics?.costs?.totalOperationalCost || 0;
  const tripWiseProfit = analytics?.tripWiseProfit || [];
  const totalProfit = analytics?.totalProfit || 0;

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>Fuel & Expense Management</h1>
          <p>Review fuel logs, track highway tolls or road permits, and compute overall operational costs.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isFinancialAnalyst && (
            <>
              <button className="btn btn-primary" onClick={() => { setVehicleId(''); setShowFuelModal(true); }}>
                <Plus size={16} />
                Log Fuel
              </button>
              <button className="btn btn-primary" onClick={() => { setExpenseVehicleId(''); setShowExpenseModal(true); }}>
                <Plus size={16} />
                Add Expense
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fuel Logs Section */}
      <div className="dashboard-panel" style={{ width: '100%', marginBottom: '2rem' }}>
        <h3 className="panel-title">Fuel Logs</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Date</th>
                <th>Liters</th>
                <th>Fuel Cost</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No fuel logs recorded.
                  </td>
                </tr>
              ) : (
                fuelLogs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontWeight: '600' }}>
                      {log.vehicle ? `${log.vehicle.name} (${log.vehicle.regNo})` : 'Removed'}
                    </td>
                    <td>{new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>{log.liters} L</td>
                    <td>₹{log.cost.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Other Expenses Section */}
      <div className="dashboard-panel" style={{ width: '100%', marginBottom: '1.5rem' }}>
        <h3 className="panel-title">Other Expenses (Toll / Misc)</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Trip</th>
                <th>Vehicle</th>
                <th>Toll</th>
                <th>Other</th>
                <th>Maint. (Linked)</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {formattedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No general expenses logged.
                  </td>
                </tr>
              ) : (
                formattedExpenses.map((exp) => (
                  <tr key={exp._id}>
                    <td style={{ fontWeight: '700' }}>{exp.tripCode}</td>
                    <td>{exp.regNo}</td>
                    <td>₹{exp.toll.toLocaleString()}</td>
                    <td>₹{exp.other.toLocaleString()}</td>
                    <td style={{ color: exp.maint > 0 ? 'var(--color-warning)' : '' }}>
                      ₹{exp.maint.toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '600' }}>₹{exp.total.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trip-Wise Profitability Ledger */}
      <div className="dashboard-panel" style={{ width: '100%', marginBottom: '2rem' }}>
        <h3 className="panel-title">Trip-Wise Profitability Ledger</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Trip Code</th>
                <th>Vehicle</th>
                <th>Revenue</th>
                <th>Fuel Cost</th>
                <th>Tolls / Misc</th>
                <th>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {tripWiseProfit.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No completed trips or profit logs recorded yet.
                  </td>
                </tr>
              ) : (
                tripWiseProfit.map((tp) => (
                  <tr key={tp._id}>
                    <td style={{ fontWeight: '700' }}>{tp.tripCode}</td>
                    <td>{tp.vehicleName}</td>
                    <td style={{ color: 'var(--color-success)' }}>₹{tp.revenue.toLocaleString()}</td>
                    <td>₹{tp.fuelCost.toLocaleString()}</td>
                    <td>₹{tp.otherCosts.toLocaleString()}</td>
                    <td style={{ fontWeight: '600', color: tp.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      ₹{tp.profit.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total profit display */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: totalProfit >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
          border: totalProfit >= 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', 
          padding: '1.25rem 2rem', 
          borderRadius: '12px',
          fontWeight: '700',
          marginBottom: '2rem'
        }}
      >
        <span style={{ fontSize: '0.9rem', color: '#fff', textTransform: 'uppercase' }}>
          Total Net Profit (Auto) = Revenue - Operating Costs
        </span>
        <span style={{ fontSize: '1.85rem', color: totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
          ₹{totalProfit.toLocaleString()}
        </span>
      </div>

      {/* Total operational cost display */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'rgba(217, 119, 6, 0.1)', 
          border: '1px solid rgba(217, 119, 6, 0.2)', 
          padding: '1.25rem 2rem', 
          borderRadius: '12px',
          fontWeight: '700'
        }}
      >
        <span style={{ fontSize: '0.9rem', color: '#fff', textTransform: 'uppercase' }}>
          Total Operational Cost (Auto) = Fuel + Maint + Tolls
        </span>
        <span style={{ fontSize: '1.85rem', color: 'var(--color-primary)' }}>
          ₹{totalOperationalCost.toLocaleString()}
        </span>
      </div>

      {/* Fuel Entry Modal */}
      {showFuelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log Fuel Fill Details</h3>
              <button className="modal-close" onClick={() => setShowFuelModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddFuel}>
              <div className="form-group">
                <label>VEHICLE</label>
                <select required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.name} ({v.regNo})</option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>FUEL FILLED (LITERS)</label>
                  <input
                    type="number"
                    required
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>TOTAL COST (₹)</label>
                  <input
                    type="number"
                    required
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>DATE</label>
                <input
                  type="date"
                  required
                  value={fuelDate}
                  onChange={(e) => setFuelDate(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFuelModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Fuel Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Other Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log General Expenditure</h3>
              <button className="modal-close" onClick={() => setShowExpenseModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label>VEHICLE</label>
                <select required value={expenseVehicleId} onChange={(e) => setExpenseVehicleId(e.target.value)}>
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.name} ({v.regNo})</option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>EXPENSE TYPE</label>
                  <select value={expenseType} onChange={(e) => setExpenseType(e.target.value)}>
                    <option value="Toll">Toll Fee</option>
                    <option value="Permit">Road Permit</option>
                    <option value="Other">Other Miscellaneous</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>TOTAL COST (₹)</label>
                  <input
                    type="number"
                    required
                    value={expenseCost}
                    onChange={(e) => setExpenseCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>DESCRIPTION DETAILS</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NH-8 Toll plaza fee or State Permit fee"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>DATE</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Expense Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelExpenses;
