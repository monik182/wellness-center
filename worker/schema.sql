CREATE TABLE IF NOT EXISTS meals (
  id      TEXT PRIMARY KEY,
  date    TEXT NOT NULL,    -- YYYY-MM-DD (CET, sent by client)
  time    TEXT NOT NULL,    -- HH:MM (CET, sent by client)
  items   TEXT NOT NULL,    -- JSON: LoggedFoodItem[]
  totals  TEXT NOT NULL     -- JSON: MacroTotals
);

CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);

CREATE TABLE IF NOT EXISTS gym_day (
  id     INTEGER PRIMARY KEY CHECK (id = 1),  -- singleton row
  active INTEGER NOT NULL DEFAULT 0,          -- 0 or 1
  date   TEXT    NOT NULL DEFAULT ''          -- YYYY-MM-DD CET
);

INSERT OR IGNORE INTO gym_day (id, active, date) VALUES (1, 0, '');
