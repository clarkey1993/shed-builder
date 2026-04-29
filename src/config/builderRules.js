// src/config/builderRules.js
//
// Bramwood builder/output rules.
// This file is for deterministic builder-sheet / export logic.
// It is NOT the same as live 3D configurator geometry.
//
// Use this file for:
// - floor/base sheet sizes
// - apex wall upright heights
// - pent side upright heights
// - roof cut tables
// - plain side sheet lengths
//
// Keep all values in inches internally.

export const BUILDER_RULES = {
  floor: {
    // Bramwood floor sheet:
    // A = 2x1 uprights (x2), always 2" under nominal width
    // B = 2x2s as required, always 4" under nominal width
    //
    // Reference drawing:
    // 4ft -> A 46", 5ft -> 58", 6ft -> 70", 7ft -> 82", 8ft -> 94", etc.
    // 5ft -> B 56", 6ft -> 68", 7ft -> 80", 8ft -> 92", etc.
    //
    // Floor depth follows the A rule too (always 2" under nominal depth),
    // unless a separate Bramwood lookup is later added.
    groupAByNominalFeet: {
      4: 46,
      5: 58,
      6: 70,
      7: 82,
      8: 94,
      9: 106,
      10: 118,
      11: 130,
      12: 142,
      13: 154,
      14: 166,
      15: 178,
      16: 190,
    },

    groupBByNominalFeet: {
      5: 56,
      6: 68,
      7: 80,
      8: 92,
      9: 104,
      10: 116,
      11: 128,
      12: 140,
      13: 152,
      14: 164,
      15: 176,
      16: 188,
    },

    groupA: {
      spec: "2x1",
      description: "upright",
      count: 2,
      markEveryFeet: 1,
      nominalOffsetInches: 2,
    },

    groupB: {
      spec: "2x2",
      description: "as required",
      nominalOffsetInches: 4,
    },
  },

  splitFloor: {
    // From Bramwood split floor sheet.
    // A is same as normal floor A table.
    // B is different and listed here.
    groupBByNominalFeet: {
      11: 63,
      12: 69,
      13: 75,
      14: 81,
      15: 87,
      16: 93,
      17: 99,
      18: 105,
      19: 111,
      20: 117,
      21: 123,
      22: 129,
      23: 135,
      24: 141,
      25: 147,
    },
  },

  apex: {
    // Apex side sheets.
    // Values are the main upright heights shown on the drawing.
    // Ignore the small left "add" notes for now.
    //
    // Heights are listed left-to-right across the wall.
    sideUprightHeightsByNominalFeet: {
      4: [66.75, 73.5, 66.75],
      5: [66.75, 75.5, 66.75],
      6: [66.75, 72, 77.5, 72, 66.75],
      7: [66.75, 73, 79.5, 73, 66.75],
      8: [66.75, 73.75, 81.5, 73.75, 66.75],
      9: [66.75, 74.75, 83.5, 74.75, 66.75],
      10: [66.75, 75.5, 85, 75.5, 66.75],
      11: [66.75, 73, 80.5, 87, 80.5, 73, 66.75],
      12: [66.75, 73.75, 81.5, 89, 81.5, 73.75, 66.75],
    },

    // Apex side sheets also show the sloping roof member length at top right.
    roofSlopeLengthByNominalFeet: {
      4: 28,
      5: 36,
      6: 42,
      7: 47,
      8: 52,
      9: 58,
      10: 63,
      11: 70,
      12: 76,
    },

    // Overall actual width of the apex side wall.
    actualWidthByNominalFeet: {
      4: 46,
      5: 58,
      6: 70,
      7: 82,
      8: 94,
      9: 106,
      10: 118,
      11: 130,
      12: 142,
    },

    standardWallHeight: 66,
    workshopWallHeight: 70,
    endUprightDisplayHeight: 66.75,
  },

  pent: {
    // Pent side sheets. Heights listed left-to-right.
    sideUprightHeightsByNominalFeet: {
      4: [70, 73, 76],
      5: [70, 73, 76],
      6: [70, 72, 74, 76],
      7: [70, 72, 74, 76, 77],
      8: [70, 72, 74, 76, 78],
      10: [70, 72, 74, 76, 78, 80],
      12: [70, 72, 74, 76, 78, 80, 82],
    },

    actualWidthByNominalFeet: {
      4: 46,
      5: 58,
      6: 70,
      7: 82,
      8: 94,
      10: 118,
      12: 142,
    },

    roofTopLengthByNominalFeet: {
      4: 47,
      5: 59,
      6: 71,
      7: 83,
      8: 95,
      10: 119,
      12: 144,
    },

    backWallHeight: 70,
  },

  apexRoof: {
    // Apex roof sheet.
    //
    // A = 2x1 upright (x6), mark every 2ft and 4" in from ends
    // B = cut (x8) 2x1s, 4 on flat / 4 on edge
    //     2x2 as required through centre (3x2 if workshop)
    groupAByNominalFeet: {
      6: 76.5,
      7: 88.5,
      8: 100.5,
      9: 112.5,
      10: 124.5,
      11: 136.5,
      12: 148.5,
      13: 160.5,
      14: 172.5,
      15: 184.5,
      16: 196.5,
    },

    groupBByNominalFeet: {
      4: 27,
      5: 33.5,
      6: 39.75,
      7: 45.5,
      8: 52,
      9: 58.5,
      10: 64.75,
      11: 71,
      12: 79,
      13: 85,
      14: 91,
      15: 97,
      16: 103,
    },

    groupA: {
      spec: "2x1",
      description: "upright",
      count: 6,
      markEveryFeet: 2,
      insetFromEndsInches: 4,
    },

    groupB: {
      spec: "2x1 / 2x2",
      description: "cut members and centre support",
      cutCount: 8,
    },
  },

  pentRoof: {
    // Pent roof sheet.
    //
    // A = 2x1s (x4), mark every 2ft and 3" in from ends
    // B = ends 2x1 upright, middles are 2x2s (3x2 if workshop)
    groupAByNominalFeet: {
      6: 75.5,
      7: 87.5,
      8: 99.5,
      9: 111.5,
      10: 123.5,
      11: 135.5,
      12: 147.5,
      13: 159.5,
      14: 171.5,
      15: 183.5,
      16: 195.5,
    },

    groupBByNominalFeet: {
      4: 50.5,
      5: 62.5,
      6: 74.5,
      7: 86.5,
      8: 98.5,
      9: 110.5,
      10: 122.5,
      11: 134.5,
      12: 146.5,
      13: 158.5,
      14: 170.5,
    },

    groupA: {
      spec: "2x1",
      description: "roof rails",
      count: 4,
      markEveryFeet: 2,
      insetFromEndsInches: 3,
    },

    groupB: {
      spec: "2x1 / 2x2",
      description: "ends upright, middles structural",
    },
  },

  plainSide: {
    // Plain side sheet.
    groupAByNominalFeet: {
      4: 44.5,
      5: 56.5,
      6: 68.5,
      7: 80.5,
      8: 92.5,
      9: 104.5,
      10: 116.5,
      11: 128.5,
      12: 140.5,
      13: 152.5,
      14: 164.5,
      15: 176.5,
      16: 188.5,
    },

    groupA: {
      spec: "2x1",
      description: "upright",
      count: 4,
      markEveryFeet: 2,
      markMiddleForWindow: true,
    },

    groupB: {
      endSpec: "2x1",
      middleSpecStandard: "2x2",
      middleSpecWorkshop: "3x2",
      standardHeight: 66,
      workshopHeight: 70,
    },
  },

  doors: {
    // Door in apex / summer house front drawings.
    clearOpenings: {
      single: 27,
      double: 60,
    },

    frameWidths: {
      singleStandard: 31,
      singleWorkshop: 33.75,
      doubleStandard: 60,
      doubleWorkshop: 62.75,
      doubleWithWindowsStandard: 61,
      doubleWithWindowsWorkshop: 62.75,
      stableDoor: 31,
      stableDoorWorkshop: 32.75,
    },

    apexTopCutByNominalFeet: {
      4: 5.5,
      5: 7.5,
      6: 9.5,
      7: 11.5,
      8: 13.5,
      9: 15.5,
      10: 17,
      11: 19,
      12: 21,
    },

    summerHouseMiddleCutByNominalFeet: {
      4: 5.5,
      5: 7.5,
      6: 9.5,
      7: 11.5,
      8: 13.5,
      9: 15.5,
      10: 17,
      11: 19,
      12: 21,
      13: 23,
      14: 25,
      15: 27,
      16: 29,
      17: 31,
    },
  },
};

