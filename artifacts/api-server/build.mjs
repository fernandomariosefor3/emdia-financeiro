import * as esbuild from 'esbuild'; 
esbuild.build({ entryPoints: ['src/index.ts'], bundle: true, format: 'esm', outfile: 'dist/index.mjs', sourcemap: true, packages: 'external' }).catch(() => process.exit(1));
