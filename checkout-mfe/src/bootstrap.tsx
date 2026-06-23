import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CheckoutRoot from './CheckoutRoot';

const App = () => {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <h1>DockerMart Checkout MFE</h1>
        <p>App running on port 3003</p>
        <CheckoutRoot />
      </div>
    </BrowserRouter>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
