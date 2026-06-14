import Link from "next/link";
import HeroStats from "@/components/HeroStats";
import AuthButton from "@/components/AuthButton";

const MODES = [
  {
    no: "๐๑",
    href: "/routes",
    kind: "Basic",
    title: "เส้นทางสำเร็จรูป",
    desc: "เลือกเส้นที่ออกแบบไว้ให้ — ครบทุกหมุดมรดก พร้อมวิ่งทันที",
  },
  {
    no: "๐๒",
    href: "/build",
    kind: "Advance",
    title: "ออกแบบเส้นทางเอง",
    desc: "เลือกย่าน → มรดกที่สนใจ → บรรยากาศ แล้วให้ระบบร้อยเส้นทางให้",
  },
];

// เปรียบเทียบ "สองโลกในสองชั่วโมง"
const COMPARE = [
  { label: "แคลอรี่", mall: "~๑๒๐", run: "~๗๒๐" },
  { label: "ใช้จ่าย", mall: "฿๘๕๐", run: "฿๐" },
  { label: "เกร็ดความรู้", mall: "๐", run: "๘ จุด" },
  { label: "บรรยากาศ", mall: "แอร์ ๒๒°", run: "ลมเมืองเก่า" },
];

export default function HomePage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col px-6 pb-9 pt-6">
      {/* หัวกระดาษ (masthead) */}
      <div className="rise flex items-center justify-between text-[10.5px] uppercase tracking-[0.22em] text-muted">
        <span className="font-display normal-case tracking-normal text-accent">รัตนโกสินทร์</span>
        <AuthButton />
      </div>
      <div className="rule-double rise mt-3" style={{ animationDelay: "60ms" }} />

      {/* Hero */}
      <header className="mt-9">
        <div className="kicker rise text-[11px] text-accent2" style={{ animationDelay: "120ms" }}>
          ๐๑ — เส้นทางมรดก
        </div>
        <h1
          className="rise mt-4 font-display text-[46px] leading-[1.02] tracking-tight"
          style={{ animationDelay: "180ms" }}
        >
          วิ่งรอบเกาะ
          <br />
          <span className="text-accent">รัตนโกสินทร์</span>
        </h1>
        <p
          className="rise mt-5 max-w-[33ch] text-[15px] leading-relaxed text-muted"
          style={{ animationDelay: "260ms" }}
        >
          ทิ้งห้างแอร์เย็น มาวิ่งตามรอยวัด วัง ป้อม และตรอกเก่ากลางพระนคร
          เก็บเกร็ดประวัติศาสตร์ทีละจุด สะสมแต้มไว้แลกของที่ระลึก
        </p>

        {/* แถบสถิติสด */}
        <HeroStats />
      </header>

      {/* ๐๒ สองโลกในสองชั่วโมง */}
      <section className="mt-11">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg">สองโลก ในสองชั่วโมง</h2>
          <span className="kicker text-[11px] text-accent2">๐๒</span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          เวลาเท่ากัน แต่ได้กลับมาคนละอย่าง
        </p>

        <div className="card-paper mt-4 overflow-hidden rounded-xl">
          {/* หัวตาราง */}
          <div className="grid grid-cols-[1fr_1fr] text-center">
            <div className="hatch border-r border-line py-3">
              <div className="text-base">🏬</div>
              <div className="mt-0.5 font-display text-[13px] text-muted">ห้างแอร์</div>
            </div>
            <div className="bg-accent/8 py-3">
              <div className="text-base">🏃</div>
              <div className="mt-0.5 font-display text-[13px] text-accent">เมืองเก่า</div>
            </div>
          </div>
          {/* แถวเปรียบเทียบ */}
          {COMPARE.map((row) => (
            <div key={row.label} className="grid grid-cols-[1fr_1fr] border-t border-line text-center text-[13px]">
              <div className="relative border-r border-line py-2.5 text-muted">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wide text-line">
                  {row.label}
                </span>
                {row.mall}
              </div>
              <div className="bg-accent/8 py-2.5 font-display text-ink">{row.run}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[11.5px] text-muted">
          จะเผาแคลฯ หรือเผาเงิน — <span className="text-accent">คุณเลือกได้</span>
        </p>
      </section>

      {/* ๐๓ เลือกโหมด */}
      <section className="mt-11">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg">เลือกโหมดการวิ่ง</h2>
          <span className="kicker text-[11px] text-accent2">๐๓</span>
        </div>

        <div className="mt-2 border-t border-line">
          {MODES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group flex items-stretch gap-4 border-b border-line py-5 transition-colors active:bg-card2/60"
            >
              <div className="font-display text-3xl leading-none text-accent">{m.no}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl">{m.title}</h3>
                  <span className="rounded-full border border-accent2/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent2">
                    {m.kind}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{m.desc}</p>
              </div>
              <div className="flex items-center text-2xl text-accent transition-transform group-active:translate-x-1">
                →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ๐๔ ออกแบบภารกิจวิ่ง (teaser → /build) */}
      <section className="mt-11">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg">ออกแบบภารกิจวิ่ง</h2>
          <span className="kicker text-[11px] text-accent2">๐๔</span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          เลือกระดับการเผา → ธีมมรดก → เวลา แล้วให้ระบบร้อยเส้นทางให้
        </p>

        <div className="mt-4 space-y-4">
          {[
            {
              no: "๐๑",
              step: "ระดับการเผา",
              items: ["🧋 ชานมไข่มุก · ~๓๕๐", "🍗 ข้าวมันไก่ทอด · ~๖๐๐", "🔥 บุฟเฟ่ต์แก้แค้น · ~๑๐๐๐+"],
            },
            {
              no: "๐๒",
              step: "ธีมมรดก",
              items: ["🏛 นักล่าซุ้มโค้ง", "🙏 วิ่งสายมู", "🍜 ของกินช่างฝีมือ"],
            },
            {
              no: "๐๓",
              step: "เวลา",
              items: ["🌅 ๐๕:๓๐ เช้าตรู่", "🌃 ๑๙:๐๐ ค่ำคืนแสงไฟ"],
            },
          ].map((s) => (
            <div key={s.no}>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="font-display text-sm text-accent">{s.no}</span>
                <span className="font-display text-[15px]">{s.step}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.items.map((it) => (
                  <span
                    key={it}
                    className="rounded-full border border-line bg-card px-3 py-1.5 text-[12px] text-muted"
                  >
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/build"
          className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-accent to-accent2 p-3.5 font-bold tracking-wide text-card active:scale-[0.98]"
        >
          ออกแบบเส้นทางของฉัน →
        </Link>
      </section>

      {/* ๐๕ ลัด */}
      <section className="mt-11">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg">สะสม &amp; ย้อนดู</h2>
          <span className="kicker text-[11px] text-accent2">๐๕</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link href="/rewards" className="card-paper flex flex-col gap-2 rounded-xl p-4 active:scale-[0.98]">
            <div className="font-display text-sm text-accent">แต้ม &amp; รางวัล</div>
            <div className="text-[11.5px] leading-snug text-muted">สะสมแต้มแลกกราฟิกมรดก</div>
          </Link>
          <Link href="/achievements" className="card-paper flex flex-col gap-2 rounded-xl p-4 active:scale-[0.98]">
            <div className="font-display text-sm text-accent">เหรียญสถานที่</div>
            <div className="text-[11.5px] leading-snug text-muted">สแกน QR ตามจุดเพื่อสะสมเหรียญ</div>
          </Link>
          <Link href="/scan" className="card-paper flex flex-col gap-2 rounded-xl p-4 active:scale-[0.98]">
            <div className="font-display text-sm text-accent">📷 สแกน QR</div>
            <div className="text-[11.5px] leading-snug text-muted">ปลดล็อกเหรียญจุดมรดก</div>
          </Link>
          <Link href="/history" className="card-paper flex flex-col gap-2 rounded-xl p-4 active:scale-[0.98]">
            <div className="font-display text-sm text-accent">ประวัติการวิ่ง</div>
            <div className="text-[11.5px] leading-snug text-muted">สถิติย้อนหลังทุกครั้งที่วิ่ง</div>
          </Link>
        </div>
      </section>

      {/* แถลงการณ์ (footer) */}
      <footer className="mt-12">
        <div className="rule-double" />
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="font-display text-base leading-tight">
              วิ่งรอบเกาะ
              <br />
              รัตนโกสินทร์
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted">
              วิ่งเก็บมรดก · ไม่เผาเงินในห้าง · ๒๕๖๙
            </div>
          </div>
          <div className="text-right text-[11px] leading-loose text-muted">
            <Link href="/routes" className="block active:text-accent">เส้นทาง</Link>
            <Link href="/rewards" className="block active:text-accent">เหรียญตรา</Link>
            <Link href="/build" className="block active:text-accent">สร้างเส้นทาง</Link>
          </div>
        </div>
        <p className="mt-5 text-center text-[10.5px] uppercase tracking-[0.2em] text-line">
          ◆ วิ่งช้า ๆ มองเมืองให้ทัน ◆
        </p>
      </footer>
    </main>
  );
}
