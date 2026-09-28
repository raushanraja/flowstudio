# FlowStudio Feature Ideas & Roadmap

This document outlines high-impact feature ideas, UX enhancements, and technical architecture proposals to evolve FlowStudio into a premier visual diagramming and simulation tool.

---

## 1. High-Impact "Quick Wins" (Existing Foundations Ready)

### 1.1 Canvas Auto-Layout / Graph Beautifier (Dagre Engine)
* **Status:** `dagre` (`^0.8.5`) is already installed in `package.json`.
* **Problem:** When creating diagrams by hand or making extensive edits, nodes quickly become misaligned, overlapping, or disorganized. Users spend significant time nudging and aligning boxes manually.
* **Proposed Solution:**
  * Add a 1-click **Auto-Layout** command accessible via the Top Bar, Command Palette (`⌘K`), and Properties Panel.
  * Support directional hierarchy modes:
    * **Top-to-Bottom (`TB`)** — Ideal for flowcharts, decision trees, and pipelines.
    * **Left-to-Right (`LR`)** — Ideal for architecture diagrams, service request flows, and state transitions.
  * Option to auto-layout the entire diagram or only the selected group/nodes.
  * Animate nodes smoothly to their target coordinates using CSS or a lightweight spring interpolation.

### 1.2 Export & Copy as Mermaid Syntax (Full Round-Trip)
* **Status:** Mermaid **import** is fully implemented, but export is currently restricted to SVG, PNG, and JSON.
* **Problem:** Users who write documentation in GitHub, GitLab, or Notion frequently need to edit diagrams visually, then convert them back into text-based Mermaid code.
* **Proposed Solution:**
  * Add **"Export Mermaid"** and **"Copy Mermaid Syntax"** tabs/buttons in `ExportModal.jsx`.
  * Serializer maps node shapes (`rect` $\to$ `[text]`, `rounded` $\to$ `(text)`, `diamond` $\to$ `{text}`, `cylinder` $\to$ `[(text)]`, `pill` $\to$ `([text])`), edge connections, directional arrows (`-->`, `---`), and edge labels (`-->|label|`).
  * Subgraphs mapped to Mermaid `subgraph ... end` blocks.

---

## 2. Diagramming Velocity & Canvas Ergonomics

### 2.1 Quick-Connect & Smart Node Spawning (`+` Directional Handles)
* **Problem:** Creating a sequence of connected nodes currently requires:
  1. Spawning a shape from the toolbar/hotkey.
  2. Dragging it onto the canvas.
  3. Locating the small 10px port on the source node.
  4. Dragging a connection line to the target port.
* **Proposed Solution (Miro / Eraser / Whimsical pattern):**
  * When a node is hovered or selected, show subtle `+` icons at its 4 borders (Top, Right, Bottom, Left).
  * **Click `+`:** Automatically creates a new node in that direction, links them with an arrow, selects the new node, and focuses the inline text editor.
  * **Drag from `+`:** Directly pulls out a new connection line that can snap to another node or release to drop a new node.

### 2.2 Selection Floating HUD (Context Micro-Toolbar)
* **Problem:** Every minor property change (color change, shape morph, line style, border style) requires moving the mouse from the canvas all the way to the right-hand `PropertiesPanel`.
* **Proposed Solution:**
  * Display a floating micro-toolbar directly above the active selection (nodes or edges).
  * **Quick Actions for Nodes:**
    * **Shape Morpher:** Convert Rect $\leftrightarrow$ Rounded $\leftrightarrow$ Pill $\leftrightarrow$ Diamond $\leftrightarrow$ Cylinder without breaking existing connections.
    * **Color Palette Swatches:** 5-6 primary accent swatches for quick color coding.
    * **Duplicate (`Ctrl+D`)**, **Delete (`Del`)**, and **Group (`Ctrl+G`)**.
  * **Quick Actions for Edges:**
    * Line style (Solid / Dashed), Flip Direction, Arrowheads, and Color.

### 2.3 Alt / Option + Drag to Duplicate
* **Problem:** Duplicate requires pressing `Ctrl+D` and moving the duplicated offset object.
* **Proposed Solution:**
  * Holding `Alt` / `Option` while dragging any selected node or group creates an immediate clone that follows the drag movement, snapping to grid upon drop (standard across Figma, Illustrator, Draw.io).

### 2.4 Smart Magnetic Guidelines (Object-to-Object Snapping)
* **Problem:** While grid snapping (`16px`) exists, aligning nodes relative to other objects (matching centers, edges, or equidistant spacing) requires manual visual checks or menu alignment tools.
* **Proposed Solution:**
  * Render dynamic colored guide lines (e.g. magenta/cyan dashed lines) when the dragged node aligns horizontally or vertically with the edge or center of neighboring nodes.
  * Provide subtle magnetic snapping pull when within 4–6px of an alignment guide.

---

## 3. Canvas Navigation & Scalability (Large Diagrams)

### 3.1 Interactive Radar Mini-Map
* **Problem:** Navigating sprawling diagrams across high-DPI screens requires repetitive panning and zooming. Users lose spatial context.
* **Proposed Solution:**
  * Collapsible thumbnail mini-map widget in the bottom corner (bottom-right or bottom-left).
  * Displays scaled preview silhouettes of all nodes and groups.
  * Highlighted viewport bounding box showing current camera view.
  * Click or drag the viewport box to pan immediately to any area of the diagram.

