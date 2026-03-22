# Shed Configurator — Full Dimensional Audit Report

**Date:** 2025-03-20  
**Purpose:** Compare current model against real drawing plans (PDF) before making changes.  
**No code was modified in this audit.**

---

## Files Inspected

| File | Purpose |
|------|---------|
| `src/shedData.json` | Lookup tables for roof, walls, doors, floor widths, framing |
| `src/context/ConfiguratorContext.jsx` | Module state, defaults, placement, reflow |
| `src/components/shed/Shed.jsx` | Floor, walls, roof assembly, scale |
| `src/components/shed/walls/Wall.jsx` | Wall geometry, door/window layout |
| `src/components/shed/windows/Window.jsx` | Window drag, positioning |
| `src/components/shed/windows/WindowFrame.jsx` | Window trim/frame rendering |
| `src/components/shed/doors/DraggableDoor.jsx` | Door drag, hitbox |
| `src/components/shed/doors/DoorFrame.jsx` | Door panel/frame rendering |
| `src/systems/openings/getOpeningDimensions.js` | Door/window dimension lookup |
| `src/systems/openings/windowPlacement.js` | Window constraints, snap, clearance |
| `src/systems/roof/getWallProfiles.js` | Wall height profiles (apex/pent) |
| `src/systems/snapping/snapRules.js` | Grid/stud snap constants |
| `src/systems/framing/generateWallFraming.js` | Stud/noggin/header layout |
| `src/components/shed/cladding/Shiplap.jsx` | Board dimensions, overlap |
| `src/components/shed/roof/ApexRoof.jsx` | Apex overhang, fascia |
| `src/components/shed/roof/PentRoof.jsx` | Pent overhang, thickness |
| `src/components/shed/Dimensions.jsx` | Dimension label display |
| `src/config/shedRules.js` | Reference rules (not all applied) |
| `src/components/shed/CameraController.jsx` | Camera (uses structureBounds) |

---

## 1. Module/Base Audit

### Source of truth
- **ConfiguratorContext.jsx** (lines 170–176, 179–184)
- **shedData.json** `floor_widths_inches`, `floor_dimensions`

### Default module sizing
| Value | Source | Value | Units |
|-------|--------|-------|-------|
| Default width | `shedData.floor_widths_inches[8]` | **94** | inches |
| Default depth | `6 * 12` | **72** | inches |
| Default nominal | 8ft × 6ft | — | feet |

### Floor width lookup (shedData.json)
```
floor_widths_inches: { "4": 46, "5": 58, "6": 70, "7": 82, "8": 94, "9": 106, "10": 118, "11": 130, "12": 142 }
```
- Key = nominal width in feet
- Value = floor width in inches

