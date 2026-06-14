// Noto Sans Thai (fontsource woff, served by jsDelivr) — shared by the OG image
// (Satori, server-side fetch) and the recap card (browser FontFace).
// We load BOTH the "thai" and "latin" subsets under one family so mixed
// Thai+Latin+digit strings (e.g. "รัตนโกสินทร์ · ANTI-MALL CLUB", "5.24") render fully.
const BASE = "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-thai@5/files";

export const NOTO_FONT_URLS = {
  thai400: `${BASE}/noto-sans-thai-thai-400-normal.woff`,
  thai700: `${BASE}/noto-sans-thai-thai-700-normal.woff`,
  latin400: `${BASE}/noto-sans-thai-latin-400-normal.woff`,
  latin700: `${BASE}/noto-sans-thai-latin-700-normal.woff`,
} as const;

export const NOTO_FAMILY = "Noto Sans Thai";

let loadPromise: Promise<void> | null = null;

/**
 * Register Noto Sans Thai for canvas drawing. Idempotent (memoized).
 * On any fetch failure, resolves anyway — canvas falls back to system sans,
 * Thai still shapes correctly, only the typeface differs.
 */
export function loadNotoSansThai(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const faces = [
      new FontFace(NOTO_FAMILY, `url(${NOTO_FONT_URLS.thai400})`, { weight: "400" }),
      new FontFace(NOTO_FAMILY, `url(${NOTO_FONT_URLS.thai700})`, { weight: "700" }),
      new FontFace(NOTO_FAMILY, `url(${NOTO_FONT_URLS.latin400})`, { weight: "400" }),
      new FontFace(NOTO_FAMILY, `url(${NOTO_FONT_URLS.latin700})`, { weight: "700" }),
    ];
    try {
      await Promise.all(
        faces.map(async (f) => {
          await f.load();
          document.fonts.add(f);
        }),
      );
      await document.fonts.ready;
    } catch {
      /* fall back to system sans */
    }
  })();
  return loadPromise;
}
