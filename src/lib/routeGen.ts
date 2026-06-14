import type { Checkpoint, RouteDef } from "@/types";
import { CHECKPOINTS } from "@/data/checkpoints";
import { distanceM, legCaloriesFromPath, metersToKm, pathLengthM } from "./geo";

export interface AdvanceSelection {
  districts: string[]; // ย่านที่เลือก
  heritage: string[]; // ประเภทมรดกที่สนใจ (ว่าง = เอาทั้งหมดในย่าน)
  atmosphere: string; // id บรรยากาศ
}

/**
 * คัดจุดตามตัวเลือกผู้ใช้: เอาเฉพาะย่านที่เลือก แล้วกรองด้วยประเภทมรดก
 * ถ้ากรองมรดกแล้วเหลือ < 2 จุด ให้คงจุดทั้งหมดในย่านไว้ (กันเส้นทางสั้นเกิน)
 */
function pickCheckpoints(sel: AdvanceSelection): Checkpoint[] {
  const inDistricts = CHECKPOINTS.filter((c) => sel.districts.includes(c.district));
  if (sel.heritage.length === 0) return inDistricts;

  const byHeritage = inDistricts.filter((c) => sel.heritage.includes(c.heritage));
  return byHeritage.length >= 2 ? byHeritage : inDistricts;
}

/**
 * เรียงจุดให้เส้นทางต่อเนื่องด้วย nearest-neighbour
 * เริ่มจากจุดเหนือสุด แล้วไล่หยิบจุดที่ใกล้จุดล่าสุดที่สุดไปเรื่อย ๆ
 */
function orderByNearestNeighbour(checkpoints: Checkpoint[]): Checkpoint[] {
  const remaining = [...checkpoints].sort((a, b) => b.ll[0] - a.ll[0]); // เหนือสุดก่อน
  const ordered: Checkpoint[] = [remaining.shift()!];

  while (remaining.length) {
    const from = ordered[ordered.length - 1].ll;
    let nearest = 0;
    let nearestD = Infinity;
    remaining.forEach((c, i) => {
      const d = distanceM(from, c.ll);
      if (d < nearestD) {
        nearestD = d;
        nearest = i;
      }
    });
    ordered.push(remaining.splice(nearest, 1)[0]);
  }
  return ordered;
}

/**
 * สร้างเส้นทางจากตัวเลือกผู้ใช้ (โหมด Advance) — คืน null ถ้าได้จุดไม่ถึง 2
 * path เป็นแค่เส้นตรงเชื่อมหมุด หน้าวิ่งจะให้ ORS ดัดให้เกาะถนนอีกที
 */
export function generateAdvanceRoute(sel: AdvanceSelection): RouteDef | null {
  const picked = pickCheckpoints(sel);
  if (picked.length < 2) return null;

  const ordered = orderByNearestNeighbour(picked);
  const path = ordered.map((c) => c.ll);

  return {
    id: `advance-${Date.now()}`,
    name: "เส้นทางของฉัน (Advance)",
    desc: `${ordered.length} จุด • ย่าน ${sel.districts.join(", ")}`,
    atmosphere: sel.atmosphere,
    distanceKm: metersToKm(pathLengthM(path)),
    // Advance สร้างสด ๆ กรอกเองไม่ได้ -> คิดแคลต่อช่วงจากระยะให้
    legCal: legCaloriesFromPath(path),
    kind: "advance",
    checkpointIds: ordered.map((c) => c.id),
    path,
  };
}
