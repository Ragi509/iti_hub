import React, { useState, useEffect } from 'react';
import { PlusCircle, Package, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AddStock = ({ preselectedItemId, onBack, onSuccess }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [formData, setFormData] = useState({
    item_id: preselectedItemId || '',
    type: 'purchase',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    department: 'Main Store',
    remarks: '',
    created_by: user ? user.name : 'Storekeeper'
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setItems(data.items);
          if (!preselectedItemId && data.items.length > 0) {
            setFormData(prev => ({
              ...prev,
              item_id: data.items[0].id,
              price: data.items[0].price_per_unit
            }));
          } else if (preselectedItemId) {
            const found = data.items.find(i => i.id === Number(preselectedItemId));
            if (found) {
              setFormData(prev => ({ ...prev, price: found.price_per_unit }));
            }
          }
        }
        setLoadingItems(false);
      });
  }, [preselectedItemId]);

  const handleItemChange = (itemId) => {
    const selected = items.find(i => i.id === Number(itemId));
    setFormData(prev => ({
      ...prev,
      item_id: itemId,
      price: selected ? selected.price_per_unit : prev.price
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setSuccessMsg(`Stock purchase recorded successfully! Recalculated Stock Balance: ${data.recalculated_stock}`);
          setFormData(prev => ({ ...prev, quantity: '', remarks: '' }));
          if (onSuccess) setTimeout(() => onSuccess(data.item.id), 1200);
        } else {
          setErrorMsg(data.error || 'Failed to record transaction');
        }
      })
      .catch(err => {
        setSubmitting(false);
        setErrorMsg('Server error: ' + err.message);
      });
  };

  const selectedItem = items.find(i => i.id === Number(formData.item_id));

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="card">
        <div className="card-header">
          <h1 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.5rem' }}>
            <PlusCircle size={24} color="#1e3a8a" /> Add Stock Intake (Purchase Transaction)
          </h1>
          <span className="badge-register badge-bin">Storekeeper Intake</span>
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
          <div className="form-group">
            <label className="form-label">Select Inventory Item *</label>
            {loadingItems ? (
              <div>Loading items...</div>
            ) : (
              <select
                className="form-select"
                value={formData.item_id}
                onChange={e => handleItemChange(e.target.value)}
                required
              >
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    [{item.register_type.toUpperCase()}] {item.name} (Current Stock: {item.current_stock} {item.unit})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedItem && (
            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Selected Item Info</span>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{selectedItem.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Register: <strong style={{ textTransform: 'uppercase' }}>{selectedItem.register_type}</strong> | Category: <strong>{selectedItem.category}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Current Balance</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#15803d' }}>
                  {selectedItem.current_stock} {selectedItem.unit}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Purchased Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                placeholder={`e.g. 50 ${selectedItem ? selectedItem.unit : ''}`}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Purchase Price per Unit (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Invoice / Receipt Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Receiving Store Department</label>
              <input
                type="text"
                className="form-input"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Supplier Name / Invoice No / Remarks</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Purchased from M/s National Hardware Ltd, Invoice #INV-2026-904"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Recording Purchase...' : 'Confirm Stock Intake'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
