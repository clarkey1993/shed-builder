# BUILD_RULES.md

> **IMPORTANT FOR AI AGENTS**  
> Always read this document before modifying code in this project.  
> This document defines the intended architecture and construction rules of the shed configurator.

---

## Bramwood Rules (Reference)

These are the target Bramwood construction rules. Where the current implementation differs, it is noted under "Current implementation."

Reference file: `src/config/shedRules.js`

---

## Wall Heights

| Shed Type | Bramwood Rule |
|-----------|---------------|
| Apex Standard Shed | 66 inches |
| Apex Workshop Shed | 70 inches |
| Pent Shed | Back wall: 70 inches |
| Pent Shed | Front wall: 70 inches + shed depth in feet |

**Current implementation:** `shedData.json` `wall_heights`: standard 66, workshop 70. Used for apex sheds. Pent roof uses `shedData.pent_roof_dims[width]` lookup (e.g. front 76–82, back 70 by width) instead of the formula above.

---

## Windows

| Window Type | Bramwood Rule (inches) |
|-------------|------------------------|
| Standard Window | 24 × 24 |
| Security Window | 24 × 12 |

**Current implementation:** `Window.jsx` and `Wall.jsx` use hardcoded `W = 22`, `WINDOW_HEIGHT = 36`. ConfiguratorContext stores `windowTypes` (STANDARD / SECURITY) but rendering does not yet apply different dimensions. Both types render at 22" × 36".

---

## Doors

| Door Type | Bramwood Rule |
|-----------|---------------|
| Single Door | 27 inch clear opening |
| Double Door | 60 inch opening |

Door height follows wall height.

**Current implementation:** `shedData.json` `door_widths` uses frame widths: single standard 31, single workshop 33.5; double standard 60, double workshop 62.5. These are full frame widths, not clear openings. Door is fixed to front wall center (no drag).

---

## Framing

| Rule | Bramwood | Current Implementation |
|------|----------|------------------------|
| Stud spacing | 24 inches | 24 inches (`generateWallFraming.js` `STUD_SPACING`, `buildGrid.js` `GRID.STUD_SPACING`, `shedData.framing.spacing_ft` 2 → 24") |
| Standard shed studs | 2×2 | 2×2 (`isWorkshop: false` → `studSize { w: 1.5, t: 1.5 }`) |
| Workshop shed studs | 3×2 | 3×2 (`isWorkshop: true` → `studSize { w: 2.5, t: 1.5 }`) |
| Noggins | ~36" vertical | 36" (`generateWallFraming.js` `NOGGIN_SPACING`) |

---

## Cladding

| Rule | Bramwood | Current Implementation |
|------|----------|------------------------|
| Orientation | Horizontal shiplap | Horizontal (`Shiplap.jsx`) |
| Board width | 5 inches | 5 inches (`Shiplap.jsx` `BOARD_WIDTH`) |
| Visible coverage | ~4 inches | 4 inches (`Shiplap.jsx` `VISIBLE_COVERAGE`) |

---

## Snapping

| Rule | Value | Current Implementation |
|------|-------|------------------------|
| Grid cell size | 6 inches | 6 inches (`buildGrid.js` `GRID.CELL_SIZE`, `Window.jsx` `SNAP`) |
| Stud spacing | 24 inches | 24 inches (`Window.jsx` `STUD_SNAP`, `buildGrid.js` `GRID.STUD_SPACING`) |
| Stud assist distance | — | 3 inches (snaps to stud if within 3" in `Window.jsx`) |
