import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Filter, FileSpreadsheet, Calendar, DollarSign, Layers } from 'lucide-react';

export const ReportsView = () => {
  const [reportType, setReportType] = useState('inventory'); // inventory, transactions
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch summary metrics
    fetch('/api/reports/summary')
      .then(res => res.json())
      .then(data => {
        if (data.success) setSummary(data.summary);
      });
  }, []);

  const fetchReportData = () => {
    setLoading(true);
    let url = `/api/reports/${reportType}?department=${selectedDept}&type=${selectedType}`;
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReportData(data.items || data.transactions || []);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, selectedDept, selectedType, dateFrom, dateTo]);

  const handleExportCsv = () => {
    let url = `/api/reports/${reportType}?department=${selectedDept}&type=${selectedType}&format=csv`;
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;

    window.open(url, '_blank');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Store Inventory & Audit Reports</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Generate audit logs, stock valuation ledgers, and export to Excel/CSV
          </p>
        </div>
        <button className="btn btn-success" onClick={handleExportCsv}>
          <Download size={18} /> Export Report to Excel / CSV
        </button>
      </div>

      {/* Summary KPI Bar */}
      {summary && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              <Layers size={26} />
            </div>
            <div>
              <div className="metric-val">{summary.total_items}</div>
              <div className="metric-lbl">Total Catalog Items</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
              <DollarSign size={26} />
            </div>
            <div>
              <div className="metric-val">₹{summary.total_valuation_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="metric-lbl">Total Inventory Valuation</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
              <BarChart3 size={26} />
            </div>
            <div>
              <div className="metric-val">{summary.pending_requisitions}</div>
              <div className="metric-lbl">Pending Requisitions</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
              <FileSpreadsheet size={26} />
            </div>
            <div>
              <div className="metric-val">{summary.active_dsr_assets}</div>
              <div className="metric-lbl">Active DSR Equipment</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Report Mode</label>
            <select className="form-select" value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="inventory">Current Stock Valuation Report</option>
              <option value="transactions">Transaction Audit Ledger Report</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Department Filter</label>
            <select className="form-select" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
              <option value="all">All Departments</option>
              <option value="Fitter">Fitter</option>
              <option value="Electrician">Electrician</option>
              <option value="Welder">Welder</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Date From</label>
            <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Date To</label>
            <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={fetchReportData}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {reportType === 'inventory' ? 'Inventory Valuation Ledger' : 'Transaction Audit Ledger'} ({reportData.length} records)
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
            <Download size={14} /> Download CSV
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Generating report data...</div>
        ) : reportData.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No data records match selected report parameters.</div>
        ) : reportType === 'inventory' ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Item Name</th>
                  <th>Register</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Unit Price</th>
                  <th>Total Valuation</th>
                  <th>Department</th>
                  <th>Bin / DSR Code</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map(item => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="badge-register badge-bin">{item.register_type.toUpperCase()}</span></td>
                    <td>{item.category}</td>
                    <td><strong>{item.current_stock} {item.unit}</strong></td>
                    <td>₹{Number(item.price_per_unit).toFixed(2)}</td>
                    <td><strong style={{ color: '#15803d' }}>₹{Number(item.total_value).toFixed(2)}</strong></td>
                    <td>{item.department || 'General'}</td>
                    <td>{item.location_code || item.dsr_code || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Tx ID</th>
                  <th>Date</th>
                  <th>Item Name</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total Amount</th>
                  <th>Department</th>
                  <th>Remarks / Invoice</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map(tx => (
                  <tr key={tx.id}>
                    <td>#{tx.id}</td>
                    <td>{tx.date}</td>
                    <td><strong>{tx.item_name}</strong></td>
                    <td>
                      <span className={`badge-status ${tx.type === 'purchase' ? 'badge-approved' : 'badge-rejected'}`}>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td><strong>{tx.quantity} {tx.unit}</strong></td>
                    <td>₹{Number(tx.price).toFixed(2)}</td>
                    <td><strong>₹{(tx.quantity * tx.price).toFixed(2)}</strong></td>
                    <td>{tx.department || 'Main Store'}</td>
                    <td>{tx.remarks}</td>
                    <td>{tx.created_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
