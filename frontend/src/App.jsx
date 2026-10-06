import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ItemDetail } from './pages/ItemDetail';
import { AddStock } from './pages/AddStock';
import { RequisitionCreate } from './pages/RequisitionCreate';
import { RequisitionApprove } from './pages/RequisitionApprove';
import { RequisitionIssue } from './pages/RequisitionIssue';
import { SyllabusView } from './pages/SyllabusView';
import { ReportsView } from './pages/ReportsView';
import { DsrView } from './pages/DsrView';

const MainAppContent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedItemId, setSelectedItemId] = useState(null);

  if (!user) {
    return <Login />;
  }

  const handleViewItem = (itemId) => {
    setSelectedItemId(itemId);
    setActiveTab('item-detail');
  };

  const handleAddStock = (itemId) => {
    setSelectedItemId(itemId);
    setActiveTab('add-stock');
  };

  return (
    <div className="app-container">
      <Header />
      <div className="main-layout">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="content-area">
          {activeTab === 'dashboard' && (
            <Dashboard 
              onViewItem={handleViewItem} 
              onAddStock={handleAddStock} 
            />
          )}

          {activeTab === 'item-detail' && (
            <ItemDetail 
              itemId={selectedItemId} 
              onBack={() => setActiveTab('dashboard')} 
              onAddStock={handleAddStock}
            />
          )}

          {activeTab === 'add-stock' && (
            <AddStock 
              preselectedItemId={selectedItemId} 
              onBack={() => setActiveTab('dashboard')} 
              onSuccess={(itemId) => handleViewItem(itemId)}
            />
          )}

          {activeTab === 'requisition-create' && (
            <RequisitionCreate 
              onBack={() => setActiveTab('dashboard')}
              onSuccess={() => setActiveTab('requisition-approve')}
            />
          )}

          {activeTab === 'requisition-approve' && (
            <RequisitionApprove />
          )}

          {activeTab === 'requisition-issue' && (
            <RequisitionIssue />
          )}

          {activeTab === 'syllabus' && (
            <SyllabusView />
          )}

          {activeTab === 'dsr' && (
            <DsrView />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
          )}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
