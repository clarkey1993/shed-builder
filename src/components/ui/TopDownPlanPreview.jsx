import { formatInchesToFeetInches, formatFeet } from "../../lib/buildData/formatUnits";

/**
 * Read-only SVG preview of top-down plan (debug/builder style).
 * Expects plan from getTopDownPlan(buildModel); coordinates in inches (XZ).
 * @param {Object} props
 * @param {Object} props.plan - Plan data from getTopDownPlan
 * @param {boolean} [props.compact] - If true, base-only mode: module outlines + size, no wall/opening dimensions
 */
export default function TopDownPlanPreview({ plan, compact = false }) {
  const modules = plan?.modules ?? [];
  const wallEdges = plan?.wallEdges ?? [];
  const openingMarkers = plan?.openingMarkers ?? [];
  const dimensionLines = plan?.dimensionLines ?? [];
  const openingChains = plan?.openingChains ?? [];

  if (modules.length === 0) {
    return <p className="text-[11px] text-gray-400 italic py-2">No modules to draw.</p>;
  }

  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const m of modules) {
    minX = Math.min(minX, m.x);
    minZ = Math.min(minZ, m.z);
    maxX = Math.max(maxX, m.x + m.width);
    maxZ = Math.max(maxZ, m.z + m.depth);
  }
  if (!compact) {
    for (const d of dimensionLines) {
      minX = Math.min(minX, d.startX, d.endX, d.witness1X, d.witness2X);
      minZ = Math.min(minZ, d.startZ, d.endZ, d.witness1Z, d.witness2Z);
      maxX = Math.max(maxX, d.startX, d.endX, d.witness1X, d.witness2X);
      maxZ = Math.max(maxZ, d.startZ, d.endZ, d.witness1Z, d.witness2Z);
    }
    for (const chain of openingChains) {
      for (const s of chain.segments) {
        minX = Math.min(minX, s.startX, s.endX, s.witness1X, s.witness2X);
        minZ = Math.min(minZ, s.startZ, s.endZ, s.witness1Z, s.witness2Z);
        maxX = Math.max(maxX, s.startX, s.endX, s.witness1X, s.witness2X);
        maxZ = Math.max(maxZ, s.startZ, s.endZ, s.witness1Z, s.witness2Z);
      }
    }
  }
  const span = Math.max(maxX - minX, maxZ - minZ, 1);
  const dimOff = 14;
  const pad = compact ? Math.max(dimOff + 10, span * 0.08) : Math.max(42, span * 0.12);
  const labelOffset = Math.max(6, span / 40);
  const dimLabelOffset = Math.max(10, span / 25);
  const chainLabelOffset = Math.max(8, span / 30);
  const baseFont = Math.max(7, Math.min(11, span / 18));
  const vbX = minX - pad;
  const vbZ = minZ - pad;
  const vbW = maxX - minX + 2 * pad;
  const vbH = maxZ - minZ + 2 * pad;

  const visibleWalls = wallEdges.filter((e) => e.included);

  return (
    <div className="w-full rounded border border-gray-200 bg-[#fafafa] overflow-hidden">
      <svg
        viewBox={`${vbX} ${vbZ} ${vbW} ${vbH}`}
        className="w-full h-40 block"
        preserveAspectRatio="xMidYMid meet"
        aria-label={compact ? "Base plan preview" : "Top-down plan preview"}
      >
        {/* Module footprints (fill + light outline) */}
        {modules.map((m) => {
          const nw = m.nominalWidthFeet ?? Math.round(m.width / 12);
          const nd = m.nominalDepthFeet ?? Math.round(m.depth / 12);
          const sizeStr = `${formatFeet(nw)} × ${formatFeet(nd)}`;
          const cx = m.x + m.width / 2;
          const cy = m.z + m.depth / 2;
          const smallFont = Math.max(5, baseFont - 2);
          return (
            <g key={m.moduleId}>
              <rect
                x={m.x}
                y={m.z}
                width={m.width}
                height={m.depth}
                fill="#f3f4f6"
                stroke="#e5e7eb"
                strokeWidth={Math.max(0.5, span / 400)}
              />
              {compact ? (
                <>
                  <text
                    x={cx}
                    y={cy}
                    dy={-smallFont * 0.4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#374151"
                    fontSize={baseFont}
                    fontFamily="ui-monospace, monospace"
                  >
                    {m.moduleId}
                  </text>
                  <text
                    x={cx}
                    y={cy}
                    dy={smallFont * 0.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#6b7280"
                    fontSize={smallFont}
                    fontFamily="ui-monospace, monospace"
                  >
                    {sizeStr}
                  </text>
                </>
              ) : (
                <>
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#374151"
                    fontSize={baseFont}
                    fontFamily="ui-monospace, monospace"
                  >
                    {m.moduleId}: Nominal {sizeStr}
                  </text>
                  {m.width !== nw * 12 || m.depth !== nd * 12 ? (
                    <text
                      x={cx}
                      y={cy}
                      dy={baseFont * 0.5}
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      fill="#6b7280"
                      fontSize={smallFont}
                      fontFamily="ui-monospace, monospace"
                    >
                      Actual {formatInchesToFeetInches(m.width)} × {formatInchesToFeetInches(m.depth)}
                    </text>
                  ) : null}
                </>
              )}
            </g>
          );
        })}

        {/* Compact mode: outside actual dimensions (elevation-style) */}
        {compact && modules.map((m) => {
          const strokeThin = Math.max(0.35, Math.min(m.width, m.depth) / 200);
          const dimFont = Math.max(5, Math.min(7, Math.min(m.width, m.depth) / 16));
          const off = dimOff;
          return (
            <g key={`compact-dim-${m.moduleId}`}>
              {/* Width: horizontal line above module */}
              <line
                x1={m.x}
                y1={m.z - off}
                x2={m.x + m.width}
                y2={m.z - off}
                stroke="#4b5563"
                strokeWidth={strokeThin}
              />
              <line
                x1={m.x}
                y1={m.z}
                x2={m.x}
                y2={m.z - off}
                stroke="#6b7280"
                strokeWidth={strokeThin * 0.8}
              />
              <line
                x1={m.x + m.width}
                y1={m.z}
                x2={m.x + m.width}
                y2={m.z - off}
                stroke="#6b7280"
                strokeWidth={strokeThin * 0.8}
              />
              <text
                x={m.x + m.width / 2}
                y={m.z - off - dimFont * 0.5}
                textAnchor="middle"
                dominantBaseline="auto"
                fill="#374151"
                fontSize={dimFont}
                fontFamily="ui-monospace, monospace"
              >
                {formatInchesToFeetInches(m.width)}
              </text>
              {/* Depth: vertical line left of module */}
              <line
                x1={m.x - off}
                y1={m.z}
                x2={m.x - off}
                y2={m.z + m.depth}
                stroke="#4b5563"
                strokeWidth={strokeThin}
              />
              <line
                x1={m.x}
                y1={m.z}
                x2={m.x - off}
                y2={m.z}
                stroke="#6b7280"
                strokeWidth={strokeThin * 0.8}
              />
              <line
                x1={m.x}
                y1={m.z + m.depth}
                x2={m.x - off}
                y2={m.z + m.depth}
                stroke="#6b7280"
                strokeWidth={strokeThin * 0.8}
              />
              <text
                x={m.x - off - dimFont * 0.4}
                y={m.z + m.depth / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#374151"
                fontSize={dimFont}
                fontFamily="ui-monospace, monospace"
              >
                {formatInchesToFeetInches(m.depth)}
              </text>
            </g>
          );
        })}

        {/* Dimension lines - omitted in compact mode */}
        {!compact && dimensionLines.map((d, i) => {
          const cx = (d.startX + d.endX) / 2;
          const cy = (d.startZ + d.endZ) / 2;
          const isHorizontal = Math.abs(d.endZ - d.startZ) < 0.1;
          const planCenterX = (minX + maxX) / 2;
          const tx = isHorizontal ? cx : (cx < planCenterX ? cx - dimLabelOffset : cx + dimLabelOffset);
          const ty = isHorizontal ? cy - dimLabelOffset : cy;
          return (
            <g key={`dim-${d.type}-${d.moduleId ?? d.wallId ?? d.openingId ?? i}`}>
              <line
                x1={d.startX}
                y1={d.startZ}
                x2={d.endX}
                y2={d.endZ}
                stroke="#6b7280"
                strokeWidth={Math.max(0.4, span / 500)}
                strokeDasharray="none"
              />
              <line
                x1={d.witness1X}
                y1={d.witness1Z}
                x2={d.startX}
                y2={d.startZ}
                stroke="#6b7280"
                strokeWidth={Math.max(0.3, span / 600)}
              />
              <line
                x1={d.witness2X}
                y1={d.witness2Z}
                x2={d.endX}
                y2={d.endZ}
                stroke="#6b7280"
                strokeWidth={Math.max(0.3, span / 600)}
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#4b5563"
                fontSize={Math.max(5, baseFont - 2)}
                fontFamily="ui-monospace, monospace"
              >
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Opening dimension chains - omitted in compact mode */}
        {!compact && span >= 40 ? openingChains.map((chain) => (
          <g key={`chain-${chain.wallId}`}>
            {chain.segments.map((s, j) => {
              const cx = (s.startX + s.endX) / 2;
              const cy = (s.startZ + s.endZ) / 2;
              const isHorizontal = Math.abs(s.endZ - s.startZ) < 0.1;
              const planCenterX = (minX + maxX) / 2;
              const tx = isHorizontal ? cx : (cx < planCenterX ? cx - chainLabelOffset : cx + chainLabelOffset);
              const ty = isHorizontal ? cy - chainLabelOffset : cy;
              return (
                <g key={`${chain.wallId}-seg-${j}`}>
                  <line
                    x1={s.startX}
                    y1={s.startZ}
                    x2={s.endX}
                    y2={s.endZ}
                    stroke="#7d8a96"
                    strokeWidth={Math.max(0.35, span / 550)}
                  />
                  <line
                    x1={s.witness1X}
                    y1={s.witness1Z}
                    x2={s.startX}
                    y2={s.startZ}
                    stroke="#7d8a96"
                    strokeWidth={Math.max(0.25, span / 700)}
                  />
                  <line
                    x1={s.witness2X}
                    y1={s.witness2Z}
                    x2={s.endX}
                    y2={s.endZ}
                    stroke="#7d8a96"
                    strokeWidth={Math.max(0.25, span / 700)}
                  />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#6b7280"
                    fontSize={Math.max(5, baseFont - 2)}
                    fontFamily="ui-monospace, monospace"
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}
          </g>
        )) : null}

        {/* Wall edges: included only; dashed when joined (shared edge); no length labels in compact */}
        {visibleWalls.map((e) => {
          const mx = e.midX ?? (e.x1 + e.x2) / 2;
          const mz = e.midZ ?? (e.z1 + e.z2) / 2;
          const isHoriz = Math.abs(e.z2 - e.z1) < 0.1;
          const off = labelOffset * 0.6;
          const lx = isHoriz ? mx : (e.side === "left" ? mx + off : mx - off);
          const lz = isHoriz ? (e.side === "front" ? mz + off : mz - off) : mz;
          return (
            <g key={e.wallId}>
              <line
                x1={e.x1}
                y1={e.z1}
                x2={e.x2}
                y2={e.z2}
                stroke={e.joined ? "#2563eb" : "#111827"}
                strokeWidth={Math.max(1.5, span / 160)}
                strokeDasharray={e.joined ? "6 4" : undefined}
                opacity={e.joined ? 0.85 : 1}
              />
              {!compact && e.length > 0 && span > 40 && (
                <text
                  x={lx}
                  y={lz}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#4b5563"
                  fontSize={Math.max(6, baseFont - 1)}
                  fontFamily="ui-monospace, monospace"
                >
                  {formatInchesToFeetInches(e.length)}
                </text>
              )}
            </g>
          );
        })}

        {/* Opening markers along wall edges - compact: subtle tick only, no label */}
        {openingMarkers.map((o) => {
          const side = o.side ?? "front";
          let lx = o.centerX;
          let lz = o.centerZ;
          const markerOff = labelOffset * 0.5;
          if (side === "front") lz += markerOff;
          else if (side === "back") lz -= markerOff;
          else if (side === "left") lx += markerOff;
          else if (side === "right") lx -= markerOff;

          const sizeStr = `${formatInchesToFeetInches(o.width)} × ${formatInchesToFeetInches(o.height)}`;
          const titleStr = `${o.displayLabel} ${sizeStr}${o.orientation === "vertical" ? " V" : ""}${o.offsetFromStart != null ? ` @${formatInchesToFeetInches(o.offsetFromStart)} from start` : ""}`;

          return (
            <g key={o.openingId}>
              <line
                x1={o.x1}
                y1={o.z1}
                x2={o.x2}
                y2={o.z2}
                stroke={o.kind === "door" ? "#b45309" : "#2A7F7F"}
                strokeWidth={compact ? Math.max(1.5, span / 180) : Math.max(3, span / 100)}
                strokeLinecap="round"
                opacity={compact ? 0.6 : 1}
              />
              {!compact && (
                <text
                  x={lx}
                  y={lz}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={o.kind === "door" ? "#92400e" : "#0f766e"}
                  fontSize={Math.max(4, baseFont - 4)}
                  fontFamily="ui-monospace, monospace"
                  title={titleStr}
                >
                  {o.displayLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {!compact && (
        <p className="text-[10px] text-gray-500 px-2 py-1 border-t border-gray-100">
          Nominal sizes shown at center. Wall lengths are actual constructed sizes. Teal = window, amber = door. Blue dashed = joined wall.
        </p>
      )}
    </div>
  );
}
