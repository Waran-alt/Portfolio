# SVG Path Visualizer

This is an interactive tool built with React and Next.js to help developers visualize, create, and debug SVG path data. It provides a real-time canvas where users can see their path rendered as they type or drag control points.

## ✨ Features

-   **Interactive Canvas**: A large SVG canvas with a coordinate grid and rulers.
-   **Live Path Editing**: Edit the raw SVG path string and see the changes reflected instantly after validation.
-   **Draggable Handles**: Manipulate the path visually by dragging endpoints and Bézier control points.
-   **Example Paths**: Load pre-defined examples for various curve types (`Q`, `C`, `A`, etc.).
-   **Append Segments**: Dynamically extend the current path with new segments of your choice.
-   **Path Breakdown**: See a detailed breakdown of each command in your path, with explanations.
-   **Command & Coordinate Overlays**: Visualize the command letters and coordinates directly on the canvas.
-   **Path Manipulation**: Utility buttons to round values to integers.

## 🌊 User Workflow

The visualizer supports a flexible workflow for creating and editing paths, whether you prefer coding or visual manipulation.

```mermaid
graph TD
    A[Start] --> B{Choose Action};
    B --> C[Select Example];
    B --> D[Start with a Blank Path];
    C --> E[Path Loaded into Textarea & Canvas];
    D --> E;
    E --> F{Edit Path};
    F --> G[Drag Points on Canvas];
    F --> H[Edit Path String in Textarea];
    G --> I[Path & Textarea Updated Instantly];
    I --> F;
    H --> J["Click 'Validate' or Press Enter"];
    J --> K{Is Path Valid?};
    K -- Yes --> L[Canvas Updated];
    K -- No --> M[Error Message Shown];
    L --> F;
    M --> H;
    E --> N[Append a Segment];
    N --> O[Select Segment Type];
    O --> P["Click 'Append Segment'"];
    P --> I;
```

## 🏗️ Architecture Overview

The tool is built as a single, comprehensive React component (`SVGTestPage`) that manages its own state and renders several sub-components for different UI sections.

### Component Structure

The main page is composed of several logical blocks that handle rendering, controls, and information display.

```mermaid
graph TD
    SVGTestPage -- Manages All --> State((pathString, pendingPathString, ...));
    SVGTestPage --> SVGRenderArea["SVG Render Area (Canvas)"];
    SVGTestPage --> Controls["Controls (Select example, toggles)"];
    SVGTestPage --> PathEditor["Path Editor (Textarea + Buttons)"];
    SVGTestPage --> PathBreakdown["PathCommandBreakdown Component"];

    subgraph SVGRenderArea
        direction TB
        CanvasSVG[SVG Element]
        CanvasSVG --> RenderedPath["path d={pathString}"];
        CanvasSVG --> DraggablePoints["Draggable Points (circle)"];
        CanvasSVG --> ControlLines["Control Lines (line)"];
        CanvasSVG --> Overlay[PathCommandsOverlay Component];
    end

    subgraph PathEditor
        direction LR
        TextArea[Textarea] -- onChange --> updatePendingPath["Updates pendingPathString"];
        ValidateBtn[Validate Button] -- onClick --> validateAndApplyPath["Validates pending, updates pathString"];
        AppendBtn[Append Button] -- onClick --> handleAppendSegment["Appends to pathString"];
    end

    State -- Drives --> SVGRenderArea;
    State -- Drives --> PathEditor;
    State -- Drives --> PathBreakdown;
```

### State Management: The Source of Truth

A key architectural decision is the separation of the rendered path from the path being edited in the textarea. This provides a stable user experience.

```mermaid
graph TD
    subgraph "User Actions"
        direction LR
        A[Edit Textarea]
        B[Drag Point]
        C[Click Validate]
        D[Click Round/Append]
        E[Select Example]
    end

    subgraph "State"
        S1(pendingPathString)
        S2(pathString - SOT)
        S3(draggablePoints)
    end

    subgraph "UI"
        U1[Textarea]
        U2[SVG Canvas]
    end
    
    A -- "Updates (buffer)" --> S1;
    B -- "Updates SOT directly" --> S2;
    D -- "Updates SOT directly" --> S2;
    E -- "Updates SOT directly" --> S2;
    C -- "Copies pending to SOT" --> S2;

    S1 -- "Controls value of" --> U1;
    S2 -- "Is rendered by" --> U2;
    S2 -- "Generates" --> S3;
    S3 -- "Are rendered on" --> U2;
    S2 -- "Also updates buffer" --> S1;
```

## ⚙️ Interaction Flow: Dragging a Point

This sequence diagram illustrates what happens under the hood when a user drags a point on the canvas.

```mermaid
sequenceDiagram
    participant User
    participant Canvas as SVG Canvas
    participant SVGTestPage as Page Component
    participant State

    User->>Canvas: Press mouse down on a draggable point
    Canvas->>SVGTestPage: handleMouseDown(pointInfo)
    SVGTestPage->>State: setDraggedPointInfo(pointInfo)
    SVGTestPage->>User: Add 'noselect' class to body
    
    User->>Canvas: Move mouse
    Canvas->>SVGTestPage: handleMouseMove(event)
    SVGTestPage->>SVGTestPage: Calculate new (x, y) from event
    SVGTestPage->>SVGTestPage: Rebuild path string with new coords
    SVGTestPage->>State: setPathString(newPathString)
    State-->>SVGTestPage: Triggers re-render
    SVGTestPage-->>Canvas: Update SVG with new path and point positions
    
    User->>Canvas: Release mouse button
    Canvas->>SVGTestPage: handleMouseUp()
    SVGTestPage->>State: setDraggedPointInfo(null)
    SVGTestPage->>User: Remove 'noselect' class from body
``` 