import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initAuth } from './auth';
import { GlobalNav } from './GlobalNav';

const CatalogApp = React.lazy(() => import('catalogApp/CatalogRoot'));
const CheckoutApp = React.lazy(() => import('checkoutApp/CheckoutRoot'));
const AccountApp = React.lazy(() => import('accountApp/AccountRoot'));
const GlobalStyles = React.lazy(() => import('designSystem/GlobalStyles'));

class RemoteErrorBoundary extends React.Component<
  { name: string; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          border: '1px solid #fed7d7',
          borderRadius: '6px',
          background: '#fff5f5',
          color: '#c53030',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <strong>⚠️ {this.props.name} App Error</strong>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
            This section of the store is temporarily unavailable. Please try again later.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function RemoteMount({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <RemoteErrorBoundary name={name}>
      <Suspense fallback={<div style={{ fontFamily: 'sans-serif' }}>Loading {name}...</div>}>
        {children}
      </Suspense>
    </RemoteErrorBoundary>
  );
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    initAuth().then(() => setAuthReady(true));
  }, []);

  if (!authReady) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h3>Authenticating…</h3>
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={null}>
        <GlobalStyles />
      </Suspense>
      <GlobalNav />
      <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
        <Routes>
          <Route path="/catalog/*" element={<RemoteMount name="Catalog"><CatalogApp /></RemoteMount>} />
          <Route path="/checkout/*" element={<RemoteMount name="Checkout"><CheckoutApp /></RemoteMount>} />
          <Route path="/account/*" element={<RemoteMount name="Account"><AccountApp /></RemoteMount>} />
          <Route path="/" element={<Navigate to="/catalog" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
