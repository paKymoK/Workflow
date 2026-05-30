WITH seed AS (SELECT gs                                                                    AS n,
                     -- Uneven created_at distribution to produce visible daily spikes
                     (current_date - ((ARRAY[0,0,0,1,2,3,3,5,6,6])[floor(random() * 10)::int + 1] * interval '1 day') +
                      interval '9 hours') +
                     (random() * interval '8 hours')                                       AS created_at,
                     random()                                                              AS r_status,
                     random()                                                              AS r_priority,
                     random()                                                              AS r_issue,
                     random()                                                              AS r_app
              FROM generate_series(1, 100000) gs),
     ticket_data AS (SELECT n,
                            created_at,
                            CASE
                                WHEN r_status < 0.45 THEN
                                    jsonb_build_object('id', 1, 'name', 'Todo', 'color', '#808080', 'group', 'TODO')
                                WHEN r_status < 0.80 THEN
                                    jsonb_build_object('id', 2, 'name', 'In-Progress', 'color', '#0000FF', 'group',
                                                       'PROCESSING')
                                ELSE
                                    jsonb_build_object('id', 3, 'name', 'Done', 'color', '#008000', 'group', 'DONE')
                                END AS status_json,
                            CASE
                                WHEN r_priority < 0.50 THEN
                                    jsonb_build_object('id', 1, 'name', 'Low', 'responseTime', 1, 'resolutionTime', 30)
                                WHEN r_priority < 0.85 THEN
                                    jsonb_build_object('id', 2, 'name', 'Medium', 'responseTime', 1, 'resolutionTime',
                                                       12)
                                ELSE
                                    jsonb_build_object('id', 3, 'name', 'High', 'responseTime', 1, 'resolutionTime', 4)
                                END AS priority_json,
                            CASE
                                WHEN r_issue < 0.40 THEN
                                    jsonb_build_object('id', 1, 'name', 'Problem', 'projectId', 1)
                                WHEN r_issue < 0.70 THEN
                                    jsonb_build_object('id', 2, 'name', 'Change Request', 'projectId', 1)
                                ELSE
                                    jsonb_build_object('id', 3, 'name', 'Complain', 'projectId', 1)
                                END AS issue_type_json,
                            CASE
                                WHEN r_app < 0.55 THEN
                                    jsonb_build_object(
                                            'application', 'Dashboard',
                                            'description', 'Load test ticket for Dashboard application',
                                            '_clazz',
                                            'com.takypok.workflowservice.model.ticket.internal.Dashboard'
                                    )
                                ELSE
                                    jsonb_build_object(
                                            'application', 'GAMS System',
                                            'description', 'Load test ticket for GAMS System application',
                                            '_clazz',
                                            'com.takypok.workflowservice.model.ticket.internal.GamsSystem'
                                    )
                                END AS detail_json
                     FROM seed),
     ins_ticket AS (
         INSERT
             INTO ticket (project, issue_type, status, summary, reporter, assignee, detail,
                          priority, workflow,
                          created_at, created_by, modified_at, modified_by)
                 SELECT jsonb_build_object('id', 1, 'code', 'IA', 'name', 'Internal Application', 'workflowId', 1),
                        issue_type_json,
                        status_json,
                        'Load Test ' || n,
                        jsonb_build_object('name', 'admin', 'email', 'tqthai@gmail.com'),
                        NULL,
                        detail_json,
                        priority_json,
                        jsonb_build_object(
                                'id', 1,
                                'name', 'Test',
                                'statuses', jsonb_build_array(
                                        jsonb_build_object('x', NULL, 'y', NULL, 'id', 1, 'name', 'Todo', 'color',
                                                           '#808080', 'group', 'TODO'),
                                        jsonb_build_object('x', NULL, 'y', NULL, 'id', 2, 'name', 'In-Progress',
                                                           'color',
                                                           '#0000FF', 'group', 'PROCESSING'),
                                        jsonb_build_object('x', NULL, 'y', NULL, 'id', 3, 'name', 'Done', 'color',
                                                           '#008000', 'group', 'DONE')
                                ),
                                'transitions', jsonb_build_array(
                                        jsonb_build_object(
                                                'to', jsonb_build_object('id', 2, 'name', 'In-Progress', 'color',
                                                                         '#0000FF',
                                                                         'group', 'PROCESSING'),
                                                'from', jsonb_build_object('id', 1, 'name', 'Todo', 'color', '#808080',
                                                                           'group', 'TODO'),
                                                'name', 'Approve',
                                                'validator', jsonb_build_array(
                                                        'com.takypok.workflowservice.function.validator.Example1Validator'),
                                                'postFunctions', jsonb_build_array(
                                                        'com.takypok.workflowservice.function.postfunction.Example1Function')
                                        ),
                                        jsonb_build_object(
                                                'to', jsonb_build_object('id', 3, 'name', 'Done', 'color', '#008000',
                                                                         'group', 'DONE'),
                                                'from', jsonb_build_object('id', 2, 'name', 'In-Progress', 'color',
                                                                           '#0000FF', 'group', 'PROCESSING'),
                                                'name', 'Approve',
                                                'validator', '[]'::jsonb,
                                                'postFunctions', '[]'::jsonb
                                        )
                                )
                        ),
                        created_at,
                        'admin',
                        now(),
                        'admin'
                 FROM ticket_data RETURNING id, status, priority, created_at
     )
