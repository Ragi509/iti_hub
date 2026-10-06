import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Package, 
  Layers, 
  HardDrive, 
  AlertTriangle,
  MapPin,
  Barcode,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export const Dashboard = ({ onViewItem, onAddStock }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRegisterTab, setActiveRegisterTab] = useState('all'); // all, bin, miscellaneous, dsr
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Add Item Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemData, setNewItemData] = useState({
    name: '',
    register_type: 'bin',
    category: 'Raw Materials',
    unit: 'Kg',
    price_per_unit: '',
    department: 'Fitter',
    location_code: '',
    dsr_code: '',
    initial_stock: '0'
  });

  const fetchItems = () => {
    setLoading(true);
    let url = `/api/items?register_type=${activeRegisterTab}&category=${selectedCategory}&department=${selectedDepartment}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setItems(data.items);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching inventory items:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, [activeRegisterTab, selectedCategory, selectedDepartment, searchQuery]);

  const handleCreateItem = (e) => {
    e.preventDefault();
    fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItemData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShowAddModal(false);
          setNewItemData({
            name: '',
            register_type: 'bin',
            category: 'Raw Materials',
            unit: 'Kg',
            price_per_unit: '',
            department: 'Fitter',
            location_code: '',
            dsr_code: '',
            initial_stock: '0'
          });
          fetchItems();
        } else {
          alert('Error creating item: ' + data.error);
        }
      });
  };

  // Metrics summary
  const binCount = items.filter(i => i.register_type === 'bin').length;
  const miscCount = items.filter(i => i.register_type === 'miscellaneous').length;
  const dsrCount = items.filter(i => i.register_type === 'dsr').length;
  const totalStockValue = items.reduce((acc, curr) => acc + (curr.current_stock * curr.price_per_unit), 0);

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Inventory Register Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Centralized ITI Store Register • Replaces Paper Bin Cards, Miscellaneous & DSR Registers
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchItems}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Add New Item
          </button>
        </div>
      </div>

      {/* Register Split Tabs (Visual Split by register_type) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveRegisterTab('all')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: activeRegisterTab === 'all' ? '#1e3a8a' : '#f1f5f9',
            color: activeRegisterTab === 'all' ? '#ffffff' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Layers size={18} /> All Registers ({items.length})
        </button>

        <button
          onClick={() => setActiveRegisterTab('bin')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: activeRegisterTab === 'bin' ? '#0284c7' : '#e0f2fe',
            color: activeRegisterTab === 'bin' ? '#ffffff' : '#0369a1',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Package size={18} /> Bin Card Register ({binCount})
        </button>

        <button
          onClick={() => setActiveRegisterTab('miscellaneous')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: activeRegisterTab === 'miscellaneous' ? '#d97706' : '#fef3c7',
            color: activeRegisterTab === 'miscellaneous' ? '#ffffff' : '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Layers size={18} /> Miscellaneous Register ({miscCount})
        </button>

        <button
          onClick={() => setActiveRegisterTab('dsr')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: activeRegisterTab === 'dsr' ? '#7c3aed' : '#f3e8ff',
            color: activeRegisterTab === 'dsr' ? '#ffffff' : '#6b21a8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <HardDrive size={18} /> Dead Stock Register - DSR ({dsrCount})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search by item name, bin location, DSR code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <select className="form-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="Raw Materials">Raw Materials</option>
              <option value="Tools & Consumables">Tools & Consumables</option>
              <option value="Hand Tools">Hand Tools</option>
              <option value="Electrical Wire">Electrical Wire</option>
              <option value="Fasteners">Fasteners</option>
              <option value="Consumables">Consumables</option>
              <option value="Safety & Cleaning">Safety & Cleaning</option>
              <option value="Machinery">Machinery</option>
              <option value="Measuring Instruments">Measuring Instruments</option>
            </select>
          </div>

          <div>
            <select className="form-select" value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
              <option value="all">All Departments</option>
              <option value="Fitter">Fitter</option>
              <option value="Electrician">Electrician</option>
              <option value="Welder">Welder</option>
              <option value="General">General Store</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            Items Inventory Matrix ({items.length} records)
          </h2>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
            Total Stock Value: <span style={{ color: '#166534', fontWeight: 800 }}>₹{totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading store inventory records...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No inventory items matching current filters.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Register</th>
                  <th>Item Name & Description</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Current Stock</th>
                  <th>Unit Price</th>
                  <th>Location / DSR Code</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const isBin = item.register_type === 'bin';
                  const isMisc = item.register_type === 'miscellaneous';
                  const isDsr = item.register_type === 'dsr';

                  return (
                    <tr key={item.id}>
                      <td>
                        {isBin && <span className="badge-register badge-bin"><Package size={14} /> Bin</span>}
                        {isMisc && <span className="badge-register badge-misc"><Layers size={14} /> Misc</span>}
                        {isDsr && <span className="badge-register badge-dsr"><HardDrive size={14} /> DSR</span>}
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{item.name}</div>
                        {isMisc && (
                          <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
                            Direct Department Route (No Reorder Storage)
                          </div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{item.category}</span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                          {item.department || 'General Store'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: item.current_stock <= 5 && !isDsr ? '#b91c1c' : '#15803d' }}>
                          {item.current_stock} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{item.unit}</span>
                        </div>
                        {item.current_stock <= 5 && !isDsr && (
                          <span style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <AlertTriangle size={12} /> Low Stock Alert
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>₹{Number(item.price_per_unit).toFixed(2)}</div>
                      </td>

                      <td>
                        {item.location_code && (
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={14} /> {item.location_code}
                          </div>
                        )}
                        {item.dsr_code && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Barcode size={14} /> {item.dsr_code}
                          </div>
                        )}
                        {!item.location_code && !item.dsr_code && <span style={{ color: '#94a3b8' }}>-</span>}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onViewItem(item.id)}
                            title="Digital Bin Card History"
                          >
                            <Eye size={15} /> Bin Card
                          </button>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onAddStock(item.id)}
                            title="Add Purchase Stock Intake"
                          >
                            + Stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>
              Add New Inventory Item
            </h2>

            <form onSubmit={handleCreateItem}>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newItemData.name}
                  onChange={e => setNewItemData({ ...newItemData, name: e.target.value })}
                  placeholder="e.g. Mild Steel Sheet 2mm"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Register Type *</label>
                  <select
                    className="form-select"
                    value={newItemData.register_type}
                    onChange={e => setNewItemData({ ...newItemData, register_type: e.target.value })}
                  >
                    <option value="bin">Bin Card Register</option>
                    <option value="miscellaneous">Miscellaneous Register</option>
                    <option value="dsr">Dead Stock Register (DSR)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={newItemData.category}
                    onChange={e => setNewItemData({ ...newItemData, category: e.target.value })}
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Tools & Consumables">Tools & Consumables</option>
                    <option value="Hand Tools">Hand Tools</option>
                    <option value="Electrical Wire">Electrical Wire</option>
                    <option value="Fasteners">Fasteners</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Safety & Cleaning">Safety & Cleaning</option>
                    <option value="Machinery">Machinery</option>
                    <option value="Measuring Instruments">Measuring Instruments</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Unit of Measure *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newItemData.unit}
                    onChange={e => setNewItemData({ ...newItemData, unit: e.target.value })}
                    placeholder="e.g. Kg, Pcs, Meters"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Price per Unit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={newItemData.price_per_unit}
                    onChange={e => setNewItemData({ ...newItemData, price_per_unit: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Stock</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newItemData.initial_stock}
                    onChange={e => setNewItemData({ ...newItemData, initial_stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={newItemData.department}
                    onChange={e => setNewItemData({ ...newItemData, department: e.target.value })}
                  >
                    <option value="Fitter">Fitter</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Welder">Welder</option>
                    <option value="General">General Store</option>
                  </select>
                </div>

                {newItemData.register_type === 'bin' && (
                  <div className="form-group">
                    <label className="form-label">Location Code (Bin Card)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newItemData.location_code}
                      onChange={e => setNewItemData({ ...newItemData, location_code: e.target.value })}
                      placeholder="e.g. R-2 B-4"
                    />
                  </div>
                )}

                {newItemData.register_type === 'dsr' && (
                  <div className="form-group">
                    <label className="form-label">DSR Serial Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newItemData.dsr_code}
                      onChange={e => setNewItemData({ ...newItemData, dsr_code: e.target.value })}
                      placeholder="e.g. ITI-DEL/REG-01/P-22/SR-10"
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
