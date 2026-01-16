CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS status
(
    id bigserial NOT NULL,
    name character varying,
    color character varying,
    created_at timestamp with time zone,
    created_by character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS ticket
(
    id bigserial NOT NULL,
    ticket_type jsonb NOT NULL,
    issue_type jsonb NOT NULL,
    status character varying NOT NULL,
    summary character varying,
    reporter jsonb NOT NULL,
    assignee jsonb,
    detail jsonb NOT NULL,
    workflow jsonb NOT NULL,
    created_at timestamp with time zone,
    created_by character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS workflow
(
    id bigserial NOT NULL,
    name character varying NOT NULL,
    statuses jsonb NOT NULL,
    transitions jsonb NOT NULL,
    created_at timestamp with time zone,
    created_by character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS ticket_type
(
    id bigserial NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    created_at timestamp with time zone,
    created_by character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS issue_type
(
    id bigserial NOT NULL,
    name character varying NOT NULL,
    ticket_type_id integer NOT NULL,
    created_at timestamp with time zone,
    created_by character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (name, ticket_type_id)
);