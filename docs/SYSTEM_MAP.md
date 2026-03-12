# SYSTEM_MAP.md

> **IMPORTANT FOR AI AGENTS**  
> Always read this document before modifying code in this project.  
> This document defines the intended architecture and construction rules of the shed configurator.

---

## Provider Hierarchy

```
main.jsx
  ConfiguratorProvider
    InteriorViewProvider
      BuilderProvider
        App
```

---

## Contexts

### ConfiguratorContext

**File:** `src/context/ConfiguratorContext.jsx`

Controls shed configuration: size, roof style, wall height type, window positions and types, door type. Primary source of truth for shed dimensions. Reads `shedData.json` for floor widths, wall heights, roof dims, door widths, framing.

### BuilderContext

**File:** `src/context/BuilderContext.jsx`

Guided step-by-step workflow. Exposes: `builderStep` (BASE, FRONT_WALL, SIDE_WALLS, BACK_WALL, ROOF, INTERIOR), `interactionMode`, `isDraggingElement`, `selectedElementId`, `showFraming`, `showDimensions`. Provides `goNext`, `goPrev`, `setBuilderStep`, `setIsDraggingElement`, etc.

### InteriorViewContext

**File:** `src/context/InteriorViewContext.jsx`

View mode (exterior/interior) and internal partitions. `addPartition`, `updatePartition`, `removePartition`, `snapToStud`. Partitions snap to 24" stud grid.

### ShedTextureContext

**File:** `src/context/ShedTextureContext.jsx`

Provides loaded textures: `woodCladding`, `woodCladdingBump`, `woodFraming`, `roofFelt`, `osb`. Loaded via `useShedTextures` hook.

---

## Config and Data

### shedData.json

**File:** `src/shedData.json`

Lookup tables: `apex_roof_dims`, `pent_roof_dims`, `wall_heights`, `door_widths`, `floor_widths_inches`, `floor_dimensions`, `framing`. Do not modify without updating BUILD_RULES.md.

### shedRules.js

**File:** `src/config/shedRules.js`

Reference constants for Bramwood rules (wall heights, windows, doors, cladding, framing). `getPentWallHeights()` for pent roof formulas. Used for verification; not yet fully applied to all rendering.

### buildGrid.js

**File:** `src/config/buildGrid.js`

Constants: `GRID.CELL_SIZE` (6), `GRID.STUD_SPACING` (24). Used by WallGrid and snapping.

---

## Snapping System

Snapping logic is implemented inline in `src/components/shed/windows/Window.jsx` via `clampAndSnap()`:

- 6" grid snap
- 24" stud snap (within 3" assist distance)
- Clamps to wall edges, avoids door zone, enforces minimum gap between windows

**Note:** `src/systems/snapping/index.js` is a placeholder (empty export).

---

## Framing System

### generateWallFraming

**File:** `src/systems/framing/generateWallFraming.js`

Calculates stud positions (including king studs at openings), noggins (~36" vertical spacing), headers above windows and doors. Accepts wall dimensions, windows, doors, workshop flag. Returns positions for studs, noggins, headers.

### WallFraming Component

**File:** `src/components/shed/framing/WallFraming.jsx`

Renders studs (InstancedMesh), noggins, headers using `generateWallFraming`. Shown when `showFraming` is true.

---

## Window System

### Window

**File:** `src/components/shed/windows/Window.jsx`

Renders window at position `x` on wall. Handles pointer events: selection, dragging. Uses raycasting against wall `dragPlaneRef` to update position. Calls `clampAndSnap()` on drag. Sets `selectedElementId` and `isDraggingElement` in BuilderContext.

### WindowFrame

**File:** `src/components/shed/windows/WindowFrame.jsx`

Visual frame (trim, framing). Highlights on hover/selection. Dimensions passed from parent.

---

## Door System

### DoorFrame

**File:** `src/components/shed/doors/DoorFrame.jsx`

Renders door opening, frame, trim, hinges, handle. Width from `shedData.door_widths[doorType][wallHeightType]`. Door is always centered on the front wall; no drag logic.

---

## Wall Components

### Wall

**File:** `src/components/shed/walls/Wall.jsx`

Composes: WallGrid, drag plane (invisible), top/bottom plates, Shiplap, WallFraming, DoorFrame (if has door), Window components. Passes `windowPositions` and `windowTypes` from ConfiguratorContext.

### Shiplap

**File:** `src/components/shed/cladding/Shiplap.jsx`

InstancedMesh of horizontal cladding boards. Cuts openings for windows and door. Uses `BOARD_WIDTH` 5", `VISIBLE_COVERAGE` 4".

### WallGrid

**File:** `src/components/shed/grid/WallGrid.jsx`

6" cell grid with emphasized 24" stud lines. Shown when `selectedElementId` matches `window-{wallId}-*`.

---

## Roof Components

### ApexRoof

**File:** `src/components/shed/roof/ApexRoof.jsx`

Extruded dual-pitch roof, fascia, finials. Optional rafter framing when `showFraming` true.

### PentRoof

**File:** `src/components/shed/roof/PentRoof.jsx`

Single-slope roof box. Front/back heights from `shedData.pent_roof_dims` by shed width. Optional rafter framing.

---

## Interaction System

**Implementations:**

- **Window drag** — `src/components/shed/windows/Window.jsx` (pointer capture, raycaster, `updateX`)
- **Camera lock** — `src/components/shed/CameraController.jsx` (`OrbitControls` disabled when `isDraggingElement`)
- **Selection** — `selectedElementId` in BuilderContext, set by Window `onPointerDown`

**Note:** `src/systems/interaction/index.js` is a placeholder (empty export).

---

## Camera Controller

**File:** `src/components/shed/CameraController.jsx`

Positions camera when `builderStep` changes. OrbitControls for rotate, pan, zoom. `enabled={!isDraggingElement}` to lock during window drag.

---

## Main Shed Assembly

**File:** `src/components/shed/Shed.jsx`

Assembles floor bearers, floor, corner posts, walls, internal partitions, roof. Controls visibility per `builderStep`. Uses `shedConfig`, `roofStyle`, `windowPositions`, `doorType` from ConfiguratorContext.

---

## Internal Partitions

**Files:**  
- `src/components/shed/InternalPartition.jsx` — Renders partition wall with cladding, framing, optional door  
- `src/components/shed/InternalPartitionDoor.jsx` — Door in partition  
- `src/components/ui/InteriorTools.jsx` — UI to add/move/remove partitions, toggle view mode

Partitions snap to 24" stud grid. Position via stud index buttons.
