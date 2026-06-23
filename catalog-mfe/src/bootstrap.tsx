import React from 'react';
import ReactDOM from 'react-dom/client';
import CatalogRoot from './CatalogRoot';

const App = () => {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>DockerMart Catalog MFE</h1>
      <p>App running on port 3001</p>
      <CatalogRoot />
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
