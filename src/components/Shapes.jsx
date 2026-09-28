import { MONO } from "../lib/utils.js";
import { getEffectiveTextColor } from "../lib/theme.js";

export function NodeShape({ n, T }) {
  const base = {
    fill: n.fill,
    stroke: n.stroke,
    strokeWidth: n.strokeWidth,
    strokeDasharray: n.dashed ? "6 5" : undefined,
  };
  switch (n.type) {
    case "rect":
      return <rect x={n.x} y={n.y} width={n.w} height={n.h} {...base} />;
    case "rounded":
      return <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} {...base} />;
    case "pill":
      return (
        <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={n.h / 2} {...base} />
      );
    case "ellipse":
      return (
        <ellipse
          cx={n.x + n.w / 2}
          cy={n.y + n.h / 2}
          rx={n.w / 2}
          ry={n.h / 2}
          {...base}
        />
      );
    case "diamond":
      return (
        <polygon
          points={`${n.x + n.w / 2},${n.y} ${n.x + n.w},${n.y + n.h / 2} ${n.x + n.w / 2},${n.y + n.h} ${n.x},${n.y + n.h / 2}`}
          {...base}
        />
      );
    case "cylinder": {
      const ry = Math.min(14, n.h / 4);
      return (
        <g>
          <path
            d={`M ${n.x} ${n.y + ry} A ${n.w / 2} ${ry} 0 0 1 ${n.x + n.w} ${n.y + ry} L ${n.x + n.w} ${n.y + n.h - ry} A ${n.w / 2} ${ry} 0 0 1 ${n.x} ${n.y + n.h - ry} Z`}
            {...base}
          />
          <ellipse
            cx={n.x + n.w / 2}
            cy={n.y + ry}
            rx={n.w / 2}
            ry={ry}
            fill={n.fill}
            stroke={n.stroke}
            strokeWidth={n.strokeWidth}
            strokeDasharray={n.dashed ? "6 5" : undefined}
          />
        </g>
      );
    }
    case "group": {
      const textColor = getEffectiveTextColor(n, T);
      return (
        <g>
          <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={14} {...base} />
          <text
            x={n.x + 14}
            y={n.y + 24}
            fill={textColor}
            fontSize={n.fontSize}
            fontWeight={700}
            fontFamily={MONO}
            pointerEvents="none"
          >
            {n.text}
          </text>
        </g>
      );
    }
    case "text":
    default:
      return (
        <rect
          x={n.x}
          y={n.y}
          width={n.w}
          height={n.h}
          rx={6}
          {...base}
        />
      );
  }
}

export function NodeText({ n, T }) {
  const text = (n.text || "").trim();
  if (!text) return null;
  const lines = text.split("\n"),
    lh = n.fontSize * 1.25;
  const startY = n.y + n.h / 2 - ((lines.length - 1) * lh) / 2;
  const textColor = getEffectiveTextColor(n, T);
  return (
    <text
      textAnchor="middle"
      fill={textColor}
      fontSize={n.fontSize}
      fontFamily={MONO}
      pointerEvents="none"
    >
      {lines.map((l, i) => (
        <tspan
          key={i}
          x={n.x + n.w / 2}
          y={startY + i * lh}
          dominantBaseline="middle"
        >
          {l}
        </tspan>
      ))}
    </text>
  );
}

export function ShapeIcon({ type }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.5 };
  return (
    <svg width={30} height={20} viewBox="0 0 30 20">
      {type === "rect" && <rect x={3} y={3} width={24} height={14} {...s} />}
      {type === "rounded" && (
        <rect x={3} y={3} width={24} height={14} rx={4} {...s} />
      )}
      {type === "pill" && (
        <rect x={3} y={5} width={24} height={10} rx={5} {...s} />
      )}
      {type === "diamond" && <polygon points="15,2 27,10 15,18 3,10" {...s} />}
      {type === "ellipse" && <ellipse cx={15} cy={10} rx={12} ry={7} {...s} />}
      {type === "cylinder" && (
        <g {...s}>
          <path d="M3 5 v10 a12 3 0 0 0 24 0 v-10" />
          <ellipse cx={15} cy={5} rx={12} ry={3} />
        </g>
      )}
      {type === "text" && (
        <text
          x={15}
          y={14}
          textAnchor="middle"
          fontSize={12}
          fill="currentColor"
          stroke="none"
        >
          T
        </text>
      )}
      {type === "group" && (
        <g {...s} strokeDasharray="3 2">
          <rect x={3} y={2} width={24} height={16} rx={3} />
          <rect x={10} y={9} width={11} height={6} />
        </g>
      )}
    </svg>
  );
}
