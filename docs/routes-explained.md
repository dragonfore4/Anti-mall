# อธิบาย `src/data/routes.ts` (ฉบับเข้าใจง่าย)

ไฟล์นี้คือ **"ทะเบียนเส้นทางวิ่ง"** — เก็บรายการเส้นทาง + มีตัวช่วยกรอกข้อมูลน่าเบื่อให้อัตโนมัติ

> แนวคิด: เวลาสร้างเส้นทาง 1 เส้น เราอยากพิมพ์แค่ **"ชื่อ + ผ่านหมุดไหนบ้าง"** ที่เหลือ (พิกัด, ระยะทาง, แคลอรี่) ให้คอมคิดเอง

---

## ภาพรวม: ไฟล์นี้มี 4 ชิ้น

```
checkpointPath()   ── แปลง "ชื่อหมุด" → "พิกัด"
BasicSpec + basic()── เครื่องกรอกอัตโนมัติ (ใส่ค่าที่คำนวณได้ให้)
BASIC_ROUTES       ── รายการเส้นทางจริง (3-4 เส้น)
basicRouteById()   ── หาเส้นทางจาก id
```

---

## ชิ้นที่ 1 — `checkpointPath()` แปลงชื่อหมุด → พิกัด

```ts
export function checkpointPath(checkpointIds: string[]): LatLng[] {
  return checkpointIds
    .map((id) => checkpointById(id)?.coord)               // ① ชื่อ → พิกัด
    .filter((coord): coord is LatLng => Boolean(coord));  // ② ทิ้งตัวที่หาไม่เจอ
}
```

**รับ** ลิสต์ชื่อหมุด → **คืน** ลิสต์พิกัด

```
["grand-palace", "wat-pho"]  →  [[13.751, 100.4915], [13.7466, 100.4925]]
```

- `?.coord` (optional chaining) = "ถ้าหาหมุดไม่เจอ → คืน `undefined` ไม่พังตอนอ่าน `.coord`"
- `.filter(...)` = เอา `undefined` ออก (กันกรณีพิมพ์ชื่อหมุดผิด)

⚠️ **กับดัก:** ถ้า id หาไม่เจอ → ถูกกรองทิ้ง**เงียบๆ** (หมุดหายจากเส้นทาง)
> แต่ตอนนิยามเส้นทางใน routes.ts จะไม่เจอปัญหานี้แล้ว เพราะ `checkpointIds` เป็น type `CheckpointId[]` (ดูชิ้นที่ 2) — พิมพ์ผิด TS ฟ้องตั้งแต่ตอนเขียน · ตัว `.filter()` นี้เป็นตาข่ายกันพลาดสำหรับ id ที่มาจากแหล่งที่ไม่ผ่าน type เช่น draft route ใน localStorage

---

## ชิ้นที่ 2 — `BasicSpec` แบบฟอร์มที่ต้องกรอก

```ts
type BasicSpec = {
  id: string;
  name: string;
  desc: string;
  atmosphere: string;
  checkpointIds: CheckpointId[];   // ← id หมุด (ไม่ใช่ string ทั่วไป)

  path?: LatLng[];
  distanceKm?: number;
  legCalories?: number[];
};
```

**กฎเดียวที่ต้องจำ: ฟิลด์ไหนมี `?` = ไม่บังคับ, ไม่มี `?` = บังคับ**

| ฟิลด์ | ต้องกรอกไหม |
|---|---|
| `id`, `name`, `desc`, `atmosphere`, `checkpointIds` | ✅ **ต้องกรอก** (ไม่มี `?`) |
| `path`, `distanceKm`, `legCalories` | ⬜ ใส่ก็ได้ ไม่ใส่ก็ได้ (มี `?` — basic() คำนวณให้) |
| `kind` | ❌ ใส่ไม่ได้ (ไม่อยู่ใน BasicSpec — factory ใส่ `"basic"` ให้เอง) |

### `CheckpointId` คืออะไร

