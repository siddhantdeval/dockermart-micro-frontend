# Managing Breaking Changes in Federated Design Systems

Exposing live components dynamically at runtime using Webpack Module Federation introduces a critical paradigm shift: **compile-time type safety does not guarantee runtime stability in production.**

---

## 1. The Core Vulnerability: Live Dependency Hijack
In a typical monolithic front-end, a dependency bump (such as upgrading a UI library) is done at build time. If a breaking change occurs, the build fails, tests fail, and the code never reaches production.

In a federated architecture:
* Remote MFE A (`designSystem`) exposes a `<Button>` component.
* Consumer MFE B (`catalogApp`) imports `designSystem/Button` at runtime.
* If Team A deploys a breaking change to the `<Button>` API (e.g. renaming `onClick` to `onPress`, or making a prop required) directly to the production URL, **MFE B will crash at runtime in production** the next time a user loads the page, even though MFE B's codebase was never changed, rebuilt, or redeployed.

---

## 2. Breaking Change Simulation Scenario

### The Change
Suppose the design system remote updates its component definition:
```typescript
// BEFORE (v1)
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
}

// AFTER (v2 - Breaking Change)
export interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void; // Renamed from onClick, and made strictly required!
  themeConfig: {
    color: string;
    borderRadius: number;
  }; // Replaced 'variant' with a required object
}
```

### The Impact
If Catalog MFE consumes this live v2 component, it will throw:
* `TypeError: Cannot read properties of undefined` if it tries to access properties on `themeConfig` (since the consumer passes `variant="primary"`).
* Clicks will silently fail to register because Catalog passes `onClick`, but the new button only binds `onPress`.

---

## 3. Resolution Strategies

To achieve a production-grade system, we must prevent "latest-version lockstep" deployments where all teams are forced to upgrade simultaneously.

### Strategy A: Versioned Remote Entry Points (Recommended)
Rather than serving the design system from a single root folder, the design system CI/CD pipeline builds and deploys artifacts into versioned directories on the CDN:
* `http://cdn.dockermart.com/design-system/v1.0.0/remoteEntry.js`
* `http://cdn.dockermart.com/design-system/v2.0.0/remoteEntry.js`

In each consumer MFE's `webpack.config.js`, the remote URL points to a specific major/minor version lock:
```javascript
remotes: {
  designSystem: 'designSystem@http://cdn.dockermart.com/design-system/v1.0.0/remoteEntry.js'
}
```
When a team is ready to upgrade, they update their remote URL block, compile, run tests, and deploy their app independently.

### Strategy B: Runtime Registry / Feature Flag Resolution
Instead of hardcoding remote URLs in the Webpack config at compile-time, we can resolve the remote entry points dynamically in the browser runtime:
1. Webpack's `ModuleFederationPlugin` is configured to use a promise-based script loader.
2. At boot time, the Shell makes a lightweight fetch request to a Configuration Registry (e.g. `/api/v1/remote-registry`).
3. The registry returns a JSON mapping of current versioned remote URLs:
   ```json
   {
     "catalogApp": "http://localhost:3001/remoteEntry.js",
     "designSystem": "http://localhost:3005/v1/remoteEntry.js"
   }
   ```
4. The Shell dynamically injects the appropriate scripts into the DOM. This allows rollbacks or version upgrades via configuration switches rather than code changes.
