import React from 'react';
import ReactDOM from 'react-dom/client';
import AccountRoot from './AccountRoot';

const App = () => {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>DockerMart Account MFE</h1>
      <p>App running on port 3004</p>
      <AccountRoot />
    </div>
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