INSERT
INTO sla (ticket_id, status, is_paused, paused_time, priority, setting,
          created_at, created_by, modified_at, modified_by)
SELECT t.id,
       CASE t.status ->> 'group'
           WHEN 'TODO' THEN
               jsonb_build_object(
                       'response', 'TODO',
                       'resolution', 'TODO',
                       'responseTime', NULL,
                       'resolutionTime', NULL,
                       'resolutionPercent', floor(random() * 25)::int,
                       'isResponseOverdue', false,
                       'isResolutionOverdue', false
               )
           WHEN 'PROCESSING' THEN
               jsonb_build_object(
                       'response', 'DONE',
                       'resolution', 'TODO',
                       'responseTime', t.created_at + (random() * (
                           CASE t.priority->>'name'
                               WHEN 'High'   THEN interval '1 hour'
                               WHEN 'Medium' THEN interval '3 hours'
                               ELSE               interval '8 hours'
                           END)),
                       'resolutionTime', NULL,
                       'resolutionPercent', floor(30 + random() * 60)::int,
                       'isResponseOverdue', (random() < 0.20),
                       'isResolutionOverdue', false
               )
           ELSE -- DONE
               jsonb_build_object(
                       'response', 'DONE',
                       'resolution', 'DONE',
                       'responseTime', t.created_at + (random() * (
                           CASE t.priority->>'name'
                               WHEN 'High'   THEN interval '1 hour'
                               WHEN 'Medium' THEN interval '3 hours'
                               ELSE               interval '8 hours'
                           END)),
                       'resolutionTime', t.created_at + (
                           CASE t.priority->>'name'
                               WHEN 'High'   THEN interval '1 hour'  + random() * interval '7 hours'
                               WHEN 'Medium' THEN interval '4 hours' + random() * interval '20 hours'
                               ELSE               interval '12 hours' + random() * interval '60 hours'
                           END),
                       'resolutionPercent', CASE WHEN random() < 0.15
                                                 THEN floor(100 + random() * 40)::int
                                                 ELSE floor(20 + random() * 79)::int
                                            END,
                       'isResponseOverdue', false,
                       'isResolutionOverdue', (random() < 0.15)
               )
           END,
       false,
       '[]'::jsonb,
       t.priority,
       jsonb_build_object(
               'weekend', jsonb_build_array(0, 6),
               'workStart', '09:00:00',
               'lunchStart', '12:00:00',
               'lunchEnd', '13:00:00',
               'workEnd', '18:00:00',
               'timezone', 'Asia/Ho_Chi_Minh'
       ),
       now(),
       'Anonymous',
       now(),
       'Anonymous'
FROM ins_ticket t;
