import type { LatLng, RouteDef } from "@/types";
import { checkpointById } from "@/data/checkpoints";
import { pathLengthM } from "@/lib/geo";

/** พิกัดหมุดเรียงตามลำดับ -> เส้นทางเริ่มต้น (เส้นตรง ก่อนถูก ORS ดัดให้เกาะถนน) */
export function checkpointPath(checkpointIds: string[]): LatLng[] {
  return checkpointIds
    .map((id) => checkpointById(id)?.ll)
    .filter((ll): ll is LatLng => Boolean(ll));
}

/** ข้อมูลที่ต้องกรอกตอนนิยามเส้นทาง Basic — path/distanceKm/kind คำนวณให้อัตโนมัติ */
type BasicSpec = Omit<RouteDef, "path" | "distanceKm" | "kind"> & {
  path?: LatLng[]; // ใส่เองได้ถ้าอยากแทรกจุดวิวพิเศษ ปกติเว้นไว้ให้ derive จากหมุด
  distanceKm?: number; // ใส่เองได้ถ้าอยากตรึงเลขสวย ๆ ปกติคำนวณจากเส้นทาง
};

/** สร้าง RouteDef จาก spec สั้น ๆ — เติม path + ระยะทาง + kind ให้เอง */
function basic(spec: BasicSpec): RouteDef {
  const path = spec.path ?? checkpointPath(spec.checkpointIds);
  return {
    ...spec,
    kind: "basic",
    path,
    distanceKm: spec.distanceKm ?? +(pathLengthM(path) / 1000).toFixed(2),
  };
}

/**
 * เส้นทาง Basic สำเร็จรูป
 * เพิ่มเส้นใหม่: ก๊อป block แล้วใส่ id/name/desc/atmosphere + เรียง checkpointIds
 * ไม่ต้องพิมพ์พิกัด path เอง (derive จากหมุดให้อัตโนมัติ)
 */
export const BASIC_ROUTES: RouteDef[] = [
  basic({
    id: "grand-loop",
    name: "รอบเกาะรัตนโกสินทร์ (เต็มเส้น)",
    desc: "วิ่งครบทุกหมุดมรดกวัฒนธรรม จากวัดพระแก้วถึงป้อมพระสุเมรุ",
    atmosphere: "heritage",
    checkpointIds: [
      "grand-palace",
      "wat-pho",
      "tha-tien",
      "sanam-luang",
      "city-pillar",
      "giant-swing",
      "democracy",
      "ratchadamnoen",
      "banglamphu",
      "phra-sumen",
    ],
  }),
  basic({
    id: "temple-short",
    name: "สายวัด–วัง (สั้น)",
    desc: "เส้นสั้นเน้นวัดพระแก้ว วัดโพธิ์ ท่าเตียน เหมาะมือใหม่",
    atmosphere: "morning",
    checkpointIds: ["grand-palace", "wat-pho", "tha-tien", "sanam-luang"],
  }),
  basic({
    id: "oldtown-street",
    name: "ย่านเมืองเก่า–บางลำพู",
    desc: "เสาชิงช้า อนุสาวรีย์ฯ ราชดำเนิน บางลำพู ป้อมพระสุเมรุ",
    atmosphere: "street",
    checkpointIds: [
      "giant-swing",
      "democracy",
      "ratchadamnoen",
      "banglamphu",
      "phra-sumen",
    ],
  }),
];

export const basicRouteById = (id: string): RouteDef | undefined =>
  BASIC_ROUTES.find((r) => r.id === id);
