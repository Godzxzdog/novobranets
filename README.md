# Новобранець — двигун і прототип

Прототип ядра забігу й браузерної версії. Деталі — [docs/ENGINE.md](docs/ENGINE.md), правки після рев'ю — [CHANGES.md](CHANGES.md).

```bash
npm test          # 20 тестів: детермінізм, директор, фінали, контент
npm run sim       # 5 стилів гри × 2000 забігів + звіт про недосяжні фінали
npm run build     # dist/novobranets.html — одна сторінка, ~300 KB, без сервера
node --experimental-strip-types scripts/validate.ts   # перевірка контенту
```

Node 22+, без залежностей (esbuild береться через `npx` лише для збірки).
