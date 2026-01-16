INSERT INTO
    status (name, color, "created_at", "created_by", "modified_at", "modified_by")
    VALUES ('Todo', '#808080', now(),'admin', now(), 'admin'),
           ('In-Progress', '#0000FF', now(),'admin', now(), 'admin'),
           ('Done', '#808080', now(),'admin', now(), 'admin');