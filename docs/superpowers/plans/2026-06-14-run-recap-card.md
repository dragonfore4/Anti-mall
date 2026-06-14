# Run Recap Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After finishing a run, let the user generate a 9:16 recap image (Layout B), save it as a PNG, and share it via the native share sheet; plus fix the Thai font in the existing OG image.

**Architecture:** A pure client-side canvas draw module (`drawRecapCard`) renders the card at a fixed 1080×1920 backing size. A thin React modal (`RecapShareModal`) owns the canvas, shows a scaled preview, and wires Save (download) + Share (Web Share files). The run summary's existing "แชร์ลง Story" button opens the modal. Shared font URLs (Noto Sans Thai, fontsource woff) are reused by both the canvas and the server-side OG image.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Canvas 2D API, `FontFace` API, Web Share API (files), `next/og` (Satori) for the OG image. Noto Sans Thai via jsDelivr/fontsource woff.

**Note on testing:** This repo has **no test runner** (per `web/CLAUDE.md` — verification is `npm run build` for types + manual browser check). Canvas rendering also needs a real DOM. So tasks verify with `npm run build` and explicit manual steps rather than a unit-test framework. Do not add a test runner.

---

## File Structure

- **Create** `src/lib/notoSansThai.ts` — shared Noto Sans Thai font URLs + a browser `loadNotoSansThai()` helper (registers `FontFace`s). Used by both the canvas module and the OG route.
- **Create** `src/lib/recapCard.ts` — `RecapData` interface + pure `drawRecapCard(canvas, data)` (Layout B + trace projection). No React, no store.
- **Create** `src/components/RecapShareModal.tsx` — modal owning the canvas; preview + Save + Share + fallback.
- **Modify** `src/components/SummaryModal.tsx` — "แชร์ลง Story" opens the modal instead of firing text-only share.
- **Modify** `src/app/run/[routeId]/page.tsx` — build `RecapData` from the store + `checkpointById`, render `RecapShareModal`.
- **Modify** `src/app/opengraph-image.tsx` — swap font to Noto Sans Thai, remove the Thai letter-spacing bug.

---

## Task 1: Shared Noto Sans Thai font module

**Files:**
- Create: `src/lib/notoSansThai.ts`

- [ ] **Step 1: Create the font module**

Create `src/lib/notoSansThai.ts`:

```ts
// Noto Sans Thai (fontsource woff, served by jsDelivr) — shared by the OG image
// (Satori, server-side fetch) and the recap card (browser FontFace).
// We load BOTH the "thai" and "latin" subsets under one family so mixed
// Thai+Latin+digit strings (e.g. "รัตนโกสินทร์ · ANTI-MALL CLUB", "5.24") render fully.
const BASE = "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-thai@5/files";

export const NOTO_FONT_URLS = {
  thai400: `${BASE}/noto-sans-thai-thai-400-normal.woff`,
  thai700: `${BASE}/noto-sans-thai-thai-700-normal.woff`,
  latin400: `${BASE}/noto-sans-thai-latin-400-normal.woff`,
  latin700: `${BASE}/noto-sans-thai-latin-700-normal.woff`,
} as const;

export const NOTO_FAMILY = "Noto Sans Thai";

let loadPromise: Promise<void> | null = null;

/**
 * Register Noto Sans Thai for canvas drawing. Idempotent (memoized).
 * On any fetch failure, resolves anyway — canvas falls back to system sans,
 * Thai still shapes correctly, only the typeface differs.
 */
export function loadNotoSansThai(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const faces = [
      new FontFace(NOTO_FAMILY, `url(${NOTO_FONT_URLS.thai400})`, { weight: "400" }),
      new FontFace(NOTO_FAMILY, `url(${NOTO_FONT_URLS.thai700})`, { weight: "700" }),
      new FontFace(NOTO_FAMILY, `url(${NOTO_FONT_URLS.latin400})`, { weight: "400" }),
      new FontFace(NOTO_FAMILY, `url(${NOTO_FONT_URLS.latin700})`, { weight: "700" }),
    ];
    try {
      await Promise.all(
        faces.map(async (f) => {
          await f.load();
          document.fonts.add(f);
        }),
      );
      await document.fonts.ready;
    } catch {
      /* fall back to system sans */
    }
  })();
  return loadPromise;
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run build`
Expected: build succeeds (no TypeScript errors). `FontFace`/`document.fonts` are standard DOM lib types.

