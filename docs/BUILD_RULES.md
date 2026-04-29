# BUILD_RULES.md

> **IMPORTANT FOR AI AGENTS**  
> Always read this document before modifying code in this project.  
> This document defines the intended architecture and construction rules of the shed configurator.

---

## Bramwood Rules (Reference)

These are the target Bramwood construction rules. Where the current implementation differs, it is noted under "Current implementation."

Reference files:

- `src/config/shedRules.js`
- `src/config/builderRules.js`

---

## Critical System Separation

This project has **two related but separate rule systems**.

### 1. Configurator System (interactive / 3D)

This system exists to support:

- nominal shed size selection
- roof selection
- openings
- partitions
- framing visualization
- live 3D rendering
- dragging / snapping / interaction

Typical sources:

- `ConfiguratorContext.jsx`
- `shedData.json`
- live render geometry
- wall / roof components

This system is allowed to be approximate where needed for stable interaction and rendering.

---

### 2. Builder Output System (deterministic / drawing / export)

This system exists to support:

- floor / base sheets
- wall sheets
- elevation sheets
- roof sheets
- schedules
- later cut lists / materials data
- printable builder packs

Typical sources:

- `src/config/builderRules.js`
- `src/lib/buildData/...`
- explicit Bramwood tables from reference drawings

This system must prefer **explicit Bramwood rules and lookup tables** over geometry inference.

---

## Critical Builder Rule

Builder outputs must **not** be derived directly from rendered geometry when Bramwood drawings define explicit sizes.

If there is a mismatch between:

- live 3D geometry
- inferred visual dimensions
- Bramwood construction tables / builder rules

then:

- `builderRules.js` is the source of truth for builder sheets
- the builder-output system is correct
- the visual system is secondary unless explicitly being corrected

---

## Dimension Types

Always distinguish between these three things:

### Nominal Size

The marketed shed size the user selects, for example:

- 8ft × 6ft
- 10ft × 8ft

This is used in the configurator UI and product selection.

---

### Actual Built Size

The real constructed size used by Bramwood sheets, for example:

- 8ft floor width → 94"
- 6ft floor depth → 70"

This is used in floor, wall, roof, and builder sheet logic.

---

### Drawing / Export Dimensions

The exact dimensions shown on builder pages:

- floor A lengths
- floor B lengths
- apex upright heights
- pent side heights
- roof member lengths

These must come from builder rules, not from guessed 3D geometry.

---

## Bramwood Rules (Core)

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

**Current implementation:** `Window.jsx` and `Wall.jsx` use `getWindowDimensions()` from `src/systems/openings/getOpeningDimensions.js`. ConfiguratorContext stores `windowTypes` (STANDARD / SECURITY). STANDARD renders at 24" × 24", SECURITY at 24" × 12".

---

## Doors

| Door Type | Bramwood Rule |
|-----------|---------------|
| Single Door | 27 inch clear opening |
| Double Door | 60 inch opening |

Door height follows wall height.

**Current implementation:** `getDoorDimensions()` reads frame widths from `shedData.json` `door_widths`: single 31 / 33.75 (standard/workshop), stable 39.75, double 60 / 62.75, double_with_windows 61. These are full frame widths, not clear openings. Door is fixed to front wall center (no drag). Internal partition doors also use `getDoorDimensions()`.

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

---

## Builder Output Rules

The following builder outputs must use `src/config/builderRules.js` as the primary rule source:

- floor / base drawings
- split floor drawings
- apex side sheets
- pent side sheets
- plain side sheets
- roof sheets
- builder schedules
- builder pack pages

Do not derive these from mesh dimensions or rendered wall outlines if Bramwood rules already define them.

---

## Floor Rules

Floor builder output follows Bramwood floor-sheet rules.

### Group A

- 2x1 uprights
- quantity: 2
- mark every 1ft
- always 2" under nominal size

Examples:

