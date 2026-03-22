/**
 * Read-only SVG preview of floor/base plan.
 * Bramwood floor sheet style: diagram at top, A/B labels, member schedule below.
 * Expects floor from getFloorPlan(buildModel).
 */
import { formatFeet } from "../../lib/buildData/formatUnits";

export default function FloorPlanPreview({ floorPlan }) {
  const modules = floorPlan?.modules ?? [];
  const dimensions = floorPlan?.dimensions ?? [];

  if (modules.length === 0) {
    return <p className="text-[11px] text-gray-400 italic py-2">No floor data.</p>;
  }

  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const m of modules) {
    const o = m.outline ?? {};
    minX = Math.min(minX, o.x ?? 0);
    minZ = Math.min(minZ, o.z ?? 0);
    maxX = Math.max(maxX, (o.x ?? 0) + (o.width ?? 0));
    maxZ = Math.max(maxZ, (o.z ?? 0) + (o.depth ?? 0));
    const la = m.labelA ?? {};
    const lb = m.labelB ?? {};
    if (la.x != null) minX = Math.min(minX, la.x - 8);
    if (lb.z != null) maxZ = Math.max(maxZ, lb.z + 8);
  }
  for (const d of dimensions) {
    minX = Math.min(minX, d.startX, d.endX, d.witness1X, d.witness2X);
    minZ = Math.min(minZ, d.startZ, d.endZ, d.witness1Z, d.witness2Z);
    maxX = Math.max(maxX, d.startX, d.endX, d.witness1X, d.witness2X);
    maxZ = Math.max(maxZ, d.startZ, d.endZ, d.witness1Z, d.witness2Z);
  }

  const span = Math.max(maxX - minX, maxZ - minZ, 1);
  const pad = Math.max(24, span * 0.08);
  const vbX = minX - pad;
  const vbZ = minZ - pad;
  const vbW = maxX - minX + 2 * pad;
  const vbH = maxZ - minZ + 2 * pad;

  const strokeThin = Math.max(0.35, span / 200);
  const baseFont = Math.max(6, Math.min(9, span / 18));

  return (
    <div className="w-full">
      {/* 1. Floor diagram (Bramwood sheet style) */}
      <div className="rounded border border-gray-200 bg-[#fafafa] overflow-hidden">
        <svg
          viewBox={`${vbX} ${vbZ} ${vbW} ${vbH}`}
          className="w-full h-40 block"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Floor plan"
        >
          {modules.map((m) => {
            const o = m.outline ?? {};
            const cx = (o.x ?? 0) + (o.width ?? 0) / 2;
            const cz = (o.z ?? 0) + (o.depth ?? 0) / 2;
            const nominalStr = `${formatFeet(m.nominalWidthFeet ?? 0)} × ${formatFeet(m.nominalDepthFeet ?? 0)}`;

            return (
              <g key={m.moduleId}>
                {/* Floor outline */}
                <rect
                  x={o.x}
                  y={o.z}
                  width={o.width}
                  height={o.depth}
                  fill="#f3f4f6"
                  stroke="#9ca3af"
                  strokeWidth={strokeThin}
                />
                {/* Internal members (B) - joists */}
                {(m.internalMembers ?? []).map((line, i) => (
                  <line
                    key={`internal-${i}`}
                    x1={line.x1}
                    y1={line.z1}
                    x2={line.x2}
                    y2={line.z2}
                    stroke="#9ca3af"
                    strokeWidth={strokeThin * 0.8}
                    opacity={0.9}
                  />
                ))}
                {/* Label A (side) */}
                {(m.labelA ?? {}).x != null && (
                  <text
                    x={m.labelA.x}
                    y={m.labelA.z}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill="#374151"
                    fontSize={baseFont}
                    fontWeight="600"
                    fontFamily="ui-sans-serif, sans-serif"
                  >
                    A
                  </text>
                )}
                {/* Label B (bottom) */}
                {(m.labelB ?? {}).x != null && (
                  <text
                    x={m.labelB.x}
                    y={m.labelB.z}
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    fill="#374151"
                    fontSize={baseFont}
                    fontWeight="600"
                    fontFamily="ui-sans-serif, sans-serif"
                  >
                    B
                  </text>
                )}
                {/* Center: nominal size */}
                <text
                  x={cx}
                  y={cz}
                  dy={-baseFont * 0.4}
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
                  y={cz}
                  dy={baseFont * 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#6b7280"
                  fontSize={baseFont - 1}
                  fontFamily="ui-monospace, monospace"
                >
                  {nominalStr}
                </text>
              </g>
            );
          })}

          {/* Dimension lines */}
          {dimensions.map((d, i) => {
            const mx = (d.startX + d.endX) / 2;
            const mz = (d.startZ + d.endZ) / 2;
            const isHorizontal = Math.abs(d.endZ - d.startZ) < 0.1;
            const labelX = mx + (isHorizontal ? 0 : baseFont * 0.5);
            const labelY = mz + (isHorizontal ? baseFont * 0.8 : 0);

            return (
              <g key={`dim-${d.type}-${d.moduleId}-${i}`}>
                <line
                  x1={d.startX}
                  y1={d.startZ}
                  x2={d.endX}
                  y2={d.endZ}
                  stroke="#4b5563"
                  strokeWidth={strokeThin}
                />
                <line
                  x1={d.witness1X}
                  y1={d.witness1Z}
                  x2={d.startX}
                  y2={d.startZ}
                  stroke="#6b7280"
                  strokeWidth={strokeThin * 0.8}
                />
                <line
                  x1={d.witness2X}
                  y1={d.witness2Z}
                  x2={d.endX}
                  y2={d.endZ}
                  stroke="#6b7280"
                  strokeWidth={strokeThin * 0.8}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={isHorizontal ? "middle" : "start"}
                  dominantBaseline="middle"
                  fill="#374151"
                  fontSize={baseFont - 1}
                  fontFamily="ui-monospace, monospace"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 2. Floor member schedule (main output) */}
      {modules.some((m) => m.memberSchedule) && (
        <div className="mt-3 border border-gray-200 rounded bg-white">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
              Floor members
            </span>
          </div>
          <div className="px-3 py-3 space-y-4">
            {modules.map((m) => {
              const schedule = m.memberSchedule;
              if (!schedule) return null;
              return (
                <div key={m.moduleId} className={modules.length > 1 ? "border-b border-gray-100 last:border-0 pb-4 last:pb-0" : ""}>
                  {modules.length > 1 && (
                    <div className="text-[10px] font-medium text-gray-500 mb-2">{m.moduleId}</div>
                  )}
                  {/* A */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-800">{schedule.groupA.label}</span>
                      <span className="text-xs text-gray-600">
                        {schedule.groupA.spec} {schedule.groupA.description}
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-mono text-gray-700">
                      {schedule.groupA.summary}
                    </div>
                  </div>
                  {/* B */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-800">{schedule.groupB.label}</span>
                      <span className="text-xs text-gray-600">
                        {schedule.groupB.spec} {schedule.groupB.description}
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-mono text-gray-700">
                      {schedule.groupB.summary}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
