CREATE TABLE IF NOT EXISTS product
(
    id          bigserial NOT NULL,
    name        character varying,
    type        character varying,
    image_url   character varying,
    detail      jsonb,
    stock       bigint NOT NULL,
    price       bigint NOT NULL,
    currency    character varying,
    created_at  timestamp with time zone,
    created_by  character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS cart
(
    id          bigserial NOT NULL,
    user_id     character varying NOT NULL,
    status      character varying NOT NULL,
    created_at  timestamp with time zone,
    created_by  character varying,
    modified_at timestamp with time zone,
    modified_by character varying,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS cart_item
(
    id             bigserial NOT NULL,
    cart_id        bigint NOT NULL,
    product_id     bigint NOT NULL,
    quantity       bigint NOT NULL,
    unit_price     bigint NOT NULL,
    currency       character varying,
    product_name   character varying,
    image_url      character varying,
    created_at     timestamp with time zone,
    created_by     character varying,
    modified_at    timestamp with time zone,
    modified_by    character varying,
    PRIMARY KEY (id),
    CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES cart (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_item_product FOREIGN KEY (product_id) REFERENCES product (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_cart_active_per_user
    ON cart (user_id)
    WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX IF NOT EXISTS ux_cart_item_product_per_cart
    ON cart_item (cart_id, product_id);

CREATE INDEX IF NOT EXISTS idx_cart_item_cart_id
    ON cart_item (cart_id);

CREATE OR REPLACE FUNCTION ensure_product_stock_non_negative()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    IF NEW.stock < 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER ensure_product_stock_non_negative
    BEFORE UPDATE OF stock
    ON product
    FOR EACH ROW
EXECUTE FUNCTION ensure_product_stock_non_negative();

ALTER TABLE cart_item
    ADD CONSTRAINT ck_cart_item_quantity_positive CHECK (quantity > 0);

ALTER TABLE product
    ADD CONSTRAINT ck_product_stock_non_negative CHECK (stock >= 0);