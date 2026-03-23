import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  sourcemap: true,
  external: [
    'express',
    'cors',
    'helmet',
    'dotenv',
    'bcrypt',
    'jsonwebtoken',
    'multer',
    'pg',
    'nodemailer',
    'passport',
    'passport-google-oauth20',
    'google-auth-library',
    'sharp',
    'express-validator',
  ],
  logLevel: 'info',
  banner: {
    js: `import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);`,
  },
});

console.log('✅ Build completed successfully!');
