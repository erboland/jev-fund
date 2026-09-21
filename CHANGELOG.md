# Changelog

All notable changes to this project are documented here.

## [0.1.1] — 2026-09-21

### Changed

- Paper book now trades **real Yahoo Finance** daily closes, then marks to the latest Yahoo print
- Removed the seeded geometric-Brownian market path from the live tape
- Tests replay a recorded Yahoo session fixture (no network in CI)

## [0.1.0] — 2026-09-21

### Added

- Paper hedge-fund engine: $100k long-only book, honest realized P&amp;L
- Jev (`typesafe-ai/jev` via Vercel AI SDK `experimental_evaluate`) with a keyless mock fallback
- Public dashboard: NAV, equity curve, this-tick probabilities, holdings, buys, and **losses**
- Tests that the blotter records holdings, buys, and losing sells
- OSS packaging in the style of other quant-finance research repos: MIT license, citation, CI, security policy, code of conduct
