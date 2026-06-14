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
