-- Align geolocations table with shared/schema.ts + JPA entity expectations.
-- This is additive (safe) for existing installs.

ALTER TABLE IF EXISTS geolocations
  ADD COLUMN IF NOT EXISTS user_id      varchar,
  ADD COLUMN IF NOT EXISTS session_id   varchar,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS is_proxy     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_vpn       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_tor       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_datacenter boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS risk_score   double precision DEFAULT 0;

-- Optional: ip_address was unique in the initial migration, but in practice a user may have multiple
-- sessions from the same IP over time. If you want to relax this, uncomment:
-- ALTER TABLE geolocations DROP CONSTRAINT IF EXISTS geolocations_ip_address_key;
