# PROJECT_ARCHITECTURE.md

> **IMPORTANT FOR AI AGENTS**  
> Always read this document before modifying code in this project.  
> This document defines the intended architecture and system separation of the shed configurator.

---

## Project Purpose

This project is a **Bramwood shed configurator AND builder pack generator**.

It has two main responsibilities:

### 1. Configurator (3D interactive system)

Allows users to design sheds in a 3D environment through a guided step-by-step workflow.

Users can configure:

- **Shed size** — width and depth via presets (nominal feet)
- **Roof type** — apex or pent
- **Door type** — none, single, or double on the front wall
- **Window placement** — add/remove windows per wall, drag to position
- **Wall height** — standard (66") or workshop (70")
- **Internal partition walls** — add partitions along width or depth, optional doors
- **Framing visualization** — toggle studs, noggins, headers, rafters

---

### 2. Builder Pack (drawing / export system)

Generates **real-world construction drawings** from Bramwood rules.

Includes:

- Base / floor plan sheets
- Wall elevation sheets
- Apex / pent side sheets
- Roof sheets
- Opening schedules
- Module / wall schedules
- (future) cut lists and material lists

---

## Critical Architecture Rule

These two systems are **NOT the same**.

### Configurator System
- Optimized for interaction and rendering
- Uses `shedData.json`
- Uses live geometry and wall meshes
- May approximate real-world values for performance

### Builder Output System
- Optimized for real-world construction accuracy
- Uses `src/config/builderRules.js`
- Uses lookup tables from Bramwood drawings
- Must be deterministic and repeatable
- Must NOT depend on Three.js scene or mesh measurements

---

## Source of Truth Rules

When there is a conflict:

| Situation | Source of Truth |
|----------|----------------|
| Visual layout / rendering | Configurator |
| Interaction (drag, snap, placement) | Configurator |
| Builder sheets / plans / dimensions | **builderRules.js** |
| Real-world construction sizes | **builderRules.js** |

---

## Core Technology

- **React**
- **React Three Fiber** — 3D scene management
- **Three.js** — geometry, materials, rendering
- **@react-three/drei** — helpers

---

## System Layers

### 1. UI Layer
Location:

src/components/ui/


Responsible for:
- Sidebar
- Builder panel
- Builder sheet preview
- Plan / elevation / roof preview rendering

---

### 2. Configurator Layer (3D)

Location:

src/context/
src/components/shed/


Responsible for:
- user interaction
- wall / roof geometry
- window and door placement
- live rendering

---

### 3. Builder Data Layer

Location:

src/lib/buildData/


Responsible for:
- transforming configurator state into clean data
- generating:
  - modules
  - walls
  - openings
  - schedules
  - plans
  - elevations
  - roof drawings

**Important:**
This layer must NOT depend on Three.js meshes.

---

### 4. Builder Rules Layer (MOST IMPORTANT)

Location:

src/config/builderRules.js


Responsible for:

- floor A/B lengths
- split floor rules
- apex upright heights
- pent upright heights
- plain side rules
- roof member sizes
- door construction rules

**This is the source of truth for real-world sizes.**

---

### 5. Config Data Layer

Location:

src/config/shedData.json


Responsible for:
- configurator presets
- general size values used by 3D system
- roof height lookups
- door widths for UI

---

## How Sheds Are Built (Configurator Flow)

1. **Base step**
   - User selects nominal width/depth
   - Floor is rendered visually
   - Uses `shedData.json`

2. **Wall steps**
   - Front, sides, back
   - Openings added and dragged
   - Cladding + framing shown

3. **Roof step**
   - Apex or pent selected
   - Uses roof dimension lookups

4. **Interior step**
   - Partitions added
   - Builder data panel available
   - Builder pack preview available

---

## Builder Pack Flow

1. Configurator state is captured
2. `getBuildModel()` creates a clean model
3. `buildSchedules()` generates structured data
4. Builder helpers generate:
   - floor plan
   - elevations
   - roof drawings
5. UI renders:
   - Builder pack pages

---

## Important Rule for AI Agents

When working on:

- floor plans
- wall sheets
- elevations
- roof drawings
- schedules
- builder pack

You MUST:

- use `builderRules.js`
- use lookup tables where available
- NOT derive values from rendered geometry
- NOT assume nominal size equals actual size

---

## Interaction Model

- Builder workflow:  
  `BASE → FRONT_WALL → SIDE_WALLS → BACK_WALL → ROOF → INTERIOR`

- Windows:
  - draggable on all walls
  - snap to 6" grid
  - snap to 24" studs

- Doors:
  - fixed to front wall center

- Camera:
  - locks during dragging

- Grid:
  - visible only during placement

---

## Cladding System

- Horizontal shiplap
- Board width: 5"
- Visible: ~4"
- Uses InstancedMesh

---

## Roof Systems

- Apex roof (dual pitch)
- Pent roof (single slope)
- Heights from `shedData.json`

---

## Performance Goals

- No per-frame heavy computation
- Use `useMemo`
- Use InstancedMesh for repeated elements

---

## Current Implementation Status

| Feature | Status |
|--------|--------|
| Configurator (3D) | ✅ Stable |
| Openings system | ✅ Working |
| Framing visualization | ✅ Working |
| Builder model | ✅ Implemented |
| Schedules | ✅ Implemented |
| Top-down plan | ✅ Implemented |
| Floor plan (builder) | ⚠️ Needs correction |
| Elevation sheets | ⚠️ Needs layout improvements |
| Roof sheets | ⚠️ Early implementation |
| Builder pack layout | ⚠️ In progress |

---

## Key Principle

👉 The 3D model helps the user design  
👉 The builder system tells the builder how to build

They are related — but **not the same system**