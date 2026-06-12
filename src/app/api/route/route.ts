import type { NextRequest } from "next/server";

/**
 * Proxy เรียก OpenRouteService (foot-walking) ฝั่ง server
 * - รับจุดเป็น [lat, lng] (ลำดับแบบ Leaflet) -> แปลงเป็น [lng, lat] ให้ ORS
 * - คืนเส้นทางที่เกาะถนนจริงเป็น [lat, lng]
 * - เก็บ API key ไว้ฝั่ง server (env) ไม่หลุดไป client
 */
export async function POST(req: NextRequest) {
  const key = process.env.ORS_API_KEY;
  if (!key) {
    return Response.json({ error: "ORS_API_KEY ไม่ได้ตั้งค่า" }, { status: 500 });
  }

  let coordinates: [number, number][];
  try {
    const body = await req.json();
    coordinates = body.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return Response.json({ error: "ต้องมีอย่างน้อย 2 จุด" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "body ไม่ถูกต้อง" }, { status: 400 });
  }

  // ORS ใช้ลำดับ [lng, lat]
  const orsCoords = coordinates.map(([lat, lng]) => [lng, lat]);

  try {
    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
      {
        method: "POST",
        headers: {
          Authorization: key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coordinates: orsCoords }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      return Response.json({ error: "ORS error", detail }, { status: res.status });
    }

    const data = await res.json();
    const line: [number, number][] = data?.features?.[0]?.geometry?.coordinates ?? [];
    // แปลงกลับเป็น [lat, lng]
    const path = line.map(([lng, lat]) => [lat, lng]);

    if (path.length < 2) {
      return Response.json({ error: "ORS ไม่คืนเส้นทาง" }, { status: 502 });
    }

    return Response.json({ path });
  } catch (e) {
    return Response.json({ error: "เรียก ORS ไม่สำเร็จ", detail: String(e) }, { status: 502 });
  }
}
