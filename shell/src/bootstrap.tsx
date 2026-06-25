import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

const CatalogRoot = React.lazy(() => import('catalogApp/CatalogRoot'));

const App = () => {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>DockerMart Shell</h1>
      <p>App running on port 3000</p>
      <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Federated Component:</h3>
        <Suspense fallback={<div>Loading Catalog MFE...</div>}>
          <CatalogRoot />
        </Suspense>
      </div>
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
