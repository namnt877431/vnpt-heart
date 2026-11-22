// Bundle src/ + ../shared into one ESM file; npm packages stay external (installed in node_modules).
import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts', 'src/db/seed-cli.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
});
