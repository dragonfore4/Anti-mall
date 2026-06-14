# Run Recap Card — Design Spec

**Date:** 2026-06-14
**Status:** Approved for planning

## Goal

After finishing a run, let the user generate a shareable recap image of that
run, then **save it as a picture** and **share it** (share sheet → Instagram /
LINE / etc.). Bundled: fix the Thai font rendering bug in the existing OG image.

Gen-Z motivation: every share is organic growth, and the run's stats + route
trace make a personal, post-worthy artifact.

## Decisions (locked)

- **Layout:** "Big numbers" (distance dominant, trace as a thumbnail). Layout B
  from brainstorming mockups.
- **Aspect ratio:** 1080×1920 (Instagram Story, 9:16).
- **Font:** Noto Sans Thai, for both the recap card and the OG image.
- **Rendering:** client-side `<canvas>` (Canvas 2D API), not `next/og` or
  `html-to-image`. Rationale: produces a Blob directly (needed for both save and
  Web Share files), Thai shapes correctly via the browser's native text engine
  (avoids Satori mark-positioning issues), works offline, no new dependency.
- **IG reality:** the web cannot post directly into an IG Story. We generate the
  PNG and hand it to the native share sheet; the user selects Instagram and
  places it. This matches the note in the root `CLAUDE.md`.

## Architecture

Three units, with the gnarly canvas code isolated from React.

### `src/lib/recapCard.ts` — pure draw module

```
export interface RecapData {
  routeName: string;
  km: string;            // already formatted, e.g. "5.24"
  time: string;          // formatted "32:10"
  calories: number;
  steps: number;
  points: number;
  medals: { emoji: string }[];
  trace: LatLng[];       // the real GPS polyline
}

export async function drawRecapCard(
  canvas: HTMLCanvasElement,
  data: RecapData,
): Promise<void>;
```

- No React, no store imports — given a canvas + data, draws Layout B.
- Sets canvas backing size to a fixed **1080×1920** (independent of screen).
- Loads Noto Sans Thai via the `FontFace` API, `await document.fonts.ready`
  before any `fillText`. On fetch failure, falls back to system sans (Thai still
  shapes correctly; only the typeface differs).
- Independently testable: call with fixture data, assert it resolves and the
  canvas is non-blank.

### `src/components/RecapShareModal.tsx` — thin UI

- Props: `RecapData` + `onClose`.
- Owns a hidden full-res `<canvas>`; on mount calls `drawRecapCard`, then shows a
  CSS-scaled-down preview of it.
- Two action buttons: **บันทึกรูป** (Save) and **แชร์** (Share).
- Redraws fresh each open (no stale canvas).

### `src/components/SummaryModal.tsx` — minimal change

- The existing **"แชร์ลง Story"** button opens `RecapShareModal` instead of
  firing the current text-only `navigator.share`.
- Run page passes the data it already has (`km`, time, calories, steps, points,
  checked-in medals, `trace`) into the modal.

## The card layout (1080×1920)

On `#f4ecdd` paper with a `#b23a2e` border, top → bottom:

1. Kicker `รัตนโกสินทร์ · ANTI-MALL CLUB` — **no letter-spacing on Thai**.
2. Giant distance number (`5.24`) in accent red, with
   `กิโลเมตร · <route name>` beneath.
3. Row of three stats: เวลา / แคล / ก้าว.
4. Trace thumbnail panel: blue run polyline auto-fit into the panel.
5. Footer: `🏆 <points> แต้ม · <n> เหรียญ` (left), `⭐ anti-mall.vercel.app`
   (right).

All text in Noto Sans Thai. Colors reuse the OG palette: bg `#f4ecdd`, ink
`#2a2118`, accent `#b23a2e`, accent2 `#c9962b`, muted `#7a6f5d`, trace `#1d4ed8`.

### Trace projection

- Equirectangular: `x ∝ lng·cos(latMid)`, `y ∝ -lat`.
- Compute bounding box → uniform scale to fit the panel with padding → center.
- Draw start pin (and finish flag if multiple points).
- **Edge cases:** empty trace → draw nothing in panel (no crash). Single point →
  start pin only.

## Save & Share

Both derive from `canvas.toBlob(cb, 'image/png')`.

- **Save:** object URL + temporary `<a download="recap-<route>-<date>.png">`,
  click, revoke URL. Works on Android/desktop; on iOS the Share path is primary.
- **Share:** guard with `navigator.canShare?.({ files:[file] })`; if ok,
  `navigator.share({ files:[file], text })` where `text` is the caption +
  `#วิ่งรอบเกาะรัตนโกสินทร์`. Share sheet opens; user picks Instagram.
- **Fallback** (no Web Share files support, e.g. desktop Chrome): hide Share,
  show Save plus a "long-press to save on mobile" hint. No dead buttons.

## Error handling

- Font fetch fails → system-sans fallback, card still renders.
- `toBlob` null → toast "สร้างรูปไม่สำเร็จ ลองใหม่" + retry button (mirrors the
  existing save-retry pattern on the run page).
- Fixed 1080×1920 backing store, CSS-scaled preview → crisp output, ~150–300 KB.

## OG image font fix (`src/app/opengraph-image.tsx`)

- Remove `letterSpacing: 8` from the Thai kicker (the cause of detached
  tone marks/vowels in the current image).
- Swap embedded font IBM Plex Sans Thai → Noto Sans Thai (same `fetch`
  arrayBuffer + `fonts` array pattern; update the font URL and `name`).

## Scope

**In:** Layout B recap card, Noto Sans Thai, save, share-sheet, OG font fix.

**Out (deferred):** customizable stickers/themes, multiple layouts, square/feed
variant, server-side rendering variant.

## Testing / verification

- Unit: `drawRecapCard` with fixture `RecapData` (incl. empty + single-point
  trace) resolves and yields a non-blank canvas.
- `npm run build` (TypeScript across the project — the repo's pass/fail check).
- Manual: finish a sim run → open recap → preview matches Layout B → Save
  downloads a PNG → Share opens the share sheet (mobile). Verify OG image marks
  are correct via opengraph.xyz after deploy.