### 3.2 Search / Find on Canvas (`Ctrl+F` / `⌘F`)
* **Problem:** Large architecture flows with dozens of microservices or decision steps make finding a specific service or label tedious.
* **Proposed Solution:**
  * Lightweight canvas search bar (`Ctrl+F`).
  * Instant search across node labels, IDs, descriptions, and edge text.
  * `Enter` / `Shift+Enter` cycles through search results.
  * Smoothly centers and zooms the camera onto the matched node with an animated highlight pulse.

---

## 4. Edge Routing & Connector Versatility

### 4.1 Configurable Connector Line Styles
* **Problem:** Current default connections are cubic Beziers, while imported Mermaid waypoints use basis/rounded curves. Users cannot choose the aesthetic style of their connectors.
* **Proposed Solution:**
  * Provide explicit **Routing Style** options on edges:
    * **Orthogonal (Elbow / Step):** Clean 90-degree corners with customizable corner radius. Standard for system architecture and network topologies.
    * **Curved (Smooth Bezier):** Flowing smooth curves ideal for mind maps and concept diagrams.
    * **Straight:** Direct point-to-point lines ideal for sequence diagrams and dense state machines.

### 4.2 Edge Bridges / Jumps
* **Problem:** In complex diagrams, intersecting connection lines look like 4-way junctions, causing visual ambiguity.
* **Proposed Solution:**
  * Automatic arc "bridge" or gap rendering when two orthogonal edges cross over each other.

---

## 5. Playback, Simulation & Presentation Superpowers

FlowStudio's simulation and scenario execution is its biggest unique differentiator compared to static tools like Excalidraw or draw.io.

### 5.1 Simulation Video / Animated Export (WebM / GIF / Animated SVG)
* **Problem:** FlowStudio has scenario playback, continuous demo mode, and animated pulse tokens, but users can only view them inside the app.
* **Proposed Solution:**
  * Export scenario executions directly as:
    * **WebM / MP4 video clip** (using `MediaRecorder` or canvas capture stream).
    * **Animated SVG** with embedded CSS `@keyframes` animations.
    * **GIF export** for inclusion in GitHub READMEs, changelogs, and slide decks.

### 5.2 Scenario Step Annotations & Presenter Mode
* **Problem:** Sharing a simulation with stakeholders requires live verbal explanations because steps only highlight nodes and edges without explanatory commentary.
* **Proposed Solution:**
  * Allow attaching markdown notes/captions to individual scenario steps (e.g., *"Step 3: Cache miss triggers database query with read replica fallback"*).
  * In playback mode, display an aesthetic callout card next to the active step explaining the business logic or protocol interaction.
  * Fullscreen **Presenter Mode** hiding editing panels and focusing purely on the story and simulation controls.

---

## 6. Rich Content & Extensibility

### 6.1 Multi-Section Nodes & Badges
* **Problem:** Nodes currently only contain a single centered label string.
* **Proposed Solution:**
  * Support rich node structures:
    * **Title + Subtitle/Description** (e.g. "Auth Service" with "Node.js / Express").
    * **Badge / Tag Pills** (e.g. "v2.1", "Deprecated", "Critical Path").
    * **Icon Selection** (e.g. AWS, database, user, lock, server icons from Lucide).

### 6.2 Pre-built Diagram Templates
* **Problem:** New users start with a blank canvas and have to build everything from scratch.
* **Proposed Solution:**
  * Template picker dialog:
    * Microservices Architecture (API Gateway $\to$ Services $\to$ DB/Cache).
    * OAuth2 / JWT Authentication Flow.
    * CI/CD Pipeline.
    * State Machine / Order Fulfillment Lifecycle.

---

## 7. Priority & Effort Matrix

| Feature | Impact | Implementation Effort | Status |
| :--- | :---: | :---: | :---: |
| **Canvas Auto-Layout (`dagre`)** | 🟢 Extremely High | 🟡 Moderate (Lib already installed) | ✅ **Completed (Phase 1)** |
| **Export to Mermaid Syntax** | 🟢 High | 🟢 Low (Parser inversion) | ✅ **Completed (Phase 1)** |
| **Alt + Drag Duplicate** | 🟢 High | 🟢 Low | ✅ **Completed (Phase 1)** |
| **Selection Floating HUD** | 🟢 High | 🟡 Moderate | ✅ **Completed (Phase 2)** |
| **Quick-Connect (`+` Handles)** | 🟢 Extremely High | 🔴 Substantial | ✅ **Completed (Phase 2)** |
| **Configurable Line Styles** | 🟡 Medium | 🟡 Moderate | ✅ **Completed (Phase 2)** |
| **Find on Canvas (`Ctrl+F`)** | 🟡 Medium | 🟢 Low | ✅ **Completed (Phase 2)** |
| **Interactive Mini-Map** | 🟡 Medium | 🟡 Moderate | ✅ **Completed (Phase 3)** |
| **Animated Simulation Export** | 🟢 High | 🔴 Substantial | ✅ **Completed (Phase 3)** |
| **Smart Magnetic Guidelines** | 🟡 Medium | 🔴 Substantial | ✅ **Completed (Phase 3)** |
