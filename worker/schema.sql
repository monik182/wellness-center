CREATE TABLE IF NOT EXISTS meals (
  id                TEXT PRIMARY KEY,
  date              TEXT NOT NULL,    -- YYYY-MM-DD (CET, sent by client)
  time              TEXT NOT NULL,    -- HH:MM (CET, sent by client)
  items             TEXT NOT NULL,    -- JSON: LoggedFoodItem[]
  totals            TEXT NOT NULL,    -- JSON: MacroTotals
  consumption_order TEXT               -- JSON: number[] (indices into items array, in consumption order)
);

CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);

CREATE TABLE IF NOT EXISTS gym_day (
  id     INTEGER PRIMARY KEY CHECK (id = 1),  -- singleton row
  active INTEGER NOT NULL DEFAULT 0,          -- 0 or 1
  date   TEXT    NOT NULL DEFAULT ''          -- YYYY-MM-DD CET
);

INSERT OR IGNORE INTO gym_day (id, active, date) VALUES (1, 0, '');

CREATE TABLE IF NOT EXISTS foods_cache (
  key               TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  source            TEXT NOT NULL,
  kcal              REAL NOT NULL,
  protein           REAL NOT NULL,
  carbs             REAL NOT NULL,
  fat               REAL NOT NULL,
  fiber             REAL,
  sugar             REAL,
  fetched_at        TEXT NOT NULL,
  default_weight_g  REAL,
  portion           TEXT,
  gi                INTEGER,                   -- Glycemic Index value (0-100)
  gi_source         TEXT                       -- 'hardcoded' | 'haiku'
);

CREATE INDEX IF NOT EXISTS idx_foods_cache_key ON foods_cache(key);

CREATE TABLE IF NOT EXISTS custom_foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  serving_size TEXT,
  serving_size_g INTEGER,
  calories REAL NOT NULL,
  protein_g REAL NOT NULL,
  carbs_g REAL NOT NULL,
  sugar_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  saturated_fat_g REAL,
  fiber_g REAL,
  sodium_mg REAL,
  source TEXT DEFAULT 'nutrition_label_scan',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_custom_foods_name ON custom_foods(name);

-- Migrations: run once on live D1 database
-- wrangler d1 execute DB --remote --command "ALTER TABLE foods_cache ADD COLUMN default_weight_g REAL; ALTER TABLE foods_cache ADD COLUMN portion TEXT;"
-- wrangler d1 execute DB --remote --command "ALTER TABLE foods_cache ADD COLUMN gi INTEGER; ALTER TABLE foods_cache ADD COLUMN gi_source TEXT;"
-- wrangler d1 execute DB --remote --command "ALTER TABLE meals ADD COLUMN consumption_order TEXT;"
