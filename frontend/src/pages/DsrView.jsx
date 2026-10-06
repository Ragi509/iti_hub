import React, { useState, useEffect } from 'react';
import { HardDrive, Barcode, UserCheck, ArrowRightLeft, CheckCircle2, RotateCcw, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DsrView = () => {
  const { user } = useAuth();
  const [dsrItems, setDsrItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [issueDept, setIssueDept] = useState('Fitter');
  const [holderName, setHolderName] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchDsrData = () => {
    setLoading(true);
    fetch('/api/dsr')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDsrItems(data.dsr_items);
          setHistory(data.distribution_history);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDsrData();
  }, []);

  const handleIssueDsr = (e) => {
    e.preventDefault();
    if (!selectedItemId || !holderName) {
      alert('Item and Holder Name are required');
      return;
    }

    fetch('/api/dsr/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: Number(selectedItemId),
        department: issueDept,
        current_holder: holderName,
        remarks: remarks || 'Issued via DSR Distribution Register'
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShowIssueModal(false);
          setHolderName('');
          setRemarks('');
          fetchDsrData();
        } else {
          alert('Error issuing DSR item: ' + data.error);
        }
      });
  };

  const handleReturnDsr = (distributionId) => {
    if (!window.confirm('Return this DSR asset to Main Store inventory?')) return;

    fetch(`/api/dsr/${distributionId}/return`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        returned_date: new Date().toISOString().split('T')[0],
        remarks: 'Asset returned to main store inventory'
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchDsrData();
        } else {
          alert('Error returning DSR asset: ' + data.error);
        }
      });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Dead Stock Register (DSR) & Asset Manager</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Tracking Machinery, Heavy Equipment & Precision Instruments with Unique Register Serial Numbers
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          if (dsrItems.length > 0) setSelectedItemId(dsrItems[0].id);
          setShowIssueModal(true);
        }}>
          <ArrowRightLeft size={18} /> Issue DSR Asset to Department
        </button>
      </div>

      {/* DSR Assets Matrix Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardDrive size={22} color="#7c3aed" /> Machinery & Heavy Equipment Register ({dsrItems.length} assets)
          </h2>
          <span className="badge-register badge-dsr">DSR Register Standard</span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading DSR register records...</div>
        ) : dsrItems.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No DSR assets registered in system.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>DSR Code</th>
                  <th>Machine / Equipment Name</th>
                  <th>Category</th>
                  <th>Holding Dept</th>
                  <th>Current Holder Name</th>
                  <th>Issued Date</th>
                  <th>Asset Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dsrItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Barcode size={16} /> {item.dsr_code || 'ITI-DEL/REG-01/SR-100'}
                      </div>
                    </td>
                    <td><strong style={{ fontSize: '1rem', color: '#0f172a' }}>{item.name}</strong></td>
                    <td>{item.category}</td>
                    <td><span className="badge-register badge-bin">{item.holding_department || item.department || 'Main Store'}</span></td>
                    <td>
                      {item.current_holder ? (
                        <span style={{ fontWeight: 700, color: '#1e3a8a' }}>{item.current_holder}</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>Main Store Inventory</span>
                      )}
                    </td>
                    <td>{item.issued_date || '-'}</td>
                    <td>
                      {item.distribution_id ? (
                        <span className="badge-status badge-approved">In Use ({item.holding_department})</span>
                      ) : (
                        <span className="badge-status badge-received">In Store</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.distribution_id ? (
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handleReturnDsr(item.distribution_id)}
                          title="Return Asset to Store"
                        >
                          <RotateCcw size={15} /> Return Asset
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedItemId(item.id);
                            setShowIssueModal(true);
                          }}
                        >
                          Issue Asset
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Distribution History Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">DSR Asset Movement & Distribution Ledger Log ({history.length} logs)</h2>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>DSR Code</th>
                <th>Equipment Name</th>
                <th>Department</th>
                <th>Holder</th>
                <th>Issued Date</th>
                <th>Returned Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td>#{h.id}</td>
                  <td><span style={{ color: '#7c3aed', fontWeight: 700 }}>{h.dsr_code}</span></td>
                  <td><strong>{h.item_name}</strong></td>
                  <td>{h.department}</td>
                  <td>{h.current_holder}</td>
                  <td>{h.issued_date}</td>
                  <td>{h.returned_date || <span style={{ color: '#d97706', fontWeight: 600 }}>Active</span>}</td>
                  <td>
                    <span className={`badge-status ${h.status === 'active' ? 'badge-approved' : 'badge-received'}`}>
                      {h.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue DSR Modal */}
      {showIssueModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1rem' }}>Issue DSR Machinery Asset</h2>
            <form onSubmit={handleIssueDsr}>
              <div className="form-group">
                <label className="form-label">Select DSR Asset *</label>
                <select
                  className="form-select"
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  required
                >
                  {dsrItems.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.dsr_code || 'DSR'}] {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Receiving Department *</label>
                <select
                  className="form-select"
                  value={issueDept}
                  onChange={e => setIssueDept(e.target.value)}
                >
                  <option value="Fitter">Fitter Workshop</option>
                  <option value="Electrician">Electrical Lab</option>
                  <option value="Welder">Welding Shed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Current Holder Name (Instructor / Technician) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={holderName}
                  onChange={e => setHolderName(e.target.value)}
                  placeholder="e.g. Amit Kumar (Fitter Instructor)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Remarks / Bay Location</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. Installed at Workshop Bay 2 Lathe Counter"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowIssueModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm DSR Distribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
