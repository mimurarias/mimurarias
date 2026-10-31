-- Global homepage counters: one row, id = 1.
CREATE TABLE IF NOT EXISTS counter (
  id     INTEGER PRIMARY KEY CHECK (id = 1),
  visits INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO counter (id, visits, clicks) VALUES (1, 0, 0);
