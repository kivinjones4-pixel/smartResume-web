-- SmartResume database initialization
-- PostgreSQL 16+ / pgvector
-- Run with: psql -v ON_ERROR_STOP=1 -f scripts/init.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Authentication and user profile
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email               varchar(320) NOT NULL,
    username            varchar(50) NOT NULL,
    password_hash       varchar(255) NOT NULL,
    phone               varchar(32),
    status              varchar(20) NOT NULL DEFAULT 'active'
                            CHECK (status IN ('pending', 'active', 'disabled')),
    email_verified_at   timestamptz,
    last_login_at       timestamptz,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at          timestamptz
);

CREATE UNIQUE INDEX uq_users_email_active
    ON users (lower(email)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_users_username_active
    ON users (lower(username)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_users_phone_active
    ON users (phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE refresh_tokens (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash          varchar(128) NOT NULL UNIQUE,
    expires_at          timestamptz NOT NULL,
    revoked_at          timestamptz,
    replaced_by_id      uuid REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    user_agent          text,
    ip_address          inet,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (expires_at > created_at)
);

CREATE INDEX idx_refresh_tokens_user_active
    ON refresh_tokens (user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE user_profiles (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name           varchar(100) NOT NULL,
    avatar_url          text,
    headline            varchar(200),
    gender              varchar(20),
    birth_date          date,
    location            varchar(150),
    contact_email       varchar(320),
    contact_phone       varchar(32),
    website_url         text,
    github_url          text,
    linkedin_url        text,
    summary             text,
    years_of_experience numeric(4,1) CHECK (years_of_experience >= 0),
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Reusable resume content pools
-- Every content row includes user_id for explicit tenant isolation.
-- ---------------------------------------------------------------------------

CREATE TABLE educations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_name         varchar(200) NOT NULL,
    degree              varchar(100),
    field_of_study      varchar(150),
    location            varchar(150),
    start_date          date,
    end_date            date,
    is_current          boolean NOT NULL DEFAULT false,
    gpa                 varchar(32),
    description         text,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id),
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CHECK (NOT is_current OR end_date IS NULL)
);

CREATE TABLE internship_experiences (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name        varchar(200) NOT NULL,
    position_title      varchar(150) NOT NULL,
    department          varchar(150),
    location            varchar(150),
    start_date          date,
    end_date            date,
    is_current          boolean NOT NULL DEFAULT false,
    description         text,
    achievements        jsonb NOT NULL DEFAULT '[]'::jsonb,
    technologies        jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id),
    CHECK (jsonb_typeof(achievements) = 'array'),
    CHECK (jsonb_typeof(technologies) = 'array'),
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CHECK (NOT is_current OR end_date IS NULL)
);

CREATE TABLE work_experiences (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name        varchar(200) NOT NULL,
    position_title      varchar(150) NOT NULL,
    employment_type     varchar(30) CHECK (
                            employment_type IS NULL OR employment_type IN
                            ('full_time', 'part_time', 'contract', 'freelance', 'other')
                        ),
    department          varchar(150),
    location            varchar(150),
    start_date          date,
    end_date            date,
    is_current          boolean NOT NULL DEFAULT false,
    description         text,
    achievements        jsonb NOT NULL DEFAULT '[]'::jsonb,
    technologies        jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id),
    CHECK (jsonb_typeof(achievements) = 'array'),
    CHECK (jsonb_typeof(technologies) = 'array'),
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CHECK (NOT is_current OR end_date IS NULL)
);

CREATE TABLE project_experiences (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_name        varchar(200) NOT NULL,
    role_name           varchar(150),
    project_url         text,
    repository_url      text,
    start_date          date,
    end_date            date,
    is_current          boolean NOT NULL DEFAULT false,
    description         text,
    achievements        jsonb NOT NULL DEFAULT '[]'::jsonb,
    technologies        jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id),
    CHECK (jsonb_typeof(achievements) = 'array'),
    CHECK (jsonb_typeof(technologies) = 'array'),
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CHECK (NOT is_current OR end_date IS NULL)
);

