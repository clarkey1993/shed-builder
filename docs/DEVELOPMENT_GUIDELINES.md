# DEVELOPMENT_GUIDELINES.md

> **IMPORTANT FOR AI AGENTS**  
> Always read this document before modifying code in this project.  
> This document defines the intended architecture and construction rules of the shed configurator.

---

## Before Making Changes

1. **Read PROJECT_ARCHITECTURE.md** — Understand purpose, interaction model, and implementation status.
2. **Review BUILD_RULES.md** — Check Bramwood rules vs current implementation before changing dimensions.
3. **Check SYSTEM_MAP.md** — Identify which systems and files your change will touch.

---

## Sensitive Areas (Handle With Care)

These areas have dimension math, configuration flow, or tight coupling. Avoid changes unless necessary; when changing, update documentation.

### ConfiguratorContext Dimension Calculations

**File:** `src/context/ConfiguratorContext.jsx`

`updateSize`, `updateRoofStyle`, `updateWallHeightType` update `shedConfig` from `shedData.json`. Changing this logic affects all downstream rendering.

### shedData.json

**File:** `src/shedData.json`

Lookup tables for floor widths, wall heights, roof dims, door widths, framing. If you change values, update `docs/BUILD_RULES.md` and verify `src/config/shedRules.js` alignment.

### builderStep Workflow

**Files:** `src/context/BuilderContext.jsx`, `src/components/ui/Sidebar.jsx`, `src/components/shed/Shed.jsx`, `src/components/shed/CameraController.jsx`

`BUILDER_STEPS` and step-based visibility/camera are tightly coupled. Adding or reordering steps requires coordinated updates across these files.

### Window Drag and Snapping Logic

**File:** `src/components/shed/windows/Window.jsx`

`clampAndSnap()` handles grid snap, stud snap, door zone, and window spacing. Any change can affect placement constraints and UX.

### Door Placement Logic

**Files:** `src/components/shed/walls/Wall.jsx`, `src/components/shed/doors/DoorFrame.jsx`

Door is always centered on front wall. Width comes from `shedData.door_widths`. Changing centering or width requires consistency with framing and cladding.

### Wall Geometry Generation

**Files:** `src/components/shed/walls/Wall.jsx`, `src/components/shed/cladding/Shiplap.jsx`

Shiplap uses `windowPositions`, `doorHalfWidth` to cut openings. Window dimensions (`W`, `WINDOW_HEIGHT`) are hardcoded in `Wall.jsx` and must match `Window.jsx`. Changing opening logic affects both.

### Roof Geometry Generation

**Files:** `src/components/shed/roof/ApexRoof.jsx`, `src/components/shed/roof/PentRoof.jsx`

Use `shedConfig.wallHeight`, `shedConfig.roofPeakHeight`, and `shedData.pent_roof_dims`. Dimensions drive visual alignment with walls.

### Framing Generation

**File:** `src/systems/framing/generateWallFraming.js`

Calculates studs, noggins, headers from wall size and openings. `generateWallFraming` must stay in sync with window/door positions and sizes used in Wall and Shiplap.

---

## Rules and Constraints

- **Never change shed dimension logic** without updating BUILD_RULES.md.
- **Avoid modifying** unless required:
  - `src/context/ConfiguratorContext.jsx`
  - `src/shedData.json`
  - `src/context/BuilderContext.jsx` (builderStep workflow)

---

## Adding Features

### Large Features

Implement in separate systems rather than altering existing ones:

- `src/systems/framing/` — framing layout logic
- `src/systems/snapping/` — currently a placeholder; could centralize snap logic from Window.jsx
- `src/systems/interaction/` — currently a placeholder; could centralize drag/select logic

### Heavy Geometry

- Use `useMemo` for layout calculations (cladding segments, framing positions).
- Prefer InstancedMesh for repeated geometry (cladding, studs).
- Avoid regenerating geometry in `useFrame` or on every render.

---

## Documentation Updates

When you change:

- Dimension or construction values → update BUILD_RULES.md
- New components or systems → update SYSTEM_MAP.md
- New features or changed behavior → update PROJECT_ARCHITECTURE.md (especially Current Implementation Status)
- Sensitive areas or new constraints → update this file
