import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Resolve a Tamil-capable font for the PDF report. PDFKit's built-in fonts are
 * Latin-only, so Tamil glyphs need an embedded TrueType font.
 *
 * Resolution order (first existing wins):
 *   1. Explicit env paths (production).
 *   2. A font bundled in the repo at `assets/fonts/` — the recommended production
 *      setup (drop in an OFL-licensed Noto Sans Tamil).
 *   3. A common Linux Noto install path.
 *   4. The macOS system Tamil font (developer machines) — a `.ttc`, so it needs a
 *      family name.
 *
 * Returns null when no Tamil font is available; the PDF then renders in English
 * only (still a clean, useful report).
 */

export type FontRef = { path: string; family?: string };
export type TamilFonts = { regular: FontRef; bold: FontRef } | null;

function firstExisting(refs: FontRef[]): FontRef | null {
  for (const ref of refs) {
    if (ref.path && existsSync(ref.path)) return ref;
  }
  return null;
}

const bundled = (file: string) => path.join(process.cwd(), 'assets', 'fonts', file);

export function resolveTamilFonts(): TamilFonts {
  const regular = firstExisting([
    ...(process.env.NEET_TAMIL_FONT_REGULAR ? [{ path: process.env.NEET_TAMIL_FONT_REGULAR }] : []),
    { path: bundled('NotoSansTamil-Regular.ttf') },
    { path: '/usr/share/fonts/truetype/noto/NotoSansTamil-Regular.ttf' },
    { path: '/System/Library/Fonts/Supplemental/Tamil Sangam MN.ttc', family: 'TamilSangamMN' },
  ]);
  if (!regular) return null;

  const bold =
    firstExisting([
      ...(process.env.NEET_TAMIL_FONT_BOLD ? [{ path: process.env.NEET_TAMIL_FONT_BOLD }] : []),
      { path: bundled('NotoSansTamil-Bold.ttf') },
      { path: '/usr/share/fonts/truetype/noto/NotoSansTamil-Bold.ttf' },
    ]) ?? regular; // fall back to regular when no bold face is present

  return { regular, bold };
}
