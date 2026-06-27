import { ImageResponse } from "next/og";
import { NOTO_FONT_URLS, NOTO_FAMILY } from "@/lib/notoSansThai";

// OG card 1200×630 (โผล่ตอนแชร์ลิงก์ใน LINE/FB/X) — ธีม YOUNG vibes (ม่วง/เหลือง/ส้ม)
export const alt = "วิ่งรอบเกาะรัตนโกสินทร์";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [thai400, thai700, latin400, latin700] = await Promise.all([
    fetch(NOTO_FONT_URLS.thai400).then((r) => r.arrayBuffer()),
    fetch(NOTO_FONT_URLS.thai700).then((r) => r.arrayBuffer()),
    fetch(NOTO_FONT_URLS.latin400).then((r) => r.arrayBuffer()),
    fetch(NOTO_FONT_URLS.latin700).then((r) => r.arrayBuffer()),
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
          background: "#3b1a4e",
          color: "#fdf7ea",
          fontFamily: NOTO_FAMILY,
          padding: "70px 80px",
          border: "16px solid #f44e03",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#ffe956",
              textTransform: "uppercase",
            }}
          >
            YOUNG vibes · รัตนโกสินทร์
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontWeight: 700,
              fontSize: 108,
              lineHeight: 1.08,
              color: "#ffe956",
              marginTop: 26,
            }}
          >
            <span>วิ่งรอบเกาะ</span>
            <span>รัตนโกสินทร์</span>
          </div>
          <div style={{ display: "flex", fontSize: 36, color: "#b6a9cf", marginTop: 34, maxWidth: 940 }}>
            ทิ้งห้างแอร์ มาวิ่งเมืองเก่า — GPS · สะสมแต้ม · สแกน QR เก็บเหรียญสถานที่
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 700, color: "#ffe956" }}>
            ⭐ anti-mall.vercel.app
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#b6a9cf" }}>๑๐ จุดมรดก · ๓ เส้นทาง</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: NOTO_FAMILY, data: thai400, style: "normal", weight: 400 },
        { name: NOTO_FAMILY, data: thai700, style: "normal", weight: 700 },
        { name: NOTO_FAMILY, data: latin400, style: "normal", weight: 400 },
        { name: NOTO_FAMILY, data: latin700, style: "normal", weight: 700 },
      ],
    },
  );
}
