CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS status
(
    id          bigserial NOT NULL,
    name        character varying,
    "group"     character varying,
    color       character varying,
    created_at  timestamp with time zone,
    created_by  character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS priority
(
    id              bigserial         NOT NULL,
    name            character varying NOT NULL,
    response_time   integer           NOT NULL,
    resolution_time integer           NOT NULL,
    created_at      timestamp with time zone,
    created_by      character varying,
    modified_at     timestamp with time zone,
    modified_by     character varying,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS sla
(
    id          bigserial NOT NULL,
    ticket_id   bigint    NOT NULL,
    status      jsonb     NOT NULL,
    is_paused   bool      NOT NULL,
    paused_time jsonb     NOT NULL,
    priority    jsonb     NOT NULL,
    setting     jsonb     NOT NULL,
    created_at  timestamp with time zone,
    created_by  character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (ticket_id)
);

CREATE TABLE IF NOT EXISTS ticket
(
    id          bigserial NOT NULL,
    project     jsonb     NOT NULL,
    issue_type  jsonb     NOT NULL,
    status      jsonb     NOT NULL,
    summary     character varying,
    reporter    jsonb     NOT NULL,
    assignee    jsonb,
    detail      jsonb     NOT NULL,
    priority    jsonb     NOT NULL,
    workflow    jsonb     NOT NULL,
    created_at  timestamp with time zone,
    created_by  character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS workflow
(
    id          bigserial         NOT NULL,
    name        character varying NOT NULL,
    statuses    jsonb             NOT NULL,
    transitions jsonb             NOT NULL,
    created_at  timestamp with time zone,
    created_by  character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS project
(
    id          bigserial         NOT NULL,
    name        character varying NOT NULL,
    code        character varying NOT NULL,
    workflow_id bigint            NOT NULL,
    created_at  timestamp with time zone,
    created_by  character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS issue_type
(
    id          bigserial         NOT NULL,
    name        character varying NOT NULL,
    project_id  integer           NOT NULL,
    created_at  timestamp with time zone,
    created_by  character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id),
    UNIQUE (name, project_id)
);

ALTER TABLE sla
    REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS idx_ticket_status_group ON ticket ((status->>'group'));
CREATE INDEX IF NOT EXISTS idx_ticket_issue_type ON ticket ((issue_type->>'name'));

CREATE INDEX IF NOT EXISTS idx_sla_ticket_id ON sla (ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_status_response ON sla ((status ->> 'response'));
CREATE INDEX IF NOT EXISTS idx_sla_status_resolution ON sla ((status ->> 'resolution'));

CREATE OR REPLACE FUNCTION validate_paused_time()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
DECLARE
    data  jsonb;
    count INT = 0;
BEGIN
    FOR data IN SELECT * FROM jsonb_array_elements(NEW.paused_time)
        LOOP
            IF data ->> 'resumeTime' IS NULL THEN
                count = count + 1;
            END IF;
            RAISE NOTICE 'Data: %', data -> 'resumeTime';
        END LOOP;

    IF count > 1 THEN
        RAISE EXCEPTION 'Can not have two active pause Object';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER validate_paused_time
    BEFORE INSERT OR UPDATE OF paused_time
    ON sla
    FOR EACH ROW
EXECUTE FUNCTION validate_paused_time();

CREATE OR REPLACE FUNCTION ticket_event_trigger()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    IF (OLD.status ->> 'group' = 'TODO') AND (NEW.status ->> 'group' = 'PROCESSING') THEN
        UPDATE sla
        SET status = status || jsonb_build_object(
                'response', 'DONE',
                'responseTime', NOW()
                               );
    END IF;

    IF (OLD.status ->> 'group' = 'PROCESSING') AND (NEW.status ->> 'group' = 'DONE') THEN
        UPDATE sla
        SET status = status || jsonb_build_object(
                'resolution', 'DONE',
                'responseTime', NOW()
                               );
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER ticket_event_trigger
    AFTER UPDATE OF status
    ON ticket
    FOR EACH ROW
    WHEN (OLD.status ->> 'group' IS DISTINCT FROM NEW.status ->> 'group')
EXECUTE FUNCTION ticket_event_trigger();

CREATE EXTENSION IF NOT EXISTS pg_cron;




