CREATE INDEX IF NOT EXISTS ix_oa_client_principal
    ON oauth2_authorization(registered_client_id, principal_name);
