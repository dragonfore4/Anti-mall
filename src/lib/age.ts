/** อายุเต็มปีจากวันเกิด (รูปแบบ "YYYY-MM-DD") — คืน null ถ้าไม่มี/รูปแบบผิด */
export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const [y, m, d] = dob.split("-").map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}
