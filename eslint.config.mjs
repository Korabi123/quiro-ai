import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    //* Build output and vendored dependencies must not be linted. Without this,
    //* `eslint .` walks `.next/**` and crashes on minified server chunks.
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },
  //* eslint-config-next v16 ships native flat config, so it is imported directly
  //* rather than pulled through FlatCompat.
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
