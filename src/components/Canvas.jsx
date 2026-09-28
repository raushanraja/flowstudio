import { edgeGeom, normRect, portPos } from "../lib/geometry.js";
import { NodeShape, NodeText } from "./Shapes.jsx";
import PlaybackOverlay from "./PlaybackOverlay.jsx";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  CopyPlus,
  Trash2,
  Unlink,
  Group,
  BoxSelect,
  Layers,
  Square,
  Workflow,
  Repeat,
} from "lucide-react";

export default function Canvas({
  wrapRef,
  svgRef,
  T,
  z,
  cam,
  snap,
  showGrid,
  tool,
  ordered,
  edges,
  byId,
  sel,
  hover,
  marquee,
  tempEdge,
  dropTarget,
  editing,
  onCanvasMouseDown,
  onCanvasDoubleClick,
  onNodeMouseDown,
  onNodeDoubleClick,
  onNodeHover,
  onNodeLeave,
  onPortMouseDown,
  onResizeMouseDown,
  onEdgeMouseDown,
  onLabelMouseDown,
  onMidpointMouseDown,
  onWaypointMouseDown,
  onWaypointDoubleClick,
  onEditChange,
  onEditCommit,
  onEditCancel,
  onZoomIn,
  onZoomOut,
  onFit,
  onToggleSnap,
  onToggleGrid,
  onDuplicate,
  onDeleteSelection,
  onDeleteConnections,
  onGroup,
  onUngroup,
  onSelectOnlyNodes,
  onSelectOnlyEdges,
  onSelectAll,
  playback,
  playFrame,
  playing,
  onPlaybackChoose,
  simMode,
  playMode,
}) {
  const editingNode = editing && byId[editing.id];
  const hasSelection = sel.nodes.length > 0 || sel.edges.length > 0;
  const nonGroupNodesCount = ordered.filter((n) => n.type !== "group").length;

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", flex: 1, overflow: "hidden", height: "100%", width: "100%" }}
    >
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: tool === "pan" ? "grab" : "default",
        }}
        onMouseDown={onCanvasMouseDown}
        onDoubleClick={simMode ? undefined : onCanvasDoubleClick}
      >
        <defs>
          <pattern
            id="grid"
            width={24}
            height={24}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${cam.x} ${cam.y}) scale(${z})`}
          >
            <circle cx={12} cy={12} r={1.2} fill={T.gridDot} />
          </pattern>

          {/* Selection Halo Glow Filter */}
          <filter id="haloGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComponentTransfer in="blur" result="glow">
              <feFuncA type="linear" slope="0.6" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect data-fullscreen width="100%" height="100%" fill={T.bg} />
        {showGrid && (
          <rect data-fullscreen width="100%" height="100%" fill="url(#grid)" />
        )}
        <g transform={`translate(${cam.x},${cam.y}) scale(${z})`}>
          {edges.map((e) => {
            const g = edgeGeom(e, byId);
            if (!g) return null;
            const seld = sel.edges.includes(e.id);
            return (
              <g key={e.id}>
                {seld && !simMode && (
                  <path
                    data-overlay
                    d={g.d}
                    fill="none"
                    stroke={T.accent}
                    strokeWidth={e.strokeWidth + 5}
                    opacity={0.35}
                    filter="url(#haloGlow)"
                  />
                )}
                <path
                  d={g.d}
                  fill="none"
                  stroke={e.stroke}
                  strokeWidth={e.strokeWidth}
                  strokeDasharray={e.dashed ? "7 6" : undefined}
                  data-edge-path={e.id}
                  data-base-stroke={e.stroke}
                />
                {e.arrow !== false && <polygon points={g.arrow} fill={e.stroke} />}
                {e.arrowStart && <polygon points={g.arrowStart} fill={e.stroke} />}
                {e.label && (
                  <g
                    style={{ cursor: seld ? "grab" : "pointer" }}
                    onMouseDown={(ev) => {
                      if (seld && onLabelMouseDown) {
                        onLabelMouseDown(ev, e);
                      } else {
                        onEdgeMouseDown(ev, e);
                      }
                    }}
                  >
                    {e.labelBg !== "transparent" && (
                      <rect
                        x={g.mid.x - (e.label.length * ((e.fontSize || 11) * 0.32) + 8)}
                        y={g.mid.y - (e.fontSize || 11) - 6}
                        width={e.label.length * ((e.fontSize || 11) * 0.65) + 16}
                        height={(e.fontSize || 11) + 10}
                        rx={6}
                        fill={e.labelBg || T.panelSolid}
                        stroke={seld ? T.accent : T.border}
                        strokeWidth={seld ? 1.5 : 1}
                        strokeDasharray={seld ? "3 3" : undefined}
                        opacity={0.95}
                      />
                    )}
                    <text
                      x={g.mid.x}
                      y={g.mid.y - 1}
                      textAnchor="middle"
                      fontSize={e.fontSize || 11}
                      fontWeight={600}
                      fontFamily="'JetBrains Mono', monospace"
                      fill={e.textColor || e.stroke}
                    >
                      {e.label}
                    </text>
                    {seld && !simMode && (
                      <circle
                        data-overlay
                        cx={g.mid.x + (e.label.length * ((e.fontSize || 11) * 0.32) + 12)}
                        cy={g.mid.y - (e.fontSize || 11) / 2}
                        r={4 / z}
                        fill={T.handle}
                        stroke={T.accent}
                        strokeWidth={1.5 / z}
                        title="Drag to reposition label"
                      />
                    )}
                  </g>
                )}
                <path
                  data-overlay
                  d={g.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14 / z}
                  style={{ cursor: "pointer" }}
                  onMouseDown={(ev) => onEdgeMouseDown(ev, e)}
                />
                {seld && !simMode && e.waypoints?.length > 0 &&
                  (() => {
                    const wps = e.waypoints;
                    const stride = Math.max(1, Math.ceil(wps.length / 40));
                    return wps
                      .filter((_, i) => i % stride === 0)
                      .map((wp, i) => (
                        <rect
                          key={i}
                          data-overlay
                          x={wp.x - 5 / z}
                          y={wp.y - 5 / z}
                          width={10 / z}
                          height={10 / z}
                          fill={T.handle}
                          stroke={T.accent}
                          strokeWidth={1.4 / z}
                          style={{ cursor: "move" }}
                          onMouseDown={(ev) => onWaypointMouseDown(ev, e, i * stride)}
                          onDoubleClick={(ev) => onWaypointDoubleClick(ev, e, i * stride)}
                        />
                      ));
                  })()}
                {seld && !simMode && !e.waypoints?.length && (
                  <circle
                    data-overlay
                    cx={g.mid.x}
                    cy={g.mid.y}
                    r={6 / z}
                    fill={T.handle}
                    stroke={T.accent}
                    strokeWidth={1.6 / z}
                    title="Drag to bend"
                    style={{ cursor: "move" }}
                    onMouseDown={(ev) => onMidpointMouseDown(ev, e)}
                  />
                )}
              </g>
            );
          })}

          {tempEdge &&
            (() => {
              const g = edgeGeom(tempEdge, byId, tempEdge);
              const valid = !!dropTarget;
              const color = valid ? T.accent : "#ef4444";
              return (
                <g data-overlay>
                  <path
                    d={g.d}
                    fill="none"
                    stroke={color}
                    strokeWidth={valid ? 3 : 2}
                    strokeDasharray="6 5"
                  />
                  <polygon points={g.arrow} fill={color} />
                </g>
              );
            })()}

          {ordered.map((n) => {
            const isSel = sel.nodes.includes(n.id);
            const isHovered = hover === n.id;
            const isDrop = dropTarget === n.id;

            return (
              <g
                key={n.id}
                onMouseDown={(e) => onNodeMouseDown(e, n)}
                onDoubleClick={simMode ? undefined : (e) => onNodeDoubleClick(e, n)}
                onMouseEnter={() => onNodeHover(n.id)}
                onMouseLeave={() => onNodeLeave(n.id)}
                style={{ cursor: isDrop ? "pointer" : "move" }}
              >
                {/* Drop Target Highlight */}
                {isDrop && (
                  <rect
                    data-overlay
                    x={n.x - 10 / z}
                    y={n.y - 10 / z}
                    width={n.w + 20 / z}
                    height={n.h + 20 / z}
                    fill={T.accent}
                    opacity={0.14}
                    stroke={T.accent}
                    strokeWidth={2.5 / z}
                    rx={n.type === "pill" ? (n.h + 20 / z) / 2 : 10}
                    pointerEvents="none"
                  />
                )}

                {/* Node Shape */}
                <NodeShape n={n} />
                {n.type !== "group" && <NodeText n={n} />}

                {/* Badge Circle */}
                {n.badge && (
                  <g pointerEvents="none">
                    <circle
                      cx={n.x + 2}
                      cy={n.y}
                      r={11}
                      fill={T.bg}
                      stroke={n.stroke}
                      strokeWidth={2}
                    />
                    <text
                      x={n.x + 2}
                      y={n.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={11}
                      fontFamily="'JetBrains Mono', monospace"
                      fill={n.stroke}
                    >
                      {n.badge}
                    </text>
                  </g>
                )}

                {/* Background service indicator */}
                {n.isService && (
                  <g pointerEvents="none" transform={`translate(${n.x + n.w - 2} ${n.y + 2})`}>
                    <circle r={9} fill={T.bg} stroke="#f59e0b" strokeWidth={2} />
                    <Repeat
                      x={-6}
                      y={-6}
                      size={12}
                      color="#f59e0b"
                      strokeWidth={2.2}
                    />
                  </g>
                )}

                {/* Connection Ports */}
                {(isSel || isHovered) && !simMode &&
                  ["top", "right", "bottom", "left"].map((side) => {
                    const p = portPos(n, side);
                    return (
                      <circle
                        key={side}
                        data-overlay
                        cx={p.x}
                        cy={p.y}
                        r={5 / z}
                        fill={T.handle}
                        stroke={n.stroke}
                        strokeWidth={1.5 / z}
                        style={{ cursor: "crosshair" }}
                        onMouseDown={(e) => onPortMouseDown(e, n, side)}
                      />
                    );
                  })}

                {/* Selection Box & Halo Glow */}
                {isSel && !simMode && (
                  <rect
                    data-overlay
                    x={n.x - 5 / z}
                    y={n.y - 5 / z}
                    width={n.w + 10 / z}
                    height={n.h + 10 / z}
                    fill="none"
                    stroke={T.accent}
                    strokeWidth={1.5 / z}
                    strokeDasharray={`${4 / z} ${3 / z}`}
                    pointerEvents="none"
                    filter="url(#haloGlow)"
                  />
                )}

                {/* Corner Resize Handles */}
                {isSel &&
                  !simMode &&
                  sel.nodes.length === 1 &&
                  [
                    ["nw", n.x, n.y],
                    ["ne", n.x + n.w, n.y],
                    ["sw", n.x, n.y + n.h],
                    ["se", n.x + n.w, n.y + n.h],
                  ].map(([h, hx, hy]) => (
                    <rect
                      key={h}
                      data-overlay
                      x={hx - 5 / z}
                      y={hy - 5 / z}
                      width={10 / z}
                      height={10 / z}
                      fill={T.handle}
                      stroke={T.accent}
                      strokeWidth={1.4 / z}
                      style={{ cursor: h + "-resize" }}
                      onMouseDown={(e) => onResizeMouseDown(e, n, h)}
                    />
                  ))}
              </g>
            );
          })}

          {/* Playback Simulation Overlay */}
          {playback && (
            <PlaybackOverlay
              playback={playback}
              frame={playFrame}
              playing={playing}
              edges={edges}
              byId={byId}
              svgRef={svgRef}
              T={T}
              onChoose={onPlaybackChoose}
              mode={playMode}
            />
          )}

          {/* Marquee Box Selection */}
          {!simMode && marquee &&
            (() => {
              const r = normRect(
                { x: marquee.x0, y: marquee.y0 },
                { x: marquee.x1, y: marquee.y1 },
              );
              return (
                <rect
                  data-overlay
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  fill={T.accent}
                  opacity={0.12}
                  stroke={T.accent}
                  strokeWidth={1 / z}
                  strokeDasharray={`${4 / z} ${3 / z}`}
                />
              );
            })()}
        </g>
      </svg>

      {/* Editing Textarea */}
      {editingNode && (
        <textarea
          autoFocus
          className="fs-edit"
          value={editing.value}
          style={{
            left: cam.x + editingNode.x * z,
            top: cam.y + editingNode.y * z,
            width: editingNode.w * z,
            height: editingNode.h * z,
            fontSize: editingNode.fontSize * z,
          }}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onEditCommit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onEditCancel();
            }
          }}
        />
      )}

      {/* Floating Selection Quick Toolbar with Node / Link Filter Toggle */}
      {hasSelection && !simMode && (
        <div
          className="fs-glass"
          style={{
            position: "absolute",
            top: 76,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 25,
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: 999,
            animation: "fadeIn 0.15s ease",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", padding: "0 4px" }}>
            {sel.nodes.length > 0 && sel.edges.length > 0
              ? `${sel.nodes.length + sel.edges.length} selected`
              : sel.nodes.length > 0
              ? `${sel.nodes.length} node${sel.nodes.length > 1 ? "s" : ""}`
              : `${sel.edges.length} link${sel.edges.length > 1 ? "s" : ""}`}
          </span>

          <span className="fs-sep" />

          {/* Toggle Segment between Nodes, Links, and Both */}
          <div
            style={{
              display: "flex",
              background: "rgba(148, 163, 184, 0.12)",
              padding: 2,
              borderRadius: 999,
              gap: 2,
            }}
          >
            <button
              className={`fs-btn-ghost ${sel.nodes.length > 0 && sel.edges.length === 0 ? "on" : ""}`}
              title="Select Only Nodes"
              onClick={onSelectOnlyNodes}
              style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11 }}
            >
              <Square size={12} />
              Nodes
            </button>
            <button
              className={`fs-btn-ghost ${sel.edges.length > 0 && sel.nodes.length === 0 ? "on" : ""}`}
              title="Select Only Links / Connectors"
              onClick={onSelectOnlyEdges}
              style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11 }}
            >
              <Workflow size={12} />
              Links
            </button>
            <button
              className={`fs-btn-ghost ${sel.nodes.length > 0 && sel.edges.length > 0 ? "on" : ""}`}
              title="Select Both Nodes & Links"
              onClick={onSelectAll}
              style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11 }}
            >
              <Layers size={12} />
              Both
            </button>
          </div>

          <span className="fs-sep" />

          {sel.nodes.length > 0 && (
            <>
              <button className="fs-btn-ghost" title="Duplicate (Ctrl+D)" onClick={onDuplicate}>
                <CopyPlus size={14} />
              </button>
              {sel.nodes.length >= 2 && (
                <button className="fs-btn-ghost" title="Group (Ctrl+G)" onClick={onGroup}>
                  <Group size={14} />
                </button>
              )}
              {sel.nodes.some((id) => byId[id]?.type === "group") && (
                <button className="fs-btn-ghost" title="Ungroup (Ctrl+Shift+G)" onClick={onUngroup}>
                  <BoxSelect size={14} />
                </button>
              )}
              <span className="fs-sep" />
            </>
          )}

          <button
            className="fs-btn-ghost"
            title="Delete connections only (Shift+Del)"
            onClick={onDeleteConnections}
          >
            <Unlink size={14} />
          </button>
          <button
            className="fs-btn-ghost"
            title="Delete (Del)"
            style={{ color: "#ef4444" }}
            onClick={onDeleteSelection}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Floating Canvas HUD & Controls (Bottom-Right) */}
      {!simMode && (
        <div
          className="fs-glass"
          style={{
            position: "absolute",
            bottom: 20,
            right: 16,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 12px",
            borderRadius: 999,
          }}
        >
          {/* Node & Link Count Stats Micro-Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--muted)",
              paddingRight: 6,
            }}
            title="Diagram Elements Count"
          >
            <Layers size={13} style={{ color: "var(--accent)" }} />
            <span>{nonGroupNodesCount} nodes</span>
            <span>•</span>
            <span>{edges.length} links</span>
          </div>

          <span className="fs-sep" />

          {/* Zoom Controls */}
          <button className="fs-btn-ghost" title="Zoom Out (-)" onClick={onZoomOut}>
            <ZoomOut size={14} />
          </button>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              width: 44,
              textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace",
              cursor: "pointer",
              color: "var(--text)",
            }}
            title="Click to reset zoom"
            onClick={onFit}
          >
            {Math.round(z * 100)}%
          </span>
          <button className="fs-btn-ghost" title="Zoom In (+)" onClick={onZoomIn}>
            <ZoomIn size={14} />
          </button>

          <span className="fs-sep" />

          <button className="fs-btn-ghost" title="Fit View" onClick={onFit}>
            <Maximize2 size={14} />
          </button>
          <button
            className={`fs-btn-ghost ${snap ? "on" : ""}`}
            title="Toggle Grid Snap"
            onClick={onToggleSnap}
          >
            <Magnet size={14} />
          </button>
          <button
            className={`fs-btn-ghost ${showGrid ? "on" : ""}`}
            title="Toggle Canvas Grid"
            onClick={onToggleGrid}
          >
            <Grid size={14} />
          </button>
        </div>
      )}

      {/* Floating Micro Shortcuts Bar (Bottom-Left) */}
      {!simMode && (
        <div className="fs-hint" style={{ borderRadius: 999, padding: "8px 16px" }}>
          <span style={{ fontWeight: 700, color: "var(--text)" }}>FlowStudio: </span>
          <span className="fs-kbd">⌘K</span> Commands · <span className="fs-kbd">V</span> Select · <span className="fs-kbd">H</span> Pan · <span className="fs-kbd">Shift</span> Multi · <span className="fs-kbd">Del</span> Delete
        </div>
      )}
    </div>
  );
}
