import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  X,
  ListChecks,
  Presentation,
  AlertTriangle,
  Repeat,
} from "lucide-react";

export default function PlayBar({
  playing,
  done,
  steps,
  loopDetected,
  loopExited,
  speed,
  scenarioName,
  simMode,
  mode = "run",
  onMode,
  intervalMs = 3000,
  onInterval,
  laps = 0,
  awaiting,
  serviceCount = 0,
  onPlay,
  onPause,
  onStepFwd,
  onStepBack,
  onRestart,
  onSpeed,
  onClose,
  onToggleScenarios,
  onToggleSim,
  isRecording = false,
  recSeconds = 0,
  onToggleRecord,
}) {
  return (
    <div
      className="fs-glass fs-playbar"
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 31,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        borderRadius: 999,
        width: "max-content",
        maxWidth: "calc(100vw - 32px)",
        whiteSpace: "nowrap",
        flexWrap: "nowrap",
        overflowX: "auto",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
      }}
    >
      <button
        className="fs-btn"
        title={
          playing
            ? "Pause (Space)"
            : done
            ? "Replay Simulation (Space / R)"
            : "Play (Space)"
        }
        onClick={playing ? onPause : onPlay}
        style={{
          background: playing ? "var(--accent-light)" : "var(--accent)",
          borderColor: "var(--accent)",
          color: playing ? "var(--accent)" : "#ffffff",
          padding: "6px 12px",
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        {playing ? (
          <Pause size={14} />
        ) : done ? (
          <RotateCcw size={14} />
        ) : (
          <Play size={14} />
        )}
        <span style={{ fontSize: 12, fontWeight: 700 }}>
          {playing ? "Pause" : done ? "Replay" : "Play"}
        </span>
        <span className="fs-kbd" style={{ fontSize: 9, opacity: 0.85, padding: "1px 4px" }}>Space</span>
      </button>

      <span className="fs-sep" style={{ flexShrink: 0 }} />

      <button
        className="fs-btn-ghost"
        title="Step Back (B / ← / ,) — replays previous hop"
        onClick={onStepBack}
        disabled={steps === 0}
        style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", flexShrink: 0 }}
      >
        <SkipBack size={15} />
        <span className="fs-kbd" style={{ fontSize: 9 }}>B</span>
      </button>
      <button
        className="fs-btn-ghost"
        title="Step Forward (N / → / .) — advances one hop"
        onClick={onStepFwd}
        disabled={done}
        style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", flexShrink: 0 }}
      >
        <SkipForward size={15} />
        <span className="fs-kbd" style={{ fontSize: 9 }}>N</span>
      </button>
      <button
        className="fs-btn-ghost"
        title="Replay / Restart Simulation (R / Shift+F5)"
        onClick={onRestart}
        style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", flexShrink: 0 }}
      >
        <RotateCcw size={15} />
        <span className="fs-kbd" style={{ fontSize: 9 }}>R</span>
      </button>

      <span className="fs-sep" style={{ flexShrink: 0 }} />

      <div
        title="Run: interactive, pauses at undecided branches. Demo: timed hops, loops forever."
        style={{
          display: "flex",
          gap: 2,
          background: "var(--panel-solid)",
          border: "1px solid var(--border)",
          borderRadius: 999,
          padding: 2,
          flexShrink: 0,
        }}
      >
        {[
          ["run", "Run"],
          ["demo", "Demo"],
        ].map(([m, label]) => (
          <button
            key={m}
            className="fs-btn-ghost"
            onClick={() => onMode && onMode(m)}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 999,
              background: mode === m ? "var(--accent)" : "transparent",
              color: mode === m ? "#ffffff" : "var(--muted)",
              flexShrink: 0,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {serviceCount > 0 && (
        <span
          title={`${serviceCount} background service${serviceCount > 1 ? "s" : ""} running on their own interval`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            color: "#b45309",
            padding: "3px 8px",
            borderRadius: 999,
            background: "rgba(245, 158, 11, 0.14)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <Repeat size={11} />
          {serviceCount} bg
        </span>
      )}

      {mode === "demo" && (
        <select
          className="fs-inp"
          value={intervalMs}
          onChange={(e) => onInterval && onInterval(+e.target.value)}
          title="Time between hops (travel time default)"
          style={{
            fontSize: 11,
            padding: "4px 24px 4px 8px",
            width: "auto",
            minWidth: 70,
            cursor: "pointer",
            flexShrink: 0,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--panel-solid)",
            color: "var(--text)",
            pointerEvents: "auto",
          }}
        >
          {![200, 400, 600, 800, 1000, 1500, 2000, 3000, 5000].includes(intervalMs) && (
            <option value={intervalMs}>{(intervalMs / 1000).toFixed(1)}s</option>
          )}
          <option value={200}>0.2s</option>
          <option value={400}>0.4s</option>
          <option value={600}>0.6s</option>
          <option value={800}>0.8s</option>
          <option value={1000}>1.0s</option>
          <option value={1500}>1.5s</option>
          <option value={2000}>2.0s</option>
          <option value={3000}>3.0s</option>
          <option value={5000}>5.0s</option>
        </select>
      )}

      {scenarioName && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--accent)",
            padding: "3px 10px",
            borderRadius: 999,
            background: "var(--accent-light)",
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          title={`Scenario: ${scenarioName}`}
        >
          {scenarioName}
        </span>
      )}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: loopDetected
            ? "#f59e0b"
            : loopExited || awaiting
            ? "var(--accent)"
            : "var(--muted)",
          textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace",
          display: "inline-flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          flexShrink: 0,
          gap: 4,
          background: loopDetected
            ? "rgba(245, 158, 11, 0.12)"
            : loopExited
            ? "var(--accent-light)"
            : undefined,
          padding: loopDetected || loopExited ? "2px 8px" : undefined,
          borderRadius: loopDetected || loopExited ? 999 : undefined,
          border: loopDetected
            ? "1px solid rgba(245, 158, 11, 0.3)"
            : loopExited
            ? "1px solid var(--accent)"
            : undefined,
        }}
        title={
          loopDetected
            ? "Loop detected — simulation stopped to prevent infinite cycling"
            : loopExited
            ? "Loop detected — executed nested step via alternate branch to exit cycle"
            : awaiting
            ? "Awaiting a branch choice — pick one on the canvas"
            : mode === "demo"
            ? `Lap ${laps + 1} · ${steps} hop${steps === 1 ? "" : "s"} this lap`
            : undefined
        }
      >
        {loopDetected ? (
          <>
            <AlertTriangle size={12} style={{ color: "#f59e0b" }} />
            <span>Loop ({steps} hops)</span>
          </>
        ) : loopExited ? (
          <span>Exited loop ({steps} hops)</span>
        ) : done ? (
          "Done"
        ) : awaiting ? (
          "Choose…"
        ) : mode === "demo" ? (
          `Lap ${laps + 1} · ${steps} hops`
        ) : (
          `${steps} hop${steps === 1 ? "" : "s"}`
        )}
      </span>

      {mode === "run" && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.25}
            value={speed}
            onChange={(e) => onSpeed(+e.target.value)}
            title="Playback speed (+ / -)"
            style={{ width: 75, margin: "0 4px", flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--muted)",
              minWidth: 28,
              fontFamily: "'JetBrains Mono', monospace",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {speed}×
          </span>
        </div>
      )}

      <span className="fs-sep" style={{ flexShrink: 0 }} />

      {/* Simulation Video Recording (WebM) */}
      {onToggleRecord && (
        <button
          type="button"
          className={`fs-btn-ghost ${isRecording ? "on" : ""}`}
          title={
            isRecording
              ? "Stop & Download WebM Video Recording"
              : "Record Simulation Video (WebM)"
          }
          onClick={onToggleRecord}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 9px",
            background: isRecording ? "rgba(239, 68, 68, 0.16)" : undefined,
            borderColor: isRecording ? "#ef4444" : undefined,
            color: isRecording ? "#ef4444" : "var(--text)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ef4444",
              display: "inline-block",
              boxShadow: isRecording ? "0 0 8px #ef4444" : undefined,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: isRecording ? "'JetBrains Mono', monospace" : undefined,
              whiteSpace: "nowrap",
            }}
          >
            {isRecording
              ? `REC ${Math.floor(recSeconds / 60)}:${String(recSeconds % 60).padStart(2, "0")}`
              : "Rec"}
          </span>
        </button>
      )}

      <button
        className="fs-btn-ghost"
        title="Scenarios"
        onClick={onToggleScenarios}
        style={{ flexShrink: 0 }}
      >
        <ListChecks size={15} />
      </button>
      <button
        className={`fs-btn-ghost ${simMode ? "on" : ""}`}
        title={simMode ? "Exit simulation view (S / Esc)" : "Simulation view (S)"}
        onClick={onToggleSim}
        style={{ color: simMode ? "var(--accent)" : undefined, flexShrink: 0 }}
      >
        <Presentation size={15} />
      </button>
      <button className="fs-btn-ghost" title="Close playback (Esc)" onClick={onClose} style={{ flexShrink: 0 }}>
        <X size={15} />
      </button>
    </div>
  );
}
