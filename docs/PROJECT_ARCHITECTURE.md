# PROJECT_ARCHITECTURE.md

> **IMPORTANT FOR AI AGENTS**  
> Always read this document before modifying code in this project.  
> This document defines the intended architecture and construction rules of the shed configurator.

---

## Project Purpose

The configurator allows users to design Bramwood sheds in a 3D environment through a guided step-by-step workflow.

Users can configure:

- **Shed size** — width and depth via presets (nominal feet)
- **Roof type** — apex or pent
- **Door type** — none, single, or double on the front wall
- **Window placement** — add/remove windows per wall, drag to position
- **Wall height** — standard (66") or workshop (70")
- **Internal partition walls** — add partitions along width or depth, optional doors
- **Framing visualization** — toggle studs, noggins, headers, rafters

**Important rule:** The configurator builds the structure of the shed only. Interior furniture such as shelves or workbenches are NOT part of the system.

---

## Core Technology

- **React**
- **React Three Fiber** — 3D scene management
- **Three.js** — geometry, materials, rendering
- **@react-three/drei** — helpers (Box, OrbitControls, Environment, etc.)

---

## How Sheds Are Built

1. **Base step** — User selects dimensions. Floor bearers, OSB floor, and dimensions come from `shedData.json`.
2. **Wall steps** — Front wall (with door), side walls, back wall. Each wall shows Shiplap cladding, optional windows, optional door frame. Walls appear progressively.
3. **Roof step** — User selects apex or pent. Apex uses `apex_roof_dims`, pent uses `pent_roof_dims` from `shedData.json`.
4. **Interior step** — User can add partition walls (along width or depth), toggle exterior/interior view, and request a quote.

---

## Interaction Model

- **Builder workflow** — Six steps: BASE → FRONT_WALL → SIDE_WALLS → BACK_WALL → ROOF → INTERIOR. Camera repositions per step.
- **Window dragging** — Windows can be dragged along their wall. Snaps to 6" grid and 24" stud spacing. Collision avoidance with door and other windows.
- **Door placement** — Doors are fixed to the center of the front wall. User selects type (none/single/double) only; no dragging.
- **Grid overlay** — 6" cells with highlighted 24" stud lines. Shown when a window is selected.
- **Camera lock** — OrbitControls disabled while dragging a window (`isDraggingElement`).
- **Partitions** — Positioned via stud index buttons in the sidebar, not by dragging in 3D.

---

## Cladding System

- Shiplap boards run horizontally.
- InstancedMesh for performance. Openings cut for windows and doors.
- Board width 5", visible coverage ~4" (see `src/components/shed/cladding/Shiplap.jsx`).

---

## Roof Systems

- **ApexRoof** — Dual-pitch extruded shape, fascia, finials, optional rafter framing.
- **PentRoof** — Single-slope box, fascia, optional rafter framing.
- Roof peak heights come from `shedData.json` lookup by shed width.

---

## Performance Goals

- Avoid regenerating geometry every frame.
- Use memoization (`useMemo`) for heavy calculations (cladding, framing, roof).
- Use InstancedMesh for cladding boards and wall studs.

---

## Current Implementation Status

| Feature | Status |
|---------|--------|
| Size presets, dimensions from shedData | ✅ Implemented |
| Roof type (apex / pent) | ✅ Implemented |
| Wall height (standard / workshop) | ✅ Implemented |
| Door type selection (none / single / double) | ✅ Implemented |
| Window add/remove per wall | ✅ Implemented |
| Window drag with grid and stud snapping | ✅ Implemented |
| Wall grid overlay when window selected | ✅ Implemented |
| Camera lock while dragging | ✅ Implemented |
| Door dragging | ❌ Not implemented (door fixed to center) |
| Shiplap cladding with openings | ✅ Implemented |
| Wall framing (studs, noggins, headers) | ✅ Implemented |
| Roof framing (rafters) | ✅ Implemented |
| Internal partitions | ✅ Implemented |
| Partition door option | ✅ Implemented |
| Exterior / interior view toggle | ✅ Implemented |
| Window types (STANDARD vs SECURITY) | ⚠️ Partially: types stored, dimensions not yet differentiated |
| `systems/snapping` | ⚠️ Placeholder; logic is inline in Window.jsx |
| `systems/interaction` | ⚠️ Placeholder; logic is in Window.jsx and CameraController |
