import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RequisitionCreate = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [department, setDepartment] = useState(user?.department || 'Fitter');
  const [requestedBy, setRequestedBy] = useState(user?.name || 'Instructor');
  const [jobOrPractical, setJobOrPractical] = useState('');
  const [studentCount, setStudentCount] = useState(20);

  // Requisition item lines: [{ item_id, quantity_requested }]
  const [lines, setLines] = useState([
    { item_id: '', quantity_requested: 1 }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setItemsList(data.items);
          if (data.items.length > 0 && lines[0].item_id === '') {
            setLines([{ item_id: data.items[0].id, quantity_requested: 1 }]);
          }
        }
        setLoading(false);
      });
  }, []);

  const addLine = () => {
    if (itemsList.length > 0) {
      setLines([...lines, { item_id: itemsList[0].id, quantity_requested: 1 }]);
    }
  };

  const removeLine = (index) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, val) => {
    const updated = [...lines];
    updated[index][field] = val;
    setLines(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!jobOrPractical.trim()) {
      setErrorMsg('Practical Job Name is required');
      setSubmitting(false);
      return;
    }

    const payload = {
      department,
      requested_by: requestedBy,
      job_or_practical: jobOrPractical,
      student_count: Number(studentCount),
      items: lines.map(l => ({
        item_id: Number(l.item_id),
        quantity_requested: Number(l.quantity_requested)
      }))
    };

    fetch('/api/requisitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setSuccessMsg(`Requisition #${data.requisition.id} created successfully! Submitted for Vice-Principal Approval.`);
          if (onSuccess) setTimeout(() => onSuccess(), 1200);
        } else {
          setErrorMsg(data.error || 'Failed to create requisition');
        }
      })
      .catch(err => {
        setSubmitting(false);
        setErrorMsg('Server error: ' + err.message);
      });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="card">
        <div className="card-header">
          <h1 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.5rem' }}>
            <FileText size={24} color="#1e3a8a" /> Instructor Practical Material Requisition Form
          </h1>
          <span className="badge-register badge-misc">Instructor Requisition</span>
        </div>

        {successMsg && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={20} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 700 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Header Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Trade Department *</label>
              <select
                className="form-select"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              >
                <option value="Fitter">Fitter Trade</option>
                <option value="Electrician">Electrician Trade</option>
                <option value="Welder">Welder Trade</option>
                <option value="General">General Trade</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Instructor Name (Requested By) *</label>
              <input
                type="text"
                className="form-input"
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Job / Practical Assignment Name *</label>
              <input
                type="text"
                className="form-input"
                value={jobOrPractical}
                onChange={e => setJobOrPractical(e.target.value)}
                placeholder="e.g. Fitter Practical Fitting Job #6 - Dovetail Joint"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student Batch Size *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={studentCount}
                onChange={e => setStudentCount(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Dynamic Item Lines */}
          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Requisitioned Line Items</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
                <Plus size={16} /> Add Item Row
              </button>
            </div>

            {lines.map((line, idx) => {
              const selectedItem = itemsList.find(i => i.id === Number(line.item_id));
              const currentStock = selectedItem ? selectedItem.current_stock : 0;
              const hasInsufficientStock = selectedItem && Number(line.quantity_requested) > currentStock;

              return (
                <div 
                  key={idx} 
                  style={{ 
                    background: hasInsufficientStock ? '#fff1f2' : '#f8fafc', 
                    border: `1px solid ${hasInsufficientStock ? '#fca5a5' : '#cbd5e1'}`,
                    padding: '1rem', 
                    borderRadius: '10px', 
                    marginBottom: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: '3fr 1fr 1fr auto',
                    gap: '1rem',
                    alignItems: 'center'
                  }}
                >
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Item #{idx + 1}</label>
                    <select
                      className="form-select"
                      value={line.item_id}
                      onChange={e => updateLine(idx, 'item_id', e.target.value)}
                      required
                    >
                      {itemsList.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stock: {item.current_stock} {item.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      value={line.quantity_requested}
                      onChange={e => updateLine(idx, 'quantity_requested', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Stock Status</div>
                    {selectedItem ? (
                      hasInsufficientStock ? (
                        <span style={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <AlertCircle size={14} /> Low Stock (Flagged)
                        </span>
                      ) : (
                        <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <CheckCircle2 size={14} /> Stock Available
                        </span>
                      )
                    ) : '-'}
                  </div>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeLine(idx)}
                    disabled={lines.length === 1}
                    style={{ alignSelf: 'flex-end', minHeight: '44px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting Requisition...' : 'Submit Requisition for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
