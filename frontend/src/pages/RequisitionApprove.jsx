import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle, XCircle, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RequisitionApprove = () => {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRequisitions = () => {
    setLoading(true);
    fetch('/api/requisitions')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRequisitions(data.requisitions);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const handleAction = (id, action) => {
    const approverName = user ? user.name : 'Dr. V. K. Singh (Vice-Principal)';
    setProcessingId(id);

    fetch(`/api/requisitions/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action, // 'approve' or 'reject'
        approved_by: approverName,
        rejection_reason: action === 'reject' ? 'Rejected during executive review' : null
      })
    })
      .then(res => res.json())
      .then(data => {
        setProcessingId(null);
        if (data.success) {
          fetchRequisitions();
        } else {
          alert('Error: ' + data.error);
        }
      });
  };

  const pendingReqs = requisitions.filter(r => r.status === 'pending');
  const pastReqs = requisitions.filter(r => r.status !== 'pending');

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Executive Requisition Approvals</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Approver / Vice-Principal Panel • Authorize material issues before storekeeper fulfillment
        </p>
      </div>

      {/* Pending Requisitions Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={22} color="#d97706" /> Pending Requisitions ({pendingReqs.length})
          </h2>
          <span className="badge-status badge-pending">Action Required</span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading requisitions...</div>
        ) : pendingReqs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No pending requisitions awaiting approval.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {pendingReqs.map(req => (
              <div key={req.id} style={{ border: '2px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className="badge-register badge-misc">REQ #{req.id}</span>
                      <span className="badge-register badge-bin">{req.department} Trade</span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Student Count: <strong>{req.student_count}</strong></span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{req.job_or_practical}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      Requested by: <strong>{req.requested_by}</strong> on {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={processingId === req.id}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={processingId === req.id}
                    >
                      <CheckCircle size={16} /> Approve Requisition
                    </button>
                  </div>
                </div>

                {/* Requested Item Lines Table */}
                <div className="table-responsive">
                  <table className="table" style={{ background: '#f8fafc', borderRadius: '8px' }}>
                    <thead>
                      <tr>
                        <th>Item Requested</th>
                        <th>Category</th>
                        <th>Req. Quantity</th>
                        <th>Current Stock</th>
                        <th>Stock Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {req.items && req.items.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.item_name}</strong></td>
                          <td>{item.category}</td>
                          <td><strong>{item.quantity_requested} {item.unit}</strong></td>
                          <td>{item.current_stock} {item.unit}</td>
                          <td>
                            {item.in_stock_flag ? (
                              <span className="badge-status badge-sufficient">In Stock</span>
                            ) : (
                              <span className="badge-status badge-deficit">Low Stock Flagged</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Requisitions Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Approval History Log ({pastReqs.length})</h2>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>REQ ID</th>
                <th>Department</th>
                <th>Practical Job Name</th>
                <th>Instructor</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Approved Date</th>
              </tr>
            </thead>
            <tbody>
              {pastReqs.map(req => (
                <tr key={req.id}>
                  <td><strong>#{req.id}</strong></td>
                  <td>{req.department}</td>
                  <td><strong>{req.job_or_practical}</strong></td>
                  <td>{req.requested_by}</td>
                  <td>
                    <span className={`badge-status badge-${req.status}`}>
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{req.approved_by || '-'}</td>
                  <td>{req.approved_at ? new Date(req.approved_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
