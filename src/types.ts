export type LatLng = [number, number];

/**
 * id ของหมุดทั้งหมด — ต้องตรงกับ id ใน CHECKPOINTS (src/data/checkpoints.ts)
 * เพิ่ม/ลบหมุดใน CHECKPOINTS แล้ว TS จะฟ้องให้มาแก้ที่นี่ด้วย (กัน id พิมพ์ผิด)
 */
export type CheckpointId =
  | "grand-palace"
  | "wat-pho"
  | "tha-tien"
  | "sanam-luang"
  | "city-pillar"
  | "giant-swing"
  | "democracy"
  | "ratchadamnoen"
  | "banglamphu"
  | "phra-sumen";

/** จุดมรดกวัฒนธรรม / จุดเช็คอิน */
export interface Checkpoint {
  id: CheckpointId;
  name: string;
  coord: LatLng; // พิกัด [lat, lng]
  district: string; // ย่าน (ใช้คัดในโหมด Advance)
  heritage: string; // ประเภทมรดก (วัด/อนุสรณ์สถาน/ป้อม ฯลฯ)
  fact: string; // เกร็ดความรู้
  points: number; // แต้มที่ได้เมื่อเช็คอิน
  emoji: string; // หน้าเหรียญสถานที่ (achievement) เมื่อสแกน QR ปลดล็อก
}

/** เส้นทางวิ่ง (ทั้ง Basic สำเร็จรูป และ Advance ที่สร้างเอง) */
export interface RouteDef {
  id: string;
  name: string;
  desc: string;
  atmosphere: string; // บรรยากาศ
  distanceKm: number;
  path: LatLng[]; // เส้นที่ควรวิ่ง
  checkpointIds: CheckpointId[];
  // แคลอรี่ต่อช่วง (leg) — legCalories[i] = แคลของช่วง checkpointIds[i] -> [i+1]
  // ความยาว = checkpointIds.length - 1 (จุดเริ่มไม่มีช่วงก่อนหน้า)
  legCalories: number[];
  kind: "basic" | "advance";
}

/** ผลการวิ่งที่บันทึก (local-first) */
export interface RunRecord {
  id: string;
  routeName: string;
  dateISO: string;
  km: number;
  elapsedMs: number;
  calories: number;
  steps: number;
  points: number;
  checkins: number;
}

export type RunMode = "gps" | "sim";
export type RunStatus = "idle" | "running" | "finished";
