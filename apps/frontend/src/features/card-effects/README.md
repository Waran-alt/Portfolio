# Card effects (tilt, foil, title-mark depth)

Helpers in `cardEffects.module.css` and `useCardTiltAndFoil.ts` drive pointer tilt, holo foils, and **local 3D lift** on SVG title marks (e.g. “focus-”, “on”) and on the **corner flip chip** (arrow button).

## Title marks: “detached from the card” stack

Layered marks in `TitleMarks.tsx` use:

| Mark | Component | Notes |
|------|-----------|--------|
| Split “focus-” / “on” | `FocusMarkLayered`, `OnMarkLayered` | Fallback when stacked title is not plain `…-on-Pixel`. |
| Merged wordmark | `ProjectMarkLayered` | Single SVG (`projectMarkSvg.tsx`) for `focus-on-pixel`; same foil + mask pattern, red path punched out of foil like the “n” hole in `OnMarkLayered`. |

Shared stack:

| Layer | Class | Role |
|--------|--------|------|
| Wrapper | `markLayered` | `position: relative`, `transform-style: preserve-3d`, sized to the band |
| Shadow plane | `markSurfaceShadow` on first SVG | `translateZ(0)`, blurred mask — reads as contact shadow |
| Front plane | `markDetachedFloat` on second SVG | `translateZ(40px)` + stacked `drop-shadow` filters |

Optional: `markDetachedFloatLiftStrong` adds extra `translateZ` when a glyph is small; **keep it after** `markDetachedFloat` in the `className` string so `transform` overrides while **filters** still come from `markDetachedFloat`.

Band containers (e.g. `.titleTriFocus`, `.titleTriOn` in `BusinessCardHero.module.css`) should set **`perspective`** (tight value, ~380px) and **`transform-style: preserve-3d`** so `translateZ` is visible.

The column that tilts usually combines **`parallaxTiltHost`** (translateZ + rotate from pointer) with **`transform-style: preserve-3d`**.

### Critical gotcha: `transform-style: flat` on intermediate wrappers

**Default `transform-style` is `flat`.** Many layout wrappers (including **`display: flex` rows**) do **not** set `preserve-3d`. Any such ancestor **between** the perspective host and the mark will **flatten** all descendant `translateZ` into one plane. The foil and tilt still move, but the mark **looks glued to the card** because the shadow layer and the lifted SVG no longer separate in depth.

**Fix:** On every flex (or block) wrapper that sits **between** the 3D-aware title column and a mark subtree, set:

```css
-webkit-transform-style: preserve-3d;
transform-style: preserve-3d;
```

Example from this repo: `.titleTriRow2` wraps “on” + “pixel” while `.titleTriFocus` does not need that extra row — “focus” kept depth; “on” did not until the row preserved 3D.

## Corner flip chip (arrow button)

Bottom-right **flip** affordance on the card front. It reuses the **same primitives** as SVG title marks (`markLayered`, `markSurfaceShadow`, `markDetachedFloat`) and the **same pointer parallax** as the stacked title (`parallaxTiltHost` driven by `--tilt-x` / `--tilt-y` from `useCardTiltAndFoil`).

### Why the DOM order looks like the title block

For the title, **`parallaxTiltHost`** sits on the **layout** wrapper, and **local `perspective`** sits on the **row** that contains the marks (e.g. `.titleTriFocus`). The corner chip mirrors that **outside → inside** order so `translateZ` stays meaningful and motion feels consistent:

