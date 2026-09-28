import { useEffect, useRef, useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";

export default function CanvasSearch({
  isOpen,
  onClose,
  nodes = [],
  edges = [],
  onFocusNode,
  onFocusEdge,
}) {
  const [query, setQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery("");
      setCurrentIndex(0);
    }
  }, [isOpen]);

  // Compute matches across nodes and edges
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const found = [];

    // Match node labels, types, and badges
    for (const n of nodes) {
      const text = (n.text || "").toLowerCase();
      const badge = (n.badge || "").toLowerCase();
      const type = (n.type || "").toLowerCase();
      if (text.includes(q) || badge.includes(q) || type.includes(q)) {
        found.push({
          type: "node",
          id: n.id,
          label: n.text || (n.type === "group" ? "Frame" : "Node"),
          sub: n.badge ? `[${n.badge}]` : n.type,
        });
      }
    }

    // Match edge labels
    for (const e of edges) {
      const text = (e.text || "").toLowerCase();
      if (text.includes(q)) {
        found.push({
          type: "edge",
          id: e.id,
          label: e.text,
          sub: "Connector",
        });
      }
    }

    return found;
  }, [query, nodes, edges]);

  // Clamp current index when matches change
  useEffect(() => {
    if (currentIndex >= matches.length) {
      setCurrentIndex(Math.max(0, matches.length - 1));
    }
  }, [matches.length, currentIndex]);

  // Navigate and focus current match
  const jumpToMatch = (index) => {
    if (!matches.length) return;
    const target = matches[index];
    if (!target) return;
    if (target.type === "node" && onFocusNode) {
      onFocusNode(target.id);
    } else if (target.type === "edge" && onFocusEdge) {
      onFocusEdge(target.id);
    }
  };

  const handleNext = () => {
    if (!matches.length) return;
    const next = (currentIndex + 1) % matches.length;
    setCurrentIndex(next);
    jumpToMatch(next);
  };

  const handlePrev = () => {
    if (!matches.length) return;
    const prev = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prev);
    jumpToMatch(prev);
  };

  // Keyboard navigation inside input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) handlePrev();
      else handleNext();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Auto-focus first match upon typing
  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setCurrentIndex(0);
    // Find first match synchronously with new query
    const q = val.trim().toLowerCase();
    if (!q) return;

    for (const n of nodes) {
      const text = (n.text || "").toLowerCase();
      const badge = (n.badge || "").toLowerCase();
      if (text.includes(q) || badge.includes(q)) {
        if (onFocusNode) onFocusNode(n.id);
        return;
      }
    }
    for (const ed of edges) {
      const text = (ed.text || "").toLowerCase();
      if (text.includes(q)) {
        if (onFocusEdge) onFocusEdge(ed.id);
        return;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fs-glass"
      style={{
        position: "absolute",
        top: 72,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 35,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px 6px 14px",
        borderRadius: 999,
        boxShadow: "0 14px 34px rgba(0, 0, 0, 0.28)",
        border: "1px solid var(--border-hard)",
        animation: "fs-fade-in 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <Search size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Find in diagram (Enter to cycle)..."
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text)",
          fontSize: 13,
          fontWeight: 500,
          width: 220,
        }}
      />

      {/* Match count badge */}
      {query.trim() && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: 999,
            background: matches.length > 0 ? "var(--accent-light)" : "rgba(239, 68, 68, 0.15)",
            color: matches.length > 0 ? "var(--accent)" : "#ef4444",
            flexShrink: 0,
          }}
        >
          {matches.length > 0 ? `${currentIndex + 1} / ${matches.length}` : "No matches"}
        </span>
      )}

      {/* Prev / Next controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button
          type="button"
          className="fs-mini"
          disabled={matches.length <= 1}
          onClick={handlePrev}
          title="Previous Match (Shift+Enter)"
          style={{ opacity: matches.length <= 1 ? 0.4 : 1 }}
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          className="fs-mini"
          disabled={matches.length <= 1}
          onClick={handleNext}
          title="Next Match (Enter)"
          style={{ opacity: matches.length <= 1 ? 0.4 : 1 }}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <div style={{ width: 1, height: 16, background: "var(--border)" }} />

      {/* Close button */}
      <button
        type="button"
        className="fs-mini"
        onClick={onClose}
        title="Close (Esc)"
      >
        <X size={14} />
      </button>
    </div>
  );
}
