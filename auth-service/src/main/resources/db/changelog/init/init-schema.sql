CREATE TABLE IF NOT EXISTS oauth2_registered_client
(
    id                            varchar(100)                            NOT NULL,
    client_id                     varchar(100)                            NOT NULL,
    client_id_issued_at           timestamp     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    client_secret                 varchar(200)  DEFAULT NULL,
    client_secret_expires_at      timestamp     DEFAULT NULL,
    client_name                   varchar(200)                            NOT NULL,
    client_authentication_methods varchar(1000)                           NOT NULL,
    authorization_grant_types     varchar(1000)                           NOT NULL,
    redirect_uris                 varchar(1000) DEFAULT NULL,
    post_logout_redirect_uris     varchar(1000) DEFAULT NULL,
    scopes                        varchar(1000)                           NOT NULL,
    client_settings               varchar(2000)                           NOT NULL,
    token_settings                varchar(2000)                           NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS oauth2_authorization_consent
(
    registered_client_id varchar(100)  NOT NULL,
    principal_name       varchar(200)  NOT NULL,
    authorities          varchar(1000) NOT NULL,
    PRIMARY KEY (registered_client_id, principal_name)
);

CREATE TABLE IF NOT EXISTS oauth2_authorization
(
    id                            varchar(100) NOT NULL,
    registered_client_id          varchar(100) NOT NULL,
    principal_name                varchar(200) NOT NULL,
    authorization_grant_type      varchar(100) NOT NULL,
    authorized_scopes             varchar(1000) DEFAULT NULL,
    attributes                    text          DEFAULT NULL,
    state                         varchar(500)  DEFAULT NULL,
    authorization_code_value      text          DEFAULT NULL,
    authorization_code_issued_at  timestamp     DEFAULT NULL,
    authorization_code_expires_at timestamp     DEFAULT NULL,
    authorization_code_metadata   text          DEFAULT NULL,
    access_token_value            text          DEFAULT NULL,
    access_token_issued_at        timestamp     DEFAULT NULL,
    access_token_expires_at       timestamp     DEFAULT NULL,
    access_token_metadata         text          DEFAULT NULL,
    access_token_type             varchar(100)  DEFAULT NULL,
    access_token_scopes           varchar(1000) DEFAULT NULL,
    oidc_id_token_value           text          DEFAULT NULL,
    oidc_id_token_issued_at       timestamp     DEFAULT NULL,
    oidc_id_token_expires_at      timestamp     DEFAULT NULL,
    oidc_id_token_metadata        text          DEFAULT NULL,
    refresh_token_value           text          DEFAULT NULL,
    refresh_token_issued_at       timestamp     DEFAULT NULL,
    refresh_token_expires_at      timestamp     DEFAULT NULL,
    refresh_token_metadata        text          DEFAULT NULL,
    user_code_value               text          DEFAULT NULL,
    user_code_issued_at           timestamp     DEFAULT NULL,
    user_code_expires_at          timestamp     DEFAULT NULL,
    user_code_metadata            text          DEFAULT NULL,
    device_code_value             text          DEFAULT NULL,
    device_code_issued_at         timestamp     DEFAULT NULL,
    device_code_expires_at        timestamp     DEFAULT NULL,
    device_code_metadata          text          DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users
(
    username VARCHAR(50)  NOT NULL,
    password VARCHAR(256) NOT NULL,
    enabled  BOOLEAN      NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (username)
);

CREATE TABLE IF NOT EXISTS authorities
(
    username  VARCHAR(50) NOT NULL,
    authority VARCHAR(50) NOT NULL,
    CONSTRAINT fk_authorities_users FOREIGN KEY (username) REFERENCES users (username),
    CONSTRAINT ix_auth_username UNIQUE (username, authority)
);

CREATE TABLE IF NOT EXISTS userinfo
(
    sub         VARCHAR(50) NOT NULL,
    name        VARCHAR     NOT NULL,
    email       VARCHAR,
    title       VARCHAR(100),
    department  VARCHAR(100),
    manager_sub VARCHAR(50),
    CONSTRAINT userinfo_pkey PRIMARY KEY (sub),
    CONSTRAINT fk_userinfo_users FOREIGN KEY (sub) REFERENCES users (username) ON DELETE CASCADE,
    CONSTRAINT fk_manager_sub FOREIGN KEY (manager_sub) REFERENCES userinfo (sub)
);

CREATE TABLE user_group (
                            id          VARCHAR(50)  NOT NULL,
                            name        VARCHAR(100) NOT NULL,
                            description VARCHAR(200),
                            CONSTRAINT user_group_pkey    PRIMARY KEY (id),
                            CONSTRAINT user_group_name_uq UNIQUE (name)
);

CREATE TABLE user_group_member (
                                   group_id VARCHAR(50) NOT NULL,
                                   user_sub VARCHAR(50) NOT NULL,
                                   CONSTRAINT user_group_member_pkey PRIMARY KEY (group_id, user_sub),
                                   CONSTRAINT fk_ugm_group FOREIGN KEY (group_id) REFERENCES user_group(id)  ON DELETE CASCADE,
                                   CONSTRAINT fk_ugm_user  FOREIGN KEY (user_sub)  REFERENCES userinfo(sub)  ON DELETE CASCADE
);

CREATE TABLE client_role_assignment (
                                        id                   VARCHAR(50)  NOT NULL,
                                        registered_client_id VARCHAR(100) NOT NULL,
                                        user_sub             VARCHAR(50),
                                        group_id             VARCHAR(50),
                                        role                 VARCHAR(50)  NOT NULL,
                                        CONSTRAINT client_role_assignment_pkey PRIMARY KEY (id),
                                        CONSTRAINT cra_exactly_one CHECK (
                                            (user_sub IS NULL AND group_id IS NOT NULL)
                                                OR
                                            (user_sub IS NOT NULL AND group_id IS NULL)
                                            ),
                                        CONSTRAINT fk_cra_client FOREIGN KEY (registered_client_id) REFERENCES oauth2_registered_client(id) ON DELETE CASCADE,
                                        CONSTRAINT fk_cra_user   FOREIGN KEY (user_sub)             REFERENCES userinfo(sub)                ON DELETE CASCADE,
                                        CONSTRAINT fk_cra_group  FOREIGN KEY (group_id)             REFERENCES user_group(id)               ON DELETE CASCADE
);

CREATE UNIQUE INDEX ux_cra_client_user  ON client_role_assignment(registered_client_id, user_sub)  WHERE user_sub  IS NOT NULL;
CREATE UNIQUE INDEX ux_cra_client_group ON client_role_assignment(registered_client_id, group_id) WHERE group_id IS NOT NULL;

CREATE INDEX ix_ugm_user_sub           ON user_group_member(user_sub);
CREATE INDEX ix_cra_client_user_sub    ON client_role_assignment(registered_client_id, user_sub);
CREATE INDEX ix_cra_client_group_id    ON client_role_assignment(registered_client_id, group_id);

CREATE INDEX IF NOT EXISTS ix_userinfo_manager_sub ON userinfo (manager_sub);
CREATE INDEX IF NOT EXISTS ix_userinfo_department ON userinfo (department);

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";