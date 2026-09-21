# Security

jev-fund is an **educational paper trader**. It must never hold production secrets for a live broker.

## Do not

- Commit `.env.local`, private keys, or AI Gateway tokens
- Open an issue that includes secrets

## Reporting

Open a private GitHub security advisory on [erboland/jev-fund](https://github.com/erboland/jev-fund) if you find a vulnerability in the demo (XSS, secret leak, unexpected order-routing).

This software does not execute real trades. If you fork it into a live system, you own that risk.
