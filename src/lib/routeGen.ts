import type { Checkpoint, LatLng, RouteDef } from "@/types";
import { CHECKPOINTS } from "@/data/checkpoints";
import { distanceM, pathLengthM } from "./geo";

export interface AdvanceSelection {
  districts: string[]; // ย่านที่เลือก
  heritage: string[]; // ประเภทมรดกที่สนใจ (ว่าง = เอาทั้งหมด)
  atmosphere: string; // id บรรยากาศ
}

/**
 * สร้างเส้นทางจากตัวเลือกผู้ใช้ (โหมด Advance)
 * - คัดจุดตามย่าน + ประเภทมรดกที่เลือก
 * - เรียงจุดด้วย nearest-neighbour ให้เส้นทางต่อเนื่อง
 * - POC: ลากเส้นตรงระหว่างจุด (ของจริงต่อ routing API เช่น OpenRouteService)
 */
export function generateAdvanceRoute(sel: AdvanceSelection): RouteDef | null {
  let pool: Checkpoint[] = CHECKPOINTS.filter((c) =>
    sel.districts.includes(c.district),
  );
  if (sel.heritage.length > 0) {
    const wanted = pool.filter((c) => sel.heritage.includes(c.heritage));
    // ถ้ากรองแล้วเหลือน้อยเกินไป ให้คงจุดในย่านไว้ทั้งหมด
    if (wanted.length >= 2) pool = wanted;
  }
  if (pool.length < 2) return null;

  // เรียงด้วย nearest-neighbour เริ่มจากจุดเหนือสุด
  const remaining = [...pool];
  remaining.sort((a, b) => b.ll[0] - a.ll[0]);
  const ordered: Checkpoint[] = [remaining.shift()!];
  while (remaining.length) {
    const last = ordered[ordered.length - 1].ll;
    let bestIdx = 0;
    let bestD = Infinity;
    remaining.forEach((c, i) => {
      const d = distanceM(last, c.ll);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    });
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }

  const path: LatLng[] = ordered.map((c) => c.ll);
  const km = +(pathLengthM(path) / 1000).toFixed(2);

  return {
    id: `advance-${Date.now()}`,
    name: "เส้นทางของฉัน (Advance)",
    desc: `${ordered.length} จุด • ย่าน ${sel.districts.join(", ")}`,
    atmosphere: sel.atmosphere,
    distanceKm: km,
    kind: "advance",
    checkpointIds: ordered.map((c) => c.id),
    path,
  };
}
