# Shed Configurator Logic Audit Report

## STEP 1 — Hardcoded Dimension Values

### Files containing shed-relevant hardcoded values

| File | Value | Context | Matches SHED_RULES? |
|------|-------|---------|---------------------|
| **shedData.json** | 66, 70 | wall_heights.standard, .workshop | ✅ Yes |
| **shedData.json** | 31, 33.5, 60, 62.5 | door_widths (single/double, standard/workshop) | ⚠️ shedData uses 31" single; SHED_RULES says 27" |
| **shedData.json** | 70 | pent_roof_dims.back | ✅ Yes |
| **Wall.jsx** | 5.5 | BOARD_WIDTH | ⚠️ SHED_RULES cladding.boardWidth = 5 |
| **Wall.jsx** | 22, 36 | W, WINDOW_HEIGHT | ⚠️ SHED_RULES windows.standard = 24x24 |
| **Window.jsx** | 22, 36 | W, H | ⚠️ Same mismatch |
| **WindowFrame.jsx** | Receives from Window | windowWidth, windowHeight | Inherits 22x36 |
| **InternalPartition.jsx** | 5.5 | BOARD_WIDTH | ⚠️ Same |
| **InternalPartition.jsx** | 24 | STUD_SPACING | ✅ Yes (studSpacing 24) |
| **DoorFrame.jsx** | Uses shedData | door_widths | shedData has 31/33.5 single, 60/62.5 double |
| **InternalPartitionDoor.jsx** | 31 | DOOR_WIDTH | shedData single.standard |
| **WallHeightSelector.jsx** | 66, 70 | Labels | ✅ Yes |
| **InteriorViewContext.jsx** | 24 | STUD_SPACING | ✅ Yes |
| **PlacementGrid.jsx** | 24 | SECTION | ✅ Yes (section size) |
| **PentRoof.jsx** | 5 | EAVE_OVERHANG | ✅ (not in rules; structural) |
| **ApexRoof.jsx** | 5 | EAVE_OVERHANG | Same |

---

## STEP 2 — Wall Height Logic

### APEX sheds
- **shedData.wall_heights**: standard=66", workshop=70" ✅
- **ConfiguratorContext**: Uses shedData.wall_heights[wallHeightType] ✅
- **Shed.jsx**: Passes shedConfig.wallHeight to all walls ✅
- **PentRoof.jsx**: Uses wallHeight from shedData for back; front from pent_roof_dims ✅

