import type { LatLng } from "@/types";

// cache ในหน่วยความจำ: เส้น Basic เปลี่ยนไม่บ่อย เรียกครั้งเดียวพอ
const cache = new Map<string, LatLng[]>();
const keyOf = (points: LatLng[]) =>
  points.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join("|");

/**
 * ดัดเส้นทางให้เกาะถนน/ทางเท้าจริง ผ่าน ORS (เรียกผ่าน /api/route)
 * - สำเร็จ -> คืนเส้นที่ลัดเลาะถนนจริง
 * - ล้มเหลว/ไม่มี key/เน็ตหลุด -> คืนเส้นตรงเดิม (แอพไม่พัง)
 */
export async function snapToRoads(points: LatLng[]): Promise<LatLng[]> {
  if (points.length < 2) return points;

  const cacheKey = keyOf(points);
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  try {
    const res = await fetch("/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: points }),
    });
    if (!res.ok) return points;

    const data = await res.json();
    const path: LatLng[] = data?.path;
    if (!Array.isArray(path) || path.length < 2) return points;

    cache.set(cacheKey, path);
    return path;
  } catch {
    return points; // fallback เส้นตรงเดิม
  }
}
