/** บรรยากาศที่เลือกได้ในโหมด Advance (และใช้ติดป้ายเส้นทาง Basic) */
export interface Atmosphere {
  id: string;
  label: string;
  emoji: string;
  desc: string;
}

export const ATMOSPHERES: Atmosphere[] = [
  {
    id: "morning",
    label: "เช้าริมน้ำ",
    emoji: "🌅",
    desc: "อากาศเย็นสบาย วิวแม่น้ำเจ้าพระยา เหมาะวิ่งเช้า",
  },
  {
    id: "heritage",
    label: "สายมรดก",
    emoji: "🏛️",
    desc: "เน้นวัด วัง อนุสรณ์สถาน เก็บเกร็ดความรู้ครบ",
  },
  {
    id: "street",
    label: "ย่านเมืองเก่า",
    emoji: "🏮",
    desc: "ตรอกซอย ตลาด ชุมชนเก่า บรรยากาศคึกคัก",
  },
  {
    id: "sunset",
    label: "เย็นย่ำสนธยา",
    emoji: "🌆",
    desc: "แสงทองยามเย็นกระทบสถาปัตยกรรมเก่า",
  },
];

export const atmosphereById = (id: string): Atmosphere | undefined =>
  ATMOSPHERES.find((a) => a.id === id);
