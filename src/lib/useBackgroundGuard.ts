import { useEffect, useState } from "react";

/**
 * ตรวจจับช่วงที่หน้าเว็บถูกพักไป background ระหว่างวิ่ง (สลับแอป / จอดับ)
 * — เว็บ track ตำแหน่งต่อใน background ไม่ได้ (ข้อจำกัดเบราว์เซอร์) ฮุคนี้จึง
 * ไม่ได้ "วิ่งต่อ" แต่ทำให้รู้ว่าหายไปนานเท่าไหร่ เพื่อเตือนผู้ใช้ + กู้เส้นต่อ
 *
 * คืน `gapMs` = ระยะเวลาที่เพิ่งหายไป (0 = ปกติ) · `clear()` ปิดการเตือน
 * ข้าม gap สั้น ๆ (< 3 วิ เช่นดึง notification) ไม่ให้เด้งกวน
 */
const GAP_MIN_MS = 3000;

export function useBackgroundGuard(active: boolean): { gapMs: number; clear: () => void } {
  const [gapMs, setGapMs] = useState(0);

  useEffect(() => {
    if (!active) {
      setGapMs(0);
      return;
    }
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt) {
        const gap = Date.now() - hiddenAt;
        hiddenAt = 0;
        if (gap > GAP_MIN_MS) setGapMs(gap);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [active]);

  return { gapMs, clear: () => setGapMs(0) };
}
