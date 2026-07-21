# Billing design

> Technical design for SaaS credits and self-hosted deployment mode.
> Economics and tiers: [billing-economics.md](billing-economics.md).

## Deployment modes

```env
DEPLOYMENT_MODE=self-hosted   # default
DEPLOYMENT_MODE=saas
```

| | self-hosted | saas |
|---|-------------|------|
| LLM config | Instance settings UI (api_key, base_url, model); env optional override | Platform env only |
| Credits | Disabled (billing layer no-op) | Per-bot balance |
| Purchase UI | Hidden | Visible to all bot members |
| Free 100 credits | N/A | On bot creation |
| LLM usage analytics | Optional log | Persist every moderation call |

Expose `deploymentMode` to client via runtime config for UI conditionals.

## Payment provider

**YooKassa** for SaaS checkout and webhooks. Implementation reads [YooKassa API docs](https://yookassa.ru/developers) during issue #118.

**TypeScript SDK:** evaluate before raw HTTP. Primary candidate: [@a2seven/yoo-checkout](https://github.com/a2seven/yoocheckout) (`@a2seven/yoo-checkout` on npm). Alternative: [@webzaytsev/yookassa-ts-sdk](https://github.com/WEBzaytsev/yookassa-ts-sdk) (Bun-friendly). Use a SDK if spike passes (payments + webhooks + idempotency); otherwise document fallback.

Test shop credentials in env (not committed).

Behind `BillingProvider` abstraction so the core credit domain does not depend on YooKassa types.

```typescript
interface BillingProvider {
  createCheckout(input: {
    botId: string;
    purchaserUserId: string;
    packageId: string;
  }): Promise<{ checkoutUrl: string }>;

  verifyWebhook(payload: unknown, headers: Headers): Promise<BillingWebhookEvent | null>;
}

interface BillingWebhookEvent {
  providerPaymentId: string;
  botId: string;
  purchaserUserId: string;
  credits: number;
  amountRub: number;
  status: "paid" | "refunded" | "failed";
}
```

`CreditService`: grant, debit, reconcile, ledger — payment-agnostic.

## Credit ledger

`credit_transactions` (append-only):

| Field | Notes |
|-------|-------|
| `bot_id` | Wallet owner |
| `type` | `grant_signup`, `purchase`, `debit_moderation`, `admin_adjust`, `reconcile_fix` |
| `amount` | Signed integer (+ / −) |
| `balance_after` | Snapshot after apply |
| `reference` | `message_id`, payment id, etc. |
| `actor_user_id` | Purchaser for `purchase`; null for system |
| `metadata` | JSON (package id, tokens, …) |

`bots.credit_balance` — denormalized cache for fast pre-check.

**`admin_adjust`:** operator-only manual grants/deductions via `cli credits grant` (SaaS). Metadata includes required `reason`, `source: cli`, optional `operator_note`. Idempotent when `--reference` repeats; default reference is `admin-grant:{uuid}`.

### Balance updates

**Hot path (success):**

1. Pre-check `credit_balance > 0` (saas only)
2. LLM call
3. On HTTP 200 + non-empty content → conditional debit:

```sql
UPDATE bots SET credit_balance = credit_balance - 1
WHERE id = $1 AND credit_balance >= 1
RETURNING credit_balance;
```

4. Insert `debit_moderation` ledger row (idempotent on `bot_id + chat_id + message_id`)

**No debit:** LLM throw/timeout, empty body, JSON parse failure.

**Reconciliation (background / nightly):**

```
expected_balance = sum(credit_transactions.amount)
actual_balance = bots.credit_balance
if mismatch → technical log + reconcile_fix transaction
```

Cross-check: `count(user_messages where is_moderated = true)` ≈ debit rows per bot.

## LLM usage analytics

Table `llm_usage` (name TBD) — one row per SaaS moderation attempt that reached the LLM:

| Field | Notes |
|-------|-------|
| `bot_id`, `chat_id`, `message_id` | Correlation |
| `model` | e.g. gpt-4.1-nano |
| `prompt_tokens`, `completion_tokens` | From API `usage` |
| `estimated_cost_rub` | Computed from token rates at call time |
| `success` | HTTP 200 + content |
| `created_at` | |

Enables SQL analytics vs revenue (`credit_transactions`) without separate experiments.

Planning COGS until data exists: **0.05 ₽ / successful moderation** — see [billing-economics.md](billing-economics.md).

## Moderation flow (saas)

```
saveMessage(is_moderated = false)
no active rules → return
credit_balance <= 0 → return
LLM → log llm_usage
  success (HTTP 200 + content) → debit + is_moderated = true + decision
  parse failure → no debit, is_moderated stays false
```

Stats on bot page:

- **Total today** — all `user_messages`
- **Moderated today** — `is_moderated = true`
- **Not moderated today** — `is_moderated = false`; card shown only if count > 0

## Purchases

Any bot member (owner or manager) may start checkout; credits always accrue to the **bot**. All members see balance. Personal payment data stays with YooKassa per payer.

**Checkout** inserts a `provider_payments` row (`pending`) with `provider_payment_id`, package snapshot, and purchaser.

**Webhook** and **sync** update that row (`succeeded` / `canceled` / `credited`) and grant credits via idempotent ledger (`reference` = YooKassa payment id). Grant happens only on `succeeded`; `credited` is set after ledger apply.

**Webhook miss fallback:** `POST /api/bots/:id/credits/sync` without `payment_id` reconciles all open rows for the bot (`pending` or `succeeded`) via `GET /v3/payments/{id}`. Optional: `{ "payment_id": "…" }` for one payment. Recovery URL: `/bots/:id/credits?payment_id={yookassa_id}`.

**Nightly:** `billing:reconcile-stale-payments` polls `pending` rows older than 15 minutes.

`credit_transactions` (ledger) and `provider_payments` (provider lifecycle) are separate tables.

## Purchase promo codes (SaaS only)

Percent-discount promo codes for credit package checkout. Self-hosted: no promo UI, API, or CLI in product flows.

### Data model

- `promo_codes` — `code` (unique, uppercased), `discount_percent` (1–100), `is_active`, optional `expires_at`
- `promo_redemptions` — unique `(promo_code_id, user_id)` after successful payment
- `provider_payments.promo_code_id` — links checkout to promo when used

### Rules

- Discount on **RUB price only**; package **credits stay full**
- Charged amount: `max(1, floor(price * (100 - percent) / 100))` (100% → 1 ₽)
- One successful redemption per user per code; abandoned checkout does not consume
- Cookie `tg_promo_code` is UX-only; checkout re-validates server-side
- Applying a new code overwrites the cookie (no remove control)

### Checkout flow

1. User applies code on `/bots/:id/credits` → `POST /api/promo/apply` sets cookie
2. Checkout reads cookie (or body `promo_code`), validates, charges discounted amount to YooKassa
3. On paid webhook/sync: grant full package credits, insert redemption idempotently
4. Ledger `purchase` metadata includes `promo_code`, `amount_rub`, `original_amount_rub` when discounted

### Operator CLI

Create codes in production (Node runtime image):

```bash
docker compose exec -it app cli promo create
```

Non-interactive:

```bash
docker compose exec app cli promo create --code SAVE10 --percent 10
```

Local dev: `bun run cli -- promo create …` (see `.docs/deploy.md` § Operator CLI).

### Manual credit grants (operator)

```bash
docker compose exec app cli credits grant --bot-id mybot --amount 5000 --reason "support"
```

Ledger type `admin_adjust`; no YooKassa payment row. Self-hosted: CLI exits with error (billing disabled).

## Product referrals (SaaS only)

In-product credit rewards for inviting new paying users. Self-hosted: no referral UI, API, or nav.

### Config (`lib/referral-config.ts`)

- `REFERRAL_COOKIE_DAYS = 30` (last-click attribution)
- `REFERRAL_REFEREE_PERCENT` / `REFERRAL_REFERRER_PERCENT` (default 10 / 10)

### Attribution

- Personal link `/r/:code` or `?ref=` on landing/login
- Cookie `tg_referral_code` — last click within 30 days; self-referral ignored
- Checkout snapshots cookie into `provider_payments.referral_code` (webhook has no cookie access)

### Rewards (first successful purchase only)

- **Referee:** `floor(package_credits * REFERRAL_REFEREE_PERCENT / 100)` credited immediately on the payment bot
- **Referrer:** same math with `REFERRAL_REFERRER_PERCENT`, stored as **pending** until claim onto an **owned** bot (all pending summed in one claim)
- Ledger type `referral_bonus` with metadata `{ referral_id, role, percent, base_credits, provider_payment_id }`
- Works alongside purchase promos (#130): promo discounts RUB; referral bonuses credits

### Anti-abuse

- No self-referral; referrer account must predate referee
- One referral lifecycle per referee; first purchase only
- Claim requires bot **owner** role
- Skip zero-bonus sides; idempotent on `provider_payments.provider_payment_id`

### APIs

- `POST /api/referral/attribution` — set cookie
- `GET /api/referral/pending` — pending sum/count for nav
- `POST /api/referral/claim` — `{ bot_id }` credits all pending to owned bot
- `GET /api/referral/link` — current user's share link

## Credit packages (config)

| package_id | Credits | Price RUB |
|------------|---------|-----------|
| `start` | 10,000 | 490 |
| `growth` | 50,000 | 1,990 |
| `max` | 100,000 | 3,990 |

Stored in code or config table; YooKassa amount derived from package.

## Implementation tracker

GitHub epic and sub-issues — search `billing` or see epic issue in the repo tracker.