CREATE TABLE awards (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    award_name          varchar(200) NOT NULL,
    issuer              varchar(200),
    awarded_at          date,
    level               varchar(100),
    certificate_url     text,
    description         text,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id)
);

CREATE TABLE skills (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                varchar(100) NOT NULL,
    category            varchar(100),
    proficiency         varchar(20) CHECK (
                            proficiency IS NULL OR proficiency IN
                            ('beginner', 'intermediate', 'advanced', 'expert')
                        ),
    years_of_experience numeric(4,1) CHECK (years_of_experience >= 0),
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id),
    UNIQUE (user_id, name)
);

CREATE INDEX idx_educations_user ON educations (user_id);
CREATE INDEX idx_internships_user ON internship_experiences (user_id);
CREATE INDEX idx_work_experiences_user ON work_experiences (user_id);
CREATE INDEX idx_project_experiences_user ON project_experiences (user_id);
CREATE INDEX idx_awards_user ON awards (user_id);
CREATE INDEX idx_skills_user ON skills (user_id);

-- ---------------------------------------------------------------------------
-- Resume composition, versions and exports
-- ---------------------------------------------------------------------------

CREATE TABLE resumes (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               varchar(150) NOT NULL,
    target_position     varchar(150),
    target_company      varchar(200),
    template_key        varchar(80) NOT NULL DEFAULT 'default',
    language_code       varchar(10) NOT NULL DEFAULT 'zh-CN',
    theme_config        jsonb NOT NULL DEFAULT '{}'::jsonb,
    section_order       jsonb NOT NULL DEFAULT
                            '["profile","education","internship","work","project","award","skill"]'::jsonb,
    status              varchar(20) NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'published', 'archived')),
    is_default          boolean NOT NULL DEFAULT false,
    public_slug         varchar(100),
    published_at        timestamptz,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id),
    CHECK (jsonb_typeof(theme_config) = 'object'),
    CHECK (jsonb_typeof(section_order) = 'array'),
    CHECK (status = 'published' OR published_at IS NULL)
);

CREATE UNIQUE INDEX uq_resumes_default_per_user
    ON resumes (user_id) WHERE is_default;
