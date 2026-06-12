export type LatLng = [number, number];

/** จุดมรดกวัฒนธรรม / จุดเช็คอิน */
export interface Checkpoint {
  id: string;
  name: string;
  ll: LatLng;
  district: string; // ย่าน (ใช้คัดในโหมด Advance)
  heritage: string; // ประเภทมรดก (วัด/อนุสรณ์สถาน/ป้อม ฯลฯ)
  fact: string; // เกร็ดความรู้
  pts: number; // แต้มที่ได้เมื่อเช็คอิน
}

/** เส้นทางวิ่ง (ทั้ง Basic สำเร็จรูป และ Advance ที่สร้างเอง) */
export interface RouteDef {
  id: string;
  name: string;
  desc: string;
  atmosphere: string; // บรรยากาศ
  distanceKm: number;
  path: LatLng[]; // เส้นที่ควรวิ่ง
  checkpointIds: string[];
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