`checkpointIds` ใช้ type `CheckpointId[]` ไม่ใช่ `string[]` — `CheckpointId` เป็น union ของ id หมุดทั้งหมด (นิยามใน [`src/types.ts`](../src/types.ts)):

```ts
type CheckpointId = "grand-palace" | "wat-pho" | "tha-tien" | ... ;
```

ผลคือ **พิมพ์ id ผิด TypeScript ฟ้องทันทีตอนเขียน** (ไม่ต้องรอ runtime) + มี autocomplete ขึ้นรายชื่อหมุดให้เลือก:

```ts
checkpointIds: ["grand-palace", "wat-po"]   // ❌ TS error: "wat-po" ไม่ใช่ CheckpointId
```

---

## ชิ้นที่ 3 — `basic()` เครื่องกรอกอัตโนมัติ ⭐ (ตัวที่งงสุด)

```ts
function basic(spec: BasicSpec): RouteDef {
  const cpPath = checkpointPath(spec.checkpointIds);              // พิกัดหมุด
  const path = spec.path ?? cpPath;                              // ①
  const legCalories = spec.legCalories ?? legCaloriesFromPath(cpPath); // ②
  const expected = spec.checkpointIds.length - 1;                // ③ เช็คความถูกต้อง
  if (legCalories.length !== expected) {
    console.warn(`...legCalories มี ${legCalories.length} ค่า แต่ควรเป็น ${expected}...`);
  }
  return {
    ...spec,
    kind: "basic",
    path,
    distanceKm: spec.distanceKm ?? metersToKm(pathLengthM(path)), // ①
    legCalories,
  };
}
```

**กุญแจคือ `??` (nullish coalescing)** อ่านว่า _"ถ้าฝั่งซ้ายไม่มี (undefined) → ใช้ฝั่งขวาแทน"_

- ① `spec.path ?? cpPath` → ไม่ได้ใส่ `path` มา ก็ใช้พิกัดหมุด
- ① `spec.distanceKm ?? metersToKm(...)` → ไม่ได้ใส่ระยะ ก็คำนวณจากความยาวเส้นทาง
- ② `spec.legCalories ?? legCaloriesFromPath(cpPath)` → ไม่ได้ใส่แคลต่อช่วง ก็คิดจากระยะให้ (~65 แคล/กม.)
- ③ ถ้ากรอก `legCalories` มาแต่จำนวนไม่ตรง (≠ หมุด−1) → `console.warn` เตือน (กัน credit 0 เงียบๆ)

`{ ...spec, ... }` (spread) = "เอาทุกฟิลด์ที่กรอกมา (id/name/...) + เติม kind/path/distanceKm/legCalories"

---

## ตัวอย่างจริง — เส้น `temple-short`

**สิ่งที่เราเขียน** (น้อยมาก):
```ts
basic({
  id: "temple-short",
  name: "สายวัด–วัง (สั้น)",
  desc: "เส้นสั้นเน้นวัดพระแก้ว วัดโพธิ์ ท่าเตียน เหมาะมือใหม่",
  atmosphere: "morning",
  checkpointIds: ["grand-palace", "wat-pho", "tha-tien", "sanam-luang"],
  legCalories: [90, 70, 130],
})
```

**สิ่งที่ `basic()` ปั้นออกมา** (ตัว **เน้น** = เติมให้อัตโนมัติ):
```ts
{
  id: "temple-short",
  name: "สายวัด–วัง (สั้น)",
  desc: "เส้นสั้นเน้นวัดพระแก้ว วัดโพธิ์ ท่าเตียน เหมาะมือใหม่",
  atmosphere: "morning",
  checkpointIds: ["grand-palace", "wat-pho", "tha-tien", "sanam-luang"],
  legCalories: [90, 70, 130],
  kind: "basic",                              // ← เติม
  path: [                                     // ← เติม (จาก checkpointPath)
    [13.751, 100.4915],   // grand-palace
    [13.7466, 100.4925],  // wat-pho
    [13.7438, 100.492],   // tha-tien
    [13.7556, 100.4922],  // sanam-luang
  ],
  distanceKm: 2.13,                           // ← เติม (คำนวณจาก path)
}
```