CREATE UNIQUE INDEX uq_resumes_public_slug
    ON resumes (public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX idx_resumes_user_updated ON resumes (user_id, updated_at DESC);

CREATE TABLE resume_education_rel (
    resume_id           uuid NOT NULL,
    education_id        uuid NOT NULL,
    user_id             uuid NOT NULL,
    sort_order          integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    PRIMARY KEY (resume_id, education_id),
    FOREIGN KEY (resume_id, user_id)
        REFERENCES resumes(id, user_id) ON DELETE CASCADE,
    FOREIGN KEY (education_id, user_id)
        REFERENCES educations(id, user_id) ON DELETE CASCADE
);

CREATE TABLE resume_internship_rel (
    resume_id           uuid NOT NULL,
    internship_id       uuid NOT NULL,
    user_id             uuid NOT NULL,
    sort_order          integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    PRIMARY KEY (resume_id, internship_id),
    FOREIGN KEY (resume_id, user_id)
        REFERENCES resumes(id, user_id) ON DELETE CASCADE,
    FOREIGN KEY (internship_id, user_id)
        REFERENCES internship_experiences(id, user_id) ON DELETE CASCADE
);

CREATE TABLE resume_work_rel (
    resume_id           uuid NOT NULL,
    work_experience_id  uuid NOT NULL,
    user_id             uuid NOT NULL,
    sort_order          integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    PRIMARY KEY (resume_id, work_experience_id),
    FOREIGN KEY (resume_id, user_id)
        REFERENCES resumes(id, user_id) ON DELETE CASCADE,
    FOREIGN KEY (work_experience_id, user_id)
        REFERENCES work_experiences(id, user_id) ON DELETE CASCADE
);

CREATE TABLE resume_project_rel (
    resume_id           uuid NOT NULL,
    project_experience_id uuid NOT NULL,
    user_id             uuid NOT NULL,
    sort_order          integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    PRIMARY KEY (resume_id, project_experience_id),
    FOREIGN KEY (resume_id, user_id)
        REFERENCES resumes(id, user_id) ON DELETE CASCADE,
    FOREIGN KEY (project_experience_id, user_id)
        REFERENCES project_experiences(id, user_id) ON DELETE CASCADE
);

CREATE TABLE resume_award_rel (
    resume_id           uuid NOT NULL,
    award_id            uuid NOT NULL,
    user_id             uuid NOT NULL,
    sort_order          integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    PRIMARY KEY (resume_id, award_id),
    FOREIGN KEY (resume_id, user_id)
        REFERENCES resumes(id, user_id) ON DELETE CASCADE,
    FOREIGN KEY (award_id, user_id)
        REFERENCES awards(id, user_id) ON DELETE CASCADE
);

CREATE TABLE resume_skill_rel (
    resume_id           uuid NOT NULL,
    skill_id            uuid NOT NULL,
    user_id             uuid NOT NULL,
    sort_order          integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    PRIMARY KEY (resume_id, skill_id),
    FOREIGN KEY (resume_id, user_id)
        REFERENCES resumes(id, user_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id, user_id)
        REFERENCES skills(id, user_id) ON DELETE CASCADE
);

CREATE INDEX idx_resume_education_order
    ON resume_education_rel (resume_id, sort_order);
CREATE INDEX idx_resume_internship_order
    ON resume_internship_rel (resume_id, sort_order);
CREATE INDEX idx_resume_work_order
    ON resume_work_rel (resume_id, sort_order);
CREATE INDEX idx_resume_project_order
    ON resume_project_rel (resume_id, sort_order);
CREATE INDEX idx_resume_award_order
    ON resume_award_rel (resume_id, sort_order);
CREATE INDEX idx_resume_skill_order
    ON resume_skill_rel (resume_id, sort_order);

CREATE TABLE resume_versions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id           uuid NOT NULL,
    user_id             uuid NOT NULL,
    version_no          integer NOT NULL CHECK (version_no > 0),
    snapshot            jsonb NOT NULL,
    change_summary      varchar(500),
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (resume_id, version_no),
    UNIQUE (id, resume_id, user_id),
    FOREIGN KEY (resume_id, user_id)
        REFERENCES resumes(id, user_id) ON DELETE CASCADE,
    CHECK (jsonb_typeof(snapshot) = 'object')
);

