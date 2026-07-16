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

**Webhook miss fallback:** client stores `provider_payment_id` in `sessionStorage` before redirect; **Refresh** and return-url polling call `POST /api/bots/:id/credits/sync`, which runs `GET /v3/payments/{id}` at YooKassa and applies credits idempotently if status is `succeeded`. Optional recovery: `/bots/:id/credits?payment_id={yookassa_id}`.

## Credit packages (config)

| package_id | Credits | Price RUB |
|------------|---------|-----------|
| `start` | 10,000 | 490 |
| `growth` | 50,000 | 1,990 |
| `max` | 100,000 | 3,990 |

Stored in code or config table; YooKassa amount derived from package.

## Implementation tracker

GitHub epic and sub-issues — search `billing` or see epic issue in the repo tracker.
