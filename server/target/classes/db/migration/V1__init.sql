-- Auth-Shield PoC schema (from shared/schema.ts)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id              varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username        text NOT NULL UNIQUE,
  password        text NOT NULL,
  email           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- DEVICE PROFILES
CREATE TABLE IF NOT EXISTS device_profiles (
  id                  varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id             varchar REFERENCES users(id),
  fingerprint         text NOT NULL UNIQUE,
  user_agent          text,
  platform            text,
  language            text,
  timezone            text,
  screen_resolution   text,
  color_depth         integer,
  pixel_ratio         real,
  hardware_concurrency integer,
  device_memory       integer,
  touch_support       boolean,
  webgl_vendor        text,
  webgl_renderer      text,
  canvas_fingerprint  text,
  audio_fingerprint   text,
  fonts               text[],
  plugins             text[],
  trust_score         real DEFAULT 0.5,
  seen_count          integer DEFAULT 1,
  first_seen          timestamptz NOT NULL DEFAULT now(),
  last_seen           timestamptz NOT NULL DEFAULT now()
);

-- TLS FINGERPRINTS
CREATE TABLE IF NOT EXISTS tls_fingerprints (
  id                   varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id              varchar REFERENCES users(id),
  device_profile_id    varchar REFERENCES device_profiles(id),
  ja3_hash             text,
  ja3_full             text,
  ja4_hash             text,
  ja4_full             text,
  tls_version          text,
  cipher_suites        text[],
  extensions           text[],
  supported_groups     text[],
  signature_algorithms text[],
  alpn_protocols       text[],
  trust_score          real DEFAULT 0.5,
  seen_count           integer DEFAULT 1,
  first_seen           timestamptz NOT NULL DEFAULT now(),
  last_seen            timestamptz NOT NULL DEFAULT now()
);

-- BEHAVIORAL PATTERNS
CREATE TABLE IF NOT EXISTS behavioral_patterns (
  id                     varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id                varchar REFERENCES users(id),
  device_profile_id      varchar REFERENCES device_profiles(id),
  session_id             varchar,
  -- Mouse dynamics
  avg_mouse_speed        real,
  mouse_speed_variance   real,
  avg_mouse_acceleration real,
  straight_line_ratio    real,
  curve_complexity       real,
  -- Keystroke dynamics
  avg_key_hold_time      real,
  key_hold_variance      real,
  avg_flight_time        real,
  flight_time_variance   real,
  typing_speed           real,
  error_rate             real,
  -- General
  sample_count           integer DEFAULT 0,
  raw_data               jsonb,
  confidence_score       real DEFAULT 0,
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- AUTH EVENTS
CREATE TABLE IF NOT EXISTS authentication_events (
  id                   varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id              varchar REFERENCES users(id),
  device_profile_id    varchar REFERENCES device_profiles(id),
  tls_fingerprint_id   varchar REFERENCES tls_fingerprints(id),
  session_id           varchar,
  event_type           text NOT NULL,
  ip_address           text,
  device_score         real,
  tls_score            real,
  behavioral_score     real,
  overall_risk_score   real,
  confidence_level     text,
  step_up_required     boolean DEFAULT false,
  success              boolean DEFAULT false,
  metadata             jsonb,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- RISK SCORES (per session or check)
CREATE TABLE IF NOT EXISTS risk_scores (
  id                 varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id            varchar REFERENCES users(id),
  session_id         varchar,
  device_score       real NOT NULL,
  tls_score          real NOT NULL,
  behavioral_score   real NOT NULL,
  overall_score      real NOT NULL,
  factors            jsonb,
  threshold          real DEFAULT 0.7,
  passed             boolean DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
  id               varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id          varchar REFERENCES users(id),
  device_profile_id varchar REFERENCES device_profiles(id),
  token            text NOT NULL UNIQUE,
  confidence_score real DEFAULT 0,
  last_activity    timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  is_active        boolean DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ANOMALY ALERTS
CREATE TABLE IF NOT EXISTS anomaly_alerts (
  id          varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     varchar REFERENCES users(id),
  session_id  varchar,
  alert_type  text NOT NULL,
  severity    text DEFAULT 'medium',
  description text,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved    boolean DEFAULT false,
  resolved_at timestamptz
);

-- GEOLOCATIONS
CREATE TABLE IF NOT EXISTS geolocations (
  id         varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ip_address text NOT NULL UNIQUE,
  city       text,
  region     text,
  country    text,
  latitude   real,
  longitude  real,
  timezone   text,
  isp        text,
  org        text,
  asn        text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- IP REPUTATION
CREATE TABLE IF NOT EXISTS ip_reputations (
  id          varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ip_address  text NOT NULL UNIQUE,
  reputation_score real DEFAULT 0.5,
  blacklisted boolean DEFAULT false,
  reason      text,
  last_updated timestamptz NOT NULL DEFAULT now()
);

-- ADMIN SETTINGS
CREATE TABLE IF NOT EXISTS admin_settings (
  id          varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  setting_key text NOT NULL UNIQUE,
  value       jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- AB EXPERIMENTS
CREATE TABLE IF NOT EXISTS ab_experiments (
  id          varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        text NOT NULL,
  description text,
  active      boolean DEFAULT true,
  variants    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id          varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     varchar REFERENCES users(id),
  action      text NOT NULL,
  resource    text,
  details     jsonb,
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- FLAGGED SESSIONS
CREATE TABLE IF NOT EXISTS flagged_sessions (
  id          varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id  varchar NOT NULL,
  user_id     varchar REFERENCES users(id),
  reason      text,
  flagged_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved    boolean DEFAULT false
);
