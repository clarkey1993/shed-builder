# Bramwood Drawings PDF vs Configurator Dimensional Audit — Mismatch Report

**Date:** 2025-03-21  
**Task:** Compare current configurator audit against Bramwood drawings PDF. No code changes.

---

## PDF Access Note

**The Bramwood Drawings PDF (`Bramwood Drawings.pdf`) could not be programmatically extracted.** The file appears to be image-based (scanned construction drawings) with no embedded text layer. Automated tools (pypdf, PyMuPDF) returned empty or negligible text.

**Implication:** This report uses:
- **Current code/audit values** — from `DIMENSIONAL_AUDIT_REPORT.md` and source files
- **PDF reference** — `BUILD_RULES.md` and `shedRules.js` as documented Bramwood specifications (the PDF would typically reflect these)
- **Manual verification required** — Any item marked "PDF: not extractable" must be checked by eye against the physical PDF

---

## 1. No Code Changes Made

No code was modified. This is a read-only comparison report.

---

## 2. Matches PDF (or Documented Bramwood Spec)

| Dimension | Current Code | PDF / Spec Reference | Notes |
|-----------|--------------|----------------------|-------|
| **Apex standard wall height** | 66" | shedData.wall_heights.standard, BUILD_RULES | Matches documented Bramwood rule |
| **Apex workshop wall height** | 70" | shedData.wall_heights.workshop, BUILD_RULES | Matches documented Bramwood rule |
| **Pent back wall** | 70" | PENT_LOW_HEIGHT, shedRules.pent.backWallHeight | Matches documented Bramwood rule |
| **Pent slope** | 1" per foot | PENT_SLOPE_PER_FOOT, shedRules.pent.slopePerFoot | Matches documented Bramwood rule |
| **Standard window** | 24" × 24" | WINDOW_RULES.STANDARD, shedRules.windows.standard | Matches documented Bramwood rule |
| **Security window** | 24" × 12" | WINDOW_RULES.SECURITY, shedRules.windows.security | Matches documented Bramwood rule |
| **Double door opening** | 60" (standard) | shedData.door_widths.double.standard, shedRules.doors.doubleWidth | Matches documented Bramwood rule |
| **Cladding board width** | 5" | Shiplap.jsx BOARD_HEIGHT, shedRules | Matches documented Bramwood rule |
| **Visible coverage** | 4" | Shiplap.jsx VISIBLE_COVERAGE, shedRules | Matches documented Bramwood rule |
| **Stud spacing** | 24" | generateWallFraming, buildGrid, shedRules | Matches documented Bramwood rule |
| **Grid snap** | 6" | snapRules, buildGrid | Documented |
| **Plate thickness** | 2" | shedData.framing.upright_middles_thickness_x | Documented |

---

## 3. Conflicts with PDF (or Documented Bramwood Spec)

### Critical

| Dimension | Current Code | PDF / Spec Reference | Why It Matters |
|-----------|--------------|----------------------|----------------|
| **Single door — clear opening vs frame** | shedData: **31"** (standard), **33.75"** (workshop) | shedRules: **27"** clear opening; BUILD_RULES: "27 inch clear opening" | BUILD_RULES defines single door as **27" clear opening**. shedData uses frame widths 31" / 33.75". The 4–7" gap suggests frame/jamb, but the spec explicitly states 27" clear. If the PDF shows 27" clear, the current 31" frame may be wrong. |
| **Stable door width** | shedData: **39.75"** (standard & workshop) | PDF: not extractable. BUILD_RULES does not list stable door. | **Stable door has no documented Bramwood spec** in BUILD_RULES or shedRules. 39.75" may conflict with PDF. If the PDF shows a different width, this will cause a visual mismatch and framing/opening issues. |
| **Label vs geometry — width** | Label: **92"** (`widthInches = size.width*12 - 2`) | Geometry: **94"** (`floor_widths_inches[8]`) | For 8ft nominal: label shows 92", geometry uses 94". User sees a dimension that does not match the physical model. |
| **Label vs geometry — depth** | Label: **70"** (`depthInches = size.depth*12 - 2`) | Geometry: **72"** (6×12) | For 6ft depth: label shows 70", geometry uses 72". Same mismatch as width. |

### Potential