- [ ] **Step 3: Commit**

```bash
git add src/lib/notoSansThai.ts
git commit -m "feat: add shared Noto Sans Thai font module"
```

---

## Task 2: Pure recap card draw module

**Files:**
- Create: `src/lib/recapCard.ts`

- [ ] **Step 1: Create the draw module**

Create `src/lib/recapCard.ts`:

```ts
import type { LatLng } from "@/types";
import { NOTO_FAMILY, loadNotoSansThai } from "@/lib/notoSansThai";

export interface RecapData {
  routeName: string;
  km: string; // pre-formatted, e.g. "5.24"
  time: string; // pre-formatted, e.g. "32:10"
  calories: number;
  steps: number;
  points: number;
  medals: { emoji: string }[];
  trace: LatLng[]; // real GPS polyline [lat, lng][]
}

const W = 1080;
const H = 1920;
const COLOR = {
  paper: "#f4ecdd",
  panel: "#efe4ce",
  line: "#d8caab",
  ink: "#2a2118",
  accent: "#b23a2e",
  accent2: "#c9962b",
  muted: "#7a6f5d",
  trace: "#1d4ed8",
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTrace(ctx: CanvasRenderingContext2D, trace: LatLng[], panel: { x: number; y: number; w: number; h: number }) {
  if (!trace || trace.length === 0) return;
  const pad = 80;
  const latMid = trace.reduce((s, p) => s + p[0], 0) / trace.length;
  const k = Math.cos((latMid * Math.PI) / 180);
  const pts = trace.map(([lat, lng]) => ({ x: lng * k, y: -lat }));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const bw = maxX - minX || 1e-6;
  const bh = maxY - minY || 1e-6;
  const availW = panel.w - pad * 2;
  const availH = panel.h - pad * 2;
  const scale = Math.min(availW / bw, availH / bh);
  const offX = panel.x + pad + (availW - bw * scale) / 2;
  const offY = panel.y + pad + (availH - bh * scale) / 2;
  const tx = (p: { x: number; y: number }) => ({ x: offX + (p.x - minX) * scale, y: offY + (p.y - minY) * scale });

  if (trace.length >= 2) {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const q = tx(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.strokeStyle = COLOR.trace;
    ctx.lineWidth = 16;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // start pin
  const start = tx(pts[0]);
  ctx.fillStyle = COLOR.accent;
  ctx.beginPath();
  ctx.arc(start.x, start.y, 20, 0, Math.PI * 2);
  ctx.fill();

  // finish flag
  if (trace.length >= 2) {
    const end = tx(pts[pts.length - 1]);
    ctx.fillStyle = COLOR.accent2;
    ctx.fillRect(end.x - 16, end.y - 16, 32, 32);
  }
}

/** Draw the Layout B recap card at a fixed 1080×1920. Loads fonts first. */
export async function drawRecapCard(canvas: HTMLCanvasElement, data: RecapData): Promise<void> {
  await loadNotoSansThai();
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const F = (weight: 400 | 700, size: number) => `${weight} ${size}px "${NOTO_FAMILY}"`;
  const PADX = 90;

  // background + border
  ctx.fillStyle = COLOR.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = COLOR.accent;
  ctx.lineWidth = 28;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // kicker (NO letter-spacing on Thai)
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLOR.accent;
  ctx.font = F(700, 30);
  ctx.fillText("รัตนโกสินทร์ · ANTI-MALL CLUB", PADX, 160);

  // giant distance
  ctx.textAlign = "center";
  ctx.fillStyle = COLOR.accent;
  ctx.font = F(700, 300);
  ctx.fillText(data.km, W / 2, 580);
  ctx.fillStyle = COLOR.muted;
  ctx.font = F(400, 42);
  ctx.fillText(`กิโลเมตร · ${data.routeName}`, W / 2, 650);

  // three stats row
  const stats = [
    { v: data.time, l: "เวลา" },
    { v: String(data.calories), l: "แคลอรี่" },
    { v: data.steps.toLocaleString(), l: "ก้าว" },
  ];
  const colW = (W - PADX * 2) / 3;
  stats.forEach((s, i) => {
    const cx = PADX + colW * i + colW / 2;
    ctx.fillStyle = COLOR.ink;
    ctx.font = F(700, 72);
    ctx.fillText(s.v, cx, 790);
    ctx.fillStyle = COLOR.muted;
    ctx.font = F(400, 32);
    ctx.fillText(s.l, cx, 845);
  });

  // trace panel
  const panel = { x: PADX, y: 910, w: W - PADX * 2, h: 740 };
  ctx.fillStyle = COLOR.panel;
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 28);
  ctx.fill();
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 3;
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 28);
  ctx.stroke();
  drawTrace(ctx, data.trace, panel);

  // footer
  ctx.textAlign = "left";
  ctx.fillStyle = COLOR.ink;
  ctx.font = F(700, 38);
  ctx.fillText(`🏆 ${data.points} แต้ม · ${data.medals.length} เหรียญ`, PADX, 1760);
  ctx.textAlign = "right";
  ctx.fillStyle = COLOR.accent2;
  ctx.font = F(700, 38);
  ctx.fillText("⭐ anti-mall.vercel.app", W - PADX, 1760);
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run build`
Expected: build succeeds. (Module is imported nowhere yet, but TypeScript still checks the file.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/recapCard.ts
git commit -m "feat: add pure recap card canvas draw module"
```

---

## Task 3: Recap share modal component

**Files:**
- Create: `src/components/RecapShareModal.tsx`

- [ ] **Step 1: Create the modal**

Create `src/components/RecapShareModal.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { drawRecapCard, type RecapData } from "@/lib/recapCard";

interface Props {
  data: RecapData;
  onClose: () => void;
}

export default function RecapShareModal({ data, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  // draw once on mount
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawRecapCard(canvas, data)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

  // detect Web Share (files) support — probe with a tiny dummy file
  useEffect(() => {
    try {
      const probe = new File(["x"], "x.png", { type: "image/png" });
      setCanShareFiles(!!navigator.canShare && navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  const toBlob = () =>
    new Promise<Blob | null>((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve(null);
      canvas.toBlob((b) => resolve(b), "image/png");
    });

  const fileName = `recap-${data.routeName}-${data.km}km.png`.replace(/\s+/g, "-");

  const onSave = async () => {
    const blob = await toBlob();
    if (!blob) return setError(true);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onShare = async () => {
    const blob = await toBlob();
    if (!blob) return setError(true);
    const file = new File([blob], fileName, { type: "image/png" });
    const text = `🏃 ฉันวิ่ง "${data.routeName}" ${data.km} กม. ได้ ${data.points} แต้ม! #วิ่งรอบเกาะรัตนโกสินทร์`;
    try {
      await navigator.share({ files: [file], text });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink/80 p-5 backdrop-blur-sm">
      <div className="card-paper rise flex max-h-[92dvh] w-full max-w-[360px] flex-col rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="kicker text-[11px] text-accent2">การ์ดสรุปผล</div>
          <button onClick={onClose} className="text-xl text-muted active:scale-90" aria-label="ปิด">
            ✕
          </button>
        </div>

        {/* preview: full-res canvas scaled down by CSS */}
        <div className="relative flex-1 overflow-hidden rounded-xl border border-line bg-card2">
          <canvas ref={canvasRef} className="h-auto w-full" />
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">กำลังสร้างรูป…</div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center justify-center gap-3 rounded-xl border border-accent bg-accent/8 p-2.5 text-xs text-accent">
            สร้างรูปไม่สำเร็จ
            <button
              onClick={() => canvasRef.current && drawRecapCard(canvasRef.current, data).then(() => { setError(false); setReady(true); }).catch(() => setError(true))}
              className="font-bold underline underline-offset-2"
            >
              ลองใหม่
            </button>
          </div>
        )}

        <div className="mt-3 flex gap-2.5">
          <button
            onClick={onSave}
            disabled={!ready}
            className="flex-1 rounded-xl border border-line bg-card2 p-3.5 font-bold active:scale-95 disabled:opacity-50"
          >
            ⬇ บันทึกรูป
          </button>
          {canShareFiles && (
            <button
              onClick={onShare}
              disabled={!ready}
              className="flex-1 rounded-xl bg-gradient-to-br from-accent to-accent2 p-3.5 font-bold text-card active:scale-95 disabled:opacity-50"
            >
              แชร์
            </button>
          )}
        </div>
        {!canShareFiles && (
          <p className="mt-2 text-center text-[11px] text-muted">บนมือถือ: กดค้างที่รูปเพื่อบันทึก แล้วโพสต์ลง IG Story ได้</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run build`
Expected: build succeeds. (Imported nowhere yet; TypeScript still checks it.)

- [ ] **Step 3: Commit**

```bash
git add src/components/RecapShareModal.tsx
git commit -m "feat: add recap share modal (preview, save, share)"
```

---

## Task 4: Wire the modal into the run summary

**Files:**
- Modify: `src/components/SummaryModal.tsx`
- Modify: `src/app/run/[routeId]/page.tsx`

- [ ] **Step 1: Change SummaryModal's share button to a generic callback**

In `src/components/SummaryModal.tsx`, the `onShare` prop already exists and the button already calls it. **No change needed to the prop** — we will repoint `onShare` on the page to open the modal. Confirm the button block reads:

```tsx
<button
  onClick={onShare}
  className="flex-1 rounded-xl bg-gradient-to-br from-accent to-accent2 p-3.5 font-bold tracking-wide text-card active:scale-95"
>
  แชร์ลง Story
</button>
```

(If it matches, this file needs no edit. The wiring happens on the page.)

- [ ] **Step 2: Import the modal, helpers, and add state on the run page**

In `src/app/run/[routeId]/page.tsx`, add these imports near the other component imports (after the `SummaryModal` import):

```tsx
import RecapShareModal from "@/components/RecapShareModal";
import type { RecapData } from "@/lib/recapCard";
import { checkpointById } from "@/data/checkpoints";
```

Add a state flag alongside the other `useState` hooks in the component (near `scanning`):

```tsx
const [showRecap, setShowRecap] = useState(false);
```

- [ ] **Step 3: Replace the text-only `onShare` with one that opens the recap modal**

In `src/app/run/[routeId]/page.tsx`, find the existing `onShare` (around lines 165-178) that builds `text` and calls `navigator.share({ title, text })`. Replace the whole `onShare` function with:

```tsx
const onShare = () => setShowRecap(true);

// ข้อมูลสำหรับการ์ดสรุปผล (สร้างเมื่อจบ)
const recapData: RecapData | null = route
  ? {
      routeName: route.name,
      km,
      time: formatTime(s.elapsedMs),
      calories: s.calories,
      steps: steps(s.distanceM),
      points: s.points,
      medals: s.checkedIn
        .map((id) => checkpointById(id))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .map((c) => ({ emoji: c.emoji })),
      trace: s.trace,
    }
  : null;
```

- [ ] **Step 4: Render the modal near the other finished-state overlays**

In `src/app/run/[routeId]/page.tsx`, just before the QR scan overlay line (`{scanning && <ScanOverlay ... />}`), add:

```tsx
{showRecap && recapData && <RecapShareModal data={recapData} onClose={() => setShowRecap(false)} />}
```

- [ ] **Step 5: Verify it type-checks**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Manual verification (simulated run)**

Run: `npm run dev`, open http://localhost:3000, start any Basic route, choose **จำลองวิ่ง**, let it finish.
Expected:
- Summary modal shows; tap **แชร์ลง Story** → recap modal opens.
- Preview shows Layout B: giant km, three stats, the blue trace thumbnail, footer with points/medals + url. Thai text is crisp with correct tone marks (no detached marks).
- **บันทึกรูป** downloads a `recap-*.png`. Open it — it is 1080×1920 and matches the preview.
- On desktop Chrome (no Web Share files): the **แชร์** button is hidden and the long-press hint shows. (On a real phone via the cloudflared tunnel, **แชร์** opens the share sheet.)

- [ ] **Step 7: Commit**

```bash
git add src/app/run/[routeId]/page.tsx src/components/SummaryModal.tsx
git commit -m "feat: open recap share card from run summary"
```

---

## Task 5: Fix OG image font (Noto Sans Thai, no letter-spacing)

**Files:**
- Modify: `src/app/opengraph-image.tsx`

- [ ] **Step 1: Swap the font source to Noto Sans Thai (thai + latin subsets)**

In `src/app/opengraph-image.tsx`, replace the `FONT_BASE` constant and the font `fetch` block (lines ~10-16) with:

```tsx
import { NOTO_FONT_URLS } from "@/lib/notoSansThai";

// ...

export default async function OpengraphImage() {
  const [thai400, thai700, latin400, latin700] = await Promise.all([
    fetch(NOTO_FONT_URLS.thai400).then((r) => r.arrayBuffer()),
    fetch(NOTO_FONT_URLS.thai700).then((r) => r.arrayBuffer()),
    fetch(NOTO_FONT_URLS.latin400).then((r) => r.arrayBuffer()),
    fetch(NOTO_FONT_URLS.latin700).then((r) => r.arrayBuffer()),
  ]);
```

- [ ] **Step 2: Update the `fontFamily` and the `fonts` array**

In the same file, change the root `<div>` style `fontFamily: "IBM Plex Sans Thai"` to:

```tsx
fontFamily: "Noto Sans Thai",
```

And replace the `fonts` array in the `ImageResponse` options with (covers Thai + Latin at both weights):

```tsx
fonts: [
  { name: "Noto Sans Thai", data: thai400, style: "normal", weight: 400 },
  { name: "Noto Sans Thai", data: thai700, style: "normal", weight: 700 },
  { name: "Noto Sans Thai", data: latin400, style: "normal", weight: 400 },
  { name: "Noto Sans Thai", data: latin700, style: "normal", weight: 700 },
],
```

- [ ] **Step 3: Remove the letter-spacing that breaks Thai marks**

In the kicker `<div>` style (the one containing `รัตนโกสินทร์ · ANTI-MALL CLUB`), **delete** the line:

```tsx
letterSpacing: 8,
```

Leave the rest of that style (fontSize, fontWeight 700, color, textTransform) unchanged.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manual verification of the OG image**

Run: `npm run dev`, then open http://localhost:3000/opengraph-image in the browser.
Expected: the 1200×630 card renders; the kicker line "รัตนโกสินทร์ · ANTI-MALL CLUB" now has **correctly attached** Thai tone marks/vowels (no floating marks), in Noto Sans Thai. The big title and body also render in Noto Sans Thai with correct marks.

- [ ] **Step 6: Commit**

```bash
git add src/app/opengraph-image.tsx
git commit -m "fix: OG image uses Noto Sans Thai, drop Thai letter-spacing"
```

---

## Self-Review Notes

- **Spec coverage:** Layout B card (Task 2/3), 1080×1920 (Task 2 `W`/`H`), Noto Sans Thai (Task 1, used in 2/3/5), client canvas (Task 2/3), save (Task 3 `onSave`), share-sheet (Task 3 `onShare` + `canShareFiles` fallback), trace projection + empty/single-point edge cases (Task 2 `drawTrace`), font-fail fallback (Task 1 try/catch), toBlob-null retry (Task 3 `error` state), OG font fix incl. letter-spacing removal (Task 5). All spec sections map to a task.
- **Type consistency:** `RecapData` defined in Task 2, imported unchanged in Tasks 3 & 4. `drawRecapCard(canvas, data)` signature consistent across Tasks 2–4. `loadNotoSansThai` / `NOTO_FONT_URLS` / `NOTO_FAMILY` from Task 1 used consistently in Tasks 2 & 5. `checkpointById(id)` returns `Checkpoint | undefined`; medals mapping filters undefined before reading `.emoji`.
- **No placeholders:** every code step contains full code; manual steps state exact URLs and expected results.
