import React, { useState, Suspense } from 'react';

const ProfileView = React.lazy(() => import('./ProfileView'));
const OrderHistory = React.lazy(() => import('./OrderHistory'));

type Tab = 'profile' | 'orders';

export default function AccountRoot() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div style={{ border: '2px solid cyan', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
      <h2>Account Remote Panel</h2>
      <div style={{ margin: '15px 0' }}>
        <button disabled={activeTab === 'profile'} onClick={() => setActiveTab('profile')} style={{ marginRight: '5px' }}>Profile</button>
        <button disabled={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>Order History</button>
      </div>
      <div style={{ padding: '10px', background: '#f5f5f5', minHeight: '120px' }}>
        <Suspense fallback={<div>Loading tab data...</div>}>
          {activeTab === 'profile' ? <ProfileView /> : <OrderHistory />}
        </Suspense>
      </div>
    </div>
  );
}
