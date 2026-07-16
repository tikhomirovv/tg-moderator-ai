# Billing economics

> Product pricing reference for SaaS mode, landing copy, and support.
> Design details: [billing-design.md](billing-design.md).

## Credit model

| Rule | Value |
|------|-------|
| Billing unit | **Bot** (not user, not chat) |
| Consumption | **1 credit = 1 successfully moderated text message** |
| Free tier | **100 credits** granted once per new bot (SaaS only) |
| Zero balance | LLM moderation skipped; message history still saved |
| Silent mode | Full credit on successful moderation |
| Self-hosted | No credits (`DEPLOYMENT_MODE=self-hosted`) |
| Currency | **RUB** |
| Payment provider | **YooKassa** (SaaS) |

Reference competitor: [Modr8 pricing & credits](https://docs.modr8.ai/introduction/pricing-and-credits).

## RUB tiers (v1 — Modr8 mirror)

Bundle sizes match Modr8; prices in RUB. Minimum purchase: **490 ₽**.

| Plan | Price (RUB) | Credits | ₽ / credit | Modr8 USD equivalent |
|------|-------------|---------|------------|----------------------|
| Старт | **490** | 10,000 | 0.049 | $5 / 10k |
| Рост | 1,990 | 50,000 | 0.040 | $20 / 50k |
| Макс | 3,990 | 100,000 | 0.040 | $40 / 100k |

Payment processor fee (plan ~3%): net ≈ **0.038–0.048 ₽ / credit**.

## Planning COGS baseline

**No separate pre-launch token experiments.** Instead, persist real LLM `usage` and computed cost on every SaaS moderation call; analyze in DB and adjust pricing later.

For planning, marketing copy, and margin estimates until real data exists, use:

```
PLANNING_LLM_COST_RUB = 0.05   # per successfully moderated message
```

| Plan | Revenue / credit | Gross margin vs 0.05 ₽ COGS (before PSP) |
|------|------------------|------------------------------------------|
| Старт | 0.049 ₽ | ~break-even (monitor via analytics) |
| Рост / Макс | 0.040 ₽ | negative at 0.05 COGS — assumes actual avg cost < 0.05 or future price tune |

When enough production data exists:

```sql
-- Example analytics (tables TBD in implementation)
SELECT
  avg(estimated_cost_rub) AS avg_cost,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY estimated_cost_rub) AS p95_cost
FROM llm_usage
WHERE created_at > now() - interval '30 days';
```

Compare `avg_cost` / `p95_cost` to `price_per_credit` per tier; raise prices or change model if needed.

## Messages per day → bundle lifetime

Assumption: every inbound text message in a registered chat with active rules consumes 1 credit when moderation succeeds (same simplification as Modr8 FAQ).

| Community profile | Messages / day | Credits / month (30 d) | Старт 10k | Рост 50k | Макс 100k |
|-------------------|----------------|------------------------|-----------|----------|-----------|
| Tiny / testing | 100 | 3,000 | ~3.3 months | ~16 months | ~33 months |
| Quiet | 150 | 4,500 | **~2.2 months** | ~11 months | ~22 months |
| Active small | 500 | 15,000 | ~22 days | ~3.3 months | ~6.7 months |
| Busy | 1,500 | 45,000 | ~7 days | **~1.1 months** | ~2.2 months |
| Hyper-busy | 3,000 | 90,000 | ~3.3 days | ~18 days | **~1.1 months** |
| Multi-chat power user | 5,000 | 150,000 | ~2 days | ~10 days | ~22 days |

### Landing / docs copy (RU)

- **Тихий чат (~150 сообщений/день)** — пакета **Старт (10 000)** хватит примерно на **2 месяца**.
- **Активный чат (~1 500/день)** — пакет **Рост (50 000)** примерно на **месяц**.
- **Очень активный (~3 000/день)** — пакет **Макс (100 000)** примерно на **месяц**.
- **Несколько чатов на одном боте** — суммируйте сообщения по всем чатам; берите **Рост** или **Макс**.

Formula:

```
bundle_lifetime_days = credits_in_bundle / messages_per_day
bundle_lifetime_months = bundle_lifetime_days / 30
```

## Theoretical LLM cost range (reference only)

Default SaaS model: `gpt-4.1-nano` — $0.10 / 1M input, $0.40 / 1M output.

| Scenario | Input tokens | Output tokens | Est. cost RUB (~100 ₽/$) |
|----------|--------------|---------------|---------------------------|
| Light | ~1,500 | ~100 | ~0.02 ₽ |
| Typical | ~2,500 | ~150 | ~0.03 ₽ |
| Heavy | ~4,500 | ~200 | ~0.05 ₽ |

The **0.05 ₽ planning baseline** aligns with the heavy scenario. Real averages should come from `llm_usage` analytics.