### Depth
- Depth in feet × 12 (e.g. 6 → 72")
- Set via `setSize` in ConfiguratorContext

### Module attachment
- **computeAttachedOffset** (ConfiguratorContext 21–35): `offsetX/Z` from parent center and child half-width/half-depth
- **snapAttachOffset**: center, start, or end aligned on join axis
- **getWallCutSpans**: `overlapHalf = Math.min(parentSpan, childSpan) / 2` for wall cuts

### Scale
- **Shed.jsx** line 76: `<group scale={1 / 12}>` — scene in **feet** (1 unit = 1 foot)

### floor_dimensions (shedData)
```
width_offset: 2, depth_offset: 2
```
- Used only in **Dimensions.jsx** for label text, not for geometry

---

## 2. Wall Audit

### Wall dimensions
| Wall | Width (local X span) | Source |
|------|----------------------|--------|
| Front/Back | `module.width` | ConfiguratorContext `getWallWidthForWallId` |
| Left/Right | `module.depth` | Same |

- Units: inches (before Shed scale)
- Wall segment length from `getVisibleWallSegments`; joins reduce visible span

### Wall height
- **shedData.json** `wall_heights`: standard **66"**, workshop **70"**
- **ConfiguratorContext** `shedConfig.wallHeight` from `wall_heights[wallHeightType]`
- **getWallProfiles.js**:
  - Apex: `eaveHeight`, `peakHeight` from shedConfig
  - Pent: `PENT_LOW_HEIGHT = 70`, `PENT_SLOPE_PER_FOOT = 1`

### Wall geometry (Wall.jsx)
- **Rectangular**: `height` from profile
- **Trapezoid** (pent sides): `heightAtStart`, `heightAtEnd`, linear slope
- **Gable** (apex front/back): `eaveHeight`, `peakHeight`, triangular top
- Local Y origin: wall bottom at `-yCenter`; center Y from `getWallYCenter`

### Wall inclusion
- `wallIncluded` map; `false` → wall omitted
- `getVisibleWallSegments` + `wallCutSpans` for joined walls

### Framing thickness
- **shedData.framing**: `upright_middles_thickness_x: 2`, `upright_ends_thickness_x: 2`
- **Wall.jsx** `plateThickness`: `shedConfig.framing.upright_middles_thickness_x` = 2"

### Shed.jsx floor / bearers
- `floorThickness` = 2" (framing)
- Bearers: `bearerThickness = 2`, `bearerSpacing = 12`

---

## 3. Roof Audit

### Apex roof (ApexRoof.jsx)
| Constant | Value | Units |
|----------|-------|-------|
| EAVE_OVERHANG | 4 | inches |
| SIDE_OVERHANG | 4 | inches |
| ROOF_PANEL_THICKNESS | 4 | inches |
| FASCIA_HEIGHT | 2 | inches |
| FASCIA_THICKNESS | 1 | inch |
| RIDGE_CAP_WIDTH | 4 | inches |
| FINIAL_H | 6 | inches |
| FINIAL_R | 2 | inches |
| RAFTER_SPACING | 24 | inches |
| RAFTER_W, RAFTER_T | 2, 3 | inches |

**Peak height:**
- `shedConfig.roofPeakHeight` from `shedData.apex_roof_dims[nominalWidth]`
- 8ft → **81.5"**
- `roofPeak = totalHeight - wallHeight` (rise above eave)
- Roof size: `roofDepth = depth + 8`, `roofWidth = width + 16` (overhangs)

### Pent roof (PentRoof.jsx)
| Constant | Value | Units |
|----------|-------|-------|
| EAVE_OVERHANG | 2 | inches |
| SIDE_OVERHANG | 2 | inches |
| ROOF_THICKNESS | 5 | inches |
| RAFTER_SPACING | 24 | inches |
| RAFTER_W, RAFTER_T | 2, 3 | inches |

**Pent wall heights (getWallProfiles.js):**
- `PENT_LOW_HEIGHT = 70"`
- `PENT_SLOPE_PER_FOOT = 1"`
- High wall = `70 + runFeet` (run = depth or width by slope direction)
- **shedData.pent_roof_dims** has front/back heights; not used in getWallProfiles (formula used instead)

### Roof peak lookup (shedData)
```
apex_roof_dims: 8ft → 81.5"
pent_roof_dims: 8ft → { front: 78, back: 70 }
```

---

## 4. Door Audit

### Door widths (shedData.json, getOpeningDimensions.js)
| Type | Standard | Workshop |
|------|----------|----------|
| single | 31" | 33.75" |
| stable | 39.75" | 39.75" |
| double | 60" | 62.75" |
| double_with_windows | 61" (mapped to double) | 61" |

### Door height (getOpeningDimensions.js)
- `usableWallHeight = wallHeight - topPlateThickness - 1`
- `height = Math.min(wallHeight, usableWallHeight)`
- Uses `wallHeight` and `topPlateThickness` (2") from shedConfig

### Wall.jsx door sizing
- `wallHeightForDoor`: uses `DOOR_TOP_CLEARANCE = 10"`, `MIN_PENT_DOOR_WALL_HEIGHT = 60"`, `MIN_APEX_DOOR_WALL_HEIGHT = 56"`
- Door bottom: `-height/2` (rect) or `-yCenter` (trapezoid/gable)

### DoorFrame.jsx (render-only)
| Constant | Value | Purpose |
|----------|-------|---------|
| DOOR_BOARD_WIDTH | 4 | Board width |
| DOOR_BOARD_THICKNESS | 0.65 | Panel thickness |
| VISUAL_STUD_WIDTH | 1.5 | Frame width |
| TRIM_W, TRIM_T | 2, 1 | Trim |
| DOUBLE_LEAF_CENTER_GAP | 1.5 | Double door center gap |

### Door placement (DraggableDoor.jsx)
| Constant | Value | Purpose |
|----------|-------|---------|
| STUD_CLEARANCE | 3 | Window–door gap |
| CORNER_CLEARANCE | 6 | Door to wall end |
| GRID_SNAP | 6 | Grid snap (snapRules) |
| STUD_SNAP | 24 | Stud snap |
| STUD_ASSIST_DIST | 3 | Stud snap assist |

### Door hitbox
- `boxGeometry args={[doorWidth + 6, wallHeight, 0.5]}` — 6" wider than door

---

## 5. Window Audit

### Window dimensions (getOpeningDimensions.js, WINDOW_RULES)
| Type | Width | Height |
|------|-------|--------|
| STANDARD | 24" | 24" |
| SECURITY | 24" | 12" |
| DOUBLE | 50" | 24" |

### WindowFrame.jsx (render)
| Constant | Value |
|----------|-------|
| EXTERIOR_TRIM_WIDTH | 1.25 |
| EXTERIOR_TRIM_THICKNESS | 0.6 |
| OPENING_SIDE_MARGIN | 3 |
| OPENING_TOP_BOTTOM_MARGIN | 2 |
| MULLION_WIDTH (double) | 2 |
| MULLION_GLAZING_GAP | 0.5 |

### Window vertical position (Wall.jsx, windowsForFraming)
- `WINDOW_BOARD_HEIGHT = 4`, `SHIPLAP_BOARD_OFFSET = 5`
- `windowTop = eaveHeight - yCenter - 9` (gable) or similar for other profiles
- Top of window: 9" below top plate/eave
- Center Y = `windowTop - height/2`

### Window placement constraints (windowPlacement.js)
| Constant | Value | Purpose |
|----------|-------|---------|
| STUD | 3 | Stud thickness for clearance |
| EDGE_CLEARANCE | 6 | 2×STUD, wall edge clearance |
| DOOR_PREFER_CLEARANCE | 2 | Prefer not over door |
| minGapBetween | w/2 + o/2 + 6 | Window–window gap |

### Snap rules (snapRules.js)
| Constant | Value |
|----------|-------|
| GRID_SNAP | 6 |
| STUD_SNAP | 24 |
| STUD_ASSIST_DIST | 3 |

### Shiplap window cut
- `winMinY = centerY - wh/2 - 2`, `winMaxY = centerY + wh/2 + 2` — 2" extra vertical margin

---

## 6. Positioning / Constraint Audit

### Window
- `clampAndSnap` (windowPlacement.js): min/max from wall width, EDGE_CLEARANCE, other windows
- Stud snap from `getValidBayCenters` (24" spacing)
- No door zone blocking; `getDefaultWindowPosition` prefers not over door

### Door
- `clampAndSnapDoor` (DraggableDoor.jsx): CORNER_CLEARANCE 6", STUD_CLEARANCE for window gap
- Snaps to GRID_SNAP (6) or STUD_SNAP (24) within assist distance

### Module attachment
- Snap: center, start, or end on join axis
- Overlap: `min(parentSpan, childSpan) / 2` for cut spans

---

## 7. Shiplap / Cladding Audit

### Shiplap.jsx
| Constant | Value | Units |
|----------|-------|-------|
| BOARD_HEIGHT | 5 | inches |
| VISIBLE_COVERAGE | 4 | inches |
| BOARD_THICKNESS | 0.9 | inches |
| OVERLAP | 0.12 | inches |
| OPENING_MARGIN | 2 | inches |

- **shedRules.js** cladding: boardWidth 5, visibleCoverage 4 — matches

---

## 8. Inconsistencies / Likely Problem Areas

### Critical
1. **Dimensions.jsx vs geometry**
   - Labels: `widthInches = size.width * 12 - 2` → 8ft shows **92"**
   - Actual module width: **94"** from `floor_widths_inches[8]`
   - Same for depth. Geometry uses module size; labels use nominal minus offset.

2. **floor_dimensions usage**
   - `width_offset`, `depth_offset` used only in Dimensions.jsx for labels
   - Not used for geometry; unclear if offsets are structural or display-only

### Potential
3. **Pent roof heights**
   - getWallProfiles: `70 + runFeet` (run = depth or width)
   - shedData.pent_roof_dims: lookup by width, e.g. front 78, back 70 for 8ft
   - Formula and lookup may differ; pent dims not used in getWallProfiles

4. **shedRules.js vs shedData**
   - shedRules: singleWidth 27", doubleWidth 60"
   - shedData: single 31", double 60"
   - shedRules marked "for verification"; shedData used in code

5. **Apex vs pent overhang**
   - Apex: EAVE_OVERHANG 4, SIDE_OVERHANG 4
   - Pent: EAVE_OVERHANG 2, SIDE_OVERHANG 2
   - Inconsistent unless intentional

6. **Framing stud spacing**
   - shedData.framing.spacing_ft: 2
   - generateWallFraming: STUD_SPACING 24
   - snapRules: STUD_SNAP 24
   - Spacing in feet vs inches may need checking

### Minor
7. **Magic numbers**
   - Wall.jsx: WINDOW_BOARD_HEIGHT 4, SHIPLAP_BOARD_OFFSET 5
   - Shiplap: winMinY/maxY ±2 beyond glazing
   - DraggableDoor hitbox +6 beyond door width

8. **Default fallbacks**
   - Wall.jsx: ghostMod defaults 96×72 when no module
   - ConfiguratorContext: default 94×72
   - Mismatch for ghost preview

---

## 9. Summary — What to Recalibrate After PDF

1. **Floor dimensions**
   - Confirm if `floor_widths_inches` matches build plans.
   - Decide whether `floor_dimensions` offsets are real or for display.

2. **Dimension labels**
   - Align Dimensions.jsx with actual geometry (94" vs 92" for 8ft).

3. **Wall heights**
   - Check 66" standard and 70" workshop.
   - Check pent slope (1" per foot) against drawings.

4. **Roof**
   - Compare apex peak heights and pent front/back heights to plans.
   - Confirm overhangs (4" apex vs 2" pent).

5. **Door sizes**
   - Verify single 31", stable 39.75", double 60" vs spec.

6. **Window sizes**
   - Verify 24×24 standard, 50×24 double.

7. **Clearances**
   - EDGE_CLEARANCE 6", CORNER_CLEARANCE 6", STUD_CLEARANCE 3".

8. **Framing**
   - Stud spacing 24", plate thickness 2", and how they relate to openings.