// -----------------------------
// Helpers
// -----------------------------

export function nominalFeetToInches(feet) {
  return Number(feet) * 12;
}

export function getNominalFeet(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function getFloorActualWidth(nominalWidthFeet) {
  const key = getNominalFeet(nominalWidthFeet);
  return BUILDER_RULES.floor.groupAByNominalFeet[key] ?? nominalFeetToInches(key) - 2;
}

export function getFloorActualDepth(nominalDepthFeet) {
  const key = getNominalFeet(nominalDepthFeet);
  return BUILDER_RULES.floor.groupAByNominalFeet[key] ?? nominalFeetToInches(key) - 2;
}

export function getFloorGroupALength(nominalFeet) {
  const key = getNominalFeet(nominalFeet);
  return BUILDER_RULES.floor.groupAByNominalFeet[key] ?? nominalFeetToInches(key) - 2;
}

export function getFloorGroupBLength(nominalFeet) {
  const key = getNominalFeet(nominalFeet);
  return BUILDER_RULES.floor.groupBByNominalFeet[key] ?? nominalFeetToInches(key) - 4;
}

export function getApexActualWidth(nominalWidthFeet) {
  const key = getNominalFeet(nominalWidthFeet);
  return BUILDER_RULES.apex.actualWidthByNominalFeet[key] ?? nominalFeetToInches(key) - 2;
}

export function getPentActualWidth(nominalWidthFeet) {
  const key = getNominalFeet(nominalWidthFeet);
  return BUILDER_RULES.pent.actualWidthByNominalFeet[key] ?? nominalFeetToInches(key) - 2;
}

export function getApexSideUprightHeights(nominalWidthFeet) {
  const key = getNominalFeet(nominalWidthFeet);
  return BUILDER_RULES.apex.sideUprightHeightsByNominalFeet[key] ?? null;
}

export function getPentSideUprightHeights(nominalWidthFeet) {
  const key = getNominalFeet(nominalWidthFeet);
  return BUILDER_RULES.pent.sideUprightHeightsByNominalFeet[key] ?? null;
}

export function getApexRoofGroupALength(nominalFeet) {
  const key = getNominalFeet(nominalFeet);
  return BUILDER_RULES.apexRoof.groupAByNominalFeet[key] ?? null;
}

export function getApexRoofGroupBLength(nominalFeet) {
  const key = getNominalFeet(nominalFeet);
  return BUILDER_RULES.apexRoof.groupBByNominalFeet[key] ?? null;
}

export function getPentRoofGroupALength(nominalFeet) {
  const key = getNominalFeet(nominalFeet);
  return BUILDER_RULES.pentRoof.groupAByNominalFeet[key] ?? null;
}

export function getPentRoofGroupBLength(nominalFeet) {
  const key = getNominalFeet(nominalFeet);
  return BUILDER_RULES.pentRoof.groupBByNominalFeet[key] ?? null;
}

export function getPlainSideGroupALength(nominalFeet) {
  const key = getNominalFeet(nominalFeet);
  return BUILDER_RULES.plainSide.groupAByNominalFeet[key] ?? null;
}

// 2ft centres across actual wall width, including ends.
// This is useful for drawing helper lines, schedules, etc.
export function getCentresAcrossWidth(actualWidthInches, spacingInches = 24) {
  const width = Number(actualWidthInches);
  if (!Number.isFinite(width) || width <= 0) return [];

  const positions = [0];
  let x = spacingInches;

  while (x < width) {
    positions.push(x);
    x += spacingInches;
  }

  if (positions[positions.length - 1] !== width) {
    positions.push(width);
  }

  return positions;
}

export default BUILDER_RULES;