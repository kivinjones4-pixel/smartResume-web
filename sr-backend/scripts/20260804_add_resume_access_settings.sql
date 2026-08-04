BEGIN;

CREATE TABLE IF NOT EXISTS user_ai_agent_settings (
    user_id             uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    language_style      varchar(30) NOT NULL DEFAULT 'professional',
    welcome_message     varchar(500) NOT NULL DEFAULT '',
    additional_info     text NOT NULL DEFAULT '',
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resume_access_settings (
    resume_id           uuid PRIMARY KEY REFERENCES resumes(id) ON DELETE CASCADE,
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visibility          varchar(20) NOT NULL DEFAULT 'private'
                            CHECK (visibility IN ('private', 'public', 'restricted')),
    visitor_code        char(6),
    ai_enabled          boolean NOT NULL DEFAULT false,
    visible_fields      jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (jsonb_typeof(visible_fields) = 'array'),
    CHECK (visibility = 'restricted' OR visitor_code IS NULL),
    CHECK (visibility <> 'restricted' OR visitor_code ~ '^[0-9]{6}$')
);

CREATE INDEX IF NOT EXISTS idx_resume_access_settings_user ON resume_access_settings (user_id);

COMMIT;
