INSERT INTO
    status (id,name, "group", color, "created_at", "created_by", "modified_at", "modified_by")
    VALUES (1,'To Do',       'TODO',       '#808080', now(),'admin', now(), 'admin'),
           (2,'In Progress', 'PROCESSING', '#0052CC', now(),'admin', now(), 'admin'),
           (3,'Pending',     'PROCESSING', '#FF8B00', now(),'admin', now(), 'admin'),
           (4,'Resolved',    'DONE',       '#36B37E', now(),'admin', now(), 'admin'),
           (5,'Closed',      'DONE',       '#008000', now(),'admin', now(), 'admin');

INSERT INTO
    priority (name, response_time, resolution_time, "created_at", "created_by", "modified_at", "modified_by")
VALUES ('Low', 1, 30, now(),'admin', now(), 'admin'),
       ('Medium', 1, 12, now(),'admin', now(), 'admin'),
       ('High', 1, 4, now(),'admin', now(), 'admin');

-- Incident management workflow (ITIL).
-- Lifecycle: To Do -> In Progress -> (Pending) -> Resolved -> Closed (+ Reopen).
-- Auto-assignment on ticket creation is handled via @InternalApplicationAnnotation(assignee=...)
-- so the "Assign" manual step is no longer needed as a separate state.
-- SLA semantics on the current TODO/PROCESSING/DONE group model:
--   * TODO       (To Do)       : response clock running.
--   * PROCESSING (In Progress) : entering stamps responseTime (response met).
--   * PROCESSING (Pending)     : resolution clock PAUSED via Pause/ResumeSlaFunction
--                                post-functions (reuses sla.paused_time); group stays
--                                PROCESSING so no group trigger fires.
--   * DONE       (Resolved)    : entering stamps resolutionTime (resolution met).
--   * DONE       (Closed)      : administrative close, no SLA effect.
-- NOTE: Reopen (Resolved -> In Progress) does NOT yet restart the resolution clock.
--   Full reopen-SLA semantics are deferred to the SLA-flag redesign.
INSERT INTO workflow(
     name, statuses, transitions, created_at, created_by, modified_at, modified_by)
VALUES ('Incident', '[
  {
    "id": 1,
    "name": "To Do",
    "color": "#808080",
    "group": "TODO"
  },
  {
    "id": 2,
    "name": "In Progress",
    "color": "#0052CC",
    "group": "PROCESSING"
  },
  {
    "id": 3,
    "name": "Pending",
    "color": "#FF8B00",
    "group": "PROCESSING"
  },
  {
    "id": 4,
    "name": "Resolved",
    "color": "#36B37E",
    "group": "DONE"
  },
  {
    "id": 5,
    "name": "Closed",
    "color": "#008000",
    "group": "DONE"
  }
]', '[
  {
    "from": { "id": 1, "name": "To Do",       "color": "#808080", "group": "TODO" },
    "to":   { "id": 2, "name": "In Progress", "color": "#0052CC", "group": "PROCESSING" },
    "name": "Start Progress",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 2, "name": "In Progress", "color": "#0052CC", "group": "PROCESSING" },
    "to":   { "id": 3, "name": "Pending",     "color": "#FF8B00", "group": "PROCESSING" },
    "name": "Put On Hold",
    "validator": [
      "com.takypok.workflowservice.function.validator.RequirePendingReasonValidator"
    ],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.PauseSlaFunction"
    ]
  },
  {
    "from": { "id": 3, "name": "Pending",     "color": "#FF8B00", "group": "PROCESSING" },
    "to":   { "id": 2, "name": "In Progress", "color": "#0052CC", "group": "PROCESSING" },
    "name": "Resume",
    "validator": [],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.ResumeSlaFunction"
    ]
  },
  {
    "from": { "id": 2, "name": "In Progress", "color": "#0052CC", "group": "PROCESSING" },
    "to":   { "id": 4, "name": "Resolved",    "color": "#36B37E", "group": "DONE" },
    "name": "Resolve",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 3, "name": "Pending",     "color": "#FF8B00", "group": "PROCESSING" },
    "to":   { "id": 4, "name": "Resolved",    "color": "#36B37E", "group": "DONE" },
    "name": "Resolve",
    "validator": [],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.ResumeSlaFunction"
    ]
  },
  {
    "from": { "id": 4, "name": "Resolved",    "color": "#36B37E", "group": "DONE" },
    "to":   { "id": 5, "name": "Closed",      "color": "#008000", "group": "DONE" },
    "name": "Close",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 4, "name": "Resolved",    "color": "#36B37E", "group": "DONE" },
    "to":   { "id": 2, "name": "In Progress", "color": "#0052CC", "group": "PROCESSING" },
    "name": "Reopen",
    "validator": [],
    "postFunctions": []
  }
]', now(), 'admin', now(), 'admin');

INSERT INTO
    project (name, code, "created_at", "created_by", "modified_at", "modified_by")
VALUES ('Internal Application', 'IA', now(), 'admin', now(), 'admin');

INSERT INTO
    issue_type (name, code, project_id, workflow_id, "created_at", "created_by", "modified_at", "modified_by")
VALUES ('Incident',        'INCIDENT',        1, 1, now(), 'admin', now(), 'admin'),
       ('Service Request', 'SERVICE_REQUEST',  1, 1, now(), 'admin', now(), 'admin'),
       ('Problem',         'PROBLEM',          1, 1, now(), 'admin', now(), 'admin'),
       ('Change Request',  'CHANGE_REQUEST',   1, 1, now(), 'admin', now(), 'admin');
