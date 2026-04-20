WITH seed AS (SELECT gs                                      AS n,
                     now() - (random() * interval '30 days') AS created_at,
                     random()                                AS r_status,
                     random()                                AS r_priority,
                     random()                                AS r_issue
              FROM generate_series(1, 100000) gs),
     ticket_data AS (SELECT n,
                            created_at,

                            -- Random status (45% TODO, 35% PROCESSING, 20% DONE)
                            CASE
                                WHEN r_status < 0.45 THEN
                                    jsonb_build_object('id', 1, 'name', 'Todo', 'color', '#808080', 'group', 'TODO')
                                WHEN r_status < 0.80 THEN jsonb_build_object('id', 2, 'name', 'In-Progress', 'color',
                                                                             '#0000FF', 'group', 'PROCESSING')
                                ELSE
                                    jsonb_build_object('id', 3, 'name', 'Done', 'color', '#008000', 'group', 'DONE')
                                END AS status_json,

                            -- Random priority (50% Low, 35% Medium, 15% High)
                            CASE
                                WHEN r_priority < 0.50 THEN
                                    jsonb_build_object('id', 1, 'name', 'Low', 'responseTime', 1, 'resolutionTime', 30)
                                WHEN r_priority < 0.85 THEN
                                    jsonb_build_object('id', 2, 'name', 'Medium', 'responseTime', 1, 'resolutionTime',
                                                       12)
                                ELSE
                                    jsonb_build_object('id', 3, 'name', 'High', 'responseTime', 1, 'resolutionTime', 4)
                                END AS priority_json,

                            -- Random issue type (40% GAMS, 60% Dashboard)
                            CASE
                                WHEN r_issue < 0.40
                                    THEN jsonb_build_object('id', 2, 'name', 'GAMS System', 'projectId', 1)
                                ELSE
                                    jsonb_build_object('id', 1, 'name', 'Dashboard', 'projectId', 1)
                                END AS issue_type_json
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
       jsonb_build_object('data', '123', '_clazz', 'com.takypok.workflowservice.model.ticket.Dashboard'),
       priority_json,
       jsonb_build_object('id', 1, 'name', 'Test'),
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
       CASE t.status ->>'group' WHEN 'TODO' THEN
              jsonb_build_object(
                  'response','TODO',
                  'resolution','TODO',
                  'responseTime',NULL,
                  'resolutionTime',NULL,
                  'isResponseOverdue',false,
                  'isResolutionOverdue',false
              )
          WHEN 'PROCESSING' THEN
              jsonb_build_object(
                  'response','DONE',
                  'resolution','TODO',
                  'responseTime', t.created_at + (random() * interval '8 hours'),
                  'resolutionTime',NULL,
                  'isResponseOverdue',false,
                  'isResolutionOverdue',false
              )
          ELSE -- DONE
              jsonb_build_object(
                  'response','DONE',
                  'resolution','DONE',
                  'responseTime', t.created_at + (random() * interval '8 hours'),
                  'resolutionTime', t.created_at + interval '8 hours' + (random() *
  interval '24 hours'),
                  'isResponseOverdue',false,
                  'isResolutionOverdue',false
              )
END
,
      false,
      '[]'::jsonb,
      t.priority,
      jsonb_build_object(
          'weekend', jsonb_build_array(6,7),
          'workStart','09:00:00',
          'lunchStart','12:00:00',
          'lunchEnd','13:00:00',
          'workEnd','18:00:00',
          'timezone','Asia/Ho_Chi_Minh'
      ),
      now(),
      'Anonymous',
      now(),
      'Anonymous'
  FROM ins_ticket t;