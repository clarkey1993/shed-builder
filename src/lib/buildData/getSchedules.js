/**
 * Schedule-generation layer.
 * Turns the build model into builder-facing schedules for UI tables, exports, and PDF packs.
 * Pure helpers; derived only from build model; no mesh or scene dependency.
 */

/**
 * Module schedule: one row per module.
 * @param {Object} buildModel - From getBuildModel()
 * @returns {Array} Sorted by module order
 */
export function getModuleSchedule(buildModel) {
  const modules = buildModel?.modules ?? [];
  return modules.map((m) => ({
    moduleId: m.id,
    width: m.width ?? 0,
    depth: m.depth ?? 0,
    roofType: m.roof?.type ?? "apex",
    attachedTo: m.attachedTo ?? null,
    attachSide: m.attachSide ?? null,
    attachOffset: m.attachOffset ?? 0,
  }));
}

/**
 * Wall schedule: one row per wall.
 * @param {Object} buildModel - From getBuildModel()
 * @returns {Array} Sorted by module order, then side order (front, back, left, right)
 */
export function getWallSchedule(buildModel) {
  const walls = buildModel?.walls ?? [];
  return walls.map((w) => {
    const row = {
      moduleId: w.moduleId,
      wallId: w.wallId,
      side: w.side,
      length: w.length ?? 0,
      height: w.height ?? 0,
      included: w.included !== false,
      joinOverride: w.joinOverride ?? "auto",
      joined: w.joined === true,
    };
    if (w.cutSpan != null) {
      row.cutSpan = w.cutSpan;
    }
    return row;
  });
}

/**
 * Opening schedule: one row per window or door.
 * @param {Object} buildModel - From getBuildModel()
 * @returns {Array} Sorted by module, side, then kind (windows before door per wall)
 */
export function getOpeningSchedule(buildModel) {
  const openings = buildModel?.openings ?? [];
  return openings.map((o) => {
    const row = {
      openingId: o.openingId ?? `${o.wallId}_${o.kind}_${o.position}`,
      kind: o.kind ?? "window",
      type: o.type ?? "STANDARD",
      subtype: o.subtype ?? o.type,
      moduleId: o.moduleId,
      wallId: o.wallId,
      position: o.position ?? 0,
      width: o.width ?? 0,
      height: o.height ?? 0,
    };
    if (o.orientation != null) {
      row.orientation = o.orientation;
    }
    return row;
  });
}

/**
 * Roof schedule: one row per module with roof.
 * @param {Object} buildModel - From getBuildModel()
 * @returns {Array} Sorted by module order
 */
export function getRoofSchedule(buildModel) {
  const modules = buildModel?.modules ?? [];
  return modules.map((m) => {
    const roof = m.roof ?? {};
    const row = {
      moduleId: m.id,
      roofType: roof.type ?? "apex",
      visible: roof.visible ?? false,
    };
    if (roof.pentSlopeDirection != null) {
      row.pentSlopeDirection = roof.pentSlopeDirection;
    }
    return row;
  });
}

/**
 * Convenience: all schedules from a build model.
 * @param {Object} buildModel - From getBuildModel()
 * @returns {{ modules: Array, walls: Array, openings: Array, roofs: Array }}
 */
export function getBuildSchedules(buildModel) {
  return {
    modules: getModuleSchedule(buildModel),
    walls: getWallSchedule(buildModel),
    openings: getOpeningSchedule(buildModel),
    roofs: getRoofSchedule(buildModel),
  };
}
