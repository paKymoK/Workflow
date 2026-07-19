-- News & Events: an employee-generated feed (any employee can post/comment/react; ADMIN's only
-- extra power is moderation — deleting someone else's post/comment, and pinning). Lives in
-- employee-service rather than a new service since it has no need for its own database and no
-- other service consumes it (no Kafka topic, deliberately — see Phase 8 of the plan).

CREATE TABLE IF NOT EXISTS news_post
(
    id           bigserial    NOT NULL,
    author_sub   varchar(200) NOT NULL REFERENCES employee (sub),
    is_anonymous boolean      NOT NULL DEFAULT false,
    type         varchar(20)  NOT NULL CHECK (type IN ('NEWS', 'EVENTS', 'UNION', 'RECOGNITION')),
    pinned       boolean      NOT NULL DEFAULT false,
    title        varchar(300) NOT NULL,
    body         text         NOT NULL,
    image_url    varchar(500),
    status       varchar(20)  NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'DELETED')),
    created_at   timestamp with time zone,
    created_by   jsonb,
    modified_at  timestamp with time zone,
    modified_by  jsonb,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_news_post_feed ON news_post (status, pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_post_author ON news_post (author_sub);

CREATE TABLE IF NOT EXISTS news_comment
(
    id            bigserial    NOT NULL,
    post_id       bigint       NOT NULL REFERENCES news_post (id) ON DELETE CASCADE,
    -- Never anonymous. Display name/avatar are resolved live from `employee` at read time rather
    -- than frozen here, so there's no stale-snapshot problem to fix later.
    commenter_sub varchar(200) NOT NULL REFERENCES employee (sub),
    content       text         NOT NULL,
    is_edited     boolean      NOT NULL DEFAULT false,
    status        varchar(20)  NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'DELETED')),
    created_at    timestamp with time zone,
    created_by    jsonb,
    modified_at   timestamp with time zone,
    modified_by   jsonb,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_news_comment_post_id ON news_comment (post_id, created_at);

-- One reaction per person per post (not one per emoji) — re-reacting with the same emoji
-- un-toggles it, a different emoji replaces it. Matches the mobile UI's single-select behavior.
CREATE TABLE IF NOT EXISTS news_reaction
(
    id              bigserial    NOT NULL,
    post_id         bigint       NOT NULL REFERENCES news_post (id) ON DELETE CASCADE,
    participant_sub varchar(200) NOT NULL REFERENCES employee (sub),
    emoji           varchar(20)  NOT NULL CHECK (emoji IN ('like', 'love', 'celebrate', 'insightful')),
    created_at      timestamp with time zone,
    created_by      jsonb,
    modified_at     timestamp with time zone,
    modified_by     jsonb,
    PRIMARY KEY (id),
    UNIQUE (post_id, participant_sub)
);

CREATE INDEX IF NOT EXISTS idx_news_reaction_post_id ON news_reaction (post_id);

-- A binary like on a comment — no emoji choice, unlike post reactions.
CREATE TABLE IF NOT EXISTS news_comment_like
(
    id              bigserial    NOT NULL,
    comment_id      bigint       NOT NULL REFERENCES news_comment (id) ON DELETE CASCADE,
    participant_sub varchar(200) NOT NULL REFERENCES employee (sub),
    created_at      timestamp with time zone,
    created_by      jsonb,
    modified_at     timestamp with time zone,
    modified_by     jsonb,
    PRIMARY KEY (id),
    UNIQUE (comment_id, participant_sub)
);

CREATE INDEX IF NOT EXISTS idx_news_comment_like_comment_id ON news_comment_like (comment_id);
