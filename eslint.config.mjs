// ESLint flat config. Standard Vite + React + TypeScript rule sets
// (previously bridged in Next's `next/core-web-vitals` via FlatCompat — that
// bundled React, hooks, and Next-router rules together; this splits it back
// into its actual parts now that there's no Next router to lint against).
// Run with `npm run lint`.

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["out/", "node_modules/", "src/data/generated/", ".next/", ".claude/", "public/"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["scripts/**/*.{ts,mjs}", "vite.config.ts"],
    languageOptions: { globals: globals.node },
  }
);
