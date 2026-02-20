INSERT INTO
    status (name, "group", color, "created_at", "created_by", "modified_at", "modified_by")
    VALUES ('Todo', 'TODO', '#808080', now(),'admin', now(), 'admin'),
           ('In-Progress', 'PROCESSING', '#FFFF00', now(),'admin', now(), 'admin'),
           ('Done', 'DONE', '#0000FF', now(),'admin', now(), 'admin');

INSERT INTO
    priority (name, response_time, resolution_time, "created_at", "created_by", "modified_at", "modified_by")
VALUES ('Low', 1, 30, now(),'admin', now(), 'admin'),
       ('Medium', 1, 12, now(),'admin', now(), 'admin'),
       ('High', 1, 4, now(),'admin', now(), 'admin');

INSERT INTO
    project (id,name, code, "created_at", "created_by", "modified_at", "modified_by")
VALUES (1, 'Internal Application', 'IA', now(), 'admin', now(), 'admin');

INSERT INTO
    issue_type (name, project_id, "created_at", "created_by", "modified_at", "modified_by")
VALUES ('Dashboard', 1 , now(),'admin', now(), 'admin'),
       ('GAMS System', 1 , now(),'admin', now(), 'admin');