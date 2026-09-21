# Hacker News (Show HN)

**Title:** Show HN: jev-fund – open-source paper hedge fund driven by Jev

**Body:**

jev-trader made a buy/sell decision every Monad block and put the tape on a public page. I wanted that for a *fund*: holdings, buys, and losses you can watch without a login.

jev-fund is a $100k long-only paper book. Each tick, Jev (TypeSafe System One via the Vercel AI SDK) — or a mock stand-in if you have no key — answers buy / sell / hold on one name. The Next.js demo shows NAV, the equity curve, open holdings, the buy blotter, and realized losses.

It is educational. Prices and fills are simulated. It will not make you money.

Repo: https://github.com/erboland/jev-fund

I built it as an open artifact of QInvesting (qinvesting.ai) / @QinvestingAI.
