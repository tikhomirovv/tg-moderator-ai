## [1.1.0] - 2026-07-12

Self-hosted Telegram AI moderation admin — **14** commits.

## What's Changed

### Added

- **rules**: add rule library with nine moderation presets in [`f0aeb33`](https://github.com/tikhomirovv/tg-moderator-ai/commit/f0aeb33b76135a8b3fe01b61f699eb267b8b3109)
- **ui**: move team join to bots page after login in [`6a4a3f7`](https://github.com/tikhomirovv/tg-moderator-ai/commit/6a4a3f727fc267e90c4b07d456f3384ac07edf7e) ([#72](https://github.com/tikhomirovv/tg-moderator-ai/issues/72))
- **rules**: uuid ids and show rule names in UI in [`23d96e6`](https://github.com/tikhomirovv/tg-moderator-ai/commit/23d96e6c20e4337405894ad7acc11cebd12ee79a)
- **ai**: expand system prompt for chat history context in [`982acb3`](https://github.com/tikhomirovv/tg-moderator-ai/commit/982acb3ba7c63e7911f0149a0871a2f34945e502)

### Fixed

- **db**: make rules uuid migration tolerate legacy rule_violated values in [`a104f05`](https://github.com/tikhomirovv/tg-moderator-ai/commit/a104f05651738a1c4267fefea84acac5f96e6413)
- **release-notes**: keep GitHub link, drop compare on app page in [`960df1d`](https://github.com/tikhomirovv/tg-moderator-ai/commit/960df1d0f1f1f7b63f27d963ef6aa813e5c2decb)
- **release**: English GitHub notes without frontmatter in [`1cf8864`](https://github.com/tikhomirovv/tg-moderator-ai/commit/1cf8864e693ecf243bf0d8a78ab109dd2b4e402a)

### Documentation

- align project docs with bot-centric stack in [`04a4d52`](https://github.com/tikhomirovv/tg-moderator-ai/commit/04a4d522e1487375c7afd94e9854bfbb280eda1f)

### Refactoring

- Telegram OIDC auth and bot-centric model ([#72](https://github.com/tikhomirovv/tg-moderator-ai/issues/72)) in [`70e6dd3`](https://github.com/tikhomirovv/tg-moderator-ai/commit/70e6dd396d5c285eda547b8451739cfca2954566)
- post-refactor audit cleanup and auth returnTo in [`d48ba7e`](https://github.com/tikhomirovv/tg-moderator-ai/commit/d48ba7ef05d2c063ef3f908ec022555d63bdf2ef)
- Telegram OIDC auth and bot-centric domain model in [`6a63e7f`](https://github.com/tikhomirovv/tg-moderator-ai/commit/6a63e7fe3158622415f4acbac41afe26c4eafb6d) ([#72](https://github.com/tikhomirovv/tg-moderator-ai/issues/72))

### Chores

- remove Better Auth skills and MCP config in [`171c2d0`](https://github.com/tikhomirovv/tg-moderator-ai/commit/171c2d0c9fe7cf528e5da41d395e1da9bbfbd6de)
- **skills**: remove vendored project-workflow from repo in [`82032c1`](https://github.com/tikhomirovv/tg-moderator-ai/commit/82032c1137c3598668cb2b67effdb44872b0d305)
- **skills**: remove discuss-research-plan from repo in [`d0cc98e`](https://github.com/tikhomirovv/tg-moderator-ai/commit/d0cc98e7f0676ef5712baadbe6b445815722c38a)