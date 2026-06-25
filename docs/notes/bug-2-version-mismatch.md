# Bug #2: `requiredVersion` Mismatch & Version Negotiation

This document analyzes Webpack Module Federation's dependency version negotiation when consumer and provider declare different version ranges for a shared singleton.

---

## 1. Observed Behavior: `^17.0.0` (remote) vs `^18.0.0` (shell)

When both the Shell and Catalog MFE set `singleton: true`, but specify different version requirements:
1. The Shell boots first and loads its React package (v18.2.0).
2. The Catalog MFE (requesting React `^17.0.0`) is loaded dynamically.
3. Webpack checks the shared scope. It finds React v18.2.0 is already loaded.
4. Because `18.2.0` does not satisfy the Catalog MFE's requirement range (`^17.0.0`), Webpack logs a warning to the console:
   > *[webpack-dev-server] Unsatisfied version 18.2.0 of shared singleton module react (required ^17.0.0)*
5. However, because **`singleton: true`** is defined, Webpack is legally bound to instantiate only *one* React script. It overrides Catalog's request and reuses the Shell's loaded React v18.2.0. The page renders successfully.

---

## 2. Incompatible Range Behavior: `^16.0.0` (remote) vs `^18.0.0` (shell)

Changing the remote requirement to `^16.0.0` produces the exact same behavior as above. Webpack logs a warning that version `18.2.0` does not satisfy `^16.0.0`, but still falls back to using version `18.2.0` to preserve the singleton promise.

### The Role of `strictVersion`
If we want to prevent this silent fallback (which could cause runtime method crashes if React 18 lacks a function React 16 expected), we can configure `strictVersion: true`:
```javascript
shared: {
  react: { 
    singleton: true, 
    eager: false, 
    requiredVersion: '^16.0.0',
    strictVersion: true // <-- Refuses to load if version mismatch occurs
  }
}
```
With `strictVersion: true`, Webpack will throw a fatal runtime error and refuse to render the MFE, preventing unstable state rendering.

---

## 3. The Organizational Fix
Who owns the `requiredVersion` decision when 5 teams set it independently?

1. **Shared Build Presets (Monorepo)**: If using a monorepo, a shared Webpack config helper (e.g. inside `packages/webpack-config`) should generate the `shared` dependency blocks automatically by reading the root `package.json` dependencies, ensuring all teams compile with identical ranges.
2. **Platform Governance Contract**: In a polyrepo environment, the platform team must enforce dependency ranges in a shared CI configuration. A pre-build lint gate or dependency sync script checks if any MFE's `package.json` has drifted from the organization's approved lockfile version list.
