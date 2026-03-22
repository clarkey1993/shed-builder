/**
 * Wall build-up depth constants — align cladding, framing, and openings.
 * Must match Shiplap.jsx (BOARD_THICKNESS, CLADDING_OFFSET) and framing stud size.
 */
export const BOARD_THICKNESS = 0.9;
export const CLADDING_OFFSET = 0.2;
export const STUD_DEPTH = 1.5; // studSize.w from generateWallFraming

/** Z of cladding center (exterior side). */
export const claddingZ = (exteriorZSign) =>
  exteriorZSign * (BOARD_THICKNESS / 2 + CLADDING_OFFSET);

/** Z of cladding interior face (back of boards, where framing meets). */
export const claddingBackZ = (exteriorZSign) =>
  exteriorZSign * CLADDING_OFFSET;

/** Z offset for framing group so stud front touches cladding back. */
export const framingZOffset = (exteriorZSign) =>
  claddingBackZ(exteriorZSign) - exteriorZSign * (STUD_DEPTH / 2);

/** Z offset for window structural framing (header/sill/jambs) relative to Window group. Window is at 0.5*exteriorZSign. */
export const windowStructuralFramingZOffset = (exteriorZSign) =>
  framingZOffset(exteriorZSign) - 0.5 * exteriorZSign;
