import type { LatLng } from "@/types";

/** ระยะทางระหว่าง 2 พิกัด (Haversine) หน่วยเมตร */
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toR = (x: number) => (x * Math.PI) / 180;
  const dLat = toR(b[0] - a[0]);
  const dLng = toR(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** ความยาวรวมของเส้นทาง (เมตร) */
export function pathLengthM(path: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) total += distanceM(path[i], path[i + 1]);
  return total;
}

/** แปลงเมตร -> กิโลเมตร ปัดทศนิยม 2 ตำแหน่ง (ใช้แสดง/เก็บระยะทาง) */
export function metersToKm(meters: number): number {
  return +(meters / 1000).toFixed(2);
}

/**
 * แคลอรี่ต่อช่วง (leg) แบบ fallback: ระยะแต่ละช่วง(กม.) × อัตรา ปัดจำนวนเต็ม
 * ใช้กับเส้นทางที่ไม่ได้กรอก legCalories เอง (เช่น Advance ที่สร้างสด ๆ)
 * คืน array ความยาว = path.length - 1
 */
export function legCaloriesFromPath(path: LatLng[], calPerKm = 65): number[] {
  const out: number[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    out.push(Math.round((distanceM(path[i], path[i + 1]) / 1000) * calPerKm));
  }
  return out;
}

/**
 * แตกเส้นทางเป็นจุดย่อยถี่ ๆ (สำหรับโหมดจำลองวิ่งให้ลื่น)
 * stepM = ระยะห่างเป้าหมายระหว่างจุดย่อย (เมตร)
 */
export function densify(path: LatLng[], stepM = 15): LatLng[] {
  const out: LatLng[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const steps = Math.max(8, Math.round(distanceM(a, b) / stepM));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  if (path.length) out.push(path[path.length - 1]);
  return out;
}

/** จุดกึ่งกลางของชุดพิกัด ใช้ตั้ง center ของแผนที่ */
export function centroid(path: LatLng[]): LatLng {
  if (!path.length) return [13.753, 100.495];
  const sum = path.reduce(
    (acc, p) => [acc[0] + p[0], acc[1] + p[1]] as LatLng,
    [0, 0] as LatLng,
  );
  return [sum[0] / path.length, sum[1] / path.length];
}