### PENT sheds
- **shedData.pent_roof_dims**: e.g. 10ft deep → front=80, back=70 (80 = 70 + 10) ✅
- **Rule**: frontWallHeight = 70 + shedDepthInFeet → Matches shedData ✅
- **MISMATCH**: Shed.jsx passes same wallHeight to front and back walls. Pent sheds require:
  - Back wall = 70"
  - Front wall = 70 + depth (e.g. 80" for 10ft)
  - **Current**: All walls use shedConfig.wallHeight (66 or 70 from wallHeightType)
  - **Proposed fix**: For roofStyle=== "pent", front wall should use pent_roof_dims[size.width].front, back wall use .back. This would require Shed.jsx to pass different heights to front vs back Wall components. User requested NOT to modify wall/roof components—report only.

---

## STEP 3 — Window Dimensions

### SHED_RULES
- Standard: 24" x 24"
- Security: 24" x 12"

### Current implementation
- **Window.jsx**: W=22, H=36 (22" x 36") ❌
- **Wall.jsx**: WINDOW_HEIGHT=36, W=22 ❌
- **WindowFrame.jsx**: Receives windowWidth, windowHeight from parent
- **Security window**: Not implemented (no 24x12 option)

### Mismatch summary
| Spec | Current | Rule |
|------|---------|------|
| Width | 22" | 24" |
| Height | 36" | 24" (standard) |

**Note**: Changing these would affect framing cutouts, drag bounds, and WindowFrame. User requested not to modify window drag logic—report only.

---

## STEP 4 — Door Dimensions

### SHED_RULES
- Single: 27" width
- Double: 60" width

### shedData.json
- single.standard: 31", single.workshop: 33.5"
- double.standard: 60", double.workshop: 62.5"

### Current implementation
- **DoorFrame.jsx**: Uses shedData.door_widths[doorType][wallHeightType] ✅ (uses shedData)
- **Wall.jsx**: doorHalfWidth from shedData.door_widths[doorType]?.standard / 2
- **Door height**: doorHeight = 6*12 = 72" (fixed). Rule says "height = wall height"—varies 66–70" for apex. ⚠️ Slight mismatch.

### Mismatch
| Spec | shedData | SHED_RULES |
|------|----------|------------|
| Single width | 31" | 27" |
| Double width | 60" | 60" ✅ |

---

## STEP 5 — Shiplap/Cladding Orientation

### SHED_RULES
- Orientation: horizontal ✅
- Board width: 5"
- Visible coverage: 4"
- rows = wallHeight / 4

### Current implementation
- **Wall.jsx**: BOARD_WIDTH = 5.5 (not 5); step = BOARD_WIDTH + GAP (0.4) = 5.9"
- **Cladding layout**: Boards placed horizontally along wall width (vertical boards would run floor-to-ceiling). The instanced meshes use RoundedBoxGeometry with [BOARD_WIDTH-0.1, studHeight, BOARD_THICKNESS]—boards are horizontal strips. ✅
- **Row calculation**: Current uses studHeight segments for window cutouts; no explicit "rows = wallHeight / 4" formula. Cladding is placed by step = 5.9", not visible coverage 4".
- **Texture repeat**: tex.repeat.set(width/24, studHeight/24)—24 is texture scale, not board dimensions.

### Mismatch
- BOARD_WIDTH: 5.5" vs rule 5"
- No explicit visible coverage (4") in row logic

---

## STEP 6 — Camera Snap Bug

### Issue
Camera was lerping toward step targets every frame, overwriting user rotation/zoom.

### Fix applied
- **Removed**: useFrame lerp
- **Changed**: Camera and target set once in useEffect when builderStep changes
- **Added**: enablePan for OrbitControls (rotation, pan, zoom)

Camera now only repositions on step change; user orbit/pan/zoom are preserved.

---

## STEP 7 — Interaction Safety

### Window dragging
- **Window.jsx**: Uses onPointerDown on mesh, setPointerCapture, canvas pointermove/pointerup ✅
- **No change** from InteriorObjects or PlacementHandler
- **Verdict**: ✅ Unaffected

### Door dragging
- Exterior door: No drag in codebase; door position fixed in DoorFrame
- **Verdict**: ✅ No conflict

### Interior objects
- Use MoveHandle; separate from Window
- **Verdict**: ✅ Correct separation

---

## STEP 8 — Summary of Mismatches

| Category | Mismatch | Location | Safe correction? |
|----------|----------|----------|------------------|
| Window size | 22x36 vs 24x24 | Window.jsx, Wall.jsx | No—would affect framing, drag |
| Door single width | shedData 31" vs rule 27" | shedData.json | No—user said do not modify |
| Cladding board | 5.5 vs 5 | Wall.jsx, InternalPartition.jsx | Possible but affects layout |
| Pent wall heights | Same height for front/back | Shed.jsx | Requires wall component changes |
| Door height | Fixed 72" vs wall height | DoorFrame.jsx | Could use wallHeight prop |

---

## Proposed Safe Corrections (without breaking existing systems)

1. **shedRules.js** ✅ Created as reference.
2. **CameraController** ✅ Fixed—no per-frame lerp.
3. **Documentation**: Add comments in Wall.jsx, Window.jsx referencing shedRules.js for future alignment.
4. **No changes** to ConfiguratorContext, shedData.json, framing logic, window/door drag, builderStep, or wall/roof components per user constraints.

---

## Files Created/Modified

- **Created**: `src/config/shedRules.js` — Single source of truth
- **Modified**: `src/components/shed/CameraController.jsx` — Camera snap fix, enablePan
- **Created**: `SHED_AUDIT_REPORT.md` — This report
