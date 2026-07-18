-- employee-service is now the source of truth for employee/HR data; auth-service is
-- authentication/authorization only. Two FKs need to move off userinfo(sub) before it can be
-- dropped — they're authorization data (group membership, role assignments), not HR data, so
-- users(username) — Spring Security JDBC's own identity table — is the correct home for them.
-- Safe with no data migration: userinfo.sub already had FOREIGN KEY (sub) REFERENCES
-- users(username), so every value satisfying the old constraint already satisfies the new one.

ALTER TABLE user_group_member DROP CONSTRAINT fk_ugm_user;
ALTER TABLE user_group_member
    ADD CONSTRAINT fk_ugm_user FOREIGN KEY (user_sub) REFERENCES users (username) ON DELETE CASCADE;

ALTER TABLE client_role_assignment DROP CONSTRAINT fk_cra_user;
ALTER TABLE client_role_assignment
    ADD CONSTRAINT fk_cra_user FOREIGN KEY (user_sub) REFERENCES users (username) ON DELETE CASCADE;

DROP TABLE IF EXISTS userinfo;
