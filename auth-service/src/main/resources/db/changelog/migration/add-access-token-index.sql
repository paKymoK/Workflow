CREATE INDEX IF NOT EXISTS ix_oa_access_token
    ON oauth2_authorization USING HASH (access_token_value);
