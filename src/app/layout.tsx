import type { Metadata, Viewport } from "next";
import { Chonburi, Sarabun } from "next/font/google";
import "./globals.css";

// ฟอนต์ display ไทยมีคาแรกเตอร์ (หัวข้อใหญ่) + body อ่านง่าย
const display = Chonburi({
  subsets: ["thai", "latin"],
  weight: "400",
  variable: "--font-chonburi",
  display: "swap",
});
const sans = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "วิ่งรอบเกาะรัตนโกสินทร์",
  description:
    "เว็บแอพวิ่งเชิงท่องเที่ยววัฒนธรรม รอบเกาะรัตนโกสินทร์ — GPS tracking + สะสมแต้ม + เกร็ดความรู้",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f0e6d2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        <div className="relative z-10 mx-auto min-h-[100dvh] max-w-app">{children}</div>
      </body>
    </html>
  );
}
