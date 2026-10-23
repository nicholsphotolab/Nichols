// Injects the ABC Areal Variable @font-face rule. A plain CSS url() can't use
// withBasePath() to survive the GitHub Pages /Nichols/ subpath, so the rule
// is built here instead and rendered once, near the root — see globals.css.
import { withBasePath } from "@/lib/basePath";

const FONT_URL = withBasePath("/fonts/ABCArealVariable.ttf");

const CSS = `@font-face {
  font-family: "ABC Areal Variable";
  src: url("${FONT_URL}") format("truetype-variations"), url("${FONT_URL}") format("truetype");
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}`;

export default function FontFace() {
  return <style>{CSS}</style>;
}
