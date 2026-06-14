/** ค่าคงที่ปรับได้ */
export const STEP_LEN_M = 0.75; // ความยาวก้าวเฉลี่ย (ม.) ใช้ประมาณก้าว
export const CHECKIN_RADIUS_M = 45; // รัศมีที่นับว่าเช็คอินสำเร็จ
export const GPS_JUMP_MAX_M = 200; // ตัด noise: ระยะกระโดดเกินนี้ถือว่าเพี้ยน

/** ประมาณจำนวนก้าวจากระยะทาง */
export function steps(distanceM: number): number {
  return Math.round(distanceM / STEP_LEN_M);
}

/** จัดรูปเวลา ms -> m:ss */
export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
