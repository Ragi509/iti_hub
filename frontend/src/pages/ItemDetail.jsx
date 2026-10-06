import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Barcode, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  FileText,
  User,
  Layers,
  HardDrive
} from 'lucide-react';

export const ItemDetail = ({ itemId, onBack, onAddStock }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    fetch(`/api/items/${itemId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDetail(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching item detail:', err);
        setLoading(false);
      });
  }, [itemId]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading Digital Bin Card...</div>;
  }

  if (!detail || !detail.item) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="card">Item not found.</div>
      </div>
    );
  }

  const { item, transactions, distributions, summary } = detail;
  const isBin = item.register_type === 'bin';
  const isMisc = item.register_type === 'miscellaneous';
  const isDsr = item.register_type === 'dsr';

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Inventory Dashboard
        </button>
        <button className="btn btn-primary" onClick={() => onAddStock(item.id)}>
          + Record Stock Intake / Purchase
        </button>
      </div>

      {/* Item Summary Card (Digital Bin Card Header) */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              {isBin && <span className="badge-register badge-bin"><Package size={16} /> Bin Card Register</span>}
              {isMisc && <span className="badge-register badge-misc"><Layers size={16} /> Miscellaneous Register</span>}
              {isDsr && <span className="badge-register badge-dsr"><HardDrive size={16} /> Dead Stock Register (DSR)</span>}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Category: {item.category}</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{item.name}</h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Current Balance Stock</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#15803d' }}>
              {item.current_stock} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#475569' }}>{item.unit}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Total Valuation: <strong style={{ color: '#0f172a' }}>₹{(item.current_stock * item.price_per_unit).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Unit Price</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>₹{Number(item.price_per_unit).toFixed(2)} / {item.unit}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Department</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>{item.department || 'General Store'}</div>
          </div>

          {item.location_code && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bin Location</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={16} /> {item.location_code}
              </div>
            </div>
          )}

          {item.dsr_code && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>DSR Register Code</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Barcode size={16} /> {item.dsr_code}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stock Summary Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div className="metric-val">{summary.total_purchased} {item.unit}</div>
            <div className="metric-lbl">Total Purchases Inward</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <TrendingDown size={28} />
          </div>
          <div>
            <div className="metric-val">{summary.total_issued} {item.unit}</div>
            <div className="metric-lbl">Total Stock Issued</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <Package size={28} />
          </div>
          <div>
            <div className="metric-val">{summary.current_stock} {item.unit}</div>
            <div className="metric-lbl">Available Balance On Hand</div>
          </div>
        </div>
      </div>

      {/* Digital Bin Card Ledger Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="#1e3a8a" /> Digital Bin Card Transaction Ledger
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Automated stock reconciliation log ({transactions.length} transactions)
          </span>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No transaction records logged for this item yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Tx ID</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Amount</th>
                  <th>Department</th>
                  <th>Remarks / Invoice Reference</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const isPurchase = tx.type === 'purchase';
                  const isIssue = tx.type === 'issue';

                  return (
                    <tr key={tx.id}>
                      <td><span style={{ fontWeight: 700, color: '#64748b' }}>#{tx.id}</span></td>
                      <td><span style={{ fontWeight: 600 }}>{tx.date}</span></td>
                      <td>
                        {isPurchase && (
                          <span className="badge-status badge-issued" style={{ background: '#dcfce7', color: '#15803d' }}>
                            + PURCHASE
                          </span>
                        )}
                        {isIssue && (
                          <span className="badge-status badge-rejected" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                            - ISSUE
                          </span>
                        )}
                        {!isPurchase && !isIssue && (
                          <span className="badge-status badge-pending">
                            ADJUSTMENT
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: isPurchase ? '#15803d' : '#b91c1c' }}>
                          {isPurchase ? '+' : '-'}{tx.quantity} {item.unit}
                        </div>
                      </td>
                      <td>₹{Number(tx.price).toFixed(2)}</td>
                      <td><strong>₹{(tx.quantity * tx.price).toFixed(2)}</strong></td>
                      <td>{tx.department || 'Main Store'}</td>
                      <td style={{ color: '#475569', fontSize: '0.9rem' }}>{tx.remarks}</td>
                      <td><span style={{ fontWeight: 600, color: '#334155' }}>{tx.created_by}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DSR Machinery Distribution Register (If DSR item) */}
      {isDsr && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive size={20} color="#7c3aed" /> DSR Machinery Asset Distribution History
            </h2>
          </div>

          {distributions.length === 0 ? (
            <div style={{ padding: '1.5rem', color: '#64748b' }}>No active distribution records for this DSR machinery asset.</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Dist ID</th>
                    <th>Holding Department</th>
                    <th>Issued Date</th>
                    <th>Returned Date</th>
                    <th>Current Holder Name</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map(d => (
                    <tr key={d.id}>
                      <td>#{d.id}</td>
                      <td><strong>{d.department}</strong></td>
                      <td>{d.issued_date}</td>
                      <td>{d.returned_date || <span style={{ color: '#d97706', fontWeight: 600 }}>Active (In Use)</span>}</td>
                      <td><span style={{ fontWeight: 700, color: '#1e3a8a' }}>{d.current_holder}</span></td>
                      <td>
                        <span className={`badge-status ${d.status === 'active' ? 'badge-approved' : 'badge-received'}`}>
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{d.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
