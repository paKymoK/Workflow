CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS status
(
    id bigserial NOT NULL,
    name character varying,
    "group" character varying,
    color character varying,
    created_at timestamp with time zone,
    created_by character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS priority
(
    id bigserial NOT NULL,
    name character varying NOT NULL,
    response_time integer NOT NULL,
    resolution_time integer NOT NULL,
    created_at timestamp with time zone,
    created_by character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS sla
(
    id bigserial NOT NULL,
    status character varying,
    ticket_id bigint NOT NULL,
    priority jsonb NOT NULL,
    paused_time jsonb NOT NULL,
    created_at timestamp with time zone,
    created_by character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS ticket
(
    id bigserial NOT NULL,
    project jsonb NOT NULL,
    issue_type jsonb NOT NULL,
    status character varying NOT NULL,
    summary character varying,
    reporter jsonb NOT NULL,
    assignee jsonb,
    detail jsonb NOT NULL,
    priority jsonb NOT NULL,
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

CREATE TABLE IF NOT EXISTS project
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
    project_id integer NOT NULL,
    created_at timestamp with time zone,
    created_by character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (name, project_id)
);

ALTER TABLE sla REPLICA IDENTITY FULL;

-- CREATE OR REPLACE FUNCTION validate_sla_pause_time()
--     RETURNS trigger
--     LANGUAGE 'plpgsql'
--     COST 100
--     VOLATILE NOT LEAKPROOF
-- AS $BODY$
-- DECLARE
--     pause JSONB;
-- BEGIN
--     FOR pause IN SELECT * FROM jsonb_array_elements(OLD.paused_time) LOOP
--             RAISE EXCEPTION 'Item Value % - %', pause ->> 'pausedTime', pause ->> 'resumeTime';
--         END LOOP;
--     RAISE EXCEPTION 'This is a simple notice message. %', OLD.paused_time ;
--     RETURN NEW;
-- END;
-- $BODY$;
--
--
-- CREATE OR REPLACE TRIGGER validate_sla_pause_time
--     BEFORE INSERT OR UPDATE ON sla
--     FOR EACH ROW
-- EXECUTE FUNCTION validate_sla_pause_time();