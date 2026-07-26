-- Documents & Policies: org-official content, either an uploaded file, inline text, or both.
-- Lives in employee-service, same reasoning as v2's News feature — no other service needs this
-- data, so no Kafka topic. Unlike news_post there's no author_sub: any admin may edit any
-- document (org-official records, not personal posts), so createdBy/modifiedBy (audit jsonb)
-- is enough — there's no ownership check that needs a queryable column.

CREATE TABLE IF NOT EXISTS document_post
(
    id          bigserial     NOT NULL,
    category    varchar(100)  NOT NULL,
    title       varchar(300)  NOT NULL,
    version     varchar(20),
    content     text,
    file_url    varchar(500),
    file_name   varchar(255),
    file_size   bigint,
    status      varchar(20)   NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at  timestamp with time zone,
    created_by  jsonb,
    modified_at timestamp with time zone,
    modified_by jsonb,
    PRIMARY KEY (id),
    CHECK (content IS NOT NULL OR file_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_document_post_list ON document_post (status, category, created_at DESC);

-- One acknowledgment per employee per document — idempotent (re-acknowledging is a no-op).
CREATE TABLE IF NOT EXISTS document_acknowledgment
(
    id           bigserial    NOT NULL,
    document_id  bigint       NOT NULL REFERENCES document_post (id) ON DELETE CASCADE,
    employee_sub varchar(200) NOT NULL REFERENCES employee (sub),
    created_at   timestamp with time zone,
    created_by   jsonb,
    modified_at  timestamp with time zone,
    modified_by  jsonb,
    PRIMARY KEY (id),
    UNIQUE (document_id, employee_sub)
);

CREATE INDEX IF NOT EXISTS idx_document_acknowledgment_document_id ON document_acknowledgment (document_id);
