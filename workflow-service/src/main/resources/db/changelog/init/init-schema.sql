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
    status jsonb NOT NULL,
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
    status jsonb NOT NULL,
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

CREATE OR REPLACE FUNCTION validate_paused_time()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS $$
DECLARE
    data jsonb;
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
    BEFORE INSERT OR UPDATE OF paused_time ON sla
    FOR EACH ROW
EXECUTE FUNCTION validate_paused_time();

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE PROCEDURE calculate_sla()
    LANGUAGE PLPGSQL
AS $$
BEGIN
    SELECT t.status, s.priority ->> 'responseTime' as TEST,  s.created_at, NOW() as now
    FROM sla s JOIN ticket t ON s.ticket_id = t.id
    WHERE 1 > calculate_sla_time(t.status ,'2026-02-01 09:00:00', (s.priority ->> 'responseTime')::INTEGER,
                                 ARRAY[
                                     tsrange('2026-02-01 09:00:00', '2026-02-01 10:00:00')
                                     ]::TSrange[]);
    -- Commit the transaction
    COMMIT;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_sla_time(status jsonb, created TIMESTAMPTZ , slaTime INT, non_working_periods TSrange[])
    RETURNS BIGINT AS $$
DECLARE
    total_working_seconds BIGINT := 0;
    official_start TIMESTAMP;
    official_end TIMESTAMP;
    work_start TIMESTAMP;
    work_end TIMESTAMP;
    lunch_start TIMESTAMP;
    lunch_end TIMESTAMP;
    start_date TIMESTAMP;
    end_date TIMESTAMP;
    non_working_period TSrange;
    adjusted_work_start TIMESTAMP;
    adjusted_work_end TIMESTAMP;
BEGIN
    start_date = created AT TIME ZONE 'UTC';
    end_date = '2026-02-01 12:30:00';

    WHILE start_date < end_date LOOP
            official_start := date_trunc('day', start_date) + interval '9 hour';
            official_end := date_trunc('day', start_date) + interval '17 hour';
            lunch_start := date_trunc('day', start_date) + interval '12 hour';
            lunch_end := date_trunc('day', start_date) + interval '13 hour';

            -- Calculate work_start and work_end within official hours
            work_start := GREATEST(start_date, official_start);
            work_end := LEAST(end_date, official_end);

            -- Adjust for lunch break if applicable
            IF work_start < lunch_start AND work_end > lunch_start THEN
                IF work_end > lunch_end THEN
                    -- Count work until lunch starts, then mark work_start after lunch
                    total_working_seconds := total_working_seconds + EXTRACT(EPOCH FROM (lunch_start - work_start));
                    work_start := lunch_end;  -- Resume after lunch
                END IF;
            END IF;

            -- Check for non-working hours

            -- Add remaining work time after all adjustments
            IF work_start < work_end THEN
                total_working_seconds := total_working_seconds + EXTRACT(EPOCH FROM (work_end - work_start));
            END IF;


            -- Move to the next day
            start_date := start_date + interval '1 day';
        END LOOP;

    RAISE WARNING 'TEST 2: % -- %', created AT TIME ZONE 'UTC', end_date;
    RAISE WARNING 'Working Time: % - % - %', total_working_seconds, total_working_seconds / 3600.0,EXTRACT(EPOCH FROM AGE(end_date, created AT TIME ZONE 'UTC'))/ 3600.0;

    RAISE EXCEPTION 'TEST';
    return total_working_seconds;
END;
$$ LANGUAGE plpgsql;


