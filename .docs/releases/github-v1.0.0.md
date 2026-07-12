## [1.0.0] - 2026-07-12

Self-hosted Telegram AI moderation admin — **50** conventional commits (70 total).

## What's Changed

### Added

- **release**: dual changelog workflow and prepare v1.0.0 in [`e7c6831`](https://github.com/tikhomirovv/tg-moderator-ai/commit/e7c6831baa155c3a877b4dc89f27d173437075de)
- release skill, release notes page, and changelog data in [`37bccbe`](https://github.com/tikhomirovv/tg-moderator-ai/commit/37bccbe02368ced229297055dadf61ff2641dba2)
- moderation audit decisions table and UI in [`002d8cc`](https://github.com/tikhomirovv/tg-moderator-ai/commit/002d8cccccf1061d2877993e0da11eab366053dc)
- **whitelist**: single entry field per rule whitelist row ([#56](https://github.com/tikhomirovv/tg-moderator-ai/issues/56)) in [`9df9887`](https://github.com/tikhomirovv/tg-moderator-ai/commit/9df9887be727455c2f2719366378ba19342d67f9)
- JSON chat history in LLM prompt and 100-msg retention ([#55](https://github.com/tikhomirovv/tg-moderator-ai/issues/55)) in [`b56775c`](https://github.com/tikhomirovv/tg-moderator-ai/commit/b56775cc380f775a6cdaa65723840afb25c2d926)
- workspace dashboard with KPI, charts, and recent activity ([#47](https://github.com/tikhomirovv/tg-moderator-ai/issues/47)) in [`31e4d77`](https://github.com/tikhomirovv/tg-moderator-ai/commit/31e4d772fefb9e257098abee8309a199472f228b)
- rules CRUD UX, per-rule actions, whitelist, schema reset ([#44](https://github.com/tikhomirovv/tg-moderator-ai/issues/44)) in [`e1fe0d9`](https://github.com/tikhomirovv/tg-moderator-ai/commit/e1fe0d977dac2c76a4f7f6da3ecaec17e049d376)
- **workspace**: add member invitations via email in [`e29782b`](https://github.com/tikhomirovv/tg-moderator-ai/commit/e29782bce2b68e000de1368ab4d468c2fc7f9a8c) ([#30](https://github.com/tikhomirovv/tg-moderator-ai/issues/30))
- **auth**: add password reset UI flow in [`0c6899c`](https://github.com/tikhomirovv/tg-moderator-ai/commit/0c6899cd2275c2f0b400024252f700c984edf0ee) ([#28](https://github.com/tikhomirovv/tg-moderator-ai/issues/28))
- **auth**: map Better Auth errors to friendly UI messages in [`605c985`](https://github.com/tikhomirovv/tg-moderator-ai/commit/605c9851264f1c28b482c6089811f47ba63e9089) ([#29](https://github.com/tikhomirovv/tg-moderator-ai/issues/29))
- **deploy**: add Docker image, GHCR CI, and production startup hooks in [`72ff738`](https://github.com/tikhomirovv/tg-moderator-ai/commit/72ff738b1e2d37e2245ea17840418bf7da656e1d)
- **bots**: hide webhook UI and add honest delivery status in [`5733da1`](https://github.com/tikhomirovv/tg-moderator-ai/commit/5733da1d15040d05366c120e5151934ddb2c50cb)
- **moderation**: separate rule criteria from LLM system prompt in [`a834579`](https://github.com/tikhomirovv/tg-moderator-ai/commit/a834579a1376f85f6d7261967aa072d53b74d910)
- **workspace**: slug URLs and collision-safe workspace slugs in [`96a9c88`](https://github.com/tikhomirovv/tg-moderator-ai/commit/96a9c882cb6c88c8e7a25236ba51d6db44bae6d4)
- **security**: validate Telegram webhook secret per bot ([#3](https://github.com/tikhomirovv/tg-moderator-ai/issues/3)) in [`2b5ead0`](https://github.com/tikhomirovv/tg-moderator-ai/commit/2b5ead00d41387289b194e06ded8ee1d3d55e203)
- **ai**: add OpenAI-compatible LLM provider config ([#7](https://github.com/tikhomirovv/tg-moderator-ai/issues/7)) in [`decc77a`](https://github.com/tikhomirovv/tg-moderator-ai/commit/decc77a618c39e34855715684971a4a16bd5a5ff)
- **moderation**: global bot enable/disable with webhook sync ([#1](https://github.com/tikhomirovv/tg-moderator-ai/issues/1)) in [`ccf4bf5`](https://github.com/tikhomirovv/tg-moderator-ai/commit/ccf4bf5115dd45de0e33e5abfe56148e8ad17e88)
- **auth**: Better Auth, workspaces, API isolation ([#6](https://github.com/tikhomirovv/tg-moderator-ai/issues/6)) in [`8ed608b`](https://github.com/tikhomirovv/tg-moderator-ai/commit/8ed608b380c15bd8406431b34761aa6b13e13061)
- **db**: migrate from MongoDB to PostgreSQL with Drizzle in [`c504f0d`](https://github.com/tikhomirovv/tg-moderator-ai/commit/c504f0d6a6910bfe9a7bbda46386477fee2d3110)

### Fixed

- open bot audit page via [id]/index.vue in [`7d10ca7`](https://github.com/tikhomirovv/tg-moderator-ai/commit/7d10ca70c7fcdfd7153e0824a48e6df8a926b751)
- correct decisions API import paths in [`7f4487b`](https://github.com/tikhomirovv/tg-moderator-ai/commit/7f4487b6fd7d024bf182691b792e076d4a4214e1)
- skip warn when ban_on_violation is disabled ([#54](https://github.com/tikhomirovv/tg-moderator-ai/issues/54)) in [`b0003c1`](https://github.com/tikhomirovv/tg-moderator-ai/commit/b0003c14622c7d0b238438d1790ec620fc483c1f)
- add migration for rules whitelist schema upgrade ([#48](https://github.com/tikhomirovv/tg-moderator-ai/issues/48)) in [`fa88eb3`](https://github.com/tikhomirovv/tg-moderator-ai/commit/fa88eb361493e76e0029e088c72b01c6f4014fce) ([#42](https://github.com/tikhomirovv/tg-moderator-ai/issues/42))
- reload workspace-scoped pages on organization switch ([#43](https://github.com/tikhomirovv/tg-moderator-ai/issues/43)) in [`3b74be6`](https://github.com/tikhomirovv/tg-moderator-ai/commit/3b74be64fe63a8c88148aea62c2d488031ab76da)
- **bots**: correct import paths in bot-delivery.ts in [`ca82b32`](https://github.com/tikhomirovv/tg-moderator-ai/commit/ca82b32c02b7890dce08d4ed166601a6c430cfba)
- **auth**: align Better Auth integration with best practices in [`3a95d82`](https://github.com/tikhomirovv/tg-moderator-ai/commit/3a95d82414c08f55b366317c25d016a27a92860d)
- **webhook**: load bot config without workspace session in [`83480fe`](https://github.com/tikhomirovv/tg-moderator-ai/commit/83480fe45af84477e343b25a846202c9a9e58fed)
- **auth**: keep session on SSR and after workspace create in [`38fa9b8`](https://github.com/tikhomirovv/tg-moderator-ai/commit/38fa9b89278c4a06f3dd1836d1bad771e87399af)
- **db**: workspace-scoped rules PK and single init migration in [`dff15d5`](https://github.com/tikhomirovv/tg-moderator-ai/commit/dff15d55d8092396e530b7fdc1de316185b3f81e)
- **workspace**: prefix organization slug with user id in [`e2c8115`](https://github.com/tikhomirovv/tg-moderator-ai/commit/e2c81151d95a8dc6e691ddb2fadeb474bd3d474c)
- **auth**: email verify success UI and neutral copy in [`8e34240`](https://github.com/tikhomirovv/tg-moderator-ai/commit/8e34240ffe3c04f4c714f7f41093b5bf61b2c396)
- **dev**: suppress migrate noise, trust localhost origins, ExFAT install in [`197e059`](https://github.com/tikhomirovv/tg-moderator-ai/commit/197e0592d3c78983630d5908ad50d3c0b7b826c5)
- **db**: resolve Drizzle migrations path under Nitro bundling in [`f3e6954`](https://github.com/tikhomirovv/tg-moderator-ai/commit/f3e695474b1e95693c8849929c63554dd9976593)

### Documentation

- **agents**: add human-friendly communication guidelines in [`89e4d7a`](https://github.com/tikhomirovv/tg-moderator-ai/commit/89e4d7ab95c50cce3e277a833c33b210defaf173)
- add AGENTS.md and Cursor rules for agents in [`838222d`](https://github.com/tikhomirovv/tg-moderator-ai/commit/838222d00aee25a889096422731beb7b9e1777ac)

### Tests

- replace PostgreSQL fixtures with in-memory mocks in [`b0e18cd`](https://github.com/tikhomirovv/tg-moderator-ai/commit/b0e18cd453010aac3570285edd3762810056ee70)

### Refactoring

- **ui**: flat routes and session-scoped workspace in [`d2196d5`](https://github.com/tikhomirovv/tg-moderator-ai/commit/d2196d5fca05a37fa03d209c85324334f5064768)
- **db**: separate migrations from Nitro connection in [`473d616`](https://github.com/tikhomirovv/tg-moderator-ai/commit/473d6169cc65934d61f36cf38421bb894b91911a)
- **db**: squash migrations into single clean init in [`f0e771b`](https://github.com/tikhomirovv/tg-moderator-ai/commit/f0e771b97cb1ad97d321700195c85d9c21091529)

### Chores

- **ci**: build Docker image on tags and manual only in [`ca29a0a`](https://github.com/tikhomirovv/tg-moderator-ai/commit/ca29a0af1780f64b2e74b95ac0e9764455a5c619)
- daily Nitro retention tasks, remove hot-path prune in [`f6bcb41`](https://github.com/tikhomirovv/tg-moderator-ai/commit/f6bcb41d4fbf4d8bda87e4dcb47c1cd565f86ede)
- remove db:reset, document incremental migrations in [`09d779c`](https://github.com/tikhomirovv/tg-moderator-ai/commit/09d779c4a1988825bec9afbc87f4a7f15a5b5464)
- **logging**: normalize levels for quieter production info ([#57](https://github.com/tikhomirovv/tg-moderator-ai/issues/57)) in [`9c06415`](https://github.com/tikhomirovv/tg-moderator-ai/commit/9c0641507280c97090b87669ba93442cb6d403b5)
- drop incremental migration, single 0000_init only ([#49](https://github.com/tikhomirovv/tg-moderator-ai/issues/49)) in [`2d7b9bc`](https://github.com/tikhomirovv/tg-moderator-ai/commit/2d7b9bc3dbb7be0d4ce009f4710886faa1c923ea)
- Node 24 CI actions and production deploy docs ([#46](https://github.com/tikhomirovv/tg-moderator-ai/issues/46)) in [`d7d7972`](https://github.com/tikhomirovv/tg-moderator-ai/commit/d7d7972196e09c12f976bec55924da37636aba58)
- remove LLM_PROVIDER, log llm_host and model instead ([#45](https://github.com/tikhomirovv/tg-moderator-ai/issues/45)) in [`6008368`](https://github.com/tikhomirovv/tg-moderator-ai/commit/6008368089edeae5c37aab5a57d8aabfcca8b870)
- **auth**: add cookieCache, rateLimit, audit hooks, typed client in [`8e6bfb9`](https://github.com/tikhomirovv/tg-moderator-ai/commit/8e6bfb9861b5d03a6564d8a6b9a580ffd6677d65) ([#32](https://github.com/tikhomirovv/tg-moderator-ai/issues/32))
- **auth**: set organization membershipLimit to 50 in [`38e5516`](https://github.com/tikhomirovv/tg-moderator-ai/commit/38e5516239f62b8d50f22ce0382e22685204c41e) ([#31](https://github.com/tikhomirovv/tg-moderator-ai/issues/31))
- **rules**: remove unused severity field in [`f874913`](https://github.com/tikhomirovv/tg-moderator-ai/commit/f8749139d039f9b06191666f7a2cbdcd031783a8)
- remove dead code and broken global logs for MVP in [`49b9273`](https://github.com/tikhomirovv/tg-moderator-ai/commit/49b9273261b16c3b1ca82fdbace999d1baa86a7f)