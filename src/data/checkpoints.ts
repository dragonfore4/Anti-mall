import type { Checkpoint } from "@/types";

/**
 * จุดมรดกวัฒนธรรมรอบเกาะรัตนโกสินทร์ (พิกัดจริงโดยประมาณ)
 * ใช้เป็นทั้งจุดเช็คอินใน Basic และตัวเลือกในโหมด Advance
 */
export const CHECKPOINTS: Checkpoint[] = [
  {
    id: "grand-palace",
    name: "วัดพระแก้ว & พระบรมมหาราชวัง",
    coord: [13.751, 100.4915],
    district: "พระบรมมหาราชวัง",
    heritage: "วัง/วัดหลวง",
    points: 50,
    emoji: "👑",
    fact: "ที่ประดิษฐานพระแก้วมรกต พระพุทธรูปคู่บ้านคู่เมือง สร้างปี พ.ศ. 2325 พร้อมการสถาปนากรุงเทพฯ",
  },
  {
    id: "wat-pho",
    name: "วัดโพธิ์ (วัดพระเชตุพนฯ)",
    coord: [13.7466, 100.4925],
    district: "ท่าเตียน",
    heritage: "วัด",
    points: 40,
    emoji: "🛕",
    fact: "แหล่งกำเนิดการนวดแผนไทย และมีพระพุทธไสยาสน์ (พระนอน) ยาว 46 เมตร",
  },
  {
    id: "tha-tien",
    name: "ย่านท่าเตียน",
    coord: [13.7438, 100.492],
    district: "ท่าเตียน",
    heritage: "ย่านการค้า/ตลาด",
    points: 25,
    emoji: "⚓",
    fact: "ตลาดเก่าริมแม่น้ำเจ้าพระยา ตึกแถวสไตล์ชิโน-โปรตุกีส มีตำนานยักษ์วัดโพธิ์–วัดแจ้ง",
  },
  {
    id: "sanam-luang",
    name: "สนามหลวง",
    coord: [13.7556, 100.4922],
    district: "สนามหลวง",
    heritage: "ลานพระราชพิธี",
    points: 30,
    emoji: "🪁",
    fact: "ลานกว้างกลางพระนคร ใช้ในพระราชพิธีสำคัญ และเคยเป็นที่จัดงานว่าวประจำปี",
  },
  {
    id: "city-pillar",
    name: "ศาลหลักเมือง",
    coord: [13.7527, 100.4942],
    district: "สนามหลวง",
    heritage: "ศาล/สิ่งศักดิ์สิทธิ์",
    points: 30,
    emoji: "🙏",
    fact: "สร้างคู่กับการสถาปนากรุงเทพฯ พ.ศ. 2325 เป็นที่ประดิษฐานเสาหลักเมือง",
  },
  {
    id: "giant-swing",
    name: "เสาชิงช้า",
    coord: [13.7518, 100.501],
    district: "เสาชิงช้า",
    heritage: "สถาปัตยกรรม/พราหมณ์",
    points: 40,
    emoji: "🎏",
    fact: "เสาแดงสูง 21 เมตร เคยใช้ในพิธีโล้ชิงช้าของศาสนาพราหมณ์ ใกล้วัดสุทัศน์",
  },
  {
    id: "democracy",
    name: "อนุสาวรีย์ประชาธิปไตย",
    coord: [13.7567, 100.5018],
    district: "ราชดำเนิน",
    heritage: "อนุสาวรีย์",
    points: 30,
    emoji: "🏛️",
    fact: "สร้างปี พ.ศ. 2482 รำลึกการเปลี่ยนแปลงการปกครอง 2475 ตั้งกลางถนนราชดำเนินกลาง",
  },
  {
    id: "ratchadamnoen",
    name: "ถนนราชดำเนินกลาง",
    coord: [13.7575, 100.4985],
    district: "ราชดำเนิน",
    heritage: "ถนนประวัติศาสตร์",
    points: 20,
    emoji: "🛣️",
    fact: "ถนนพระราชดำริในรัชกาลที่ 5 ออกแบบตามถนนในยุโรป สองข้างเป็นอาคารสไตล์โมเดิร์น",
  },
  {
    id: "banglamphu",
    name: "ย่านบางลำพู",
    coord: [13.76, 100.4968],
    district: "บางลำพู",
    heritage: "ย่านชุมชนเก่า",
    points: 25,
    emoji: "🏮",
    fact: "ย่านการค้าเก่าแก่ ใกล้ถนนข้าวสาร มีชุมชนช่างฝีมือและร้านขนมไทยดั้งเดิม",
  },
  {
    id: "phra-sumen",
    name: "ป้อมพระสุเมรุ",
    coord: [13.7637, 100.4953],
    district: "บางลำพู",
    heritage: "ป้อมปราการ",
    points: 40,
    emoji: "🏰",
    fact: "ป้อมปราการเก่าริมแม่น้ำเจ้าพระยา 1 ใน 2 ป้อมที่เหลืออยู่จากเดิม 14 ป้อม",
  },
];

export const checkpointById = (id: string): Checkpoint | undefined =>
  CHECKPOINTS.find((c) => c.id === id);

/** รายชื่อย่านทั้งหมด (ไม่ซ้ำ) สำหรับโหมด Advance */
export const ALL_DISTRICTS: string[] = Array.from(
  new Set(CHECKPOINTS.map((c) => c.district)),
);

/** รายชื่อประเภทมรดกทั้งหมด (ไม่ซ้ำ) สำหรับโหมด Advance */
export const ALL_HERITAGE: string[] = Array.from(
  new Set(CHECKPOINTS.map((c) => c.heritage)),
);
