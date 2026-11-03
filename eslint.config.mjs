import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Findings that already exist in the public site's code. They are reported as warnings so the lint
    // command can run in CI without the platform work rewriting frontend code; triage them separately.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/use-memo": "warn",
      "react/jsx-key": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  globalIgnores([".next/**", "admin/.next/**", "out/**", "node_modules/**", "drizzle/**", "backups/**", "reports/**", "src/data/generated/**", "next-env.d.ts"]),
]);
