// tsup.config.ts
import { defineConfig, type Options } from "tsup";

const DEFAULT_CONFIG: Options = {
  entry: ["src/index.ts"],
  dts: true,
  clean: true,
  outDir: "dist",
  skipNodeModulesBundle: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
};

export default defineConfig([
  {
    ...DEFAULT_CONFIG,
    format: "esm",
  },
]);
