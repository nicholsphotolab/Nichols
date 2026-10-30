// dxCode.ts
// The DX edge code a real 35mm negative carries along its edge: a two-track
// barcode (clock on top, data underneath) printed once per frame, encoding
// the film's DX number and that frame's number. Pure data — DxEdgeCode.tsx
// draws it.
//
// Encoding, 31 bits per code, left to right (I3A "DX codes for 135-size
// film", expanded code):
//
//   entry        6   101010
//   class        7   DX number part 1, MSB first
//   separator    1   0
//   specifier    4   DX number part 2, MSB first
//   frame        6   frame number 0–63, MSB first
//   half frame   1   0 for frame N, 1 for N "A" (the half-frame code)
//   separator    1   0
//   parity       1   makes the 1s in [last entry bit, class, specifier,
//                    parity] even
//   exit         4   0101
//
// No relative or aliased imports, so the node:test suite can load it as-is.

export type DxNumber = readonly [part1: number, part2: number];

/**
 * DX numbers by stock, from the I3A "DX codes for 135-size film" table.
 * Stocks not in that table (Ektar 100, UltraMax 400, ColorPlus, the newer
 * Portra 160 emulsion…) are deliberately absent — never invent a code. The
 * few the hero shows anyway are listed separately as stand-ins (below).
 *
 * Keys are normalized stock names (see normalizeStock).
 */
const DX_NUMBERS: Record<string, DxNumber> = {
  "portra 400": [79, 13],
  "portra 160": [79, 11],
  "portra 800": [43, 7],
  "gold 200": [78, 2], // the older listing is 96-12
  "gold 100": [78, 1],
  "tri-x": [64, 5],
  "hp5": [109, 9],
  "hp5 400": [109, 9], // "Ilford HP5 Plus 400", as the hero names it
  // The table's "KODAK Ektachrome 100 Film". Today's Ektachrome E100 (2018)
  // postdates the 2008 table; this is the nearest listing, chosen to stand in
  // for it.
  "ektachrome 100": [52, 15],
  "ektachrome e100": [52, 15],
};

/**
 * Stocks the film hero shows a code for although the table has no entry of
 * their own, each borrowing a listed stock's number. Keyed by the full name,
 * brand included (see spacedStock), since a brand can be most of the name.
 */
const STAND_INS: Record<string, DxNumber> = {
  // CineStill isn't in the table (and is often unmarked, its remjet removed).
  // Kodak Portra 800 — the table's C-41 800 — stands in.
  "cinestill 800": [43, 7],
  "cinestill 800t": [43, 7],
};

/**
 * Lowercased, with a space between a name and a speed run together —
 * "Cinestill800" → "cinestill 800", "Portra400" → "portra 400". Only two or
 * more letters followed by two or more digits, so "E100" in "Ektachrome E100"
 * and "HP5" stay whole.
 */
function spacedStock(stock: string): string {
  return stock
    .toLowerCase()
    .replace(/([a-z]{2,})(\d{2,})/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * "Kodak Portra 400", "PORTRA 400" and "Portra 400" all → "portra 400";
 * "Ilford HP5 Plus" → "hp5". Brand names and "Plus" are dropped so the
 * site's short captions match the table's full product names.
 */
export function normalizeStock(stock: string): string {
  return spacedStock(stock)
    .replace(/\b(kodak|ilford|fujifilm|fuji)\b/g, "")
    .replace(/\bplus\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The stock's DX number, or null when it isn't in the table. */
export function dxNumberFor(stock: string | null | undefined): DxNumber | null {
  if (!stock) return null;
  return STAND_INS[spacedStock(stock)] ?? DX_NUMBERS[normalizeStock(stock)] ?? null;
}

/**
 * A DX number for every stock, for drawing: the real one (or a stand-in) when
 * there is one, otherwise a made-up one worked out from the stock's name —
 * so the hero's edge code never goes blank, and a given stock always gets the
 * same code. Decoration, not data: 120, generic "Fujifilm" and the like carry
 * no DX code on real film.
 */
export function dxNumberForDisplay(stock: string | null | undefined): DxNumber {
  const known = dxNumberFor(stock);
  if (known) return known;

  // FNV-1a over the normalized name, split into the two parts' ranges.
  let h = 0x811c9dc5;
  for (const ch of normalizeStock(stock ?? "")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return [h % 128, (h >>> 7) % 16];
}

export const DX_BITS = 31;

function bits(value: number, width: number): number[] {
  const out: number[] = [];
  for (let i = width - 1; i >= 0; i--) out.push((value >> i) & 1);
  return out;
}

/** The 31 data-track bits for one frame code. */
export function encodeDx(
  [part1, part2]: DxNumber,
  frame: number,
  half: boolean
): number[] {
  if (part1 < 0 || part1 > 127) throw new RangeError(`DX part 1 out of range: ${part1}`);
  if (part2 < 0 || part2 > 15) throw new RangeError(`DX part 2 out of range: ${part2}`);
  const f = ((frame % 64) + 64) % 64;

  const entry = [1, 0, 1, 0, 1, 0];
  const cls = bits(part1, 7);
  const spec = bits(part2, 4);
  const ones = [entry[5], ...cls, ...spec].reduce((n, b) => n + b, 0);
  const parity = ones % 2;

  return [
    ...entry,
    ...cls,
    0,
    ...spec,
    ...bits(f, 6),
    half ? 1 : 0,
    0,
    parity,
    0, 1, 0, 1,
  ];
}

/** The clock track: solid at both ends, then every other bit. */
export function clockBit(i: number, n = DX_BITS): number {
  return i < 5 || i >= n - 3 || i % 2 === 0 ? 1 : 0;
}
