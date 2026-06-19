INSERT INTO
    status (id,name, "group", color, "created_at", "created_by", "modified_at", "modified_by")
    VALUES (1,'New', 'TODO', '#808080', now(),'admin', now(), 'admin'),
           (2,'Assigned', 'TODO', '#6554C0', now(),'admin', now(), 'admin'),
           (3,'In Progress', 'PROCESSING', '#0052CC', now(),'admin', now(), 'admin'),
           (4,'Pending', 'PROCESSING', '#FF8B00', now(),'admin', now(), 'admin'),
           (5,'Resolved', 'DONE', '#36B37E', now(),'admin', now(), 'admin'),
           (6,'Closed', 'DONE', '#008000', now(),'admin', now(), 'admin');

INSERT INTO
    priority (name, response_time, resolution_time, "created_at", "created_by", "modified_at", "modified_by")
VALUES ('Low', 1, 30, now(),'admin', now(), 'admin'),
       ('Medium', 1, 12, now(),'admin', now(), 'admin'),
       ('High', 1, 4, now(),'admin', now(), 'admin');

-- Incident management workflow (ITIL).
-- Lifecycle: New -> Assigned -> In Progress -> (Pending) -> Resolved -> Closed (+ Reopen).
-- SLA semantics on the current TODO/PROCESSING/DONE group model:
--   * TODO    (New, Assigned)     : response clock running.
--   * PROCESSING (In Progress)    : entering stamps responseTime (response met).
--   * PROCESSING (Pending)        : resolution clock PAUSED via Pause/ResumeSlaFunction
--                                   post-functions (reuses sla.paused_time); group stays
--                                   PROCESSING so no group trigger fires.
--   * DONE   (Resolved)           : entering stamps resolutionTime (resolution met).
--   * DONE   (Closed)             : administrative close, no SLA effect (trigger only
--                                   fires on PROCESSING->DONE).
-- NOTE: Reopen (Resolved -> In Progress) does NOT yet restart the resolution clock; the
--   sla.status 'resolution' flag stays DONE. Full reopen-SLA semantics (fresh/delta timer,
--   reopen count, auto-close) are deferred to the SLA-flag redesign.
INSERT INTO workflow(
     name, statuses, transitions, created_at, created_by, modified_at, modified_by)
VALUES ('Incident', '[
  {
    "id": 1,
    "name": "New",
    "color": "#808080",
    "group": "TODO"
  },
  {
    "id": 2,
    "name": "Assigned",
    "color": "#6554C0",
    "group": "TODO"
  },
  {
    "id": 3,
    "name": "In Progress",
    "color": "#0052CC",
    "group": "PROCESSING"
  },
  {
    "id": 4,
    "name": "Pending",
    "color": "#FF8B00",
    "group": "PROCESSING"
  },
  {
    "id": 5,
    "name": "Resolved",
    "color": "#36B37E",
    "group": "DONE"
  },
  {
    "id": 6,
    "name": "Closed",
    "color": "#008000",
    "group": "DONE"
  }
]', '[
  {
    "from": { "id": 1, "name": "New", "color": "#808080", "group": "TODO" },
    "to":   { "id": 2, "name": "Assigned", "color": "#6554C0", "group": "TODO" },
    "name": "Assign",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 2, "name": "Assigned", "color": "#6554C0", "group": "TODO" },
    "to":   { "id": 3, "name": "In Progress", "color": "#0052CC", "group": "PROCESSING" },
    "name": "Start Progress",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 3, "name": "In Progress", "color": "#0052CC", "group": "PROCESSING" },
    "to":   { "id": 4, "name": "Pending", "color": "#FF8B00", "group": "PROCESSING" },
    "name": "Put On Hold",
    "validator": [],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.PauseSlaFunction"
    ]
  },
  {
    "from": { "id": 4, "name": "Pending", "color": "#FF8B00", "group": "PROCESSING" },
    "to":   { "id": 3, "name": "In Progress", "color": "#0052CC", "group": "PROCESSING" },
    "name": "Resume",
    "validator": [],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.ResumeSlaFunction"
    ]
  },
  {
    "from": { "id": 3, "name": "In Progress", "color": "#0052CC", "group": "PROCESSING" },
    "to":   { "id": 5, "name": "Resolved", "color": "#36B37E", "group": "DONE" },
    "name": "Resolve",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 4, "name": "Pending", "color": "#FF8B00", "group": "PROCESSING" },
    "to":   { "id": 5, "name": "Resolved", "color": "#36B37E", "group": "DONE" },
    "name": "Resolve",
    "validator": [],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.ResumeSlaFunction"
    ]
  },
  {
    "from": { "id": 5, "name": "Resolved", "color": "#36B37E", "group": "DONE" },
    "to":   { "id": 6, "name": "Closed", "color": "#008000", "group": "DONE" },
    "name": "Close",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 5, "name": "Resolved", "color": "#36B37E", "group": "DONE" },
    "to":   { "id": 3, "name": "In Progress", "color": "#0052CC", "group": "PROCESSING" },
    "name": "Reopen",
    "validator": [],
    "postFunctions": []
  }
]', now(), 'admin', now(), 'admin');

INSERT INTO
    project ( name, code, workflow_id, "created_at", "created_by", "modified_at", "modified_by")
VALUES ('Internal Application', 'IA', 1, now(), 'admin', now(), 'admin');

INSERT INTO
    issue_type (name, code, project_id, "created_at", "created_by", "modified_at", "modified_by")
VALUES ('Problem', 'PROBLEM', 1 , now(),'admin', now(), 'admin'),
       ('Change Request', 'CHANGE_REQUEST', 1 , now(),'admin', now(), 'admin'),
       ('Complain', 'COMPLAIN', 1 , now(),'admin', now(), 'admin');
