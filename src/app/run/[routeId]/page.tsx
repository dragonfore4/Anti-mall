"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RouteDef, RunMode } from "@/types";
import { basicRouteById } from "@/data/routes";
import { repo } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useUser } from "@/lib/useUser";
import { useRunStore } from "@/store/runStore";
import { densify, metersToKm, pathLengthM } from "@/lib/geo";
import { snapToRoads } from "@/lib/snapToRoads";
import { formatTime, steps } from "@/lib/stats";
import { useWakeLock } from "@/lib/useWakeLock";
import { useBackgroundGuard } from "@/lib/useBackgroundGuard";
import StatsBar from "@/components/StatsBar";
import CheckinToast from "@/components/CheckinToast";
import SummaryModal from "@/components/SummaryModal";
import ScanOverlay from "@/components/ScanOverlay";
import RecapShareModal from "@/components/RecapShareModal";
import type { RecapData } from "@/lib/recapCard";

// แผนที่ต้องโหลดฝั่ง client เท่านั้น (Leaflet อ้าง window)
const RunMap = dynamic(() => import("@/components/RunMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-muted">กำลังโหลดแผนที่…</div>,
});

export default function RunPage({ params }: { params: Promise<{ routeId: string }> }) {
  const { routeId } = use(params);

  // หา route: Basic ก่อน ไม่เจอค่อยดู draft (Advance) ใน localStorage
  const [route, setRoute] = useState<RouteDef | null | undefined>(undefined);
  const [snapping, setSnapping] = useState(false);
  useEffect(() => {
    const base = basicRouteById(routeId) ?? repo.getDraftRoute(routeId);
    if (!base) {
      setRoute(null);
      return;
    }
    // base.path = พิกัดหมุดเรียงตามลำดับอยู่แล้ว (derive จาก checkpointIds)
    // แสดงเส้นตรงก่อนทันที แล้วค่อยอัปเกรดเป็นเส้นเกาะถนนจริงเมื่อ ORS ตอบ
    setRoute(base);
    setSnapping(true);
    let cancelled = false;
    snapToRoads(base.path).then((snapped) => {
      if (cancelled) return;
      setSnapping(false);
      if (snapped !== base.path) {
        setRoute({
          ...base,
          path: snapped,
          distanceKm: metersToKm(pathLengthM(snapped)),
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  const [mode, setMode] = useState<RunMode>("sim");
  const [scanning, setScanning] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const s = useRunStore();
  const savedRef = useRef(false);
  const router = useRouter();
  const { user } = useUser();

  // เริ่มวิ่ง — ถ้าต่อ Supabase แล้วต้อง login ก่อน (เพื่อบันทึกผลต่อ user)
  const onStart = () => {
    if (!route) return;
    if (isSupabaseConfigured && !user) {
      router.push(`/login?next=${encodeURIComponent(`/run/${routeId}`)}`);
      return;
    }
    useRunStore.getState().begin(route, mode);
  };

  const trackingGps = s.status === "running" && mode === "gps";
  useWakeLock(trackingGps);

  // ตรวจจับช่วงที่สลับออกไป background ระหว่างวิ่ง GPS (track ต่อไม่ได้บนเว็บ)
  const { gapMs, clear: clearGap } = useBackgroundGuard(trackingGps);

  // กลับมาจาก background → ดึงตำแหน่งสดทันที (ไม่ต้องรอ watchPosition tick ถัดไป)
  // จุดที่กระโดดไกลจะถูกตัดระยะโดยตัวกรอง noise ใน store แต่ trace จะลากเส้นเชื่อมต่อให้
  useEffect(() => {
    if (gapMs > 0 && trackingGps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => useRunStore.getState().pushPosition([p.coords.latitude, p.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
      );
    }
  }, [gapMs, trackingGps]);

  // ลูปติดตามตำแหน่ง (sim / gps) + นาฬิกาจับเวลา
  useEffect(() => {
    if (s.status !== "running" || !route) return;
    const tick = setInterval(() => useRunStore.getState().tick(), 500);
    let cleanup = () => clearInterval(tick);

    if (mode === "sim") {
      const path = densify(route.path);
      let i = 0;
      const sim = setInterval(() => {
        if (i >= path.length) {
          useRunStore.getState().finish();
          return;
        }
        useRunStore.getState().pushPosition(path[i]);
        i++;
      }, 180);
      cleanup = () => {
        clearInterval(tick);
        clearInterval(sim);
      };
    } else {
      if (!navigator.geolocation) {
        alert("เบราว์เซอร์นี้ไม่รองรับ GPS");
      } else {
        const watch = navigator.geolocation.watchPosition(
          (p) => useRunStore.getState().pushPosition([p.coords.latitude, p.coords.longitude]),
          (e) => alert("เปิด GPS ไม่ได้: " + e.message + "\n(ต้องเปิดผ่าน HTTPS หรือ localhost)"),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
        );
        cleanup = () => {
          clearInterval(tick);
          navigator.geolocation.clearWatch(watch);
        };
      }
    }
    return cleanup;
  }, [s.status, mode, route]);

  // บันทึกผลการวิ่ง (เรียกตอนจบ + ปุ่มลองใหม่ถ้าพลาด)
  const persistRun = () => {
    if (!route) return;
    setSaveError(false);
    repo
      .addRun({
        id: `run-${Date.now()}`,
        routeName: route.name,
        dateISO: new Date().toISOString(),
        km: +(s.distanceM / 1000).toFixed(2),
        elapsedMs: s.elapsedMs,
        calories: s.calories,
        steps: steps(s.distanceM),
        points: s.points,
        checkins: s.checkedIn.length,
      })
      .catch((e) => {
        console.error("บันทึกการวิ่งไม่สำเร็จ:", e);
        savedRef.current = false; // ปลดล็อกให้ effect/ปุ่มลองใหม่ได้
        setSaveError(true);
      });
  };

  // บันทึกผลเมื่อจบ (ครั้งเดียว)
  useEffect(() => {
    if (s.status !== "finished" || !route || savedRef.current) return;
    savedRef.current = true;
    persistRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.status, route, s.distanceM, s.elapsedMs, s.points, s.calories, s.checkedIn.length]);

  // รีเซ็ตเมื่อออกจากหน้า
  useEffect(() => () => useRunStore.getState().reset(), []);

  const km = (s.distanceM / 1000).toFixed(2);
  const statList = useMemo(
    () => [
      { value: km, label: "กิโลเมตร" },
      { value: formatTime(s.elapsedMs), label: "เวลา" },
      { value: String(s.calories), label: "แคลอรี่" },
      { value: steps(s.distanceM).toLocaleString(), label: "ก้าว" },
    ],
    [km, s.elapsedMs, s.distanceM, s.calories],
  );

  const onShare = () => setShowRecap(true);

  // ข้อมูลการ์ดสรุปผล — memoize เพื่อไม่ให้ canvas วาดใหม่ทุก render
  const recapData: RecapData | null = useMemo(
    () =>
      showRecap && route
        ? {
            routeName: route.name,
            km,
            time: formatTime(s.elapsedMs),
            calories: s.calories,
            steps: steps(s.distanceM),
            points: s.points,
            medals: s.checkedIn.length,
            trace: s.trace,
          }
        : null,
    [showRecap, route, km, s.elapsedMs, s.calories, s.distanceM, s.points, s.checkedIn.length, s.trace],
  );

  if (route === undefined)
    return <main className="flex min-h-[100dvh] items-center justify-center text-muted">กำลังโหลด…</main>;

  if (route === null)
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-5 text-center">
        <div className="text-4xl">🤔</div>
        <div className="text-muted">ไม่พบเส้นทางนี้ (อาจถูกล้างจาก browser)</div>
        <Link href="/" className="rounded-2xl bg-card2 px-4 py-2 font-bold">
          กลับหน้าหลัก
        </Link>
      </main>
    );

  return (
    <main className="relative flex h-[100dvh] flex-col overflow-hidden landscape:flex-row">
      {/* หัว (แนวตั้ง) */}
      <header className="z-[500] flex items-center gap-3 border-b border-line bg-card px-4 py-3 landscape:hidden">
        <Link href="/" className="text-xl text-muted active:scale-90">
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[15px] leading-tight">{route.name}</div>
          <div className="text-[11px] text-muted">
            {route.distanceKm} กม. · {route.checkpointIds.length} จุด
            {snapping && <span className="text-accent"> · กำลังดัดเส้นให้เกาะถนน…</span>}
          </div>
        </div>
      </header>

      {/* แผนที่ */}
      <div className="relative flex-1">
        <RunMap route={route} trace={s.trace} current={s.current} checkedIn={s.checkedIn} />

        {/* สถิติลอย (เฉพาะแนวตั้ง — แนวนอนย้ายไปแผงข้าง) */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[600] landscape:hidden">
          <StatsBar stats={statList} />
        </div>

        {/* แต้มสด (แนวตั้ง) */}
        <div className="absolute right-3 top-[86px] z-[600] rounded-full border border-accent bg-card/90 px-3 py-1 text-sm font-bold text-accent backdrop-blur landscape:hidden">
          🏆 {s.points}
        </div>

        {/* ปุ่มสแกน QR ระหว่างวิ่ง (แนวตั้ง) */}
        <button
          onClick={() => setScanning(true)}
          className="absolute right-3 top-[124px] z-[600] flex items-center gap-1.5 rounded-full border border-line bg-card/90 px-3 py-1.5 text-xs font-bold backdrop-blur active:scale-95 landscape:hidden"
        >
          📷 สแกน QR
        </button>

        <CheckinToast data={s.lastCheckin} onClose={() => useRunStore.getState().clearLastCheckin()} />

        {/* เตือนว่าหน้าจอต้องเปิดค้าง — เว็บ track ต่อใน background ไม่ได้ */}
        {trackingGps && !hintDismissed && (
          <div className="absolute inset-x-3 bottom-3 z-[600] flex items-start gap-2 rounded-xl border border-line bg-card/90 px-3 py-2 text-[11px] leading-relaxed text-muted backdrop-blur">
            <span>💡 เปิดหน้าจอค้างไว้ระหว่างวิ่ง — ถ้าออกจากแอปหรือจอดับ การจับระยะจะหยุดชั่วคราว</span>
            <button
              onClick={() => setHintDismissed(true)}
              aria-label="ปิด"
              className="ml-auto shrink-0 text-muted active:opacity-60"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* แผงควบคุม (แนวตั้ง — ล่าง) */}
      <div className="z-[600] bg-card p-4 landscape:hidden">
        {s.status === "idle" && (
          <div className="flex items-center gap-2.5">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as RunMode)}
              className="rounded-xl border border-line bg-card2 px-3 py-3 text-sm"
            >
              <option value="sim">จำลองวิ่ง</option>
              <option value="gps">GPS จริง</option>
            </select>
            <button
              onClick={onStart}
              className="flex-1 rounded-xl bg-accent p-3.5 font-bold tracking-wide text-cream active:scale-95"
            >
              ▶ เริ่มวิ่ง
            </button>
          </div>
        )}
        {s.status === "running" && (
          <button
            onClick={() => useRunStore.getState().finish()}
            className="w-full rounded-xl bg-[#2c1338] p-3.5 font-bold tracking-wide text-cream active:scale-95"
          >
            ■ จบการวิ่ง
          </button>
        )}
      </div>

      {/* แผงข้าง (แนวนอน) — หัว + สถิติ + แต้ม + สแกน + ปุ่มควบคุม รวมในแถบขวา */}
      <aside className="z-[600] hidden shrink-0 flex-col gap-3 overflow-y-auto border-l border-line bg-card p-4 landscape:flex landscape:w-72 lg:w-80">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl text-muted active:scale-90">
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-[15px] leading-tight">{route.name}</div>
            <div className="text-[11px] text-muted">
              {route.distanceKm} กม. · {route.checkpointIds.length} จุด
              {snapping && <span className="text-accent"> · กำลังดัดเส้นให้เกาะถนน…</span>}
            </div>
          </div>
        </div>

        <StatsBar stats={statList} className="grid grid-cols-2 gap-2" />

        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-accent bg-card px-3 py-1 text-sm font-bold text-accent">
            🏆 {s.points}
          </span>
          <button
            onClick={() => setScanning(true)}
            className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold active:scale-95"
          >
            📷 สแกน QR
          </button>
        </div>

        {/* ปุ่มควบคุม (ดันลงล่างแผงเมื่อมีที่ว่าง) */}
        <div className="mt-auto">
          {s.status === "idle" && (
            <div className="flex flex-col gap-2.5">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as RunMode)}
                className="rounded-xl border border-line bg-card2 px-3 py-3 text-sm"
              >
                <option value="sim">จำลองวิ่ง</option>
                <option value="gps">GPS จริง</option>
              </select>
              <button
                onClick={onStart}
                className="rounded-xl bg-accent p-3.5 font-bold tracking-wide text-cream active:scale-95"
              >
                ▶ เริ่มวิ่ง
              </button>
            </div>
          )}
          {s.status === "running" && (
            <button
              onClick={() => useRunStore.getState().finish()}
              className="w-full rounded-xl bg-[#2c1338] p-3.5 font-bold tracking-wide text-cream active:scale-95"
            >
              ■ จบการวิ่ง
            </button>
          )}
        </div>
      </aside>

      {/* สรุปผล */}
      {s.status === "finished" && (
        <SummaryModal
          km={km}
          time={formatTime(s.elapsedMs)}
          cal={s.calories}
          steps={steps(s.distanceM)}
          points={s.points}
          checkins={s.checkedIn.length}
          onShare={onShare}
        />
      )}

      {/* แจ้งเตือนเซฟไม่สำเร็จ + ปุ่มลองใหม่ */}
      {s.status === "finished" && saveError && (
        <div className="fixed inset-x-4 top-4 z-[1100] flex items-center justify-center gap-3 rounded-xl border border-accent bg-card p-3 text-sm shadow-2xl">
          <span className="text-accent">⚠️ บันทึกการวิ่งไม่สำเร็จ</span>
          <button onClick={persistRun} className="font-bold text-accent underline underline-offset-2">
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {/* เตือนตอนกลับมาจาก background — ช่วงที่หายไปอาจติดตามไม่ครบ */}
      {gapMs > 0 && (
        <div className="fixed inset-x-4 top-4 z-[1100] flex items-center justify-center gap-3 rounded-xl border border-accent2 bg-card p-3 text-sm shadow-2xl">
          <span className="text-accent2">
            ⚠️ สลับออกไป {Math.round(gapMs / 1000)} วิ — ช่วงนั้นจับระยะไม่ได้ ลากเส้นเชื่อมต่อให้แล้ว
          </span>
          <button onClick={clearGap} className="font-bold text-accent2 underline underline-offset-2">
            รับทราบ
          </button>
        </div>
      )}

      {/* การ์ดสรุปผล (modal) */}
      {showRecap && recapData && <RecapShareModal data={recapData} onClose={() => setShowRecap(false)} />}
      {/* สแกน QR ระหว่างวิ่ง (modal) */}
      {scanning && <ScanOverlay modal onClose={() => setScanning(false)} />}
    </main>
  );
}
