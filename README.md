# leave-calculator-vue

Scaffolded Vite + Vue 3 + TypeScript app for leave calculations.


Features:

- Leave balance calculator (paste data, calculates accruals and final compensation)
- Days counter (Hijri month breakdown)
- Supports two calendar modes: Umm al-Qura and an arithmetical Hijri algorithm


Getting started:

1. Install dependencies

```bash
npm install
```

1. Run dev server

```bash
npm run dev
```

1. Run tests

```bash
npm test
```


Notes:

- This project uses `@umalqura/core` for Umm al‑Qura conversions and a small arithmetical algorithm for generic Hijri conversion. Install packages before running.
- The accrual/business rules are preserved from the original app.
