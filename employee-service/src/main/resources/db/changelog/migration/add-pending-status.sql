-- Account-sync (Phase 3): employee rows are now created as empty PENDING shells the instant
-- auth-service confirms a sub, before HR has filled anything in — so `name` can no longer be
-- NOT NULL, and `status` needs a new PENDING value.
ALTER TABLE employee ALTER COLUMN name DROP NOT NULL;

ALTER TABLE employee DROP CONSTRAINT employee_status_check;
ALTER TABLE employee
    ADD CONSTRAINT employee_status_check
        CHECK (status IN ('PENDING', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'));

ALTER TABLE employee ALTER COLUMN status DROP DEFAULT;
