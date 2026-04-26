INSERT INTO product (
    name,
    category,
    image_url,
    detail,
    stock,
    price,
    currency,
    created_at,
    created_by,
    modified_at,
    modified_by
)
SELECT
    'Product ' || gs AS name,
    (ARRAY['Electronics', 'Fashion', 'Home', 'Sports', 'Books'])[(gs % 5) + 1] AS type,
    'https://picsum.photos/seed/product-' || gs || '/640/480' AS image_url,
    jsonb_build_object(
	    '_clazz', 'com.takypok.shopservice.model.product.ProductInfo'  ,
        'description', 'Sample product #' || gs,
        'sku', 'SKU-' || LPAD(gs::text, 6, '0'),
        'rating', ROUND((3 + (gs % 20) * 0.1)::numeric, 1),
        'tags', jsonb_build_array(
            (ARRAY['new', 'popular', 'sale', 'limited'])[(gs % 4) + 1],
            (ARRAY['eco', 'premium', 'budget', 'gift'])[((gs + 1) % 4) + 1]
        )
    ) AS detail,
    (10 + (gs % 200))::bigint AS stock,
    (500 + gs * 25)::bigint AS price,
    'USD' AS currency,
    NOW() - (gs || ' minutes')::interval AS created_at,
    'seed-script' AS created_by,
    NOW() - (gs || ' minutes')::interval AS modified_at,
    'seed-script' AS modified_by
FROM generate_series(1, 1000) AS gs;

