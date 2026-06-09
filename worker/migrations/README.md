# D1 Database Migrations

This directory contains SQL migrations for the Wellness Center D1 database.

## How to Apply Migrations

### Prerequisites
- Wrangler CLI installed (`npm install -g @cloudflare/wrangler`)
- D1 database configured in `wrangler.toml`
- API credentials set up

### Apply a Migration

Run the migration SQL against the remote D1 database:

```bash
wrangler d1 execute DB --remote < migrations/001_add_gi_and_consumption_order.sql
```

Or apply line by line:

```bash
wrangler d1 execute DB --remote --command "ALTER TABLE foods_cache ADD COLUMN gi INTEGER;"
wrangler d1 execute DB --remote --command "ALTER TABLE foods_cache ADD COLUMN gi_source TEXT;"
wrangler d1 execute DB --remote --command "ALTER TABLE meals ADD COLUMN consumption_order TEXT;"
```

### Local Testing (Optional)

Test against local D1 first (no `--remote` flag):

```bash
wrangler d1 execute DB < migrations/001_add_gi_and_consumption_order.sql
```

## Migration History

### 001_add_gi_and_consumption_order.sql
- **Added:** 2026-06-09
- **Purpose:** Adds GI (Glycemic Index) tracking and meal consumption order
- **Changes:**
  - `foods_cache.gi` (INTEGER) — Glycemic Index value (0-100)
  - `foods_cache.gi_source` (TEXT) — Where GI came from: 'hardcoded' or 'haiku'
  - `meals.consumption_order` (TEXT) — JSON array of food item indices in consumption order
