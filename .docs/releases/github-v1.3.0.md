## [1.3.0] - 2026-07-16

Self-hosted Telegram AI moderation admin — **10** commits.

## What's Changed

### Added

- **bots**: restrict manager from delete and team admin in [`8b0eca5`](https://github.com/tikhomirovv/tg-moderator-ai/commit/8b0eca5b07f10810533bad129af7006e5951e606)
- **billing**: add provider_payments table for durable checkout recovery in [`5df5b53`](https://github.com/tikhomirovv/tg-moderator-ai/commit/5df5b5304f60c141200719659a4940525317c6f6)
- **billing**: SaaS credits, deployment mode, self-hosted LLM ([#115](https://github.com/tikhomirovv/tg-moderator-ai/issues/115)-119) in [`d9cc34b`](https://github.com/tikhomirovv/tg-moderator-ai/commit/d9cc34bb7e0e9375bde265e00b4af028906b6fff)
- **ui**: refresh credits page via YooKassa payment sync in [`4bd57d4`](https://github.com/tikhomirovv/tg-moderator-ai/commit/4bd57d442fcef50027a000bfe351c4eb2ea1d7de)
- **billing**: sync YooKassa payment status when webhook missed in [`75de0c3`](https://github.com/tikhomirovv/tg-moderator-ai/commit/75de0c3cbe7b0932603022c778f807f1fcc9fd57)
- **billing**: SaaS credits, deployment mode, and self-hosted LLM settings in [`224c325`](https://github.com/tikhomirovv/tg-moderator-ai/commit/224c325f05c9e03d8f74d9ef08815f8d4559805c) ([#114](https://github.com/tikhomirovv/tg-moderator-ai/issues/114), [#115](https://github.com/tikhomirovv/tg-moderator-ai/issues/115), [#119](https://github.com/tikhomirovv/tg-moderator-ai/issues/119))

### Fixed

- **dashboard**: localize all moderation actions and chat names in [`5bc6c2f`](https://github.com/tikhomirovv/tg-moderator-ai/commit/5bc6c2fab71bc080906b54be5981158c1121fa4d)
- **i18n**: place vue-i18n config under i18n/ for module v10 in [`2ee1f68`](https://github.com/tikhomirovv/tg-moderator-ai/commit/2ee1f68a85cc1d2eab20746e3094b96e567360f5)

### Documentation

- **i18n**: document i18n/i18n.config.ts path in [`3d2c429`](https://github.com/tikhomirovv/tg-moderator-ai/commit/3d2c429c60041971f05ebbeac9adac391e9ee0e7)

### Tests

- **billing**: cover payment sync and fetchPayment paths in [`d093059`](https://github.com/tikhomirovv/tg-moderator-ai/commit/d093059f23ffa0dcf9cf01c15baa47c82dea4bdf)