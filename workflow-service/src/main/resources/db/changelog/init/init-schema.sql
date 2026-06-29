CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS status
(
    id          bigserial NOT NULL,
    name        character varying,
    "group"     character varying,
    color       character varying,
    created_at  timestamp with time zone,
    created_by  jsonb,
    modified_at timestamp with time zone,
    modified_by jsonb,
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
    created_by      jsonb,
    modified_at     timestamp with time zone,
    modified_by     jsonb,
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
    created_by  jsonb,
    modified_at timestamp with time zone,
    modified_by jsonb,
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
    version     bigint    NOT NULL DEFAULT 0,
    approvals      jsonb     NOT NULL DEFAULT '[]',
    linked_tickets jsonb     NOT NULL DEFAULT '[]',
    created_at  timestamp with time zone,
    created_by  jsonb,
    modified_at timestamp with time zone,
    modified_by jsonb,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS workflow
(
    id          bigserial         NOT NULL,
    name        character varying NOT NULL,
    statuses    jsonb             NOT NULL,
    transitions jsonb             NOT NULL,
    created_at  timestamp with time zone,
    created_by  jsonb,
    modified_at timestamp with time zone,
    modified_by jsonb,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS project
(
    id          bigserial         NOT NULL,
    name        character varying NOT NULL,
    code        character varying NOT NULL,
    created_at  timestamp with time zone,
    created_by  jsonb,
    modified_at timestamp with time zone,
    modified_by jsonb,
    PRIMARY KEY (id),
    UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS issue_type
(
    id          bigserial         NOT NULL,
    name        character varying NOT NULL,
    code        character varying NOT NULL,
    project_id  integer           NOT NULL,
    workflow_id bigint            NOT NULL,
    created_at  timestamp with time zone,
    created_by  jsonb,
    modified_at timestamp with time zone,
    modified_by jsonb,
    PRIMARY KEY (id),
    UNIQUE (name, project_id),
    UNIQUE (code, project_id)
);

ALTER TABLE sla
    REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS idx_ticket_status_group ON ticket ((status->>'group'));
CREATE INDEX IF NOT EXISTS idx_ticket_issue_type ON ticket ((issue_type->>'name'));
CREATE INDEX idx_tickets_detail_gin ON ticket USING GIN (detail);
CREATE INDEX IF NOT EXISTS idx_ticket_status_id
ON ticket (((status ->> 'id')::bigint));

CREATE INDEX IF NOT EXISTS idx_ticket_priority_id
ON ticket (((priority ->> 'id')::bigint));

CREATE INDEX IF NOT EXISTS idx_ticket_assignee_sub
ON ticket ((assignee ->> 'sub'));

CREATE INDEX IF NOT EXISTS idx_ticket_approvals_gin ON ticket USING GIN (approvals);
CREATE INDEX IF NOT EXISTS idx_ticket_linked_tickets_gin ON ticket USING GIN (linked_tickets);
CREATE INDEX IF NOT EXISTS idx_ticket_linked_tickets_id ON ticket USING GIN ((linked_tickets) jsonb_path_ops);


CREATE INDEX IF NOT EXISTS idx_sla_status_response ON sla ((status ->> 'response'));
CREATE INDEX IF NOT EXISTS idx_sla_status_resolution ON sla ((status ->> 'resolution'));
CREATE INDEX IF NOT EXISTS idx_sla_status_response_overdue ON sla ((status ->> 'isResponseOverdue'));
CREATE INDEX IF NOT EXISTS idx_sla_status_resolution_overdue ON sla ((status ->> 'isResolutionOverdue'));
CREATE INDEX IF NOT EXISTS idx_sla_status_resolution_percent ON sla ((status ->> 'resolutionPercent'));

CREATE INDEX IF NOT EXISTS idx_ticket_open_assignee_sub
ON ticket ((assignee->>'sub'))
WHERE status->>'group' != 'DONE'
  AND assignee IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sla_pending_overdue_check
ON sla (ticket_id)
WHERE (status ->> 'isResponseOverdue') IS DISTINCT FROM 'true'
   OR (status ->> 'isResolutionOverdue') IS DISTINCT FROM 'true';

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

CREATE OR REPLACE FUNCTION prevent_issue_type_code_update()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    IF OLD.code IS DISTINCT FROM NEW.code THEN
        RAISE EXCEPTION 'Column code of issue_type is immutable and cannot be updated';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER prevent_issue_type_code_update
    BEFORE UPDATE OF code
    ON issue_type
    FOR EACH ROW
EXECUTE FUNCTION prevent_issue_type_code_update();

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
                               )
        WHERE NEW.id = ticket_id;
    END IF;

    IF (OLD.status ->> 'group' = 'PROCESSING') AND (NEW.status ->> 'group' = 'DONE') THEN
        UPDATE sla
        SET status = status || jsonb_build_object(
                'resolution', 'DONE',
                'resolutionTime', NOW()
                               )
        WHERE NEW.id = ticket_id;
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

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log
(
    id         bigserial   NOT NULL,
    ticket_id  bigint      NOT NULL,
    action     varchar     NOT NULL,
    actor      jsonb,
    payload    jsonb       NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_ticket_id ON audit_log (ticket_id, id DESC);

-- Ticket audit: TICKET_CREATED, STATUS_CHANGED, ASSIGNEE_CHANGED
CREATE OR REPLACE FUNCTION audit_ticket()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (ticket_id, action, actor, payload)
        VALUES (NEW.id, 'TICKET_CREATED', NEW.created_by,
                jsonb_build_object(
                        'summary', NEW.summary,
                        'project', NEW.project,
                        'issueType', NEW.issue_type,
                        'priority', NEW.priority,
                        'reporter', NEW.reporter
                ));

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO audit_log (ticket_id, action, actor, payload)
            VALUES (NEW.id, 'STATUS_CHANGED', NEW.modified_by,
                    jsonb_build_object('from', OLD.status, 'to', NEW.status));
        END IF;

        IF OLD.assignee IS DISTINCT FROM NEW.assignee THEN
            INSERT INTO audit_log (ticket_id, action, actor, payload)
            VALUES (NEW.id, 'ASSIGNEE_CHANGED', NEW.modified_by,
                    jsonb_build_object('from', OLD.assignee, 'to', NEW.assignee));
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER audit_ticket_trigger
    AFTER INSERT OR UPDATE
    ON ticket
    FOR EACH ROW
EXECUTE FUNCTION audit_ticket();

-- SLA audit: SLA_PAUSED, SLA_RESUMED
CREATE OR REPLACE FUNCTION audit_sla()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    IF OLD.is_paused = false AND NEW.is_paused = true THEN
        INSERT INTO audit_log (ticket_id, action, actor, payload)
        VALUES (NEW.ticket_id, 'SLA_PAUSED', NEW.modified_by, '{}');

    ELSIF OLD.is_paused = true AND NEW.is_paused = false THEN
        INSERT INTO audit_log (ticket_id, action, actor, payload)
        VALUES (NEW.ticket_id, 'SLA_RESUMED', NEW.modified_by, '{}');
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER audit_sla_trigger
    AFTER UPDATE OF is_paused
    ON sla
    FOR EACH ROW
EXECUTE FUNCTION audit_sla();