- 4ft → 46"
- 5ft → 58"
- 6ft → 70"
- 7ft → 82"
- 8ft → 94"
- 9ft → 106"
- 10ft → 118"
- 11ft → 130"
- 12ft → 142"

### Group B

- 2x2s as required
- always 4" under nominal size

Examples:

- 5ft → 56"
- 6ft → 68"
- 7ft → 80"
- 8ft → 92"
- 9ft → 104"
- 10ft → 116"
- 11ft → 128"
- 12ft → 140"

### Important

A floor/base drawing is **not** the same as a wall-footprint plan.  
Do not generate floor drawings from wall sides or generic footprint reuse.

---

## Split Floor Rules

Split floor uses the normal A logic, but B uses the split-floor Bramwood table.

Examples for split-floor B:

- 11ft → 63"
- 12ft → 69"
- 13ft → 75"
- 14ft → 81"
- 15ft → 87"
- 16ft → 93"

---

## Apex Side Rules

Apex side builder output must use explicit upright-height tables from `builderRules.js`.

Use the **main upright heights** shown on the Bramwood drawing.  
Ignore the small left-side “add” numbers unless the task specifically asks for them.

Examples:

### 8ft apex side

- 66¾"
- 73¾"
- 81½"
- 73¾"
- 66¾"

### 9ft apex side

- 66¾"
- 74¾"
- 83½"
- 74¾"
- 66¾"

Do not derive these from generic slope math if the lookup table exists.

---

## Pent Side Rules

Pent side builder output must use explicit per-size upright-height tables from `builderRules.js`.

Examples:

### 8ft pent side

- 70"
- 72"
- 74"
- 76"
- 78"

Do not replace this with a generic visual slope approximation if the explicit table exists.

---

## Plain Side Rules

Plain side builder output must use the Bramwood plain-side table for group A lengths.

Examples:

- 4ft → 44½"
- 5ft → 56½"
- 6ft → 68½"
- 7ft → 80½"
- 8ft → 92½"

---

## Roof Rules

Roof builder output must use explicit Bramwood roof-sheet tables from `builderRules.js`.

This includes:

- apex roof group A
- apex roof group B
- pent roof group A
- pent roof group B

Do not infer these lengths from the rendered roof mesh if the Bramwood table exists.

---

## Door Builder Rules

Door builder sheets may use different values than simple configurator openings.

Keep these concepts separate:

- clear opening
- frame width
- builder cut/member values

Use the explicit builder-rule values where the Bramwood drawings define them.

---

## File Ownership

Use these files for these responsibilities:

### `shedData.json`

Use for:

- configurator presets
- live 3D dimension lookups already used by rendering
- general size / roof / framing values used by the interactive system

### `src/config/builderRules.js`

Use for:

- explicit builder-sheet lookup rules
- floor A/B lengths
- split floor lengths
- apex side upright heights
- pent side upright heights
- plain side lengths
- roof sheet lengths
- builder-only construction values

### `src/lib/buildData/...`

Use for:

- deriving clean builder-output data from configurator state and builder rules
- schedules
- plan/elevation/roof/floor page data
- builder pack composition

### `src/components/ui/...`

Use for:

- rendering builder previews
- builder sheet pages
- readable presentation only

Do not hardcode Bramwood construction tables inside UI components unless explicitly requested for a very small temporary pass.

---

## Change Strategy

When working on builder sheets or export logic:

1. Confirm whether the value belongs to the configurator system or builder-output system
2. If it is builder-output logic, check `builderRules.js` first
3. Fix the rule source before patching labels
4. Do not “make it look right” by faking displayed numbers in the preview layer
5. Prefer shared rule helpers over component-local calculations

---

## Documentation Rule

When changing:

- builder construction sizes
- floor member tables
- wall stud/upright tables
- roof member tables
- builder-output ownership

update this file and keep it aligned with:

- `src/config/builderRules.js`
- `.cursorrules`