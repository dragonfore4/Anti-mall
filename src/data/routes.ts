import type { CheckpointId, LatLng, RouteDef } from "@/types";
import { checkpointById } from "@/data/checkpoints";
import { legCaloriesFromPath, metersToKm, pathLengthM } from "@/lib/geo";

/** พิกัดหมุดเรียงตามลำดับ -> เส้นทางเริ่มต้น (เส้นตรง ก่อนถูก ORS ดัดให้เกาะถนน) */
export function checkpointPath(checkpointIds: string[]): LatLng[] {
  return checkpointIds
    .map((id) => checkpointById(id)?.coord)
    .filter((coord): coord is LatLng => Boolean(coord));
}

/**
 * ข้อมูลที่ใช้ตอนนิยามเส้นทาง Basic
 * - ฟิลด์ไม่มี `?` = บังคับกรอก
 * - ฟิลด์มี `?` = ใส่ก็ได้ ไม่ใส่ก็ได้ (basic() คำนวณให้)
 * - `kind`/`path`/`distanceKm`/`legCalories` ไม่บังคับ เพราะ basic() เติมให้เอง
 */
type BasicSpec = {
  id: string; // id ไม่ซ้ำใคร (ใช้ใน URL /run/<id>)
  name: string; // ชื่อโชว์
  desc: string; // คำอธิบายสั้น ๆ
  atmosphere: string; // บรรยากาศ (morning/heritage/street/...)
  checkpointIds: CheckpointId[]; // หมุดที่ผ่าน เรียงตามลำดับ (id พิมพ์ผิด = TS ฟ้องทันที)

  path?: LatLng[]; // ใส่เองได้ถ้าอยากแทรกจุดวิวพิเศษ ปกติเว้นไว้ให้ derive จากหมุด
  distanceKm?: number; // ใส่เองได้ถ้าอยากตรึงเลขสวย ๆ ปกติคำนวณจากเส้นทาง
  legCalories?: number[]; // แคลต่อช่วง (ยาว = จำนวนหมุด - 1) ไม่ใส่ = คิดจากระยะให้
};

/** สร้าง RouteDef จาก spec สั้น ๆ — เติม path + ระยะทาง + legCalories + kind ให้เอง */
function basic(spec: BasicSpec): RouteDef {
  const cpPath = checkpointPath(spec.checkpointIds);
  const path = spec.path ?? cpPath;
  // legCalories คิดจากระยะระหว่างหมุด (cpPath) เสมอ ไม่ใช่ path ที่อาจมีจุดวิวแทรก
  const legCalories = spec.legCalories ?? legCaloriesFromPath(cpPath);
  // กัน legCalories ที่กรอกมือยาวไม่ตรงจำนวนช่วง (= หมุด - 1) แล้ว credit 0 เงียบ ๆ
  const expected = spec.checkpointIds.length - 1;

  console.log("legcalories", legCalories);
  console.log("expected", expected);
  if (legCalories.length !== expected) {
    console.warn(
      `[routes] เส้นทาง "${spec.id}": legCalories มี ${legCalories.length} ค่า แต่ควรเป็น ${expected} (จำนวนหมุด − 1)`,
    );
  }
  return {
    ...spec,
    kind: "basic",
    path,
    distanceKm: spec.distanceKm ?? metersToKm(pathLengthM(path)),
    legCalories,
  };
}

/**
 * เส้นทาง Basic สำเร็จรูป
 * เพิ่มเส้นใหม่: ก๊อป block แล้วใส่ id/name/desc/atmosphere + เรียง checkpointIds
 * ไม่ต้องพิมพ์พิกัด path เอง (derive จากหมุดให้อัตโนมัติ)
 */
export const BASIC_ROUTES: RouteDef[] = [
  basic({
    id: "test",
    name: "test",
    desc: "test",
    atmosphere: "heritage",
    checkpointIds: ["grand-palace", "banglamphu", "phra-sumen"],
  }),
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
    // แคลต่อช่วง: ๙ ช่วง (= ๑๐ หมุด - ๑) เช่น วัดพระแก้ว→วัดโพธิ์ = 90
    legCalories: [90, 70, 130, 80, 110, 100, 70, 80, 100],
  }),
  basic({
    id: "temple-short",
    name: "สายวัด–วัง (สั้น)",
    desc: "เส้นสั้นเน้นวัดพระแก้ว วัดโพธิ์ ท่าเตียน เหมาะมือใหม่",
    atmosphere: "morning",
    checkpointIds: ["grand-palace", "wat-pho", "tha-tien", "sanam-luang"],
    // ๓ ช่วง: วัดพระแก้ว→วัดโพธิ์→ท่าเตียน→สนามหลวง
    legCalories: [90, 70, 130],
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
    // ๔ ช่วง
    legCalories: [120, 90, 70, 100],
  }),
];

export const basicRouteById = (id: string): RouteDef | undefined =>
  BASIC_ROUTES.find((r) => r.id === id);