CREATE TABLE resume_exports (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id           uuid NOT NULL,
    user_id             uuid NOT NULL,
    version_id          uuid,
    format              varchar(10) NOT NULL CHECK (format IN ('pdf', 'docx', 'html', 'json')),
    status              varchar(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url            text,
    file_size_bytes     bigint CHECK (file_size_bytes >= 0),
    error_message       text,
    requested_at        timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at        timestamptz,
    FOREIGN KEY (resume_id, user_id)
        REFERENCES resumes(id, user_id) ON DELETE CASCADE,
    FOREIGN KEY (version_id, resume_id, user_id)
        REFERENCES resume_versions(id, resume_id, user_id) ON DELETE CASCADE,
    CHECK (
        (status = 'completed' AND file_url IS NOT NULL AND completed_at IS NOT NULL)
        OR status <> 'completed'
    )
);

CREATE INDEX idx_resume_versions_resume
    ON resume_versions (resume_id, version_no DESC);
CREATE INDEX idx_resume_exports_user
    ON resume_exports (user_id, requested_at DESC);

-- ---------------------------------------------------------------------------
-- AI Copilot and personal Agent RAG
-- ---------------------------------------------------------------------------

CREATE TABLE ai_polish_records (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id           uuid,
    source_type         varchar(30) NOT NULL,
    source_id           uuid,
    operation           varchar(30) NOT NULL CHECK (
                            operation IN
                            ('rewrite', 'grammar', 'ats_optimize', 'summarize', 'translate')
                        ),
    original_text       text NOT NULL,
    suggested_text      text,
    diff_data           jsonb,
    model_name          varchar(100),
    prompt_tokens       integer CHECK (prompt_tokens >= 0),
    completion_tokens   integer CHECK (completion_tokens >= 0),
    status              varchar(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'completed', 'failed', 'accepted', 'rejected')),
    error_message       text,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at        timestamptz,
    FOREIGN KEY (resume_id, user_id)
        REFERENCES resumes(id, user_id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_polish_user_created
    ON ai_polish_records (user_id, created_at DESC);

CREATE TABLE agent_profiles (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name        varchar(100) NOT NULL,
    avatar_url          text,
    system_prompt       text,
    tone                varchar(50) NOT NULL DEFAULT 'professional',
    welcome_message     text,
    is_public           boolean NOT NULL DEFAULT false,
    public_slug         varchar(100),
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_agent_profiles_public_slug
    ON agent_profiles (public_slug) WHERE public_slug IS NOT NULL;

CREATE TABLE agent_conversations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
    agent_type          varchar(20) NOT NULL
                            CHECK (agent_type IN ('personal', 'platform')),
    visitor_session_id  varchar(128),
    visitor_user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
    title               varchar(200),
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (agent_type = 'personal' AND owner_user_id IS NOT NULL)
        OR (agent_type = 'platform' AND owner_user_id IS NULL)
    ),
    CHECK (visitor_session_id IS NOT NULL OR visitor_user_id IS NOT NULL)
);

CREATE TABLE agent_messages (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     uuid NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
    role                varchar(20) NOT NULL
                            CHECK (role IN ('system', 'user', 'assistant', 'tool')),
    content             text NOT NULL,
    tool_name           varchar(100),
    tool_call_id        varchar(128),
    metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
    prompt_tokens       integer CHECK (prompt_tokens >= 0),
    completion_tokens   integer CHECK (completion_tokens >= 0),
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_agent_conversations_owner
    ON agent_conversations (owner_user_id, updated_at DESC);
CREATE INDEX idx_agent_messages_conversation
    ON agent_messages (conversation_id, created_at);

CREATE TABLE resume_embeddings (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id           uuid NOT NULL,
    source_type         varchar(30) NOT NULL CHECK (
                            source_type IN
                            ('profile', 'education', 'internship', 'work', 'project', 'award', 'skill', 'resume')
                        ),
    source_id           uuid,
    chunk_index         integer NOT NULL DEFAULT 0 CHECK (chunk_index >= 0),
    content             text NOT NULL,
    content_hash        char(64) NOT NULL,
    metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
    embedding           vector(1536) NOT NULL,
    embedding_model     varchar(100) NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id, user_id)
        REFERENCES resumes(id, user_id) ON DELETE CASCADE,
    UNIQUE (resume_id, source_type, source_id, chunk_index),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_resume_embeddings_tenant
    ON resume_embeddings (user_id, resume_id, source_type);

-- HNSW supports fast cosine-distance RAG retrieval. Adjust m and
-- ef_construction after measuring the production workload.
CREATE INDEX idx_resume_embeddings_hnsw
    ON resume_embeddings USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Keep updated_at consistent without relying on application code.
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_educations_updated_at
    BEFORE UPDATE ON educations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_internships_updated_at
    BEFORE UPDATE ON internship_experiences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_work_experiences_updated_at
    BEFORE UPDATE ON work_experiences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_project_experiences_updated_at
    BEFORE UPDATE ON project_experiences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_awards_updated_at
    BEFORE UPDATE ON awards FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_skills_updated_at
    BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_resumes_updated_at
    BEFORE UPDATE ON resumes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_agent_profiles_updated_at
    BEFORE UPDATE ON agent_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_agent_conversations_updated_at
    BEFORE UPDATE ON agent_conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_resume_embeddings_updated_at
    BEFORE UPDATE ON resume_embeddings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
