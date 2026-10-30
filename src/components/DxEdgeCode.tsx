// DxEdgeCode.tsx
// The DX edge code a real 35mm negative carries along its edge, drawn for one
// frame: the frame number, the frame's code, then the half-frame ("A") label
// with its little arrow, and the half-frame code — 47.5 bit-widths apart,
// start to start, as on film. The bits come from lib/dxCode.ts.
//
// Drawn in "bit units" (one bit wide ≈ 0.4mm on film) as a single inline SVG
// that scales to whatever width it's given. Two stacked tracks that touch: the
// clock track on top (3.2 units), the data track underneath (2.4). Runs of
// the same cell type are merged into single rects so it renders crisply.
//
// Decoration, not content: aria-hidden, since the carousel's own position
// already says which frame this is. A stock with no real DX code (CineStill,
// generic Fujifilm, anything on 120) gets a made-up but consistent one, so
// every frame shows a code.

import { DX_BITS, clockBit, dxNumberForDisplay, encodeDx } from "@/lib/dxCode";
import styles from "./DxEdgeCode.module.css";

const CLOCK_H = 3.2;
const DATA_H = 2.4;
const CODE_H = CLOCK_H + DATA_H;
/** Start-to-start distance between the frame code and its half-frame code. */
const HALF_STEP = 47.5;
/** Room left of the first code for the frame number. */
const LABEL_W = 7;
const WIDTH = LABEL_W + HALF_STEP + DX_BITS;

const NUMBER_SIZE = CODE_H * 0.78;
const HALF_LABEL_SIZE = CODE_H * 0.5;

// A cell is one bit column: which of its two tracks are inked.
type Cell = "full" | "top" | "bottom" | "none";

function cellAt(data: number[], i: number): Cell {
  const top = clockBit(i) === 1;
  const bottom = data[i] === 1;
  return top && bottom ? "full" : top ? "top" : bottom ? "bottom" : "none";
}

/** One code as a path: merged runs of same-type cells, starting at x0. */
function codePath(data: number[], x0: number): string {
  let d = "";
  let i = 0;
  while (i < DX_BITS) {
    const type = cellAt(data, i);
    let j = i + 1;
    while (j < DX_BITS && cellAt(data, j) === type) j++;
    if (type !== "none") {
      const x = x0 + i;
      const w = j - i;
      const y = type === "bottom" ? CLOCK_H : 0;
      const h = type === "full" ? CODE_H : type === "top" ? CLOCK_H : DATA_H;
      d += `M${x} ${y}h${w}v${h}h${-w}z`;
    }
    i = j;
  }
  return d;
}

export default function DxEdgeCode({
  stock,
  frame,
  className,
}: {
  /** The film stock the image was shot on, e.g. "Portra 400". */
  stock: string | null | undefined;
  /** Frame number, 0–63 (wrapped). */
  frame: number;
  className?: string;
}) {
  // Every stock gets one — the real code where there is one, otherwise a
  // made-up but consistent one (see dxNumberForDisplay).
  const dx = dxNumberForDisplay(stock);

  const n = ((frame % 64) + 64) % 64;
  const halfX = LABEL_W + HALF_STEP;
  const paths =
    codePath(encodeDx(dx, n, false), LABEL_W) + codePath(encodeDx(dx, n, true), halfX);

  return (
    <svg
      className={`${styles.dx}${className ? ` ${className}` : ""}`}
      viewBox={`0 0 ${WIDTH} ${CODE_H}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <text
        className={styles.number}
        x={LABEL_W - 1}
        y={CODE_H / 2 + NUMBER_SIZE * 0.36}
        fontSize={NUMBER_SIZE}
        textAnchor="end"
      >
        {n}
      </text>

      <path d={paths} />

      {/* The half-frame label sits before its code, with the arrow under it
          pointing on along the film. */}
      <text
        className={styles.number}
        x={halfX - 1}
        y={HALF_LABEL_SIZE * 0.78}
        fontSize={HALF_LABEL_SIZE}
        textAnchor="end"
      >
        {n}A
      </text>
      <path
        d={`M${halfX - 11.25} 4.42h8.63v-.42l1.62.6-1.62.6v-.42h-8.63z`}
        shapeRendering="geometricPrecision"
      />
    </svg>
  );
}
