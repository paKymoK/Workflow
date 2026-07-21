-- FCM device tokens: source of truth for push notification registration. Unique on fcm_token
-- alone (not (sub, fcm_token)) — a token identifies one physical app install, so re-registering it
-- under a different sub (shared device, reinstall by another employee) reassigns the row instead
-- of creating a conflicting duplicate. chat-service mirrors this via device-token.events into its
-- own device_token_directory, the same way it already mirrors employee_directory.

CREATE TABLE IF NOT EXISTS device_token
(
    id           bigserial    NOT NULL,
    sub          varchar(200) NOT NULL REFERENCES employee (sub),
    platform     varchar(20)  NOT NULL CHECK (platform IN ('WEB', 'ANDROID', 'IOS')),
    fcm_token    varchar(500) NOT NULL,
    last_used_at timestamp with time zone,
    created_at   timestamp with time zone,
    created_by   jsonb,
    modified_at  timestamp with time zone,
    modified_by  jsonb,
    PRIMARY KEY (id),
    UNIQUE (fcm_token)
);

CREATE INDEX IF NOT EXISTS idx_device_token_sub ON device_token (sub);
