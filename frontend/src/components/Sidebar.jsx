import React from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  PlusCircle, 
  FileText, 
  CheckSquare, 
  PackageCheck, 
  BookOpenCheck, 
  BarChart3, 
  ShieldAlert,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const role = user?.role || 'Storekeeper';

  const navItems = [
    { id: 'dashboard', label: 'Inventory Dashboard', icon: LayoutDashboard, roles: ['Storekeeper', 'Instructor', 'Approver', 'Admin'] },
    { id: 'add-stock', label: 'Add Stock (Purchase)', icon: PlusCircle, roles: ['Storekeeper', 'Admin'] },
    { id: 'requisition-create', label: 'Create Requisition', icon: FileText, roles: ['Instructor', 'Admin', 'Storekeeper'] },
    { id: 'requisition-approve', label: 'Approve Requisitions', icon: CheckSquare, roles: ['Approver', 'Admin'] },
    { id: 'requisition-issue', label: 'Issue Stock (FIFO)', icon: PackageCheck, roles: ['Storekeeper', 'Admin'] },
    { id: 'syllabus', label: 'Syllabus Gap Analysis', icon: BookOpenCheck, roles: ['Instructor', 'Storekeeper', 'Approver', 'Admin'] },
    { id: 'dsr', label: 'DSR Asset Manager', icon: HardDrive, roles: ['Storekeeper', 'Instructor', 'Approver', 'Admin'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['Storekeeper', 'Approver', 'Admin'] },
  ];

  return (
    <aside className="sidebar">
      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', padding: '0.5rem 1rem 0.25rem' }}>
        Navigation Menu
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isAllowed = item.roles.includes(role);

        return (
          <div
            key={item.id}
            className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            style={{
              opacity: isAllowed ? 1 : 0.6,
            }}
          >
            <Icon size={20} />
            <span>{item.label}</span>
            {!isAllowed && (
              <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: '#334155', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                View
              </span>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
        <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>Govt ITI Store Dept</div>
        <div>v1.0 Core System (Digitized Register Edition)</div>
      </div>
    </aside>
  );
};
