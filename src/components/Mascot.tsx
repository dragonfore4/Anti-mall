/**
 * มาสคอตนักวิ่ง (flat, น่ารัก) — หัวโต มีหน้ายิ้ม ทำท่าวิ่งไปทางขวา + เส้นความเร็ว
 * โทน: ผิวครีม · เสื้อ/ผ้าคาดหัวส้ม · ขาม่วง · รองเท้า/เส้นเร็วเหลือง
 */
export default function Mascot({ className }: { className?: string }) {
  const cream = "#fdfbbb";
  const orange = "#f44e03";
  const purple = "#3b1a4e";
  const yellow = "#ffe956";
  return (
    <svg viewBox="0 0 120 130" className={className} fill="none" aria-hidden="true">
      {/* เส้นความเร็ว */}
      <g stroke={yellow} strokeWidth="5" strokeLinecap="round">
        <line x1="6" y1="58" x2="30" y2="58" />
        <line x1="2" y1="74" x2="26" y2="74" />
        <line x1="10" y1="90" x2="30" y2="90" />
      </g>

      {/* ขาหลัง */}
      <path d="M60 86 Q 50 100 40 105" stroke={purple} strokeWidth="11" strokeLinecap="round" />
      <ellipse cx="37" cy="107" rx="10" ry="6" transform="rotate(-20 37 107)" fill={yellow} />
      {/* ขาหน้า */}
      <path d="M63 86 Q 76 96 85 108" stroke={purple} strokeWidth="11" strokeLinecap="round" />
      <ellipse cx="88" cy="110" rx="10" ry="6" transform="rotate(14 88 110)" fill={yellow} />

      {/* ลำตัว (เสื้อส้ม) */}
      <path d="M66 60 L 61 88" stroke={orange} strokeWidth="19" strokeLinecap="round" />

      {/* แขนหลัง */}
      <path d="M64 66 Q 50 64 45 73" stroke={cream} strokeWidth="8" strokeLinecap="round" />
      {/* แขนหน้า (เหวี่ยงไปข้างหน้า) */}
      <path d="M68 64 Q 83 62 87 53" stroke={cream} strokeWidth="8" strokeLinecap="round" />

      {/* หัว */}
      <circle cx="66" cy="37" r="23" fill={cream} />
      {/* ผ้าคาดหัว */}
      <path d="M45 31 Q 66 19 88 30" stroke={orange} strokeWidth="7" strokeLinecap="round" />
      <path d="M86 29 l 10 -4 -3 9 z" fill={orange} />
      {/* หน้า: ตา + แก้ม + ยิ้ม */}
      <circle cx="61" cy="38" r="3" fill={purple} />
      <circle cx="73" cy="38" r="3" fill={purple} />
      <circle cx="56" cy="45" r="2.6" fill={orange} opacity="0.55" />
      <circle cx="78" cy="45" r="2.6" fill={orange} opacity="0.55" />
      <path d="M60 46 Q 67 52 74 46" stroke={purple} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
