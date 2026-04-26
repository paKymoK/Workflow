CREATE TABLE IF NOT EXISTS shop_order
(
    id           bigserial         NOT NULL,
    order_id     character varying NOT NULL,
    cart_id      bigint            NOT NULL,
    user_id      character varying NOT NULL,
    total_amount bigint            NOT NULL,
    currency     character varying NOT NULL DEFAULT 'VND',
    status       character varying NOT NULL,
    created_at   timestamp with time zone,
    created_by   character varying,
    modified_at  timestamp with time zone,
    modified_by  character varying,
    PRIMARY KEY (id),
    CONSTRAINT uq_shop_order_order_id UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_order_order_id ON shop_order (order_id);
CREATE INDEX IF NOT EXISTS idx_shop_order_status_created_at ON shop_order (status, created_at);
