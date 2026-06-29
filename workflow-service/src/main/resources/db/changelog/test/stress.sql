-- stress.sql — 100 k ticket load-test seed
-- Requires init-data.sql to have run first (status / priority / project / issue_type / workflow rows).
--
-- Fixed from original:
--   • Status ids/names/colors now match the real status table (id 4 = Resolved for DONE branch)
--   • Issue-type ids, names, codes and workflowId now match issue_type table
--   • Embedded workflow JSON is the real Incident workflow (id 1) not a fake 3-step stub
--   • resolutionPercent for overdue DONE tickets now > 100 (110-149) so the value is meaningful
--   • KanbanBoard group key corrected separately in the frontend (PROCESSING not IN_PROGRESS)

WITH internal_users(u) AS (
     VALUES
       ('{"sub":"btngoc2",  "name":"Bui Thuy Ngoc",        "email":"btngoc2@mycompany.local"}'::jsonb),
       ('{"sub":"nmngoc5",  "name":"Nguyen Minh Ngoc",     "email":"nmngoc5@mycompany.local"}'::jsonb),
       ('{"sub":"nttdung9", "name":"Nguyen Thi Thuy Dung", "email":"nttdung9@mycompany.local"}'::jsonb),
       ('{"sub":"dvtuan4",  "name":"Do Van Tuan",           "email":"dvtuan4@mycompany.local"}'::jsonb),
       ('{"sub":"ldduc",    "name":"Le Dinh Duc",           "email":"ldduc@mycompany.local"}'::jsonb),
       ('{"sub":"ndtoi",    "name":"Nguyen Dinh Toi",       "email":"ndtoi@mycompany.local"}'::jsonb),
       ('{"sub":"nmhoang6", "name":"Nguyen Minh Hoang",    "email":"nmhoang6@mycompany.local"}'::jsonb),
       ('{"sub":"ntnghia4", "name":"Nguyen Tuan Nghia",    "email":"ntnghia4@mycompany.local"}'::jsonb),
       ('{"sub":"nvtuan16", "name":"Nguyen Vi Tuan",        "email":"nvtuan16@mycompany.local"}'::jsonb),
       ('{"sub":"nxmanh1",  "name":"Nguyen Xuan Manh",     "email":"nxmanh1@mycompany.local"}'::jsonb),
       ('{"sub":"phanh5",   "name":"Pham Hoang Anh",        "email":"phanh5@mycompany.local"}'::jsonb),
       ('{"sub":"ptduong1", "name":"Pham Tung Duong",      "email":"ptduong1@mycompany.local"}'::jsonb),
       ('{"sub":"txdat2",   "name":"Tran Xuan Dat",         "email":"txdat2@mycompany.local"}'::jsonb),
       ('{"sub":"nvtu3",    "name":"Nguyen Van Tu",          "email":"nvtu3@mycompany.local"}'::jsonb),
       ('{"sub":"natuan25", "name":"Nguyen Anh Tuan",       "email":"natuan25@mycompany.local"}'::jsonb),
       ('{"sub":"tqthai",   "name":"Truong Quang Thai",     "email":"tqthai@mycompany.local"}'::jsonb),
       ('{"sub":"ndtu24",   "name":"Nguyen Duc Tu",          "email":"ndtu24@mycompany.local"}'::jsonb)
),
     users_arr AS (SELECT array_agg(u) AS arr FROM internal_users),
     seed AS (SELECT gs                                                                    AS n,
                     -- Uneven created_at distribution to produce visible daily spikes
                     (current_date - ((ARRAY[0,0,0,1,2,3,3,5,6,6])[floor(random() * 10)::int + 1] * interval '1 day') +
                      interval '9 hours') +
                     (random() * interval '8 hours')                                       AS created_at,
                     random()                                                              AS r_status,
                     random()                                                              AS r_priority,
                     random()                                                              AS r_issue,
                     random()                                                              AS r_app,
                     random()                                                              AS r_reporter,
                     random()                                                              AS r_assignee
              FROM generate_series(1, 100000) gs),
     ticket_data AS (SELECT n,
                            created_at,
                            -- FIX: status names/colors match real status table; DONE uses id 4 (Resolved) not id 3 (Pending)
                            CASE
                                WHEN r_status < 0.45 THEN
                                    jsonb_build_object('id', 1, 'name', 'To Do',      'color', '#808080', 'group', 'TODO')
                                WHEN r_status < 0.80 THEN
                                    jsonb_build_object('id', 2, 'name', 'In Progress','color', '#0052CC', 'group', 'PROCESSING')
                                ELSE
                                    jsonb_build_object('id', 4, 'name', 'Resolved',   'color', '#36B37E', 'group', 'DONE')
                                END AS status_json,
                            CASE
                                WHEN r_priority < 0.50 THEN
                                    jsonb_build_object('id', 1, 'name', 'Low',    'responseTime', 1, 'resolutionTime', 30)
                                WHEN r_priority < 0.85 THEN
                                    jsonb_build_object('id', 2, 'name', 'Medium', 'responseTime', 1, 'resolutionTime', 12)
                                ELSE
                                    jsonb_build_object('id', 3, 'name', 'High',   'responseTime', 1, 'resolutionTime',  4)
                                END AS priority_json,
                            -- FIX: ids, names, codes and workflowId now match the real issue_type table
                            CASE
                                WHEN r_issue < 0.40 THEN
                                    jsonb_build_object('id', 3, 'name', 'Problem',        'code', 'PROBLEM',        'projectId', 1, 'workflowId', 1)
                                WHEN r_issue < 0.70 THEN
                                    jsonb_build_object('id', 4, 'name', 'Change Request', 'code', 'CHANGE_REQUEST', 'projectId', 1, 'workflowId', 1)
                                ELSE
                                    jsonb_build_object('id', 1, 'name', 'Incident',       'code', 'INCIDENT',       'projectId', 1, 'workflowId', 1)
                                END AS issue_type_json,
                            (SELECT arr FROM users_arr)[floor(r_reporter * 17)::int + 1] AS reporter_json,
                            (SELECT arr FROM users_arr)[floor(r_assignee * 17)::int + 1] AS assignee_json,
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
                        reporter_json,
                        assignee_json,
                        detail_json,
                        priority_json,
                        -- FIX: real Incident workflow (id 1) instead of the fake 3-step stub
                        '{"id":1,"name":"Incident","statuses":[{"id":1,"name":"To Do","color":"#808080","group":"TODO"},{"id":2,"name":"In Progress","color":"#0052CC","group":"PROCESSING"},{"id":3,"name":"Pending","color":"#FF8B00","group":"PROCESSING"},{"id":4,"name":"Resolved","color":"#36B37E","group":"DONE"},{"id":5,"name":"Closed","color":"#008000","group":"DONE"}],"transitions":[{"from":{"id":1,"name":"To Do","color":"#808080","group":"TODO"},"to":{"id":2,"name":"In Progress","color":"#0052CC","group":"PROCESSING"},"name":"Start Progress","validator":[],"postFunctions":[]},{"from":{"id":2,"name":"In Progress","color":"#0052CC","group":"PROCESSING"},"to":{"id":3,"name":"Pending","color":"#FF8B00","group":"PROCESSING"},"name":"Put On Hold","validator":["com.takypok.workflowservice.function.validator.RequirePendingReasonValidator"],"postFunctions":["com.takypok.workflowservice.function.postfunction.PauseSlaFunction"]},{"from":{"id":3,"name":"Pending","color":"#FF8B00","group":"PROCESSING"},"to":{"id":2,"name":"In Progress","color":"#0052CC","group":"PROCESSING"},"name":"Resume","validator":[],"postFunctions":["com.takypok.workflowservice.function.postfunction.ResumeSlaFunction"]},{"from":{"id":2,"name":"In Progress","color":"#0052CC","group":"PROCESSING"},"to":{"id":4,"name":"Resolved","color":"#36B37E","group":"DONE"},"name":"Resolve","validator":[],"postFunctions":[]},{"from":{"id":3,"name":"Pending","color":"#FF8B00","group":"PROCESSING"},"to":{"id":4,"name":"Resolved","color":"#36B37E","group":"DONE"},"name":"Resolve","validator":[],"postFunctions":["com.takypok.workflowservice.function.postfunction.ResumeSlaFunction"]},{"from":{"id":4,"name":"Resolved","color":"#36B37E","group":"DONE"},"to":{"id":5,"name":"Closed","color":"#008000","group":"DONE"},"name":"Close","validator":[],"postFunctions":[]},{"from":{"id":4,"name":"Resolved","color":"#36B37E","group":"DONE"},"to":{"id":2,"name":"In Progress","color":"#0052CC","group":"PROCESSING"},"name":"Reopen","validator":[],"postFunctions":[]}]}'::jsonb,
                        created_at,
                        reporter_json,
                        now(),
                        reporter_json
                 FROM ticket_data RETURNING id, status, priority, created_at
     )
