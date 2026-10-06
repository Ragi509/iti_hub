import React, { useState, useEffect } from 'react';
import { BookOpenCheck, Plus, AlertCircle, CheckCircle2, RefreshCw, Trash2, Edit3 } from 'lucide-react';

export const SyllabusView = () => {
  const [syllabusList, setSyllabusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    department: 'Fitter',
    item_name: '',
    required_quantity: '',
    syllabus_reference: '',
    updated_by: 'Instructor'
  });

  const fetchSyllabus = () => {
    setLoading(true);
    fetch(`/api/syllabus?department=${selectedDept}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSyllabusList(data.syllabus_requirements);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSyllabus();
  }, [selectedDept]);

  const handleAddSyllabus = (e) => {
    e.preventDefault();
    fetch('/api/syllabus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShowAddModal(false);
          setFormData({
            department: 'Fitter',
            item_name: '',
            required_quantity: '',
            syllabus_reference: '',
            updated_by: 'Instructor'
          });
          fetchSyllabus();
        } else {
          alert('Error: ' + data.error);
        }
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this syllabus requirement entry?')) return;
    fetch(`/api/syllabus/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) fetchSyllabus();
      });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>NCVT Syllabus Requirements & Stock Gap Analysis</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Departmental Practical Requirements vs Store Available Stock Gap Indicators
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add Syllabus Requirement
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569', marginRight: '0.5rem' }}>Filter Trade:</span>
          {['all', 'Fitter', 'Electrician', 'Welder'].map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                background: selectedDept === dept ? '#1e3a8a' : '#f1f5f9',
                color: selectedDept === dept ? '#fff' : '#475569'
              }}
            >
              {dept === 'all' ? 'All Departments' : `${dept} Trade`}
            </button>
          ))}
        </div>
      </div>

      {/* Syllabus Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpenCheck size={22} color="#1e3a8a" /> Syllabus Checklist Matrix ({syllabusList.length} requirements)
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading syllabus requirements...</div>
        ) : syllabusList.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No syllabus requirement entries found for selected trade.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Trade Dept</th>
                  <th>Required Item Name</th>
                  <th>NCVT Practical Reference</th>
                  <th>Syllabus Required Qty</th>
                  <th>Current Store Stock</th>
                  <th>Stock Gap Indicator</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {syllabusList.map(req => {
                  const isSufficient = req.status_flag === 'sufficient';

                  return (
                    <tr key={req.id}>
                      <td><span className="badge-register badge-bin">{req.department}</span></td>
                      <td><strong style={{ fontSize: '1rem', color: '#0f172a' }}>{req.item_name}</strong></td>
                      <td style={{ color: '#475569', fontSize: '0.85rem' }}>{req.syllabus_reference || '-'}</td>
                      <td><strong>{req.required_quantity} {req.unit}</strong></td>
                      <td>{req.current_stock} {req.unit}</td>
                      <td>
                        {isSufficient ? (
                          <span className="badge-status badge-sufficient">
                            <CheckCircle2 size={14} /> Stock Sufficient (+{req.stock_gap} {req.unit})
                          </span>
                        ) : (
                          <span className="badge-status badge-deficit">
                            <AlertCircle size={14} /> Deficit Warning ({req.stock_gap} {req.unit})
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(req.id)}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1rem' }}>Add Syllabus Requirement Entry</h2>
            <form onSubmit={handleAddSyllabus}>
              <div className="form-group">
                <label className="form-label">Trade Department *</label>
                <select
                  className="form-select"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="Fitter">Fitter Trade</option>
                  <option value="Electrician">Electrician Trade</option>
                  <option value="Welder">Welder Trade</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Required Item Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.item_name}
                  onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="e.g. Mild Steel Flat Bar 50x6mm"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Required Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.required_quantity}
                  onChange={e => setFormData({ ...formData, required_quantity: e.target.value })}
                  placeholder="e.g. 300"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">NCVT Syllabus / Practical Reference</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.syllabus_reference}
                  onChange={e => setFormData({ ...formData, syllabus_reference: e.target.value })}
                  placeholder="e.g. NCVT Fitter Module 2 Fitting Practical"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
