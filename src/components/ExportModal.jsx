import { useState } from "react";
import {
  X,
  FileCode,
  Image,
  FileImage,
  Download,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { THEMES } from "../lib/theme.js";

export default function ExportModal({
  isOpen,
  onClose,
  theme = "dark",
  T,
  onExportJSON,
  onExportSVG,
  onExportPNG,
  onCopyPNG,
  onCopySVG,
}) {
  const [transparent, setTransparent] = useState(false);
  const [scale, setScale] = useState(2);
  const [copiedType, setCopiedType] = useState(null);
  const [isCopying, setIsCopying] = useState(null);
  const [copyError, setCopyError] = useState(null);

  if (!isOpen) return null;

  const handleCopyPNG = async () => {
    if (!onCopyPNG || isCopying) return;
    setIsCopying("png");
    setCopyError(null);
    try {
      const ok = await onCopyPNG({ transparent, scale });
      if (ok) {
        setCopiedType("png");
        setTimeout(() => setCopiedType(null), 2000);
      } else {
        // If binary PNG clipboard failed (e.g. over HTTP LAN), attempt SVG text copy fallback
        if (onCopySVG) {
          const svgOk = await onCopySVG({ transparent });
          if (svgOk) {
            setCopiedType("png_as_svg");
            setTimeout(() => setCopiedType(null), 3000);
            return;
          }
        }
        setCopyError("png");
        setTimeout(() => setCopyError(null), 3500);
      }
    } catch {
      setCopyError("png");
      setTimeout(() => setCopyError(null), 3500);
    } finally {
      setIsCopying(null);
    }
  };

  const handleCopySVG = async () => {
    if (!onCopySVG || isCopying) return;
    setIsCopying("svg");
    setCopyError(null);
    try {
      const ok = await onCopySVG({ transparent });
      if (ok) {
        setCopiedType("svg");
        setTimeout(() => setCopiedType(null), 2000);
      } else {
        setCopyError("svg");
        setTimeout(() => setCopyError(null), 3500);
      }
    } catch {
      setCopyError("svg");
      setTimeout(() => setCopyError(null), 3500);
    } finally {
      setIsCopying(null);
    }
  };

  return (
    <div className="fs-modal-backdrop" onClick={onClose}>
      <div
        className="fs-command-modal fs-glass"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: 22,
          maxWidth: 620,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
          borderRadius: 20,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                Export Diagram
              </h3>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                }}
              >
                Customizable
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: 12 }}>
              Choose background transparency, quality, and export format
            </p>
          </div>
          <button
            className="fs-btn-ghost"
            onClick={onClose}
            style={{ padding: 6, borderRadius: "50%" }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options Bar: Background Transparency & PNG Scale */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 18,
            padding: 12,
            borderRadius: 14,
            background: "rgba(148, 163, 184, 0.06)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Background Mode Toggle */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--muted)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Background</span>
              <span
                style={{
                  fontSize: 10,
                  color: transparent ? "var(--accent)" : "var(--muted)",
                  fontWeight: 700,
                }}
              >
                {transparent ? "Transparent" : "Canvas Theme"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                background: "var(--panel-solid)",
                padding: 3,
                borderRadius: 10,
                border: "1px solid var(--border)",
              }}
            >
              <button
                type="button"
                onClick={() => setTransparent(false)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "6px 8px",
                  border: "none",
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: !transparent ? "var(--accent)" : "transparent",
                  color: !transparent ? "#ffffff" : "var(--muted)",
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.4)",
                    background: T?.bg || THEMES[theme]?.bg || THEMES.dark.bg,
                    display: "inline-block",
                  }}
                />
                Solid
              </button>

              <button
                type="button"
                onClick={() => setTransparent(true)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "6px 8px",
                  border: "none",
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: transparent ? "var(--accent)" : "transparent",
                  color: transparent ? "#ffffff" : "var(--muted)",
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background:
                      "linear-gradient(45deg, #94a3b8 25%, transparent 25%, transparent 75%, #94a3b8 75%, #94a3b8), linear-gradient(45deg, #94a3b8 25%, #ffffff 25%, #ffffff 75%, #94a3b8 75%, #94a3b8)",
                    backgroundSize: "6px 6px",
                    backgroundPosition: "0 0, 3px 3px",
                    display: "inline-block",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                />
                Transparent
              </button>
            </div>
          </div>

          {/* PNG Scale Resolution */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--muted)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>PNG Resolution</span>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--accent)",
                  fontWeight: 700,
                }}
              >
                {scale === 1 ? "1x Standard" : scale === 2 ? "2x Retina" : "3x Ultra HD"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                background: "var(--panel-solid)",
                padding: 3,
                borderRadius: 10,
                border: "1px solid var(--border)",
                gap: 2,
              }}
            >
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScale(s)}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    border: "none",
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: scale === s ? "var(--accent-light)" : "transparent",
                    color: scale === s ? "var(--accent)" : "var(--muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Export Formats List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* PNG Card */}
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--panel-solid)",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  flexShrink: 0,
                }}
              >
                <Image size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 3,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>PNG Image</span>
                  <span className="fs-kbd" style={{ fontSize: 10 }}>.png</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: transparent ? "var(--accent)" : "var(--muted)",
                      background: transparent ? "var(--accent-light)" : "rgba(148, 163, 184, 0.12)",
                      padding: "1px 7px",
                      borderRadius: 6,
                    }}
                  >
                    {transparent ? "Transparent" : "Solid"}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--muted)",
                      background: "rgba(148, 163, 184, 0.12)",
                      padding: "1px 7px",
                      borderRadius: 6,
                    }}
                  >
                    {scale}x Scale
                  </span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.4 }}>
                  High-resolution raster graphic image for presentations, documents, and sharing.
                </div>
              </div>
            </div>

            {/* Action Buttons for PNG */}
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              {onCopyPNG && (
                <button
                  type="button"
                  className="fs-btn-ghost"
                  disabled={!!isCopying}
                  onClick={handleCopyPNG}
                  style={{
                    background:
                      copiedType === "png"
                        ? "var(--accent-light)"
                        : copyError === "png"
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(148, 163, 184, 0.08)",
                    color:
                      copiedType === "png"
                        ? "var(--accent)"
                        : copyError === "png"
                          ? "#ef4444"
                          : "var(--text)",
                    border:
                      copyError === "png"
                        ? "1px solid #ef4444"
                        : "1px solid var(--border)",
                    borderRadius: 9,
                    padding: "6px 12px",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {copiedType === "png" ? (
                    <>
                      <Check size={14} style={{ color: "var(--accent)" }} />
                      Copied!
                    </>
                  ) : copiedType === "png_as_svg" ? (
                    <>
                      <Check size={14} style={{ color: "var(--accent)" }} />
                      Copied SVG (LAN Mode)
                    </>
                  ) : copyError === "png" ? (
                    <>
                      <AlertCircle size={14} style={{ color: "#ef4444" }} />
                      Copy Failed
                    </>
                  ) : isCopying === "png" ? (
                    <>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      Copying...
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy Image
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                className="fs-btn on"
                onClick={() => {
                  onExportPNG({ transparent, scale });
                  onClose();
                }}
                style={{
                  borderRadius: 9,
                  padding: "6px 16px",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <Download size={14} />
                Download PNG
              </button>
            </div>
          </div>

          {/* SVG Card */}
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--panel-solid)",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  flexShrink: 0,
                }}
              >
                <FileImage size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 3,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Vector SVG</span>
                  <span className="fs-kbd" style={{ fontSize: 10 }}>.svg</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: transparent ? "var(--accent)" : "var(--muted)",
                      background: transparent ? "var(--accent-light)" : "rgba(148, 163, 184, 0.12)",
                      padding: "1px 7px",
                      borderRadius: 6,
                    }}
                  >
                    {transparent ? "Transparent" : "Solid"}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--accent)",
                      background: "var(--accent-light)",
                      padding: "1px 7px",
                      borderRadius: 6,
                    }}
                  >
                    Themeable CSS
                  </span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.4 }}>
                  Minimal, semantic vector graphics with CSS classes (<code>.fs-node</code>, <code>.fs-edge-path</code>) and CSS custom properties (<code>--fs-bg</code>, <code>--node-fill</code>). Seamlessly override styles or colors when imported into your website, apps, or design tools.
                </div>
              </div>
            </div>

            {/* Action Buttons for SVG */}
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              {onCopySVG && (
                <button
                  type="button"
                  className="fs-btn-ghost"
                  disabled={!!isCopying}
                  onClick={handleCopySVG}
                  style={{
                    background:
                      copiedType === "svg"
                        ? "var(--accent-light)"
                        : copyError === "svg"
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(148, 163, 184, 0.08)",
                    color:
                      copiedType === "svg"
                        ? "var(--accent)"
                        : copyError === "svg"
                          ? "#ef4444"
                          : "var(--text)",
                    border:
                      copyError === "svg"
                        ? "1px solid #ef4444"
                        : "1px solid var(--border)",
                    borderRadius: 9,
                    padding: "6px 12px",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {copiedType === "svg" ? (
                    <>
                      <Check size={14} style={{ color: "var(--accent)" }} />
                      Copied!
                    </>
                  ) : copyError === "svg" ? (
                    <>
                      <AlertCircle size={14} style={{ color: "#ef4444" }} />
                      Copy Failed
                    </>
                  ) : isCopying === "svg" ? (
                    <>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      Copying...
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy SVG
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                className="fs-btn on"
                onClick={() => {
                  onExportSVG({ transparent });
                  onClose();
                }}
                style={{
                  borderRadius: 9,
                  padding: "6px 16px",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                <Download size={14} />
                Download SVG
              </button>
            </div>
          </div>

          {/* JSON Document Card */}
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--panel-solid)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  flexShrink: 0,
                }}
              >
                <FileCode size={22} />
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 3,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    FlowStudio Document
                  </span>
                  <span className="fs-kbd" style={{ fontSize: 10 }}>.json</span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.4 }}>
                  Complete diagram state format to backup or re-import into FlowStudio.
                </div>
              </div>
            </div>

            <button
              type="button"
              className="fs-btn"
              onClick={() => {
                onExportJSON();
                onClose();
              }}
              style={{
                borderRadius: 9,
                padding: "6px 16px",
                fontWeight: 600,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              <Download size={14} />
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
