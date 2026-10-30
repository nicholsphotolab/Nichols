// Unit tests for the DX encoder. Run with `npm test` (Node's built-in test
// runner, which loads TypeScript directly).

import { test } from "node:test";
import assert from "node:assert/strict";
import { DX_BITS, clockBit, dxNumberFor, dxNumberForDisplay, encodeDx, normalizeStock } from "./dxCode.ts";

const str = (b: number[]) => b.join("");

test("79-15, frame 23 matches the reference code", () => {
  const code = encodeDx([79, 15], 23, false);
  assert.equal(code.length, DX_BITS);
  assert.equal(
    str(code),
    ["101010", "1001111", "0", "1111", "010111", "0", "0", "1", "0101"].join("")
  );
  // Parity bit (index 6+7+1+4+6+1+1 = 26) is 1.
  assert.equal(code[26], 1);
});

test("parity makes [last entry bit, class, specifier, parity] even", () => {
  for (const [p1, p2] of [
    [79, 13],
    [78, 2],
    [109, 9],
    [64, 5],
    [0, 0],
    [127, 15],
  ] as const) {
    const c = encodeDx([p1, p2], 1, false);
    const counted = [c[5], ...c.slice(6, 13), ...c.slice(14, 18), c[26]];
    const ones = counted.reduce((n, b) => n + b, 0);
    assert.equal(ones % 2, 0, `${p1}-${p2}`);
  }
  // 78-2: last entry bit 0, class 1001110 (4), spec 0010 (1) → 5 ones → parity 1.
  assert.equal(encodeDx([78, 2], 1, false)[26], 1);
  // 64-5: class 1000000 (1), spec 0101 (2) → 3 ones → parity 1.
  assert.equal(encodeDx([64, 5], 1, false)[26], 1);
  // 79-13: class 1001111 (5), spec 1101 (3) → 8 ones → parity 0.
  assert.equal(encodeDx([79, 13], 1, false)[26], 0);
  // 52-15: class 0110100 (3), spec 1111 (4) → 7 ones → parity 1.
  assert.equal(encodeDx([52, 15], 1, false)[26], 1);
});

test("half-frame flag and frame wrap", () => {
  assert.equal(encodeDx([79, 13], 5, true)[24], 1);
  assert.equal(encodeDx([79, 13], 5, false)[24], 0);
  assert.deepEqual(encodeDx([79, 13], 64 + 7, false), encodeDx([79, 13], 7, false));
});

test("clock track: solid ends, alternating middle", () => {
  const clock = Array.from({ length: DX_BITS }, (_, i) => clockBit(i));
  assert.equal(str(clock), "1111101010101010101010101010111");
});

test("stock lookup normalizes names and never invents codes", () => {
  assert.equal(normalizeStock("Kodak Portra 400"), "portra 400");
  assert.equal(normalizeStock("Ilford HP5 Plus"), "hp5");
  assert.deepEqual(dxNumberFor("HP5 Plus 400"), [109, 9]);
  assert.deepEqual(dxNumberFor("Ilford HP5 Plus 400"), [109, 9]);
  assert.deepEqual(dxNumberFor("PORTRA 400"), [79, 13]);
  assert.deepEqual(dxNumberFor("Gold 200"), [78, 2]);
  assert.deepEqual(dxNumberFor("EKTACHROME E100"), [52, 15]);
  assert.deepEqual(dxNumberFor("Kodak Ektachrome 100"), [52, 15]);
  assert.equal(dxNumberFor("Ektar 100"), null);
  assert.equal(dxNumberFor(undefined), null);
});

test("stand-ins, including names run together with their speed", () => {
  assert.equal(normalizeStock("Cinestill800"), "cinestill 800");
  assert.deepEqual(dxNumberFor("Portra400"), [79, 13]);
  assert.deepEqual(dxNumberFor("Cinestill800"), [43, 7]);
  assert.deepEqual(dxNumberFor("CineStill 800T"), [43, 7]);
  assert.deepEqual(dxNumberFor("EKTACHROME E100"), [52, 15]);
});

test("display codes: real where known, made-up but stable otherwise", () => {
  assert.deepEqual(dxNumberForDisplay("Portra 400"), [79, 13]);
  const fuji = dxNumberForDisplay("FUJIFILM");
  assert.deepEqual(dxNumberForDisplay("Fujifilm"), fuji);
  const [p1, p2] = fuji;
  assert.ok(p1 >= 0 && p1 <= 127 && p2 >= 0 && p2 <= 15);
  assert.equal(encodeDx(fuji, 1, false).length, DX_BITS);
  assert.notDeepEqual(dxNumberForDisplay("Ektar 100"), dxNumberForDisplay("UltraMax 400"));
});
