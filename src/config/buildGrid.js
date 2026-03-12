/**
 * Build grid constants for placement and snapping.
 * Used by wall grid overlay. Values from snapRules.
 */
import { GRID_SNAP, STUD_SNAP } from "../systems/snapping/snapRules";

export const GRID = {
  CELL_SIZE: GRID_SNAP,
  STUD_SPACING: STUD_SNAP,
};
