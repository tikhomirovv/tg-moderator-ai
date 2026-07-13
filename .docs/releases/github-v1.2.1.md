## [1.2.1] - 2026-07-13

Self-hosted Telegram AI moderation admin — **10** commits.

## What's Changed

### Added

- **bots**: owner-only bot deletion API and UI ([#87](https://github.com/tikhomirovv/tg-moderator-ai/issues/87)) in [`a18c7d6`](https://github.com/tikhomirovv/tg-moderator-ai/commit/a18c7d6a663f968b94ae1a81ca4585e5bb6b8791)
- **chats**: auto-add via Telegram, health, avatars ([#76](https://github.com/tikhomirovv/tg-moderator-ai/issues/76)) ([#84](https://github.com/tikhomirovv/tg-moderator-ai/issues/84)) in [`6d12a58`](https://github.com/tikhomirovv/tg-moderator-ai/commit/6d12a585c36e0aa2c3431c041d7a18a9199cd75b)
- **auth**: bot login link fallback via platform bot ([#83](https://github.com/tikhomirovv/tg-moderator-ai/issues/83)) in [`9871dc5`](https://github.com/tikhomirovv/tg-moderator-ai/commit/9871dc5aa9b12f38411b3f5e836cac6f0fd5dc85)
- **moderation**: per-bot warn/ban message templates ([#82](https://github.com/tikhomirovv/tg-moderator-ai/issues/82)) in [`1a0de5b`](https://github.com/tikhomirovv/tg-moderator-ai/commit/1a0de5b4cb1ab07ba6d38a35308b064099b57a10)
- **bots**: resolve bot id and name from token via getMe ([#81](https://github.com/tikhomirovv/tg-moderator-ai/issues/81)) in [`eab27ed`](https://github.com/tikhomirovv/tg-moderator-ai/commit/eab27edefc52521c8b262b3f1cec359002330ef3)
- **ui**: add document titles to all pages ([#80](https://github.com/tikhomirovv/tg-moderator-ai/issues/80)) in [`b26c630`](https://github.com/tikhomirovv/tg-moderator-ai/commit/b26c630fb14fe9f0bc6921c79116bdbea196d9e5)

### Fixed

- **rules**: unblock PUT/DELETE by moving chat photo route in [`22719da`](https://github.com/tikhomirovv/tg-moderator-ai/commit/22719dae9c7e0da39659009746c7afd1441d4ed4)
- **ui**: send empty JSON body on POST via tunnel in [`dac58b0`](https://github.com/tikhomirovv/tg-moderator-ai/commit/dac58b0bab29b1a75d1b55d3fe86ecd495925618) ([#90](https://github.com/tikhomirovv/tg-moderator-ai/issues/90))
- **bots**: cascade delete audit tables via bot_id FK ([#88](https://github.com/tikhomirovv/tg-moderator-ai/issues/88)) in [`f3306f8`](https://github.com/tikhomirovv/tg-moderator-ai/commit/f3306f8287cc2778d4ed6bb5d3ad32a324a4ce1e)
- **auth**: correct login-bot imports and dedupe TelegramFetch ([#85](https://github.com/tikhomirovv/tg-moderator-ai/issues/85)) in [`f906cc6`](https://github.com/tikhomirovv/tg-moderator-ai/commit/f906cc678a83dff67c80e58ee6183a21bff5b7d9)