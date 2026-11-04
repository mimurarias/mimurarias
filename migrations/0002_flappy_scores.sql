-- Ranking do Flappy da Lua Diferente: somente pontuacao e data, sem nomes.
CREATE TABLE IF NOT EXISTS flappy_scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  score      INTEGER NOT NULL CHECK (score >= 0 AND score <= 100000),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_flappy_scores_rank
  ON flappy_scores (score DESC, created_at ASC);
