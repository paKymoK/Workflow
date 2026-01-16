CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS upload_file
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name character varying,
    created_at timestamp with time zone,
    created_by character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id)
);

