// ESLint flat config. Pulls in Next.js's recommended rule sets
// (next/core-web-vitals: React + hooks + next/* rules; next/typescript adds
// @typescript-eslint recommendations) via the FlatCompat bridge, since
// eslint-config-next still ships in the legacy "extends" format.
// Run with `npm run lint` (plain `eslint .` — `next lint` is deprecated).

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  { ignores: [".next/", "out/", "node_modules/", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
