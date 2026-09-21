# Contributing to jev-fund

Thanks for helping make an honest paper fund.

## Rules of the desk

1. Default path stays keyless (`MODEL=mock`).
2. Paper P&L must stay honest. Do not hide losing sells from the Losses tape.
3. No live brokerage, wallet, or private-key hooks in this repo.
4. Keep PRs small and focused.

## Setup

```bash
git clone https://github.com/erboland/jev-fund.git
cd jev-fund
npm install
cp .env.example .env.local
npm test
npm run lint
npm run dev
```

## Pull requests

1. Fork the repository.
2. Create a feature branch.
3. Add or update tests when you touch `src/lib/fund.ts`.
4. Open a PR against `main`.

Feature ideas belong in an issue tagged `enhancement`.
