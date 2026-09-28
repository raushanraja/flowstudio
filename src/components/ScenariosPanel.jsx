import { Plus, Copy, Trash2, Mic, X, Route, Download, Upload, AlertTriangle } from "lucide-react";

// Non-group nodes split into entry points (no incoming edge) and the rest,
// for the scenario start-node picker.
function startCandidates(nodes, edges) {
  const real = nodes.filter((n) => n.type !== "group");
  const ids = new Set(real.map((n) => n.id));
  const incoming = new Set(
    edges.filter((e) => ids.has(e.from) && ids.has(e.to)).map((e) => e.to),
  );
  const label = (n) => (n.text || "").split("\n")[0] || n.id;
  return {
    entries: real.filter((n) => !incoming.has(n.id)),
    others: real.filter((n) => incoming.has(n.id)),
    label,
  };
}

// Decision nodes: non-group nodes with more than one outgoing edge.
function decisionNodes(nodes, edges) {
  const ids = new Set(nodes.filter((n) => n.type !== "group").map((n) => n.id));
  const out = new Map();
  for (const e of edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) continue;
    if (!out.has(e.from)) out.set(e.from, []);
    out.get(e.from).push(e);
  }
  return [...out.entries()]
    .filter(([, es]) => es.length > 1)
    .map(([id, es]) => {
      const n = nodes.find((x) => x.id === id);
      return {
        id,
        text: (n?.text || id).split("\n")[0],
        edges: es.map((e) => ({
          id: e.id,
          label: e.label || `→ ${(nodes.find((x) => x.id === e.to)?.text || e.to).split("\n")[0]}`,
        })),
      };
    });
}

