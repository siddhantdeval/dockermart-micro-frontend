import React, { useState, useEffect, Suspense } from 'react';
import { AuthEventBus } from '../../shell/src/mfe-event-bus';
import { User } from '../../shell/src/auth';
import { Button } from 'designSystem/Button';

const ProfileView = React.lazy(() => import('./ProfileView'));
const OrderHistory = React.lazy(() => import('./OrderHistory'));

type Tab = 'profile' | 'orders';

export default function AccountRoot() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeReady = AuthEventBus.onReady((u) => setUser(u));
    const unsubscribeRefreshed = AuthEventBus.onRefreshed((detail) => {
      console.log('[Account] Auth token refreshed at:', detail.timestamp);
    });
    return () => {
      unsubscribeReady();
      unsubscribeRefreshed();
    };
  }, []);

  return (
    <div style={{ border: '2px solid cyan', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Account Remote Panel</h2>
        {user ? (
          <span style={{ fontSize: '14px', background: '#cbd5e0', padding: '4px 8px', borderRadius: '4px', fontWeight: 500 }}>
            Active Profile: <strong>{user.name}</strong> ({user.roles.join(', ')})
          </span>
        ) : (
          <span style={{ fontSize: '14px', color: '#e53e3e', fontWeight: 500 }}>
            🔒 Authenticating session...
          </span>
        )}
      </div>
      <div style={{ margin: '15px 0' }}>
        <Button 
          disabled={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
          variant={activeTab === 'profile' ? 'primary' : 'secondary'}
          style={{ marginRight: '5px' }}
        >
          Profile
        </Button>
        <Button 
          disabled={activeTab === 'orders'} 
          onClick={() => setActiveTab('orders')}
          variant={activeTab === 'orders' ? 'primary' : 'secondary'}
        >
          Order History
        </Button>
      </div>
      <div style={{ padding: '10px', background: '#f5f5f5', minHeight: '120px' }}>
        <Suspense fallback={<div>Loading tab data...</div>}>
          {activeTab === 'profile' ? <ProfileView /> : <OrderHistory />}
        </Suspense>
      </div>
    </div>
  );
}
