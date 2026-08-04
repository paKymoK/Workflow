-- Mirrors auth-service's department/unit head + location columns (system of record) so this
-- read-only mirror stays a full snapshot, not just the fields today's joins happen to need.

ALTER TABLE department
    ADD COLUMN IF NOT EXISTS head     VARCHAR(200),
    ADD COLUMN IF NOT EXISTS location VARCHAR(200);

ALTER TABLE unit
    ADD COLUMN IF NOT EXISTS head     VARCHAR(200),
    ADD COLUMN IF NOT EXISTS location VARCHAR(200);
