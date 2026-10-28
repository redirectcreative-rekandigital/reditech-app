import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Keluaran `shadcn add`: jangan diedit manual (lihat prd/11 §2), dan
    // beberapa pola resminya belum lolos aturan react-hooks/purity baru.
    "src/components/ui/**",
    "src/hooks/use-mobile.ts",
  ]),
]);

export default eslintConfig;
