
/**
 * Read-only SVG previews of front/back/left/right elevations (builder-style wall sheet).
 * Expects elevations from getElevations(buildModel). Coordinates in inches; Y up from baseline.
 */
function SingleElevation({ elevation }) {
  if (!elevation) return null;

  const { wall, roof, openings, label, dimensions, uprights, uprightSchedule } = elevation;
  const wallW = wall?.width ?? 0;
  const wallH = wall?.height ?? 70;
  const roofH = roof?.points?.reduce((max, [, y]) => Math.max(max, y), wallH) ?? wallH;
  const dimOff = 14;
  const leftPad = dimOff + 8;
  const rightPad = dimOff + 12;
  const leaderArea = (uprights ?? []).length > 0 ? 22 : 0;
  const bottomPad = dimOff + 6 + leaderArea;
  const topPad = 8;

  const totalH = roofH + topPad + bottomPad;
  const vbW = leftPad + wallW + rightPad;
  const vbH = totalH;
  const bodyLeft = leftPad;
  const baselineSvgY = vbH - bottomPad;

  const toSvgY = (dataY) => baselineSvgY - dataY;

  const roofPath =
    roof?.points?.length >= 2
      ? roof.points
          .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${bodyLeft + x} ${toSvgY(y)}`)
          .join(" ")
      : "";

  const strokeThin = Math.max(0.35, wallW / 280);
  const strokeMed = Math.max(0.5, wallW / 200);
  const fontSize = Math.max(5, Math.min(8, wallW / 18));

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-medium text-gray-600 truncate">{label}</span>
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-28 block rounded border border-gray-200 bg-white"
        preserveAspectRatio="xMidYMid meet"
        aria-label={`Elevation: ${label}`}
      >
        {/* Wall outline */}
        <rect
          x={bodyLeft}
          y={toSvgY(wallH)}
          width={wallW}
          height={wallH}
          fill="#f3f4f6"
          stroke="#9ca3af"
          strokeWidth={strokeMed}
        />
        {/* Roof silhouette */}
        {roofPath && (
          <path
            d={roofPath}
            fill="none"
            stroke="#374151"
            strokeWidth={Math.max(0.8, wallW / 120)}
            strokeLinejoin="round"
          />
        )}
        {/* Apex uprights at 2ft centres with leader-line callouts */}
        {(uprights ?? []).map((u, i) => {
          const s = uprightSchedule?.[i];
          const labelText = s?.displayLabel ?? `${u.heightInches}"`;
          const leaderDrop = 12;
          const labelY = -16;
          const topY = u.heightInches;
          return (
            <g key={`upright-${i}`}>
              <line
                x1={bodyLeft + u.x}
                y1={toSvgY(0)}
                x2={bodyLeft + u.x}
                y2={toSvgY(topY)}
                stroke="#6b7280"
                strokeWidth={strokeThin}
                opacity={0.85}
              />
              <line
                x1={bodyLeft + u.x}
                y1={toSvgY(topY)}
                x2={bodyLeft + u.x}
                y2={toSvgY(-leaderDrop)}
                stroke="#6b7280"
                strokeWidth={strokeThin * 0.9}
                opacity={0.75}
              />
              <text
                x={bodyLeft + u.x}
                y={toSvgY(labelY)}
                textAnchor="middle"
                dominantBaseline="hanging"
                fill="#374151"
                fontSize={fontSize - 1}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                {labelText}
              </text>
            </g>
          );
        })}
        {/* Openings */}
        {openings?.map((o) => (
          <rect
            key={o.openingId}
            x={bodyLeft + o.leftX}
            y={toSvgY(o.bottomY + o.height)}
            width={o.width}
            height={o.height}
            fill={o.kind === "door" ? "#fef3c7" : "#ccfbf1"}
            stroke={o.kind === "door" ? "#d97706" : "#0d9488"}
            strokeWidth={strokeThin}
          />
        ))}
        {/* Dimension lines */}
        {dimensions?.map((d, i) => {
          const k = `${d.type}-${d.openingId ?? i}`;
          const mx = (d.startX + d.endX) / 2;
          const my = (d.startY + d.endY) / 2;
          const isHorizontal = Math.abs(d.endY - d.startY) < 0.1;
          const labelX = bodyLeft + mx + (isHorizontal ? 0 : fontSize * 0.6);
          const labelY = toSvgY(my) + (isHorizontal ? fontSize * 0.8 : 0);

          return (
            <g key={k}>
              <line
                x1={bodyLeft + d.startX}
                y1={toSvgY(d.startY)}
                x2={bodyLeft + d.endX}
                y2={toSvgY(d.endY)}
                stroke="#4b5563"
                strokeWidth={strokeThin}
              />
              <line
                x1={bodyLeft + d.witness1X}
                y1={toSvgY(d.witness1Y)}
                x2={bodyLeft + d.startX}
                y2={toSvgY(d.startY)}
                stroke="#6b7280"
                strokeWidth={strokeThin * 0.8}
              />
              <line
                x1={bodyLeft + d.witness2X}
                y1={toSvgY(d.witness2Y)}
                x2={bodyLeft + d.endX}
                y2={toSvgY(d.endY)}
                stroke="#6b7280"
                strokeWidth={strokeThin * 0.8}
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor={isHorizontal ? "middle" : "start"}
                dominantBaseline="middle"
                fill="#374151"
                fontSize={fontSize}
                fontFamily="ui-monospace, monospace"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ElevationPreview({ elevations }) {
  const faces = ["front", "back", "left", "right"];
  const valid = faces.filter((f) => elevations?.[f]);

  if (valid.length === 0) {
    return <p className="text-[11px] text-gray-400 italic py-2">No elevations to draw.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {faces.map((face) => (
          <SingleElevation key={face} elevation={elevations?.[face]} />
        ))}
      </div>
      <p className="text-[10px] text-gray-500 border-t border-gray-100 pt-1">
        Debug elevation previews from build data. Amber = door, teal = window.
      </p>
    </div>
  );
}
