# Roadmap

jev-fund is a **watchable paper book**. The point is a public tape with honest losses — not a live desk.

## Now (v0.1)

- [x] Real Yahoo Finance daily history and last print (paper fills)
- [x] Mock decision model (no API key)
- [x] Optional Jev via Vercel AI Gateway / TypeSafe
- [x] Holdings, buys, and losses on one page
- [x] Public GitHub packaging (license, citation, CI, disclaimer)

## Next

- [ ] Persist the book across process restarts (file or SQLite) so a hosted demo does not reset on cold start
- [ ] Export a tick log (JSONL) for research write-ups

## Not in scope

- Live brokerage, wallets, or private keys
- Hiding losing trades
- Claiming this is QInvesting production