### `legCalories: [90, 70, 130]` หมายความว่าอะไร

แคลอรี่ผูกกับ **"ช่วง" (leg) ระหว่างหมุด** ไม่ใช่ตัวหมุด:

```
grand-palace ──90──► wat-pho ──70──► tha-tien ──130──► sanam-luang
  (หมุด ๑)           (หมุด ๒)         (หมุด ๓)            (หมุด ๔)
              ช่วง๑           ช่วง๒            ช่วง๓
```

- วิ่งช่วง ๑ (หมุด๑→๒) ถึง wat-pho ได้ **90** แคล
- วิ่งช่วง ๒ (หมุด๒→๓) ถึง tha-tien ได้ **70** แคล
- วิ่งช่วง ๓ (หมุด๓→๔) ถึง sanam-luang ได้ **130** แคล

→ **๔ หมุด มี ๓ ช่วง** เลยกรอก `legCalories` 3 ตัว (กฎ: `legCalories.length = จำนวนหมุด − 1`)

> หมุดแรก (จุดเริ่ม) ไม่มีช่วงก่อนหน้า → ได้ 0 แคล

---

## ชิ้นที่ 4 — `basicRouteById()` หาเส้นจาก id

```ts
export const basicRouteById = (id: string): RouteDef | undefined =>
  BASIC_ROUTES.find((r) => r.id === id);
```

หน้าวิ่งเรียกตัวนี้: เปิด URL `/run/temple-short` → เอา `"temple-short"` มาหาเส้นทาง (ไม่เจอคืน `undefined`)

---

## วิธีเพิ่มเส้นทางใหม่ (recipe)

ก๊อป block `basic({...})` แล้วแก้ 5 อย่าง:

```ts
basic({
  id: "river-walk",              // 1. id ไม่ซ้ำใคร
  name: "เลียบเจ้าพระยา",         // 2. ชื่อโชว์
  desc: "เน้นจุดริมน้ำ",          // 3. คำอธิบาย
  atmosphere: "sunset",          // 4. บรรยากาศ
  checkpointIds: ["tha-tien", "phra-sumen"],  // 5. หมุดที่ผ่าน (เรียงลำดับ)
  // legCalories: [120],         // (ไม่ใส่ก็ได้ — คิดจากระยะให้)
})
```

`path` / `distanceKm` / `kind` **ไม่ต้องเขียน** — มาเอง

---

## สรุปการไหลทั้งไฟล์

```
พิมพ์แค่ checkpointIds (+ legCalories ถ้าอยากกำหนดเอง)
        │  basic() ช่วยเติม path/distanceKm/legCalories/kind
        ▼
RouteDef เต็มพร้อมใช้
        │  เก็บใน BASIC_ROUTES
        ▼
basicRouteById(id)  ←  หน้าวิ่ง /run/[id] หยิบไปใช้
```

---

## คำศัพท์ที่อาจงง

| สัญลักษณ์/คำ | แปล |
|---|---|
| `?.` (optional chaining) | "ถ้าตัวหน้าเป็น undefined ก็หยุด คืน undefined ไม่พัง" |
| `??` (nullish coalescing) | "ถ้าซ้าย undefined/null → ใช้ขวาแทน" |
| `field?: T` | ฟิลด์ optional (มี `?` = ไม่บังคับ) |
| `CheckpointId` | union ของ id หมุดทั้งหมด — พิมพ์ผิด TS ฟ้อง (แทน `string`) |
| `...spec` (spread) | กระจายทุกฟิลด์ของ spec ลงใน object ใหม่ |
| `coord is LatLng` (type guard) | บอก TypeScript ว่าหลัง filter เหลือแต่ LatLng จริง |
| `leg` | "ช่วง" ระหว่างหมุด ๒ จุด |
