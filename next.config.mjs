/** @type {import('next').NextConfig} */
const nextConfig = {
  // ปิด StrictMode: react-leaflet/html5-qrcode เข้ากับ double-mount ของ StrictMode (dev) ไม่ได้
  // ("Map container is being reused", camera AbortError) — มีผลแค่ dev, production mount ครั้งเดียวอยู่แล้ว
  // reactStrictMode: false,
};

export default nextConfig;
