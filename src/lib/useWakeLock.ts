import { useEffect } from "react";

/**
 * กันหน้าจอดับระหว่างวิ่ง (Wake Lock API)
 * บรรเทาปัญหา "เบราว์เซอร์หยุด JS เมื่อจอดับ" — แต่ไม่ใช่ background tracking สมบูรณ์
 * (รองรับเฉพาะ secure context: localhost / HTTPS)
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        if ("wakeLock" in navigator) {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* ผู้ใช้/เบราว์เซอร์ปฏิเสธ — ข้ามไป */
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && !cancelled) request();
    };

    request();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
