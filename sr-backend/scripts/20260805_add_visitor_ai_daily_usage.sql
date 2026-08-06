BEGIN;

CREATE TABLE IF NOT EXISTS visitor_ai_daily_usage (
    device_hash         char(64) NOT NULL,
    usage_date          date NOT NULL,
    question_count      integer NOT NULL DEFAULT 0 CHECK (question_count >= 0),
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_hash, usage_date)
);

COMMIT;
