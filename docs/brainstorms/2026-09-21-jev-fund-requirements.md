---
date: 2026-09-21
topic: jev-fund
---

# Open-source Jev hedge fund (MVP)

## Problem Frame

QInvesting needs a public, cloneable proof that AI can run a fund in the open — not a private SaaS dashboard. [jev-trader](https://jev-trader.vercel.app/) showed the winning pattern: a live page that anyone can watch decide, quote, and lose money in public. Virat’s [ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) (forked on this GitHub account) is the educational multi-agent idea, but it is a CLI, not a demo people share.

This MVP is the jev-trader-shaped **paper hedge fund**: Jev (Vercel AI / TypeSafe System One) picks buy / sell / hold on a small equity book, and a demo site shows holdings, buys, and losses. The page also points people at [@QinvestingAI](https://x.com/QinvestingAI) and [qinvesting.ai](https://qinvesting.ai).

## Requirements

- R1. Public demo shows a live (or live-feeling) paper fund: current holdings with weights and unrealized P&L.
- R2. Demo shows a trade blotter of buys and sells, including realized **losses**, not only winners.
- R3. Demo shows fund-level P&L (dollars and percent), cash, exposure, win/loss counts, and an equity curve.
- R4. Each tick, a model answers buy / sell / hold for one name, with probabilities and latency, in a decision panel plus a scrolling feed.
- R5. Default path is dry-run / mock so the site and `npm run dev` work with zero API keys. Optional `MODEL=jev` uses Jev via the Vercel AI SDK `evaluate` API, and falls back to mock if the call fails.
- R6. Educational disclaimer is always visible. This is not live trading, not advice, not QInvesting’s customer product.
- R7. Footer (and README) promote X `@QinvestingAI` and https://qinvesting.ai plus the GitHub repo.
- R8. Repo is launch-ready: MIT license, README with run/deploy, env example, architecture sketch, and ready-to-post X / HN / Reddit copy.

## Success Criteria

- A stranger can open the demo and, without signing in, understand what the fund holds, what it bought, and what it lost.
- A developer can clone, `npm install`, `npm run dev`, and see the same kind of page with no secrets.
- Enabling Jev is a documented env-var swap, not a rewrite.
- Launch posts exist so the author can publish from `@QinvestingAI` the same day.

## Scope Boundaries

- No real brokerage, wallet, or on-chain orders (that is jev-trader’s Monad/Kuru loop).
- No auth, billing, or QInvesting customer accounts.
- No virattt-style personality-agent zoo in v1.
- Do not auto-post to X, HN, or Reddit from this repo; ship copy (and a demo recording) the author publishes.

## Key Decisions

- **Paper equities, not Monad market-making:** QInvesting is an investing product. The jev-trader *presentation* (holdings, tape, P&L) is the reference, not the Kuru order-book bot.
- **Mock-first Jev:** Same contract as jev-trader (`MODEL=jev` vs mock) so the public site never depends on a key.
- **Deterministic seeded history + live continuation:** The page is never empty; then it keeps ticking so a screen recording has motion.
- **Promote at the end:** Chrome stays a trading desk; X and QInvesting live in the footer and README, not a marketing hero.

## Dependencies / Assumptions

- Jev is TypeSafe’s System One model via AI SDK (`typesafe-ai/jev`). Local/OIDC or `AI_GATEWAY_API_KEY` / `TYPESAFE_AI_API_KEY` when live Jev is on.
- Brand X account is [@QinvestingAI](https://x.com/QinvestingAI). Startup site is [qinvesting.ai](https://qinvesting.ai).
- This Cursor project has no public GitHub URL until the author clicks Create repo; README should not invent one.

## Outstanding Questions

### Deferred to Planning

- [Affects R5][Technical] Exact Jev env var names and Gateway vs TypeSafe provider when deploying to Vercel.
- [Affects R1][Needs research] Whether a free public price feed is reliable enough, or simulated prices stay the default.

## Next Steps

→ Implement the MVP (dashboard + paper engine + launch kit).
