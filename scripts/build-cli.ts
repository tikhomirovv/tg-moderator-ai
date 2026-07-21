import * as esbuild from "esbuild";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const outfile = ".output/cli.cjs";

await mkdir(dirname(outfile), { recursive: true });

await esbuild.build({
  entryPoints: ["scripts/cli-entry.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  outfile,
  banner: {
    js: "#!/usr/bin/env node",
  },
});

console.log(`Bundled operator CLI → ${outfile}`);