export default function ScenariosPanel({
  scenarios,
  activeScenarioId,
  nodes,
  edges,
  recording,
  loopDetected,
  loopExited,
  loopNodeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onDuplicate,
  onStart,
  onChoice,
  onLoopExit,
  onMaxLoopRetries,
  onRecording,
  onClose,
  onExport,
  onImport,
  simMode,
}) {
  const active = scenarios.find((s) => s.id === activeScenarioId) || null;
  const decisions = decisionNodes(nodes, edges);
  const starts = startCandidates(nodes, edges);

  return (
    <div
      className="fs-glass fs-scenarios"
      style={{
        position: "absolute",
        top: simMode ? 16 : 76,
        right: 16,
        zIndex: 31,
        width: 300,
        maxHeight: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        borderRadius: 14,
        overflow: "hidden",
        animation: "slideDown 0.15s ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Route size={14} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>
          Scenarios
        </span>
        <button
          className="fs-btn-ghost"
          title="Export scenarios"
          onClick={onExport}
        >
          <Download size={14} />
        </button>
        <button
          className="fs-btn-ghost"
          title="Import scenarios"
          onClick={onImport}
        >
          <Upload size={14} />
        </button>
        <button
          className="fs-btn-ghost"
          title="New scenario"
          onClick={onCreate}
        >
          <Plus size={15} />
        </button>
        <button className="fs-btn-ghost" title="Close" onClick={onClose}>
          <X size={15} />
        </button>
      </div>

      <div style={{ overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        {scenarios.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--muted)", padding: "6px 4px", lineHeight: 1.5 }}>
            No scenarios yet. Create one to pre-select the branch each
            decision node takes during playback.
          </div>
        )}
        {scenarios.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 8px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: s.id === activeScenarioId ? "var(--accent-light)" : "var(--panel-solid)",
              cursor: "pointer",
            }}
            onClick={() => onSelect(s.id)}
          >
            <input
              type="radio"
              checked={s.id === activeScenarioId}
              onChange={() => onSelect(s.id)}
              onClick={(e) => e.stopPropagation()}
              style={{ accentColor: "var(--accent)" }}
            />
            <input
              className="fs-inp"
              value={s.name}
              onChange={(e) => onRename(s.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{ flex: 1, padding: "2px 6px", fontSize: 12, minWidth: 0 }}
            />
            <button
              className="fs-btn-ghost"
              title="Duplicate"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(s.id);
              }}
            >
              <Copy size={13} />
            </button>
            <button
              className="fs-btn-ghost"
              title="Delete"
              style={{ color: "#ef4444" }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(s.id);
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {active && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "8px 12px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "var(--muted)",
            }}
          >
            <span style={{ flex: 1 }}>
              Branch choices for “{active.name}”
            </span>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                fontWeight: 600,
                color: recording ? "var(--accent)" : "inherit",
              }}
            >
              <input
                type="checkbox"
                checked={recording}
                onChange={(e) => onRecording(e.target.checked)}
              />
              <Mic size={12} />
              Record
            </label>
          </div>
          <label className="fs-lbl" style={{ fontSize: 11 }}>
            Start node
            <select
              className="fs-inp"
              value={active.startId || ""}
              onChange={(e) => onStart && onStart(active.id, e.target.value || null)}
            >
              <option value="">Auto (entry point / selection)</option>
              {starts.entries.length > 0 && (
                <optgroup label="Entry points">
                  {starts.entries.map((n) => (
                    <option key={n.id} value={n.id}>
                      {starts.label(n)}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="All nodes">
                {starts.others.map((n) => (
                  <option key={n.id} value={n.id}>
                    {starts.label(n)}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
              fontSize: 11,
              color: "var(--text)",
              background: "var(--panel-solid)",
              padding: "4px 8px",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <span>Max retries before exit:</span>
            <select
              className="fs-inp"
              value={active.maxLoopRetries ?? 1}
              onChange={(e) => onMaxLoopRetries(active.id, +e.target.value)}
              style={{ fontSize: 11, padding: "2px 6px" }}
              title="Number of loop passes (e.g. 1 retry = 1-2-1-2-3 sequence)"
            >
              <option value={1}>1 retry (1-2-1-2-3)</option>
              <option value={2}>2 retries</option>
              <option value={3}>3 retries</option>
              <option value={5}>5 retries</option>
            </select>
          </div>
          {loopExited && (
            <div
              style={{
                fontSize: 11,
                color: "var(--accent)",
                background: "var(--accent-light)",
                border: "1px solid var(--accent)",
                borderRadius: 8,
                padding: "8px 10px",
                lineHeight: 1.4,
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              <Route size={14} style={{ shrink: 0, marginTop: 1, color: "var(--accent)" }} />
              <div>
                <strong>Loop exited via nested step</strong>
                {loopNodeId && (
                  <> at node <em>"{(nodes.find((n) => n.id === loopNodeId)?.text || loopNodeId).split("\n")[0]}"</em></>
                )}
                . Simulation continued along alternate branch.
              </div>
            </div>
          )}
          {loopDetected && !loopExited && (
            <div
              style={{
                fontSize: 11,
                color: "#f59e0b",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: 8,
                padding: "8px 10px",
                lineHeight: 1.4,
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              <AlertTriangle size={14} style={{ shrink: 0, marginTop: 1, color: "#f59e0b" }} />
              <div>
                <strong>Loop detected</strong>
                {loopNodeId && (
                  <> at node <em>"{(nodes.find((n) => n.id === loopNodeId)?.text || loopNodeId).split("\n")[0]}"</em></>
                )}
                . Change a branch choice or set a loop exit step below to break the cycle.
              </div>
            </div>
          )}
          {decisions.length === 0 && (
            <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
              No decision nodes in this diagram.
            </div>
          )}
          {decisions.map((d) => {
            const chosen = active.choices[d.id] || "";
            const loopExitChosen = active.loopExits?.[d.id] || "";
            return (
              <div key={d.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label className="fs-lbl" style={{ fontSize: 11 }}>
                  {d.text}
                  <select
                    className="fs-inp"
                    value={chosen}
                    onChange={(e) => onChoice(active.id, d.id, e.target.value)}
                  >
                    <option value="">Default (first edge)</option>
                    {d.edges.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="fs-lbl" style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 6 }}>
                  ↳ If loop repeats (nested exit step):
                  <select
                    className="fs-inp"
                    value={loopExitChosen}
                    onChange={(e) => onLoopExit(active.id, d.id, e.target.value)}
                    style={{ fontSize: 11 }}
                  >
                    <option value="">Auto (alternate branch)</option>
                    {d.edges.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            );
          })}
          {recording && (
            <div style={{ fontSize: 11, color: "var(--accent)", lineHeight: 1.5 }}>
              Recording: click a branch badge during playback to capture it
              into this scenario.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
