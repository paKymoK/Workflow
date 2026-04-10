DO $$
    DECLARE
        i INTEGER;
    BEGIN
        FOR i IN 1..100000 LOOP
                INSERT INTO public.ticket VALUES (i, '{"id": 1, "code": "IA", "name": "Internal Application", "workflowId": 1}', '{"id": 1, "name": "Dashboard", "projectId": 1}', '{"id": 1, "name": "Todo", "color": "#808080", "group": "TODO"}', 'Ticket ' || i, '{"name": "admin", "email": "tqthai@gmail.com"}', NULL, '{"data": "123", "_clazz": "com.takypok.workflowservice.model.ticket.Dashboard"}', '{"id": 3, "name": "High", "responseTime": 1, "resolutionTime": 4}', '{"id": 1, "name": "Test", "statuses": [{"id": 1, "name": "Todo", "color": "#808080", "group": "TODO"}, {"id": 2, "name": "In-Progress", "color": "#0000FF", "group": "PROCESSING"}, {"id": 3, "name": "Done", "color": "#008000", "group": "DONE"}], "transitions": [{"to": {"id": 2, "name": "In-Progress", "color": "#0000FF", "group": "PROCESSING"}, "from": {"id": 1, "name": "Todo", "color": "#808080", "group": "TODO"}, "name": "Approve", "validator": ["com.takypok.workflowservice.function.validator.Example1Validator"], "postFunctions": ["com.takypok.workflowservice.function.postfunction.Example1Function"]}, {"to": {"id": 3, "name": "Done", "color": "#008000", "group": "DONE"}, "from": {"id": 2, "name": "In-Progress", "color": "#0000FF", "group": "PROCESSING"}, "name": "Approve", "validator": [], "postFunctions": []}]}', NOW() - (RANDOM() * INTERVAL '1 days'), 'admin', NOW(), 'admin');
                INSERT INTO public.sla VALUES (i, i, '{"response": "TODO", "resolution": "TODO", "responseTime": null, "resolutionTime": null, "isResponseOverdue": false, "isResolutionOverdue": false}', false, '[]', '{"id": 3, "name": "High", "responseTime": 1, "resolutionTime": 4}', '{"weekend": [], "workEnd": "23:59:00", "lunchEnd": "13:00:00", "timezone": "Asia/Ho_Chi_Minh", "workStart": "01:00:00", "lunchStart": "12:00:00"}', NOW(), 'Anonymous', NOW(), 'Anonymous');
            END LOOP;
    END $$;

SELECT setval('ticket_id_seq', 100000, true);
SELECT setval('sla_id_seq', 100000, true);

UPDATE ticket
SET issue_type = '{
  "id": 2,
  "name": "GAMS System",
  "projectId": 1
}'
WHERE id IN (
    SELECT DISTINCT FLOOR(RANDOM() * 100000 + 1)::INT
    FROM generate_series(1, 40000)
);

UPDATE ticket
SET status = '{
  "id": 2,
  "name": "In-Progress",
  "color": "#0000FF",
  "group": "PROCESSING"
}'
WHERE id IN (
    SELECT DISTINCT FLOOR(RANDOM() * 100000 + 1)::INT
    FROM generate_series(1, 30000)
);

UPDATE ticket
SET status = '{
  "id": 3,
  "name": "Done",
  "color": "#008000",
  "group": "DONE"
}'
WHERE id IN (
    SELECT DISTINCT FLOOR(RANDOM() * 100000 + 1)::INT
    FROM generate_series(1, 30000)
) AND status ->> 'group' = 'PROCESSING' ;