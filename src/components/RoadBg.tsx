/**
 * ลายถนนคดเคี้ยว (decorative) — แถบม่วงอมเทา + เส้นกลางประ ไขว้กันแบบในดีไซน์
 * วางในพาเรนต์ที่เป็น `relative isolate` แล้วใช้ -z-10 เพื่ออยู่หลัง content
 */
export default function RoadBg({ className }: { className?: string }) {
  // ถนนสายเดียวคดเคี้ยว
  const a = "M-60 70 C 150 130, 60 300, 250 360 S 420 560, 190 660 S 20 840, 260 940";
  const roads = [a];
  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 400 950"
        preserveAspectRatio="xMidYMin slice"
        fill="none"
      >
        {/* ตัวถนน (ม่วงอมเทา) — จาง ๆ พอเป็นพื้นผิว ไม่กลบข้อความ */}
        {roads.map((d, i) => (
          <path key={`r${i}`} d={d} stroke="#6f5f93" strokeWidth="74" strokeLinecap="round" opacity="0.45" />
        ))}
        {/* ไฮไลต์ขอบถนน */}
        {roads.map((d, i) => (
          <path key={`h${i}`} d={d} stroke="#7e6fa3" strokeWidth="60" strokeLinecap="round" opacity="0.4" />
        ))}
        {/* เส้นกลางประ */}
        {roads.map((d, i) => (
          <path
            key={`c${i}`}
            d={d}
            stroke="#b6a9cf"
            strokeWidth="4"
            strokeDasharray="16 22"
            strokeLinecap="round"
            opacity="0.45"
          />
        ))}
      </svg>
    </div>
  );
}
