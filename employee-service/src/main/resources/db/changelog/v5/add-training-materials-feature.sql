-- Training Materials: org-official content, either a video (media-service HLS pipeline) or an
-- uploaded PDF/slides file. Lives in employee-service, same reasoning as v2's News feature and
-- v4's Documents feature — no other service needs this data, so no Kafka topic. Unlike
-- document_post there's no free-form "content OR file" choice: a material is exactly one of
-- video or file, enforced by the CHECK below.

CREATE TABLE IF NOT EXISTS training_material
(
    id          bigserial     NOT NULL,
    category    varchar(100)  NOT NULL,
    title       varchar(300)  NOT NULL,
    format      varchar(20)   NOT NULL CHECK (format IN ('PDF', 'VIDEO', 'SLIDES')),
    video_id    varchar(100),
    duration    varchar(50),
    file_url    varchar(500),
    file_name   varchar(255),
    file_size   bigint,
    status      varchar(20)   NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at  timestamp with time zone,
    created_by  jsonb,
    modified_at timestamp with time zone,
    modified_by jsonb,
    PRIMARY KEY (id),
    CHECK (
        (format = 'VIDEO' AND video_id IS NOT NULL AND file_url IS NULL)
        OR (format IN ('PDF', 'SLIDES') AND file_url IS NOT NULL AND video_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_training_material_list ON training_material (status, category, created_at DESC);

-- One completion per employee per training material — idempotent (re-completing is a no-op).
CREATE TABLE IF NOT EXISTS training_completion
(
    id                    bigserial    NOT NULL,
    training_material_id  bigint       NOT NULL REFERENCES training_material (id) ON DELETE CASCADE,
    employee_sub          varchar(200) NOT NULL REFERENCES employee (sub),
    created_at            timestamp with time zone,
    created_by            jsonb,
    modified_at           timestamp with time zone,
    modified_by           jsonb,
    PRIMARY KEY (id),
    UNIQUE (training_material_id, employee_sub)
);

CREATE INDEX IF NOT EXISTS idx_training_completion_material_id ON training_completion (training_material_id);
