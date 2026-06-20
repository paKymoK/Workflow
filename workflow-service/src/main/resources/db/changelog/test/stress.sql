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
       ('{"sub":"nvhung",  "name":"Nguyen Van Hung",    "email":"nvhung@mycompany.local"}'::jsonb),
       ('{"sub":"ltphuong","name":"Le Thi Phuong",      "email":"ltphuong@mycompany.local"}'::jsonb),
       ('{"sub":"pdhung",  "name":"Pham Duc Hung",      "email":"pdhung@mycompany.local"}'::jsonb),
       ('{"sub":"hmlong",  "name":"Hoang Minh Long",    "email":"hmlong@mycompany.local"}'::jsonb),
       ('{"sub":"tqthai",  "name":"Truong Quang Thai",  "email":"tqthai@mycompany.local"}'::jsonb),
       ('{"sub":"nvbinh",  "name":"Nguyen Van Binh",    "email":"nvbinh@mycompany.local"}'::jsonb),
       ('{"sub":"dqbao",   "name":"Dang Quoc Bao",      "email":"dqbao@mycompany.local"}'::jsonb),
       ('{"sub":"vqhieu",  "name":"Vu Quang Hieu",      "email":"vqhieu@mycompany.local"}'::jsonb),
       ('{"sub":"nttung",  "name":"Nguyen Thanh Tung",  "email":"nttung@mycompany.local"}'::jsonb),
       ('{"sub":"dtnam",   "name":"Do Thanh Nam",        "email":"dtnam@mycompany.local"}'::jsonb),
       ('{"sub":"nthuong", "name":"Nguyen Thi Huong",   "email":"nthuong@mycompany.local"}'::jsonb),
       ('{"sub":"btlan",   "name":"Bui Thi Lan",         "email":"btlan@mycompany.local"}'::jsonb),
       ('{"sub":"pthoa",   "name":"Phan Thi Hoa",        "email":"pthoa@mycompany.local"}'::jsonb),
       ('{"sub":"ltmai",   "name":"Ly Thi Mai",           "email":"ltmai@mycompany.local"}'::jsonb),
       ('{"sub":"mtngoc",  "name":"Mai Thi Ngoc",         "email":"mtngoc@mycompany.local"}'::jsonb),
       ('{"sub":"ttthu",   "name":"Tran Thi Thu",         "email":"ttthu@mycompany.local"}'::jsonb),
       ('{"sub":"dtyen",   "name":"Dinh Thi Yen",         "email":"dtyen@mycompany.local"}'::jsonb),
       ('{"sub":"cvphuc",  "name":"Cao Van Phuc",         "email":"cvphuc@mycompany.local"}'::jsonb),
       ('{"sub":"nvan",    "name":"Nguyen Van An",        "email":"nvan@mycompany.local"}'::jsonb),
       ('{"sub":"tvduc",   "name":"Tran Van Duc",         "email":"tvduc@mycompany.local"}'::jsonb)
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
                            (SELECT arr FROM users_arr)[floor(r_reporter * 20)::int + 1] AS reporter_json,
                            (SELECT arr FROM users_arr)[floor(r_assignee * 20)::int + 1] AS assignee_json,
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
                        reporter_json->>'sub',
                        now(),
                        reporter_json->>'sub'
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
       'Anonymous',
       now(),
       'Anonymous'
FROM ins_ticket t
CROSS JOIN LATERAL (SELECT random() AS r_done_overdue) rd;
