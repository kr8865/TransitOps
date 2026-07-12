import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Fuel, BarChart2, TrendingUp, DollarSign, TrendingDown, Truck, AlertTriangle } from 'lucide-react';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('transitops_token');
      const res = await fetch('http://localhost:5001/api/expenses/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
      } else {
        throw new Error(data.message || 'Failed to fetch analytics metrics');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-container"><h2>Loading reports &amp; analytics...</h2></div>;
  }

  if (error) {
    return <div className="page-container"><div className="alert-box alert-danger">Error: {error}</div></div>;
  }

  const kpis = analytics?.kpis || {};
  const costs = analytics?.costs || {};
  const efficiency = analytics?.fuelEfficiency || 0;
  const vehicleAnalytics = analytics?.vehicleAnalytics || [];
  const totalProfit = analytics?.totalProfit || 0;

  const totalRevenue = costs.totalRevenue || 0;
  const totalAcquisitionCost = costs.totalAcquisitionCost || 0;
  const totalNetMoneyUsed = costs.totalNetMoneyUsed || 0;
  const totalNetProfitAfterAcquisition = costs.totalNetProfitAfterAcquisition || 0;
  const totalOperationalCost = costs.totalOperationalCost || 0;

  // Sort vehicles by operating costs descending for the "Top Costliest Vehicles" list
  const costliestVehicles = [...vehicleAnalytics]
    .sort((a, b) => b.totalCosts - a.totalCosts)
    .slice(0, 3); // top 3 costliest

  const maxCostValue = Math.max(...costliestVehicles.map(v => v.totalCosts), 1) || 1;

  // Monthly Revenue Data from API
  const monthlyRevenue = analytics?.monthlyRevenue || [];
  const maxRevenue = Math.max(...monthlyRevenue.map(r => r.revenue), 10000) || 10000;

  // SVG dimensions
  const width = 500;
  const height = 180;
  const paddingLeft = 40;
  const paddingBottom = 25;
  const chartHeight = height - paddingBottom;
  const chartWidth = width - paddingLeft;
  const barSpacing = chartWidth / Math.max(monthlyRevenue.length, 1);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const exportAnalyticsCSV = () => {
    if (!analytics) return;

    const headers = [
      'Vehicle',
      'Revenue',
      'Fuel Cost',
      'Maintenance Cost',
      'Other Expense',
      'Total Cost',
      'ROI %'
    ];

    const quote = (value) => `"${String(value || '').replace(/"/g, '""')}"`;
    const rows = vehicleAnalytics.map(v => [
      quote(`${v.name} (${v.regNo})`),
      quote(v.revenue),
      quote(v.fuelCost),
      quote(v.maintenanceCost),
      quote(v.otherExpenseCost),
      quote(v.totalCosts),
      quote(v.roiPercentage)
    ]);

    const csvContent = [headers.map(quote).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transitops-analytics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>Reports &amp; Analytics</h1>
          <p>Gain insights into fleet yields, operational cost progression, and resource efficiencies.</p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span>Fuel Efficiency</span>
            <Fuel size={16} className="stat-icon" style={{ color: 'var(--color-info)' }} />
          </div>
          <div className="stat-value">{Number(efficiency).toFixed(1)} km/l</div>
          <div className="stat-footer">Average mileage performance</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Fleet Utilization</span>
            <BarChart2 size={16} className="stat-icon" style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value">{kpis.fleetUtilization !== undefined ? kpis.fleetUtilization : 0}%</div>
          <div className="stat-footer">Percentage of active fleet transit</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Total Revenue</span>
            <TrendingUp size={16} className="stat-icon" style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{fmt(totalRevenue)}</div>
          <div className="stat-footer">Cumulative completed trip earnings</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Operational Cost</span>
            <DollarSign size={16} className="stat-icon" style={{ color: 'var(--color-warning)' }} />
          </div>
          <div className="stat-value">{fmt(totalOperationalCost)}</div>
          <div className="stat-footer">Cumulative fuel, maint &amp; tolls</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Total Money Used</span>
            <TrendingDown size={16} className="stat-icon" style={{ color: 'var(--color-danger)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{fmt(totalNetMoneyUsed)}</div>
          <div className="stat-footer">Acquisition + all operational costs</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Net Profit (Ops)</span>
            <DollarSign size={16} className="stat-icon" style={{ color: totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }} />
          </div>
          <div className="stat-value" style={{ color: totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {fmt(totalProfit)}
          </div>
          <div className="stat-footer">Revenue minus operational costs</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Net Profit (After Acq.)</span>
            <DollarSign size={16} className="stat-icon" style={{ color: totalNetProfitAfterAcquisition >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }} />
          </div>
          <div className="stat-value" style={{ color: totalNetProfitAfterAcquisition >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {fmt(totalNetProfitAfterAcquisition)}
          </div>
          <div className="stat-footer">Revenue minus ops &amp; acquisition</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Average Vehicle ROI</span>
            <TrendingUp size={16} className="stat-icon" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="stat-value">
            {vehicleAnalytics.length > 0
              ? `${(vehicleAnalytics.reduce((sum, v) => sum + v.roiPercentage, 0) / vehicleAnalytics.length).toFixed(1)}%`
              : '0.0%'}
          </div>
          <div className="stat-footer">Average capital return yields</div>
        </div>
      </div>

      {/* Split Panels: Monthly Revenue Chart & Costliest Vehicles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Reports & Analytics</h2>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>Export summary data for finance or board reports.</p>
        </div>
        <button className="btn btn-secondary" onClick={exportAnalyticsCSV}>Export CSV</button>
      </div>
      <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="dashboard-panel">
          <h3 className="panel-title">Monthly Revenue</h3>
          <div className="chart-container">
            <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
              <line x1={paddingLeft} y1={chartHeight} x2={width} y2={chartHeight} className="chart-axis" />
              <line x1={paddingLeft} y1={0} x2={paddingLeft} y2={chartHeight} className="chart-axis" />

              {/* Grid Lines */}
              <line x1={paddingLeft} y1={chartHeight/2} x2={width} y2={chartHeight/2} className="chart-grid-line" />
              <line x1={paddingLeft} y1={chartHeight/4} x2={width} y2={chartHeight/4} className="chart-grid-line" />

              {/* Y Labels */}
              <text x={10} y={chartHeight/4 + 4} className="chart-text">75K</text>
              <text x={10} y={chartHeight/2 + 4} className="chart-text">50K</text>
              <text x={10} y={chartHeight*3/4 + 4} className="chart-text">25K</text>

              {/* Monthly bars */}
              {monthlyRevenue.map((r, idx) => {
                const barWidth = 35;
                const x = paddingLeft + (idx * barSpacing) + (barSpacing - barWidth)/2;
                const ratio = r.revenue / maxRevenue;
                const barHeight = ratio * chartHeight;
                const y = chartHeight - barHeight;

                return (
                  <g key={r.month}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      className="chart-bar"
                      style={{ fill: 'var(--color-info)' }}
                    />
                    <text x={x + barWidth/2} y={chartHeight + 15} textAnchor="middle" className="chart-text">
                      {r.month}
                    </text>
                    <text x={x + barWidth/2} y={y - 5} textAnchor="middle" className="chart-text" style={{ fill: '#fff' }}>
                      {r.revenue >= 1000 ? `₹${Math.round(r.revenue/1000)}K` : `₹${r.revenue}`}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Top Costliest Vehicles ranking tracker */}
        <div className="dashboard-panel">
          <h3 className="panel-title">Top Costliest Vehicles</h3>
          <div className="progress-list" style={{ marginTop: '1.5rem' }}>
            {costliestVehicles.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No operational logs found.</p>
            ) : (
              costliestVehicles.map((v, idx) => {
                // Color codes: Red for top cost, orange for second, blue for third
                const colors = ['var(--color-danger)', 'var(--color-warning)', 'var(--color-info)'];
                return (
                  <div className="progress-item" key={v._id}>
                    <div className="progress-item-label">
                      <strong>{v.name} ({v.regNo})</strong>
                      <span>{fmt(v.totalCosts)}</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${(v.totalCosts / maxCostValue) * 100}%`,
                          backgroundColor: colors[idx % 3]
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Truck-wise Financial Breakdown */}
      <div className="dashboard-panel" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Truck size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 className="panel-title" style={{ margin: 0 }}>Truck-wise Financial Breakdown</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Reg No.</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Fuel Cost</th>
                <th style={{ textAlign: 'right' }}>Maint. Cost</th>
                <th style={{ textAlign: 'right' }}>Other Costs</th>
                <th style={{ textAlign: 'right' }}>Ops Cost</th>
                <th style={{ textAlign: 'right' }}>Acquisition</th>
                <th style={{ textAlign: 'right' }}>Total Money Used</th>
                <th style={{ textAlign: 'right' }}>Net Profit (Ops)</th>
                <th style={{ textAlign: 'right' }}>Net Profit (After Acq.)</th>
              </tr>
            </thead>
            <tbody>
              {vehicleAnalytics.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No vehicles found.
                  </td>
                </tr>
              ) : (
                vehicleAnalytics.map((v) => {
                  const netProfit = v.netProfit || 0;
                  const netProfitAfterAcq = v.netProfitAfterAcquisition || 0;
                  return (
                    <tr key={v._id}>
                      <td style={{ fontWeight: '700' }}>{v.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{v.regNo}</td>
                      <td>
                        <span className={`badge badge-${v.status === 'Available' ? 'completed' : v.status === 'On Trip' ? 'dispatched' : v.status === 'In Shop' ? 'draft' : 'cancelled'}`}>
                          {v.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-success)', fontWeight: '600' }}>{fmt(v.revenue)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(v.fuelCost)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(v.maintenanceCost)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(v.otherExpenseCost)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-warning)', fontWeight: '600' }}>{fmt(v.totalCosts)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(v.acquisitionCost)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-danger)', fontWeight: '700' }}>{fmt(v.netMoneyUsed)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: netProfitAfterAcq >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {netProfitAfterAcq >= 0 ? '+' : ''}{fmt(netProfitAfterAcq)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Totals footer */}
            {vehicleAnalytics.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', fontWeight: '700' }}>
                  <td colSpan="3" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>FLEET TOTALS</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>{fmt(totalRevenue)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(costs.fuelCostTotal)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(costs.maintenanceCostTotal)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(costs.otherExpenseCostTotal)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-warning)' }}>{fmt(totalOperationalCost)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(totalAcquisitionCost)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>{fmt(totalNetMoneyUsed)}</td>
                  <td style={{ textAlign: 'right', color: totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}
                  </td>
                  <td style={{ textAlign: 'right', color: totalNetProfitAfterAcquisition >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {totalNetProfitAfterAcquisition >= 0 ? '+' : ''}{fmt(totalNetProfitAfterAcquisition)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <AlertTriangle size={13} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong style={{ color: 'var(--text-secondary)' }}>Net Profit (Ops)</strong> = Revenue − Fuel − Maintenance − Other Expenses.&nbsp;
            <strong style={{ color: 'var(--text-secondary)' }}>Net Profit (After Acq.)</strong> = Revenue − Operational Costs − Acquisition Cost.&nbsp;
            <strong style={{ color: 'var(--text-secondary)' }}>Total Money Used</strong> = Acquisition Cost + All Operational Costs.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
