# Prop-Drilling Failure: Cross-MFE Coupling Anti-Pattern

This document analyzes the structural and operational issues that arise when passing React props directly across micro-frontend boundaries to handle communication.

---

## 1. What Broke and Which File Failed

### The Scenario
The Shell attempts to manage cart state locally and pass down state modifiers directly to the lazy-loaded remote components:
```tsx
// In shell/src/App.tsx
const [cartCount, setCartCount] = useState(0);

return (
  <CatalogApp onAddToCart={() => setCartCount(c => c + 1)} />
);
```

When the Catalog team refactors their component and renames their internal prop API from `onAddToCart` to `onItemAdded` inside `CatalogRoot.tsx`:
*   **The Bug**: The application compiled successfully, but communication broke **silently at runtime**. 
*   **The Symptom**: The user clicks the "Add to Cart" button inside the Catalog remote, but the Cart count indicator in the Shell navbar remains stuck at `0`. No console error was thrown because Javascript objects allow accessing non-existent properties (resolving to `undefined`), resulting in a silent failure of the callback execution.

---

## 2. Blast Radius & Deploy Coupling

1.  **Deployer of the Break**: The **Catalog team's deploy** broke the Shell's integration.
2.  **Out-of-Scope Files Modified**: To fix the issue, a developer had to modify `shell/src/App.tsx` and the Shell's `declarations.d.ts` file.
3.  **Monolithic Coordination**: The Catalog team could not deploy their refactor independently. They had to coordinate their release schedule with the Shell team, requiring a **synchronized deployment** of both the Catalog MFE and the Shell MFE at the same time. If they didn't, the production site would render a broken cart integration.

---

## 3. Why Prop-Drilling Recreates the Monolith

Passing state and callbacks directly through React component props couples the MFEs at the **code level**:
*   **Rigid Interfaces**: The remote's React component signature becomes a strict contract that the Shell must know about at build time.
*   **Version Lock**: It forces the Shell and remotes to share matching type definitions and runtime structures.
*   **Loss of Autonomy**: Teams lose the ability to iterate on their own component parameters without seeking approval and coordinated reviews from the platform/Shell team.

To maintain true independent deployability, MFEs must communicate via a **neutral, event-driven message bus** where neither component has direct knowledge of the other's internal component signatures.
