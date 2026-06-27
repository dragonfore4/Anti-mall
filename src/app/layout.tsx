import type { Metadata, Viewport } from "next";
import { Kanit, Sarabun, Fredoka } from "next/font/google";
import "./globals.css";

// ฟอนต์ display ไทยทรงเรขาคณิต หนา เล่นสนุก (หัวข้อใหญ่) + body อ่านง่าย
const display = Kanit({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-kanit",
  display: "swap",
});
// ฟอนต์โลโก้ "young vibes" — ตัวกลม หนา (latin)
const brand = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});
const sans = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sarabun",
  display: "swap",
});

const SITE_URL = "https://anti-mall.vercel.app";
const SITE_NAME = "วิ่งรอบเกาะรัตนโกสินทร์";
const SITE_DESC =
  "เว็บแอพวิ่งเชิงท่องเที่ยววัฒนธรรม รอบเกาะรัตนโกสินทร์ — GPS tracking + สะสมแต้ม + เกร็ดความรู้ + สแกน QR สะสมเหรียญสถานที่";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  keywords: ["วิ่ง", "รัตนโกสินทร์", "เมืองเก่า", "กรุงเทพ", "GPS", "มรดกวัฒนธรรม", "anti-mall"],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESC,
    locale: "th_TH",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESC,
  },
};

export const viewport: Viewport = {
  themeColor: "#3b1a4e",
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
    <html lang="th" className={`${display.variable} ${sans.variable} ${brand.variable}`}>
      <body className="font-sans">
        <div className="relative z-10 min-h-[100dvh]">{children}</div>
      </body>
    </html>
  );
}
