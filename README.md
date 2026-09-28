# FlowStudio

A visual flowchart and diagram editor built with React and Vite. Design diagrams, import Mermaid syntax, simulate step-by-step logic workflows, and export crisp transparent assets for presentations, documentation, and web inclusion.

---

## Features

### Visual Canvas & Shapes
- Support for multiple node types: Rectangle, Rounded Box, Pill, Ellipse, Diamond, Cylinder, Group Containers, and Freeform Text.
- Full styling customization: Background fills, stroke colors, stroke width, dashed borders, badges, and font sizing.
- Grouping and hierarchy support with auto-expanding bounding boxes.

### Mermaid Flowchart Import & Auto-Layout
- Direct import from `.mmd`, `.md`, `.txt`, or raw Mermaid syntax definitions.
- Automatic layout calculation using Dagre hierarchy positioning.
- Smart conversion to native nodes, groups, ports, and connected edges.

### Flow Simulation & Playback Engine
- Define, edit, and organize multiple scenario test paths.
- Step-by-step execution playback with animated edge pulses and active node glow.
- Loop exit handling and manual branching choices during simulation.

### Smart Edge Routing & Waypoints
- Port connection snapping (Top, Right, Bottom, Left) with dynamic auto-port selection.
- Draggable waypoints and mid-handle bend controls for custom orthogonal and curved routing.
- Clickable and repositionable edge labels with custom background styling.
- Directional arrowheads (start and end arrows) and dashed line styles.

### Minimal, Semantic & Themeable SVG Export
- Pure, minimal standalone vector SVG generation without editor bloat or camera artifacts.
- Semantic CSS classes (`.fs-node`, `.fs-edge-path`, `.fs-node-text`, `.fs-group`) and CSS custom properties (`--fs-bg`, `--node-fill`, `--node-stroke`, `--fs-font`).
- 100% themeable and restylable via external CSS when imported or embedded in web apps, documentation, or design tools, while retaining full presentation attribute fallbacks.
- Transparent and solid background options.
- High-resolution raster PNG exports with customizable scaling (1x Standard, 2x Retina, 3x Ultra HD).
- Direct clipboard copy support for both clean vector SVG code and PNG image data.
- Complete document state save and restore via JSON.

### Productivity Tools
- Command Palette (`Ctrl+K` / `Cmd+K`) for fast access to actions, alignment & distribution tools, and shapes.
- Full undo and redo history tracking.
- Grid snapping, multi-node alignment (left, center, right, top, bottom), distribution tools (horizontal, vertical spacing), and nudge adjustments.
- Light, Dark, and Clay themes with tailored preset palettes and a clean glassmorphic interface.

---

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Diagram Layout**: Dagre
- **Geometry & Shapes**: D3 Shape
- **Parser**: Mermaid Core
- **Linter**: Oxlint

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/flowstudio.git

# Navigate to the project directory
cd flowstudio

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the local development server
npm run dev
```

The application will be available at `http://localhost:5310/` (or the port specified in your terminal).

### Building for Production

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd / Ctrl + K` | Open Command Palette |
| `Cmd / Ctrl + Z` | Undo |
| `Cmd / Ctrl + Y` or `Cmd / Ctrl + Shift + Z` | Redo |
| `Cmd / Ctrl + C` | Copy selected nodes |
| `Cmd / Ctrl + V` | Paste copied nodes |
| `Cmd / Ctrl + D` | Duplicate selection |
| `Cmd / Ctrl + G` | Group selected nodes |
| `Cmd / Ctrl + Shift + G` | Ungroup selected group |
| `Cmd / Ctrl + A` | Select all nodes and edges |
| `Delete` / `Backspace` | Delete selected nodes and edges |
| `Shift + Delete` | Delete only edge connections of selection |
| `Arrow Keys` | Nudge selection (hold `Shift` for fine 1px nudge) |
| `Space` | Toggle simulation play / pause |
| `,` / `.` | Step back / Step forward in simulation |
| `V` | Switch to Select tool |
| `H` | Switch to Pan tool |
| `R` / `U` / `P` / `D` / `O` / `B` / `T` / `G` | Add Rectangle / Rounded / Pill / Diamond / Ellipse / Database / Text / Frame (placed around the last canvas click) |

