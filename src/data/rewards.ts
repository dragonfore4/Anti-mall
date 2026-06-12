/** กราฟิก/ของรางวัลที่ปลดล็อกตามแต้มสะสมรวม */
export interface Collectible {
  id: string;
  code: string; // เลขลำดับเหรียญ (เลขไทย)
  name: string;
  tag: string; // ฉายาสั้น ๆ
  emoji: string;
  needPoints: number;
}

export const COLLECTIBLES: Collectible[] = [
  { id: "yak", code: "๐๐๑", name: "ยักษ์เฝ้าวัด", tag: "ทวารบาลวัดโพธิ์", emoji: "👹", needPoints: 0 },
  { id: "swing", code: "๐๐๒", name: "เสาชิงช้าแดง", tag: "นักโล้ท้าฟ้า", emoji: "🎏", needPoints: 80 },
  { id: "garuda", code: "๐๐๓", name: "ครุฑทองคำ", tag: "พาหนะแห่งเทพ", emoji: "🦅", needPoints: 160 },
  { id: "boat", code: "๐๐๔", name: "เรือสุพรรณหงส์", tag: "นักพายเจ้าพระยา", emoji: "🛶", needPoints: 240 },
  { id: "temple", code: "๐๐๕", name: "พระปรางค์อรุณ", tag: "ยอดรับแสงอรุณ", emoji: "🛕", needPoints: 320 },
  { id: "crown", code: "๐๐๖", name: "มหาพิชัยมงกุฎ", tag: "ราชันเมืองเก่า", emoji: "👑", needPoints: 450 },
];
