import Sunburst from "./Sunburst";

interface Props {
  /** เส้นผ่านศูนย์กลางวงนอก (px) */
  size?: number;
  /** สีริบบิ้นด้านล่าง */
  ribbon?: string;
  /** สีวงนอก (sunburst) */
  outerFill?: string;
  /** ถ้ากำหนด จะวาดวงในซ้อน (เช่น วงส้ม) */
  innerFill?: string;
  className?: string;
  /** เนื้อหากลางเหรียญ (เลข/ข้อความ) */
  children?: React.ReactNode;
}

/**
 * เหรียญรางวัล: วงแฉก (อาจซ้อนวงใน) + ริบบิ้นห้อยด้านล่าง
 * ใช้ใน: ป้ายเลขโหมดวิ่ง (หน้าหลัก), การ์ดลัด "สะสม & ย้อนดู"
 */
export default function Medal({
  size = 128,
  ribbon = "var(--color-accent)",
  outerFill = "var(--color-cream)",
  innerFill,
  className,
  children,
}: Props) {
  const notch = "polygon(0 0,100% 0,100% 100%,50% 72%,0 100%)";
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {/* ริบบิ้น (อยู่หลังเหรียญ) */}
      <div
        className="absolute left-1/2 top-[64%] flex -translate-x-1/2 gap-2.5"
        aria-hidden="true"
      >
        <span
          style={{ background: ribbon, clipPath: notch, height: size * 0.42, width: size * 0.2 }}
          className="-rotate-12 rounded-sm"
        />
        <span
          style={{ background: ribbon, clipPath: notch, height: size * 0.42, width: size * 0.2 }}
          className="rotate-12 rounded-sm"
        />
      </div>

      {/* วงนอก (แฉก) */}
      <span className="absolute inset-0 flex items-center justify-center">
        <Sunburst size={size} fill={outerFill} />
      </span>
      {/* วงใน (วงกลมเรียบ เพื่ออ่านข้อความง่าย) */}
      {innerFill && (
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: innerFill, width: size * 0.64, height: size * 0.64 }}
        />
      )}

      {/* เนื้อหากลาง */}
      <div className="relative z-10 flex flex-col items-center justify-center px-3 text-center leading-tight">
        {children}
      </div>
    </div>
  );
}
