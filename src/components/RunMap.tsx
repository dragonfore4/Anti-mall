"use client";

import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import type { LatLng, RouteDef } from "@/types";
import { checkpointById } from "@/data/checkpoints";
import { centroid } from "@/lib/geo";

const currentIcon = L.divIcon({
  className: "",
  html: '<div class="pulse"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

type Role = "start" | "finish" | "normal";

function checkpointIcon(role: Role, done: boolean) {
  const bg = done || role === "start" ? "#16a34a" : "#22262f";
  const border = done ? "#fff" : role === "finish" ? "#ff7a59" : "#ffc83d";
  const glyph = done ? "✓" : role === "start" ? "▶" : role === "finish" ? "🏁" : "📍";

  // ป้ายกำกับ "เริ่ม" / "เส้นชัย" (โชว์เฉพาะตอนยังไม่เช็คอิน)
  const label =
    !done && role === "start" ? "เริ่ม" : !done && role === "finish" ? "เส้นชัย" : "";
  const labelHtml = label
    ? `<div style="position:absolute;top:33px;left:50%;transform:translateX(-50%);
        white-space:nowrap;background:${role === "start" ? "#16a34a" : "#1a1d24"};
        color:#fff;font-size:10px;font-weight:700;padding:1px 7px;border-radius:999px;
        border:1px solid ${role === "finish" ? "#ff7a59" : "transparent"}">${label}</div>`
    : "";

  return L.divIcon({
    className: "",
    html: `<div style="position:relative;background:${bg};border:2px solid ${border};
      border-radius:50%;width:30px;height:30px;display:flex;align-items:center;
      justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.5)">${glyph}${labelHtml}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/** มุมทิศ (องศา ตามเข็มนาฬิกาจากทิศเหนือ) จาก a ไป b */
function bearing(a: LatLng, b: LatLng): number {
  const toR = (x: number) => (x * Math.PI) / 180;
  const toD = (x: number) => (x * 180) / Math.PI;
  const dLng = toR(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(toR(b[0]));
  const x =
    Math.cos(toR(a[0])) * Math.sin(toR(b[0])) -
    Math.sin(toR(a[0])) * Math.cos(toR(b[0])) * Math.cos(dLng);
  return (toD(Math.atan2(y, x)) + 360) % 360;
}

/** ลูกศรบอกทิศทางบนเส้น (▲ ชี้เหนือ หมุนตามมุมทิศ) */
function arrowIcon(deg: number) {
  return L.divIcon({
    className: "",
    html: `<div style="transform:rotate(${deg}deg);color:#b23a2e;font-size:15px;
      line-height:1;text-shadow:0 0 3px #f8f1e1,0 0 3px #f8f1e1">▲</div>`,
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5],
  });
}

/** เลื่อนแผนที่ตามตำแหน่งปัจจุบัน */
function Recenter({ current }: { current: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (current) map.panTo(current, { animate: true });
  }, [current, map]);
  return null;
}

interface Props {
  route: RouteDef;
  trace: LatLng[];
  current: LatLng | null;
  checkedIn: string[];
}

export default function RunMap({ route, trace, current, checkedIn }: Props) {
  const center = centroid(route.path);

  // ลูกศรทิศทาง: สุ่มจุดบนเส้นเป็นช่วง ๆ (~12 ลูกศร) แล้วหันตามทิศที่วิ่ง
  const arrows = useMemo(() => {
    const pts = route.path;
    if (pts.length < 2) return [];
    const every = Math.max(1, Math.floor(pts.length / 12));
    const out: { pos: LatLng; deg: number }[] = [];
    for (let i = every; i < pts.length - 1; i += every) {
      out.push({ pos: pts[i], deg: bearing(pts[i], pts[i + 1]) });
    }
    return out;
  }, [route.path]);

  return (
    <MapContainer
      center={center}
      zoom={15}
      zoomControl={false}
      attributionControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
        maxZoom={20}
      />

      {/* เส้นทางที่ควรวิ่ง (เส้นประชาดแดง) */}
      <Polyline
        positions={route.path}
        pathOptions={{ color: "#b23a2e", weight: 4, opacity: 0.7, dashArray: "8 8" }}
      />

      {/* ลูกศรบอกทิศทางการวิ่ง (ยืนยันว่าเป็นเส้นเดียวต่อเนื่อง ไม่ใช่ทางแยก) */}
      {arrows.map((a, i) => (
        <Marker key={`arrow-${i}`} position={a.pos} icon={arrowIcon(a.deg)} interactive={false} />
      ))}

      {/* เส้นทางที่วิ่งจริง (น้ำเงิน) */}
      {trace.length > 1 && (
        <Polyline positions={trace} pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.9 }} />
      )}

      {/* หมุดจุดเช็คอิน (จุดแรก = เริ่ม, จุดสุดท้าย = เส้นชัย) */}
      {route.checkpointIds.map((id, idx) => {
        const cp = checkpointById(id);
        if (!cp) return null;
        const role: Role =
          idx === 0 ? "start" : idx === route.checkpointIds.length - 1 ? "finish" : "normal";
        const done = checkedIn.includes(id);
        return (
          <Marker key={id} position={cp.ll} icon={checkpointIcon(role, done)}>
            <Popup>
              <b>{cp.name}</b>
              {role === "start" && <span style={{ color: "#16a34a" }}> (จุดเริ่ม)</span>}
              {role === "finish" && <span style={{ color: "#ff7a59" }}> (เส้นชัย)</span>}
              <br />
              {cp.fact}
              <br />
              <span style={{ color: "#16a34a" }}>+{cp.pts} แต้ม</span>
              {idx > 0 && (
                <span style={{ color: "#ff7a59" }}> · 🔥 {route.legCal[idx - 1] ?? 0} แคล (ช่วงก่อนถึงจุดนี้)</span>
              )}
            </Popup>
          </Marker>
        );
      })}

      {/* ตำแหน่งปัจจุบัน */}
      {current && <Marker position={current} icon={currentIcon} />}

      <Recenter current={current} />
    </MapContainer>
  );
}
