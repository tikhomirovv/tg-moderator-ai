## [1.3.2] - 2026-07-21

Self-hosted Telegram AI moderation admin — **17** conventional commits (18 total).

## What's Changed

### Added

- **rules**: AI assist draft mode for empty rules in [`1c6489d`](https://github.com/telemodai/app/commit/1c6489d5f1a648163f20edfbdb2162120e4f746e)
- **rules**: AI assist to rewrite rule text in modal in [`9f6fd5b`](https://github.com/telemodai/app/commit/9f6fd5bda88c6415bca8f315ef392883de813ff2) ([#146](https://github.com/telemodai/app/issues/146))
- **billing**: add cli credits grant via admin_adjust in [`c3096d2`](https://github.com/telemodai/app/commit/c3096d2be92cf7e224544fe6e3ecf3dd07dbfa84)
- **cli**: add commander operator CLI with promo create in [`58d3211`](https://github.com/telemodai/app/commit/58d32112452904c4a720d4c7fe9201e563e37ccc)
- **billing**: add product referral rewards for SaaS in [`cd99727`](https://github.com/telemodai/app/commit/cd99727c833cb958e669e8074f4bdd9cd17b9d48)
- **billing**: add purchase promo codes for SaaS checkout in [`869a38a`](https://github.com/telemodai/app/commit/869a38a9aedb0ee357ad0a3d930dbcddd2242bba)
- configurable product name via APP_NAME env in [`62bae89`](https://github.com/telemodai/app/commit/62bae898c74fa7c118db04500eecdafa32833e44)

### Fixed

- **i18n**: drop e.g. prefix from AI assist placeholders in [`af65c6c`](https://github.com/telemodai/app/commit/af65c6c52fbea2e4fdf74242ef1fd7d0ea050215)
- **promo**: clear stale cookie on current; errors only on apply in [`3fa929d`](https://github.com/telemodai/app/commit/3fa929d22245b49353808a878e9ef3e1c89903de)
- **ui**: human-readable promo apply errors on credits page in [`40e950a`](https://github.com/telemodai/app/commit/40e950ac04cda4b23c5b59c7137d5604a999c741)
- **retention**: restore sql import for count query in [`330dab0`](https://github.com/telemodai/app/commit/330dab0be116ffc761f3c5a14c9ba41ae0d77141)
- **retention**: use lt() for moderation_decisions delete cutoff in [`5b9d6fa`](https://github.com/telemodai/app/commit/5b9d6faff78eb28fd743154da199ab1441cdf608)

### Documentation

- MIT license, telemodai/app repo and GHCR paths in [`60baf5d`](https://github.com/telemodai/app/commit/60baf5d36c7526f3b84a8be230ae228240afd14c)

### CI

- publish Docker image to ghcr.io/telemodai/app in [`7d9652c`](https://github.com/telemodai/app/commit/7d9652caa20a88224a755ae39c39deceab367998)

### Chores

- drop unrelated promo-cookie test from PR in [`4da445b`](https://github.com/telemodai/app/commit/4da445bd8f9b86422e423e67ee49a27b3c201433)
- **license**: switch from MIT to PolyForm Noncommercial in [`2e42e17`](https://github.com/telemodai/app/commit/2e42e170ad1c6edffc5f0340cb6f2c047d09cf37)

### Other

- **ui**: pill AI assist toggle with wand and magenta tint in [`8f74ee0`](https://github.com/telemodai/app/commit/8f74ee08f36350ac1f7332af1f06e8482def79e4)