| Dimension | Current Code | PDF / Spec Reference | Why It Matters |
|-----------|--------------|----------------------|----------------|
| **Pent front wall height** | getWallProfiles: **70 + runFeet** (formula) | shedData.pent_roof_dims: lookup, e.g. 8ft → front **78**, back 70 | Formula: 6ft depth → front 76". Lookup: 8ft width → front 78". For 8×6 pent, code uses depth for run → 76"; shedData lookup is by width → 78". **getWallProfiles does not use pent_roof_dims**; formula and lookup can diverge. If PDF uses a different convention, walls will be wrong. |
| **Pent roof dims lookup** | pent_roof_dims by nominal **width** | getWallProfiles uses **run** (depth or width by slope direction) | Lookup key is shed width; formula uses run in slope direction. For slope front-to-back, run = depth. For slope left-to-right, run = width. Lookup may not match formula for all configurations. |
| **Floor width formula** | `floor_widths_inches[n]` = 12n − 2 (e.g. 8→94) | PDF: not extractable | 8ft nominal → 94" internal. If PDF shows different base/floor dimensions, floor and walls will be misaligned. |
| **floor_dimensions offset** | width_offset: 2, depth_offset: 2 | Used **only** in Dimensions.jsx labels | Offsets suggest 2" per side (e.g. external vs internal). Unclear if structural or display-only. If PDF shows external dimensions, labels might intend external; geometry is internal. |

---

## 4. Likely Visual Problem Areas (Not Explicitly Dimensioned in PDF)

These affect proportions and realism but may not have explicit dimensions in the PDF:

| Area | Current Code | Issue | Impact |
|------|--------------|-------|--------|
| **Window height placement** | `windowTop = eaveHeight - yCenter - 9` (9" below top plate) | WINDOW_BOARD_HEIGHT 4 + SHIPLAP_BOARD_OFFSET 5 = 9" fixed offset | Windows are placed 9" below eave regardless of wall height. On shorter walls or trapezoids, this can look too high or crowd the door. No PDF dimension to verify; likely visual-only. |
| **Window on trapezoid walls** | `windowTop = topAtX - 9` at window x | Same 9" offset at local x | On sloping sides, window top follows wall height at x. Vertical position can look inconsistent if offset is wrong for slope. |
| **Door hitbox vs door width** | `boxGeometry args={[doorWidth + 6, wallHeight, 0.5]}` | Hitbox 6" wider than door | Affects interaction only; no geometry mismatch. |
| **Double door center gap** | DoorFrame: DOUBLE_LEAF_CENTER_GAP 1.5" | Visual split between leaves | Small gap; minor proportion issue if PDF shows different. |
| **Ghost module defaults** | Wall.jsx: ghostW 96, ghostD 72 when no module | ConfiguratorContext default: 94×72 | Ghost preview uses 96" width vs actual 94"; brief visual inconsistency during placement. |
| **Apex vs pent overhang** | Apex: 4" eave, 4" side; Pent: 2" eave, 2" side | Different by roof type | May be intentional. If PDF standardizes overhangs, this could be wrong. |
| **Roof peak for apex** | shedData.apex_roof_dims: 8ft → 81.5" | PDF: not extractable | Peak height drives roof shape. If PDF differs, roof will look wrong. |
| **Shiplap opening margin** | winMinY/winMaxY ±2 beyond glazing | 2" extra vertical margin for cuts | Could affect alignment of cladding around windows if PDF expects different clearance. |

---

## 5. Recommended Order of Fixes

(No code changes made; order is for future implementation.)

### Priority 1 — Label vs geometry mismatch
1. **Dimensions.jsx labels** — Align displayed dimensions with actual geometry. Either: (a) use `floor_widths_inches` and depth×12 for labels, or (b) document and consistently apply the 2" offset rule for both labels and geometry.
2. **Clarify floor_dimensions** — Confirm whether width_offset/depth_offset are structural or display-only, and whether they should affect geometry.

### Priority 2 — Door spec conflicts
3. **Single door** — Confirm whether 27" is clear opening or frame. If clear opening, derive frame width from 27" + jamb thickness and update shedData.
4. **Stable door** — Obtain Bramwood spec (or measure from PDF) for stable door width. Update shedData.door_widths.stable if it differs from 39.75".

### Priority 3 — Pent roof consistency
5. **Pent wall heights** — Unify getWallProfiles and shedData.pent_roof_dims. Either use the formula everywhere or the lookup everywhere, and align with PDF convention for run (depth vs width by slope direction).
6. **pent_roof_dims key** — Ensure lookup uses the correct dimension (width vs depth) for the chosen slope direction.

### Priority 4 — Visual refinements
7. **Window vertical placement** — Revisit WINDOW_BOARD_HEIGHT and SHIPLAP_BOARD_OFFSET (or equivalent) so window position scales sensibly with wall height and roof type.
8. **Manual PDF check** — Review the Bramwood drawings PDF by eye for: floor widths, wall heights, apex peak, pent front/back heights, all door widths (especially stable), window sizes and typical positions.

---

## Summary Table

| Category | Count |
|----------|-------|
| Matches | 11 |
| Conflicts (critical) | 4 |
| Conflicts (potential) | 4 |
| Likely visual problem areas | 8 |

**Note:** All "PDF" references assume the PDF reflects the documented Bramwood rules. Manual verification against the actual drawings is required where the PDF could not be extracted.
