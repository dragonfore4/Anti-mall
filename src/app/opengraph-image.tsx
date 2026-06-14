import { ImageResponse } from "next/og";

// OG card 1200×630 (โผล่ตอนแชร์ลิงก์ใน LINE/FB/X) — ธีมกระดาษสา
export const alt = "วิ่งรอบเกาะรัตนโกสินทร์";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ใช้ IBM Plex Sans Thai (static) — Satori เรนเดอร์สระ/วรรณยุกต์ไทยได้ถูกตำแหน่ง
// (Chonburi/Sarabun ทำ mark-positioning ใน Satori เพี้ยน)
const FONT_BASE = "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansthai";

export default async function OpengraphImage() {
  const [regular, bold] = await Promise.all([
    fetch(`${FONT_BASE}/IBMPlexSansThai-Regular.ttf`).then((r) => r.arrayBuffer()),
    fetch(`${FONT_BASE}/IBMPlexSansThai-Bold.ttf`).then((r) => r.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4ecdd",
          color: "#2a2118",
          fontFamily: "IBM Plex Sans Thai",
          padding: "70px 80px",
          border: "16px solid #b23a2e",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 8,
              color: "#b23a2e",
              textTransform: "uppercase",
            }}
          >
            รัตนโกสินทร์ · ANTI-MALL CLUB
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontWeight: 700,
              fontSize: 108,
              lineHeight: 1.08,
              color: "#b23a2e",
              marginTop: 26,
            }}
          >
            <span>วิ่งรอบเกาะ</span>
            <span>รัตนโกสินทร์</span>
          </div>
          <div style={{ display: "flex", fontSize: 36, color: "#7a6f5d", marginTop: 34, maxWidth: 940 }}>
            ทิ้งห้างแอร์ มาวิ่งเมืองเก่า — GPS · สะสมแต้ม · สแกน QR เก็บเหรียญสถานที่
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 700, color: "#c9962b" }}>
            ⭐ anti-mall.vercel.app
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#7a6f5d" }}>๑๐ จุดมรดก · ๓ เส้นทาง</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "IBM Plex Sans Thai", data: regular, style: "normal", weight: 400 },
        { name: "IBM Plex Sans Thai", data: bold, style: "normal", weight: 700 },
      ],
    },
  );
}
