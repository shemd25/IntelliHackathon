-- V3: Alerts table

CREATE TABLE IF NOT EXISTS alerts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id    UUID NOT NULL,
    type        VARCHAR(100) NOT NULL,
    severity    VARCHAR(50)  NOT NULL DEFAULT 'MEDIUM',
    payload     TEXT,
    resolved    BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_child_created  ON alerts(child_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved      ON alerts(child_id, resolved) WHERE resolved = false;
