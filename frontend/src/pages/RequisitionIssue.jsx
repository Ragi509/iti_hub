import React, { useState, useEffect } from 'react';
import { PackageCheck, CheckCircle2, AlertTriangle, Layers, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RequisitionIssue = () => {
  const { user } = useAuth();
  const [approvedReqs, setApprovedReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [issuingId, setIssuingId] = useState(null);

  const fetchApprovedRequisitions = () => {
    setLoading(true);
    fetch('/api/requisitions?status=approved')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApprovedReqs(data.requisitions);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApprovedRequisitions();
  }, []);

  const openIssueModal = (reqId) => {
    fetch(`/api/requisitions/${reqId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSelectedReq(data.requisition);
        }
      });
  };

  const handleConfirmIssue = (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    // Business Rule 3 check: approved_by must be set
    if (!selectedReq.approved_by) {
      alert('Error: Business Rule 3 Violation! Cannot issue requisition without prior approval (approved_by required).');
      return;
    }

    setIssuingId(selectedReq.id);

    const storekeeperName = user ? user.name : 'Rajesh Sharma (Storekeeper)';
    const issueItems = selectedReq.items.map(item => ({
      item_id: item.item_id,
      quantity_issued: item.quantity_requested
    }));

    fetch(`/api/requisitions/${selectedReq.id}/issue`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issued_by: storekeeperName,
        items: issueItems
      })
    })
      .then(res => res.json())
      .then(data => {
        setIssuingId(null);
        if (data.success) {
          alert('Stock successfully issued! Stock balances auto-reconciled and FIFO batches updated.');
          setSelectedReq(null);
          fetchApprovedRequisitions();
        } else {
          alert('Failed to issue stock: ' + data.error);
        }
      });
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Requisition Issue & FIFO Stock Allocation</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Storekeeper Fulfillment Panel • Enforces Business Rule 3 (Prior Approval Required) & Business Rule 4 (FIFO Batch Suggestion)
        </p>
      </div>

      {/* Approved Requisitions Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PackageCheck size={22} color="#15803d" /> Requisitions Ready for Issue ({approvedReqs.length})
          </h2>
          <span className="badge-status badge-approved">Approved Status</span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading approved requisitions...</div>
        ) : approvedReqs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No approved requisitions waiting for store issue.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>REQ ID</th>
                  <th>Department</th>
                  <th>Job / Practical Name</th>
                  <th>Requested By</th>
                  <th>Approved By</th>
                  <th>Approved Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvedReqs.map(req => (
                  <tr key={req.id}>
                    <td><strong>#{req.id}</strong></td>
                    <td><span className="badge-register badge-bin">{req.department}</span></td>
                    <td><strong>{req.job_or_practical}</strong></td>
                    <td>{req.requested_by}</td>
                    <td>
                      <span style={{ color: '#15803d', fontWeight: 700 }}>
                        <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {req.approved_by}
                      </span>
                    </td>
                    <td>{req.approved_at ? new Date(req.approved_at).toLocaleDateString() : '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openIssueModal(req.id)}
                      >
                        Review FIFO & Issue &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FIFO Issue Fulfillment Modal */}
      {selectedReq && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <span className="badge-register badge-bin">Requisition #{selectedReq.id}</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                  {selectedReq.job_or_practical}
                </h2>
              </div>
              <span className="badge-status badge-approved">Approved by {selectedReq.approved_by}</span>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <strong>Department:</strong> {selectedReq.department} | <strong>Requested By:</strong> {selectedReq.requested_by} | <strong>Students:</strong> {selectedReq.student_count}
            </div>

            {/* Business Rule 4 FIFO Suggestion Box */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e3a8a' }}>
              Business Rule 4: FIFO (First In First Out) Batch Allocation Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {selectedReq.items.map(item => (
                <div key={item.id} style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1rem', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{item.item_name}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.5rem' }}>({item.category})</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: item.in_stock_flag ? '#15803d' : '#b91c1c' }}>
                      Requested: {item.quantity_requested} {item.unit} | Available Stock: {item.current_stock} {item.unit}
                    </div>
                  </div>

                  {/* FIFO Batch Suggestion Breakdown */}
                  {item.fifo_suggestion && item.fifo_suggestion.batches.length > 0 ? (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                        Suggested Oldest FIFO Batch Draw (Oldest First)
                      </div>
                      {item.fifo_suggestion.batches.map((batch, bIdx) => (
                        <div key={bIdx} style={{ fontSize: '0.85rem', color: '#1e293b', display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                          <span>Batch #{batch.batch_transaction_id} (Intake Date: {batch.purchase_date}) - {batch.remarks}</span>
                          <strong style={{ color: '#1e3a8a' }}>Take {batch.quantity_suggested} {item.unit} @ ₹{batch.unit_price}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                      <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      No purchase stock batch available! Item flagged as out of stock.
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedReq(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmIssue}
                disabled={issuingId === selectedReq.id}
              >
                {issuingId === selectedReq.id ? 'Issuing Stock...' : 'Confirm Issue & Auto-Reconcile Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
