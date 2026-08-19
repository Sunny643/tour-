-- Initial schema for the listing-to-promo-video SaaS.
-- Run against the Supabase Postgres DATABASE_URL.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- app_users: mirrors the Clerk user, holds persona default + branding (reused across projects) + billing state
CREATE TABLE app_users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id           TEXT NOT NULL UNIQUE,
  email                   TEXT NOT NULL,
  default_persona         TEXT NOT NULL DEFAULT 'agent' CHECK (default_persona IN ('agent', 'host')),
  brand_logo_key          TEXT,
  brand_contact_name      TEXT,
  brand_contact_phone     TEXT,
  brand_contact_email     TEXT,
  brand_contact_website   TEXT,
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT,
  plan                    TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  renders_used_this_period INT NOT NULL DEFAULT 0,
  period_reset_at         TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- music_tracks: curated (placeholder, for now) track library
CREATE TABLE music_tracks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  mood_tags           TEXT[] NOT NULL DEFAULT '{}',
  suggested_persona   TEXT NOT NULL DEFAULT 'both' CHECK (suggested_persona IN ('agent', 'host', 'both')),
  file_url            TEXT NOT NULL,
  duration_seconds    INT,
  is_placeholder      BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- projects: one per listing/property
CREATE TABLE projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  persona_type          TEXT NOT NULL CHECK (persona_type IN ('agent', 'host')),
  price_text            TEXT,
  aspect_ratio          TEXT NOT NULL DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16')),
  template_style        TEXT,
  music_track_id        UUID REFERENCES music_tracks(id),
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'rendering', 'rendered', 'failed')),
  latest_render_job_id  UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- project_photos: ordered photos per project
CREATE TABLE project_photos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_key       TEXT NOT NULL,
  public_url        TEXT,
  order_index       INT NOT NULL,
  width             INT,
  height            INT,
  file_size_bytes   INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, order_index)
);

-- render_jobs: status/provider tracking per render
CREATE TABLE render_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL DEFAULT 'shotstack',
  provider_job_id   TEXT,
  status            TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'rendering', 'done', 'failed')),
  render_params     JSONB NOT NULL,
  output_url        TEXT,
  share_slug        TEXT UNIQUE,
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE projects
  ADD CONSTRAINT fk_projects_latest_render_job
  FOREIGN KEY (latest_render_job_id) REFERENCES render_jobs(id);

CREATE INDEX idx_project_photos_project_id ON project_photos(project_id);
CREATE INDEX idx_render_jobs_project_id ON render_jobs(project_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
