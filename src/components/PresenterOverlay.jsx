import { MonitorPlay, StickyNote } from "lucide-react";

export default function PresenterOverlay({
  scenarioName,
  nodeLabel,
  note,
  steps = 0,
  done = false,
  playing = false,
}) {
  return (
    <div
      className="fs-presenter"
      style={{
        position: "absolute",
        top: 24,
        left: 24,
        zIndex: 30,
        width: "min(420px, calc(100vw - 48px))",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
        animation: "slideDown 0.2s ease-out",
      }}
    >
      <div
        className="fs-glass"
        style={{
          borderRadius: 16,
          padding: "12px 16px",
          boxShadow: "0 18px 44px rgba(0, 0, 0, 0.28)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <MonitorPlay size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Presenting
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: done ? "var(--accent)" : "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            {done
              ? "Complete"
              : playing
                ? `Step ${steps}`
                : `Paused · step ${steps}`}
          </span>
        </div>

        {scenarioName ? (
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 8 }}>
            {scenarioName}
          </div>
        ) : null}
        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginTop: scenarioName ? 2 : 8,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {nodeLabel ? nodeLabel.split("\n")[0] : "Waiting for playback…"}
        </div>
      </div>

      {note ? (
        <div
          className="fs-glass"
          style={{
            borderRadius: 16,
            padding: "14px 16px 16px",
            borderLeft: "3px solid var(--accent)",
            boxShadow: "0 18px 44px rgba(0, 0, 0, 0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 7,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}
          >
            <StickyNote size={12} />
            Step note
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
            {note}
          </div>
        </div>
      ) : null}

      <div
        style={{
          fontSize: 11,
          color: "var(--muted)",
          paddingLeft: 4,
          opacity: 0.85,
        }}
      >
        Esc exits presenter mode
      </div>
    </div>
  );
}
