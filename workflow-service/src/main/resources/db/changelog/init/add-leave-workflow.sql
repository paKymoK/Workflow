-- Leave workflow: employee submits, their live org-chart manager approves/rejects
-- (RequesterManagerValidator, resolved from employee_directory.manager_sub). "Rejected" reuses
-- the existing DONE-group status from the Service Request workflow (id 10) since status names
-- are globally unique; a new "Leave Approved" status is needed because Service Request's
-- existing "Approved" (id 8) is mid-flow (TODO group, feeds into "In Progress"), not terminal,
-- which doesn't fit Leave's simpler two-outcome lifecycle. Kept as its own file (appended as a
-- new changelog include) rather than editing init-data.sql, since that file's checksum is
-- already recorded for environments where it has run.

INSERT INTO
    status (id, name, "group", color, "created_at", "created_by", "modified_at", "modified_by")
VALUES (27, 'Pending Manager Approval', 'TODO', '#6554C0', now(), '{"sub":"admin","name":"Admin","email":"admin@gmail.com"}'::jsonb, now(), '{"sub":"admin","name":"Admin","email":"admin@gmail.com"}'::jsonb),
       (28, 'Leave Approved',           'DONE', '#36B37E', now(), '{"sub":"admin","name":"Admin","email":"admin@gmail.com"}'::jsonb, now(), '{"sub":"admin","name":"Admin","email":"admin@gmail.com"}'::jsonb);

INSERT INTO workflow(
     name, statuses, transitions, created_at, created_by, modified_at, modified_by)
VALUES ('Leave', '[
  {
    "id": 27,
    "name": "Pending Manager Approval",
    "color": "#6554C0",
    "group": "TODO"
  },
  {
    "id": 28,
    "name": "Leave Approved",
    "color": "#36B37E",
    "group": "DONE"
  },
  {
    "id": 10,
    "name": "Rejected",
    "color": "#FF5630",
    "group": "DONE"
  }
]', '[
  {
    "from": { "id": 27, "name": "Pending Manager Approval", "color": "#6554C0", "group": "TODO" },
    "to":   { "id": 28, "name": "Leave Approved",            "color": "#36B37E", "group": "DONE" },
    "name": "Approve",
    "validator": [
      "com.takypok.workflowservice.function.validator.RequesterManagerValidator"
    ],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.RecordApprovalFunction",
      "com.takypok.workflowservice.function.postfunction.DecrementLeaveBalanceFunction"
    ]
  },
  {
    "from": { "id": 27, "name": "Pending Manager Approval", "color": "#6554C0", "group": "TODO" },
    "to":   { "id": 10, "name": "Rejected",                  "color": "#FF5630", "group": "DONE" },
    "name": "Reject",
    "validator": [
      "com.takypok.workflowservice.function.validator.RequesterManagerValidator",
      "com.takypok.workflowservice.function.validator.RequireRejectionNoteValidator"
    ],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.RecordRejectionFunction"
    ]
  }
]', now(), '{"sub":"admin","name":"Admin","email":"admin@gmail.com"}'::jsonb, now(), '{"sub":"admin","name":"Admin","email":"admin@gmail.com"}'::jsonb);

INSERT INTO
    project (name, code, "created_at", "created_by", "modified_at", "modified_by")
VALUES ('Human Resources', 'HR', now(), '{"sub":"admin","name":"Admin","email":"admin@gmail.com"}'::jsonb, now(), '{"sub":"admin","name":"Admin","email":"admin@gmail.com"}'::jsonb);

INSERT INTO
    issue_type (name, code, project_id, workflow_id, "created_at", "created_by", "modified_at", "modified_by")
VALUES ('Leave Request', 'LEAVE_REQUEST',
        (SELECT id FROM project WHERE code = 'HR'),
        (SELECT id FROM workflow WHERE name = 'Leave'),
        now(), '{"sub":"admin","name":"Admin","email":"admin@gmail.com"}'::jsonb, now(), '{"sub":"admin","name":"Admin","email":"admin@gmail.com"}'::jsonb);