INSERT
INTO sla (ticket_id, status, is_paused, paused_time, priority, setting,
          created_at, created_by, modified_at, modified_by)
SELECT t.id,
       CASE t.status ->> 'group'
           WHEN 'TODO' THEN
               jsonb_build_object(
                       'response',            'TODO',
                       'resolution',          'TODO',
                       'responseTime',        NULL,
                       'resolutionTime',      NULL,
                       'resolutionPercent',   floor(random() * 25)::int,
                       'isResponseOverdue',   false,
                       'isResolutionOverdue', false
               )
           WHEN 'PROCESSING' THEN
               jsonb_build_object(
                       'response',            'DONE',
                       'resolution',          'TODO',
                       'responseTime',        t.created_at + (random() * (
                           CASE t.priority->>'name'
                               WHEN 'High'   THEN interval '1 hour'
                               WHEN 'Medium' THEN interval '3 hours'
                               ELSE               interval '8 hours'
                           END)),
                       'resolutionTime',      NULL,
                       'resolutionPercent',   floor(30 + random() * 60)::int,
                       'isResponseOverdue',   (random() < 0.20),
                       'isResolutionOverdue', false
               )
           ELSE -- DONE (Resolved)
               jsonb_build_object(
                       'response',            'DONE',
                       'resolution',          'DONE',
                       'responseTime',        t.created_at + (random() * (
                           CASE t.priority->>'name'
                               WHEN 'High'   THEN interval '1 hour'
                               WHEN 'Medium' THEN interval '3 hours'
                               ELSE               interval '8 hours'
                           END)),
                       'resolutionTime',      t.created_at + (
                           CASE t.priority->>'name'
                               WHEN 'High'   THEN interval '1 hour'   + random() * interval '7 hours'
                               WHEN 'Medium' THEN interval '4 hours'  + random() * interval '20 hours'
                               ELSE               interval '12 hours' + random() * interval '60 hours'
                           END),
                       -- FIX: overdue tickets get percent > 100 (110–149) so the value signals breach
                       'resolutionPercent',   CASE WHEN rd.r_done_overdue < 0.15
                                                   THEN floor(110 + random() * 40)::int
                                                   ELSE floor(20  + random() * 79)::int
                                              END,
                       'isResponseOverdue',   false,
                       'isResolutionOverdue', (rd.r_done_overdue < 0.15)
               )
           END,
       false,
       '[]'::jsonb,
       t.priority,
       jsonb_build_object(
               'weekend',    jsonb_build_array(0, 6),
               'workStart',  '09:00:00',
               'lunchStart', '12:00:00',
               'lunchEnd',   '13:00:00',
               'workEnd',    '18:00:00',
               'timezone',   'Asia/Ho_Chi_Minh'
       ),
       now(),
       '{"sub":"anonymous","name":"Anonymous","email":null}'::jsonb,
       now(),
       '{"sub":"anonymous","name":"Anonymous","email":null}'::jsonb
FROM ins_ticket t
CROSS JOIN LATERAL (SELECT random() AS r_done_overdue) rd;
