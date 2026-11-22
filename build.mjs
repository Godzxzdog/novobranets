// Збірка: одна команда → dist/novobranets.html, який відкривається подвійним кліком.
// esbuild береться через npx (кешується після першого запуску).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = dirname(new URL(import.meta.url).pathname);
const htmlPath = resolve(root, 'web/index.html');
let html = readFileSync(htmlPath, 'utf8');

const tag = '<script type="module" src="./app.js"></script>';
if (!html.includes(tag)) {
  console.error('❌ У web/index.html немає тегу ' + tag);
  process.exit(1);
}

// Один есbuild-бандл: усе інше (стилі, розмітка) лишається в index.html.
const bundled = execFileSync(
  'npx',
  ['--yes', 'esbuild@0.24.0', 'web/entry.js', '--bundle', '--format=esm', '--target=es2022', '--log-level=error'],
  { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
);

html = html.replace(tag, `<script type="module">\n${bundled}\n</script>`);
if (!html.includes('STAT_LABELS') || !html.includes('Run(')) {
  console.error('❌ Модулі не потрапили в бандл');
  process.exit(1);
}

mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, 'dist/novobranets.html'), html);
console.log(`✅ dist/novobranets.html — ${(html.length / 1024).toFixed(1)} KB, відкривається без сервера`);