/** ค่าคงที่ปรับได้ (ของจริงควรให้ผู้ใช้กรอกโปรไฟล์) */
export const WEIGHT_KG = 60; // น้ำหนักผู้ใช้ ใช้คำนวณแคลอรี่
export const STEP_LEN_M = 0.75; // ความยาวก้าวเฉลี่ย (ม.) ใช้ประมาณก้าว
export const RUN_MET = 8.0; // MET วิ่งเบา ๆ
export const CHECKIN_RADIUS_M = 45; // รัศมีที่นับว่าเช็คอินสำเร็จ
export const GPS_JUMP_MAX_M = 200; // ตัด noise: ระยะกระโดดเกินนี้ถือว่าเพี้ยน

/** แคลอรี่จากสูตร MET: MET × น้ำหนัก(กก.) × เวลา(ชม.) */
export function calories(elapsedMs: number): number {
  return Math.round((RUN_MET * WEIGHT_KG * elapsedMs) / 3_600_000);
}

/** ประมาณจำนวนก้าวจากระยะทาง */
export function steps(distanceM: number): number {
  return Math.round(distanceM / STEP_LEN_M);
}

/** จัดรูปเวลา ms -> m:ss */
export function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
