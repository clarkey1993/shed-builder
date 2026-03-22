/**
 * Read-only SVG previews of roof plan drawings (apex and pent).
 * Expects drawings from getRoofDrawings(buildModel).
 */
function SingleRoofDrawing({ drawing }) {
  if (!drawing) return null;

  const { roofType, footprint, ridgeLine, slopeArrow, slopeLabel, label, dimensions } = drawing;
  const { width, depth } = footprint;

  const dimOff = 12;
  const leftPad = dimOff + 8;
  const rightPad = dimOff + 12;
  const topPad = dimOff + 6;
  const bottomPad = dimOff + 8;

  const vbW = leftPad + width + rightPad;
  const vbH = topPad + depth + bottomPad;
  const bodyX = leftPad;
  const bodyY = topPad;

  const strokeW = Math.max(0.4, Math.min(width, depth) / 100);
  const fontSize = Math.max(5, Math.min(8, Math.min(width, depth) / 14));

  const toSvg = (dx, dz) => [bodyX + dx, bodyY + dz];

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-medium text-gray-600 truncate">{label}</span>
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-24 block rounded border border-gray-200 bg-white"
        preserveAspectRatio="xMidYMid meet"
        aria-label={`Roof: ${label}${slopeLabel ? `, ${slopeLabel}` : ""}`}
      >
        {/* Roof outline (footprint) */}
        <rect
          x={bodyX}
          y={bodyY}
          width={width}
          height={depth}
          fill="#f3f4f6"
          stroke="#6b7280"
          strokeWidth={strokeW}
        />

        {roofType === "apex" && ridgeLine && (
          <>
            <line
              x1={toSvg(ridgeLine.x1, ridgeLine.z1)[0]}
              y1={toSvg(ridgeLine.x1, ridgeLine.z1)[1]}
              x2={toSvg(ridgeLine.x2, ridgeLine.z2)[0]}
              y2={toSvg(ridgeLine.x2, ridgeLine.z2)[1]}
              stroke="#1f2937"
              strokeWidth={strokeW * 1.5}
              strokeLinecap="round"
            />
            <text
              x={bodyX + width / 2}
              y={bodyY + depth / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#374151"
              fontSize={fontSize - 1}
              fontFamily="ui-monospace, monospace"
            >
              ridge
            </text>
          </>
        )}

        {roofType === "pent" && slopeArrow && (
          <>
            <defs>
              <marker
                id={`arrow-${drawing.moduleId}`}
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L8,3 L0,6 Z" fill="#1f2937" />
              </marker>
            </defs>
            <line
              x1={toSvg(slopeArrow.x1, slopeArrow.z1)[0]}
              y1={toSvg(slopeArrow.x1, slopeArrow.z1)[1]}
              x2={toSvg(slopeArrow.x2, slopeArrow.z2)[0]}
              y2={toSvg(slopeArrow.x2, slopeArrow.z2)[1]}
              stroke="#1f2937"
              strokeWidth={strokeW * 1.2}
              strokeLinecap="round"
              markerEnd={`url(#arrow-${drawing.moduleId})`}
            />
            <text
              x={bodyX + (slopeArrow.x1 + slopeArrow.x2) / 2}
              y={bodyY + (slopeArrow.z1 + slopeArrow.z2) / 2 - fontSize * 0.5}
              textAnchor="middle"
              dominantBaseline="auto"
              fill="#4b5563"
              fontSize={fontSize - 1}
              fontFamily="ui-monospace, monospace"
            >
              high→low
            </text>
          </>
        )}

        {/* Dimension lines */}
        {dimensions?.map((d, i) => {
          const k = `${d.type}-${i}`;
          const [sx, sy] = toSvg(d.startX, d.startZ);
          const [ex, ey] = toSvg(d.endX, d.endZ);
          const [w1x, w1y] = toSvg(d.witness1X, d.witness1Z);
          const [w2x, w2y] = toSvg(d.witness2X, d.witness2Z);
          const mx = (sx + ex) / 2;
          const my = (sy + ey) / 2;
          const isHorizontal = Math.abs(ey - sy) < 0.1;
          const labelX = mx + (isHorizontal ? 0 : fontSize * 0.6);
          const labelY = my + (isHorizontal ? fontSize * 0.8 : 0);

          return (
            <g key={k}>
              <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#4b5563" strokeWidth={strokeW} />
              <line x1={w1x} y1={w1y} x2={sx} y2={sy} stroke="#6b7280" strokeWidth={strokeW * 0.8} />
              <line x1={w2x} y1={w2y} x2={ex} y2={ey} stroke="#6b7280" strokeWidth={strokeW * 0.8} />
              <text
                x={labelX}
                y={labelY}
                textAnchor={isHorizontal ? "middle" : "start"}
                dominantBaseline="middle"
                fill="#374151"
                fontSize={fontSize - 1}
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

export default function RoofDrawingPreview({ drawings }) {
  if (!drawings?.length) {
    return <p className="text-[11px] text-gray-400 italic py-2">No roof drawings.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {drawings.map((d) => (
          <SingleRoofDrawing key={d.moduleId} drawing={d} />
        ))}
      </div>
      <p className="text-[10px] text-gray-500 border-t border-gray-100 pt-1">
        Roof plan view. Apex: ridge line. Pent: slope direction (high → low).
      </p>
    </div>
  );
}