1. **Shell** — `.cornerArrowPerspective` in `BusinessCardHero.module.css`: absolute box (`34×34`), `pointer-events: none`, and **`transform-style: preserve-3d`** so the subtree is **not flattened** against `.flipInner` (same class of bug as a flex row without `preserve-3d`).
2. **Parallax + stack + perspective** — one inner `div` combines **`parallaxTiltHost`** + **`markLayered`** + **`.cornerArrow3dHost`**. The module class supplies `translateZ(18px) rotateX(…) rotateY(…)` from CSS variables; `.cornerArrow3dHost` adds **`perspective: 380px`** and `preserve-3d` for the chip’s own depth.
3. **Contact shadow** — `span` with **`markSurfaceShadow`** + **`.cornerArrowShadowDisc`**: full inset, circular fill, sits at **`translateZ(0)`** (from `markSurfaceShadow`).
4. **Lifted chip** — `<button>` with **`.cornerArrowFloating`** + **`markDetachedFloat`**: **`translateZ(40px)`** and the shared **`drop-shadow`** stack from `cardEffects.module.css`. Inset `box-shadow` on `.cornerArrowFloating` keeps the glass rim; large outer shadows stay mostly on **hover** so they do not fight the detached `drop-shadow`s at rest.

Rough DOM (see `BusinessCardHero.tsx` when `shownSide === 'front'`):

```text
.flipInner
  .cornerArrowPerspective
    .parallaxTiltHost.markLayered.cornerArrow3dHost
      span  (markSurfaceShadow + cornerArrowShadowDisc)
      button.cornerArrowFloating.markDetachedFloat
        .cornerArrowStack → face + foil spans
        svg.cornerArrowSvg
```

### Hover motion (chip + icon)

Defined in `BusinessCardHero.module.css`:

| Piece | Mechanism |
|--------|------------|
| Chip | `@keyframes cornerChipHover` on **`:hover`** — `translateZ` / `rotate` / `scale`; **0%** uses **`translateZ(40px)`** so it lines up with **`markDetachedFloat`** when the animation starts. |
| Icon | `@keyframes cornerChipIconJiggle` on the **SVG** child — independent `rotate` wiggle. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables those hover **animations**; pointer tilt is also skipped in JS when `reducedMotion` is true, so `--tilt-x` / `--tilt-y` stay at their defaults on `.tiltArea`. |

### Quick checklist when adding a new lifted mark

1. Mark wrapper: `markLayered` (+ optional `markLayeredOffsetY` for layout nudge — use `translate3d(0, y, 0)` if you ever combine with other transforms on the same node).
2. Two lifted planes: shadow → `markSurfaceShadow` (often on an SVG or a shaped `span`); main → `markDetachedFloat` (and optional lift modifier).
3. Band div: `perspective` + `preserve-3d`.
4. Walk **up the DOM/CSS** from the mark to the tilt host: **no flat-only flex/grid section** should sit in that chain without `preserve-3d` if you need internal Z separation.
5. `.face` uses `overflow: hidden`; extreme `translateZ` or shadows can clip — adjust band size or shadow offsets if needed.
6. To match **pointer parallax** with the title: put **`parallaxTiltHost`** outside the host that carries **`perspective`** + **`markLayered`** (corner chip: `.cornerArrowPerspective` → inner `div` with `parallaxTiltHost` + `markLayered` + `.cornerArrow3dHost`).

### Where it is wired

- **Title marks (SVG):** `TitleMarks.tsx` — `ProjectMarkLayered` (merged), `FocusMarkLayered`, `OnMarkLayered`; bands in `BusinessCardHero.module.css` (`.titleTriProject`, `.titleTriFocus`, `.titleTriOn`, `.titleTriRow2`, `.titleTriRowPixel`).
- **Corner chip:** `BusinessCardHero.tsx` (front-only block under `.flipInner`); styles and keyframes in `BusinessCardHero.module.css` (`.cornerArrow*`, `cornerChipHover`, `cornerChipIconJiggle`).
- **Shared tokens:** `cardEffects.module.css` — `markLayered`, `markSurfaceShadow`, `markDetachedFloat`, `parallaxTiltHost`, foil classes; **`useCardTiltAndFoil.ts`** sets `--tilt-x` / `--tilt-y` on the tilt **area** and applies the main card rotation on the tilt **layer**.
