interface Props {
  /** ขนาดกล่อง (px) */
  size?: number;
  /** จำนวนแฉก */
  spikes?: number;
  className?: string;
  /** สีพื้น (ดีฟอลต์ = เหลืองนวล) */
  fill?: string;
  children?: React.ReactNode;
}

/**
 * วงกลมแฉก (sunburst/เฟือง) สีเหลืองนวล มีช่องกลางใส่ emoji/ไอคอน
 * ใช้ซ้ำใน: การ์ดเส้นทาง, ตัวเลือกบรรยากาศ, เหรียญสถานที่, ลัดหน้าหลัก
 */
export default function Sunburst({
  size = 64,
  spikes = 22,
  className,
  fill = "var(--color-cream)",
  children,
}: Props) {
  const cx = 50;
  const cy = 50;
  const outer = 50;
  const inner = 41;
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <polygon points={pts.join(" ")} fill={fill} />
      </svg>
      <span
        className="relative z-10 flex items-center justify-center leading-none"
        style={{ fontSize: size * 0.42 }}
      >
        {children}
      </span>
    </div>
  );
}
