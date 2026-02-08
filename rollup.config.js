import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const isDev = process.env.BUILD === "development";

export default {
  input: "src/main.ts",
  output: {
    file: "dist/linear-gauge-card.js",
    format: "es",
    inlineDynamicImports: true,
    sourcemap: isDev,
  },
  plugins: [
    resolve(),
    typescript(),
    !isDev && terser(),
  ],
};
