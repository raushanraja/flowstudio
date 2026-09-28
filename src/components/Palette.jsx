import { SHAPE_DEFS } from "../lib/theme.js";
import { ShapeIcon } from "./Shapes.jsx";

export default function Palette({ onAddNode }) {
  return (
    <div
      className="fs-glass"
      style={{
        position: "absolute",
        top: 76,
        left: 16,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "8px 6px",
        borderRadius: 18,
        alignItems: "center",
      }}
    >
      {SHAPE_DEFS.map((s) => (
        <button
          key={s.type}
          className="fs-palbtn"
          title={`${s.label} (${s.key})`}
          onClick={() => onAddNode(s.type)}
        >
          <ShapeIcon type={s.type} />
          <span className="fs-palbtn-key">({s.key})</span>
        </button>
      ))}
    </div>
  );
}
