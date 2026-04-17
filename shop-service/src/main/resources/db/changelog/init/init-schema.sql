CREATE TABLE IF NOT EXISTS product
(
    id          bigserial NOT NULL,
    name        character varying,
    image_url   character varying,
    detail      jsonb,
    stock       bigint NOT NULL,
    created_at  timestamp with time zone,
    created_by  character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (name)
);