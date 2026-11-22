// Збірка: одна команда → dist/novobranets.html, який відкривається подвійним кліком.
// esbuild береться через npx (кешується після першого запуску).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
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

// Фото вшиваємо як data-URI: гра має лишитись одним файлом без інтернету.
// esbuild беремо з npx-кешу, а data-URI підставляємо власним кроком.
const bundledRaw = execFileSync(
  'npx',
  ['--yes', 'esbuild@0.24.0', 'web/entry.js', '--bundle', '--format=esm', '--target=es2022', '--log-level=error'],
  { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
);

const photosDir = resolve(root, 'assets/photos');
let bundled = bundledRaw;
if (existsSync(photosDir)) {
  const files = readdirSync(photosDir).filter((f) => f.endsWith('.jpg'));
  for (const f of files) {
    const key = resolve(photosDir, f);
    const dataUri = `data:image/jpeg;base64,${readFileSync(key).toString('base64')}`;
    const placeholder = `__PHOTO_${f.replace('.jpg', '')}__`;
    // Модуль photos.ts експортує шлях до файлу; замінюємо його на вміст.
    bundled = bundled.split(`assets/photos/${f}`).join(dataUri);
    void placeholder;
  }
}

html = html.replace(tag, `<script type="module">\n${bundled}\n</script>`);
if (!html.includes('STAT_LABELS') || !html.includes('Run(')) {
  console.error('❌ Модулі не потрапили в бандл');
  process.exit(1);
}

mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, 'dist/novobranets.html'), html);
console.log(`✅ dist/novobranets.html — ${(html.length / 1024).toFixed(1)} KB, відкривається без сервера`);