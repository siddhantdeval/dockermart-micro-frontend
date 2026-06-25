# TypeScript Module Declarations & Federated Type Safety

In a micro-frontend architecture using Webpack Module Federation, static type compilation and runtime loading are decoupled. This creates specific type safety challenges.

---

## 1. Export Mismatch Failure (Default vs Named)

If a consumer defines the federated import in `declarations.d.ts` as:
```typescript
declare module 'catalogApp/CatalogRoot' {
  const Component: React.ComponentType;
  export default Component;
}
```
But the catalog remote actually implements and exposes a named export:
```typescript
// catalog-mfe/src/CatalogRoot.tsx
export const CatalogRoot = () => { ... };
```

### What Happens?
1. **Compile Time (Success):** The consumer's TypeScript compiler passes. It believes `catalogApp/CatalogRoot` has a default export and allows `import CatalogApp from 'catalogApp/CatalogRoot'`.
2. **Runtime (Crash):** When the browser loads the remote chunk, Webpack resolves the module object. The Shell tries to access the `default` property of the module object, which is `undefined`. React throws a runtime error:
   > *Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined.*

---

## 2. Industry Solutions for Type-Safe Contracts

To prevent manual shims from going out of sync, teams use several patterns:

### Option A: Monorepo TS Path Mapping (Best for Monorepos)
If all MFEs reside in a single repository, we can bypass manually written `declarations.d.ts` by mapping the import paths in `tsconfig.json` directly to the source directory of the remote:
```json
// shell/tsconfig.json
"paths": {
  "catalogApp/*": ["../catalog-mfe/src/*"]
}
```
This forces TypeScript to type-check against the *actual* source code of the Catalog team at compile time.

### Option B: Shared Types Package
If teams operate in separate git repositories (polyrepo), the provider team publishes a lightweight package containing only the type definitions (e.g. `@dockermart/catalog-types`) to a private registry.
Consuming teams install the package, and reference it:
```typescript
// shell/src/declarations.d.ts
declare module 'catalogApp/CatalogRoot' {
  import { CatalogRootType } from '@dockermart/catalog-types';
  const Component: CatalogRootType;
  export default Component;
}
```

### Option C: Federated Types (Dynamic Type Generation)
Advanced tooling, such as `@module-federation/typescript` (or Webpack plugins like `native-federation-typescript`), automatically scans exposed files at build time, generates `.d.ts` files, and serves them alongside `remoteEntry.js` (e.g. at `http://localhost:3001/remoteEntry.d.ts`).
Consuming build pipelines download these types dynamically during their build steps, ensuring compilation fails if an API contract breaks.
