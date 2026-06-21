INSERT INTO
    status (id,name, "group", color, "created_at", "created_by", "modified_at", "modified_by")
    VALUES (1,'To Do',           'TODO',       '#808080', now(),'admin', now(), 'admin'),
           (2,'In Progress',     'PROCESSING', '#0052CC', now(),'admin', now(), 'admin'),
           (3,'Pending',         'PROCESSING', '#FF8B00', now(),'admin', now(), 'admin'),
           (4,'Resolved',        'DONE',       '#36B37E', now(),'admin', now(), 'admin'),
           (5,'Closed',          'DONE',       '#008000', now(),'admin', now(), 'admin'),
           -- Service Request statuses
           (6,'Submitted',       'TODO',       '#808080', now(),'admin', now(), 'admin'),
           (7,'Pending Approval','TODO',       '#6554C0', now(),'admin', now(), 'admin'),
           (8,'Approved',        'TODO',       '#00B8D9', now(),'admin', now(), 'admin'),
           (9,'Fulfilled',       'DONE',       '#36B37E', now(),'admin', now(), 'admin'),
           (10,'Rejected',       'DONE',       '#FF5630', now(),'admin', now(), 'admin'),
           -- Problem management statuses
           (11,'Identified',        'TODO',       '#808080', now(),'admin', now(), 'admin'),
           (12,'Investigating',     'PROCESSING', '#0052CC', now(),'admin', now(), 'admin'),
           (13,'Root Cause Found',  'PROCESSING', '#6554C0', now(),'admin', now(), 'admin'),
           (14,'Known Error',       'PROCESSING', '#FF8B00', now(),'admin', now(), 'admin'),
           (15,'Problem Resolved',  'DONE',       '#36B37E', now(),'admin', now(), 'admin'),
           -- Change Request statuses
           (16,'Draft',              'TODO',       '#808080', now(),'admin', now(), 'admin'),
           (17,'Submitted',          'TODO',       '#4C9AFF', now(),'admin', now(), 'admin'),
           (18,'Under Assessment',   'TODO',       '#6554C0', now(),'admin', now(), 'admin'),
           (19,'Pending Approval',   'TODO',       '#FF8B00', now(),'admin', now(), 'admin'),
           (20,'Scheduled',          'TODO',       '#00B8D9', now(),'admin', now(), 'admin'),
           (21,'Implementing',       'PROCESSING', '#0052CC', now(),'admin', now(), 'admin'),
           (22,'Under Review (PIR)', 'PROCESSING', '#6554C0', now(),'admin', now(), 'admin'),
           (23,'CR Closed',          'DONE',       '#008000', now(),'admin', now(), 'admin'),
           (24,'CR Rejected',        'DONE',       '#FF5630', now(),'admin', now(), 'admin'),
           (25,'Failed',             'DONE',       '#FF5630', now(),'admin', now(), 'admin'),
           (26,'Rolled Back',        'DONE',       '#FF8B00', now(),'admin', now(), 'admin');

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

-- Service Request workflow (ITIL).
-- Lifecycle: Submitted -> Pending Approval -> Approved -> In Progress -> (Pending) -> Fulfilled -> Closed (+ Reopen).
-- Rejected is a terminal state from Pending Approval only.
-- SLA semantics on the current TODO/PROCESSING/DONE group model:
--   * TODO       (Submitted, Pending Approval, Approved) : response clock running.
--                Approval wait does NOT eat into resolution SLA — work hasn't started yet.
--   * PROCESSING (In Progress) : entering stamps responseTime (resolution clock starts).
--   * PROCESSING (Pending)     : resolution clock PAUSED via PauseSlaFunction (same as Incident).
--   * DONE       (Fulfilled)   : entering stamps resolutionTime (resolution met).
--   * DONE       (Closed)      : administrative close, no SLA effect.
--   * DONE       (Rejected)    : terminal, no SLA effect. Rejection note posted to media-service
--                                as a highlighted comment via RecordRejectionFunction (best-effort).
-- NOTE: Approval is single-approver for now. Multi-level approval via subtask project is deferred.
-- NOTE: Reopen (Fulfilled -> In Progress) does NOT yet restart the resolution clock.
INSERT INTO workflow(
     name, statuses, transitions, created_at, created_by, modified_at, modified_by)
VALUES ('Service Request', '[
  {
    "id": 6,
    "name": "Submitted",
    "color": "#808080",
    "group": "TODO"
  },
  {
    "id": 7,
    "name": "Pending Approval",
    "color": "#6554C0",
    "group": "TODO"
  },
  {
    "id": 8,
    "name": "Approved",
    "color": "#00B8D9",
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
    "id": 9,
    "name": "Fulfilled",
    "color": "#36B37E",
    "group": "DONE"
  },
  {
    "id": 5,
    "name": "Closed",
    "color": "#008000",
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
    "from": { "id": 6,  "name": "Submitted",       "color": "#808080", "group": "TODO" },
    "to":   { "id": 7,  "name": "Pending Approval", "color": "#6554C0", "group": "TODO" },
    "name": "Submit For Approval",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 7,  "name": "Pending Approval", "color": "#6554C0", "group": "TODO" },
    "to":   { "id": 8,  "name": "Approved",          "color": "#00B8D9", "group": "TODO" },
    "name": "Approve",
    "validator": [],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.RecordApprovalFunction"
    ]
  },
  {
    "from": { "id": 7,  "name": "Pending Approval", "color": "#6554C0", "group": "TODO" },
    "to":   { "id": 10, "name": "Rejected",          "color": "#FF5630", "group": "DONE" },
    "name": "Reject",
    "validator": [
      "com.takypok.workflowservice.function.validator.RequireRejectionNoteValidator"
    ],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.RecordRejectionFunction"
    ]
  },
  {
    "from": { "id": 8,  "name": "Approved",      "color": "#00B8D9", "group": "TODO" },
    "to":   { "id": 2,  "name": "In Progress",   "color": "#0052CC", "group": "PROCESSING" },
    "name": "Start Progress",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 2,  "name": "In Progress",   "color": "#0052CC", "group": "PROCESSING" },
    "to":   { "id": 3,  "name": "Pending",        "color": "#FF8B00", "group": "PROCESSING" },
    "name": "Put On Hold",
    "validator": [
      "com.takypok.workflowservice.function.validator.RequirePendingReasonValidator"
    ],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.PauseSlaFunction"
    ]
  },
  {
    "from": { "id": 3,  "name": "Pending",        "color": "#FF8B00", "group": "PROCESSING" },
    "to":   { "id": 2,  "name": "In Progress",    "color": "#0052CC", "group": "PROCESSING" },
    "name": "Resume",
    "validator": [],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.ResumeSlaFunction"
    ]
  },
  {
    "from": { "id": 2,  "name": "In Progress",    "color": "#0052CC", "group": "PROCESSING" },
    "to":   { "id": 9,  "name": "Fulfilled",       "color": "#36B37E", "group": "DONE" },
    "name": "Fulfill",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 3,  "name": "Pending",         "color": "#FF8B00", "group": "PROCESSING" },
    "to":   { "id": 9,  "name": "Fulfilled",        "color": "#36B37E", "group": "DONE" },
    "name": "Fulfill",
    "validator": [],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.ResumeSlaFunction"
    ]
  },
  {
    "from": { "id": 9,  "name": "Fulfilled",        "color": "#36B37E", "group": "DONE" },
    "to":   { "id": 5,  "name": "Closed",            "color": "#008000", "group": "DONE" },
    "name": "Close",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 9,  "name": "Fulfilled",        "color": "#36B37E", "group": "DONE" },
    "to":   { "id": 2,  "name": "In Progress",      "color": "#0052CC", "group": "PROCESSING" },
    "name": "Reopen",
    "validator": [],
    "postFunctions": []
  }
]', now(), 'admin', now(), 'admin');

-- Problem management workflow (ITIL).
-- Lifecycle: Identified -> Investigating -> Root Cause Found -> Known Error -> Problem Resolved -> Closed.
-- No Reopen: if a resolved problem recurs it becomes a new Problem (ITIL best practice).
-- SLA semantics:
--   * TODO       (Identified)       : response clock running (loose target).
--   * PROCESSING (Investigating)    : entering stamps responseTime.
--   * PROCESSING (Root Cause Found) : RCA complete, resolution still in progress.
--   * PROCESSING (Known Error)      : workaround documented; resolution clock may be
--                                     paused if Pending via PauseSlaFunction (same mechanism).
--   * DONE       (Problem Resolved) : entering stamps resolutionTime.
--   * DONE       (Closed)           : post-PIR administrative close, no SLA effect.
-- Known Error requires a workaroundNote (RequireWorkaroundNoteValidator) and optionally
-- accepts linkedTicketIds + linkedTicketType to record CAUSED_BY/DUPLICATES/RELATED links
-- into ticket.linked_tickets jsonb (RecordKnownErrorFunction).
INSERT INTO workflow(
     name, statuses, transitions, created_at, created_by, modified_at, modified_by)
VALUES ('Problem', '[
  {
    "id": 11,
    "name": "Identified",
    "color": "#808080",
    "group": "TODO"
  },
  {
    "id": 12,
    "name": "Investigating",
    "color": "#0052CC",
    "group": "PROCESSING"
  },
  {
    "id": 13,
    "name": "Root Cause Found",
    "color": "#6554C0",
    "group": "PROCESSING"
  },
  {
    "id": 14,
    "name": "Known Error",
    "color": "#FF8B00",
    "group": "PROCESSING"
  },
  {
    "id": 15,
    "name": "Problem Resolved",
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
    "from": { "id": 11, "name": "Identified",      "color": "#808080", "group": "TODO" },
    "to":   { "id": 12, "name": "Investigating",   "color": "#0052CC", "group": "PROCESSING" },
    "name": "Start Investigation",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 12, "name": "Investigating",   "color": "#0052CC", "group": "PROCESSING" },
    "to":   { "id": 13, "name": "Root Cause Found","color": "#6554C0", "group": "PROCESSING" },
    "name": "Confirm Root Cause",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 13, "name": "Root Cause Found","color": "#6554C0", "group": "PROCESSING" },
    "to":   { "id": 14, "name": "Known Error",     "color": "#FF8B00", "group": "PROCESSING" },
    "name": "Mark As Known Error",
    "validator": [
      "com.takypok.workflowservice.function.validator.RequireWorkaroundNoteValidator"
    ],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.RecordKnownErrorFunction"
    ]
  },
  {
    "from": { "id": 14, "name": "Known Error",     "color": "#FF8B00", "group": "PROCESSING" },
    "to":   { "id": 3,  "name": "Pending",          "color": "#FF8B00", "group": "PROCESSING" },
    "name": "Put On Hold",
    "validator": [
      "com.takypok.workflowservice.function.validator.RequirePendingReasonValidator"
    ],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.PauseSlaFunction"
    ]
  },
  {
    "from": { "id": 3,  "name": "Pending",          "color": "#FF8B00", "group": "PROCESSING" },
    "to":   { "id": 14, "name": "Known Error",       "color": "#FF8B00", "group": "PROCESSING" },
    "name": "Resume",
    "validator": [],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.ResumeSlaFunction"
    ]
  },
  {
    "from": { "id": 14, "name": "Known Error",      "color": "#FF8B00", "group": "PROCESSING" },
    "to":   { "id": 15, "name": "Problem Resolved", "color": "#36B37E", "group": "DONE" },
    "name": "Resolve",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 13, "name": "Root Cause Found", "color": "#6554C0", "group": "PROCESSING" },
    "to":   { "id": 15, "name": "Problem Resolved", "color": "#36B37E", "group": "DONE" },
    "name": "Resolve",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 15, "name": "Problem Resolved", "color": "#36B37E", "group": "DONE" },
    "to":   { "id": 5,  "name": "Closed",            "color": "#008000", "group": "DONE" },
    "name": "Close",
    "validator": [],
    "postFunctions": []
  }
]', now(), 'admin', now(), 'admin');

-- Change Request workflow (ITIL).
-- Lifecycle: Draft -> Submitted -> Under Assessment -> Pending Approval -> Scheduled
--            -> Implementing -> Under Review (PIR) -> CR Closed
-- Rejection branches: Under Assessment -> Draft (revise) | CR Rejected (terminal hard reject)
-- Terminal failure branches: Failed | Rolled Back (both DONE, no reopen — new ticket required)
-- SLA semantics:
--   * TODO       (Draft .. Scheduled)  : response clock running.
--                All pre-Implementing stages are management/approval work outside the
--                support team's control, so SLA tracks only as a push mechanism.
--   * PROCESSING (Implementing)        : entering stamps responseTime (team now in control).
--   * PROCESSING (Under Review / PIR)  : resolution clock still running.
--   * DONE       (CR Closed)           : entering stamps resolutionTime.
--   * DONE       (CR Rejected / Failed / Rolled Back) : terminal, no SLA effect.
-- No Pause/Resume transitions: Change Request is schedule-driven, not on-hold driven.
-- Approval is single-approver (same as Service Request); multi-level deferred.
INSERT INTO workflow(
     name, statuses, transitions, created_at, created_by, modified_at, modified_by)
VALUES ('Change Request', '[
  {
    "id": 16,
    "name": "Draft",
    "color": "#808080",
    "group": "TODO"
  },
  {
    "id": 17,
    "name": "Submitted",
    "color": "#4C9AFF",
    "group": "TODO"
  },
  {
    "id": 18,
    "name": "Under Assessment",
    "color": "#6554C0",
    "group": "TODO"
  },
  {
    "id": 19,
    "name": "Pending Approval",
    "color": "#FF8B00",
    "group": "TODO"
  },
  {
    "id": 20,
    "name": "Scheduled",
    "color": "#00B8D9",
    "group": "TODO"
  },
  {
    "id": 21,
    "name": "Implementing",
    "color": "#0052CC",
    "group": "PROCESSING"
  },
  {
    "id": 22,
    "name": "Under Review (PIR)",
    "color": "#6554C0",
    "group": "PROCESSING"
  },
  {
    "id": 23,
    "name": "CR Closed",
    "color": "#008000",
    "group": "DONE"
  },
  {
    "id": 24,
    "name": "CR Rejected",
    "color": "#FF5630",
    "group": "DONE"
  },
  {
    "id": 25,
    "name": "Failed",
    "color": "#FF5630",
    "group": "DONE"
  },
  {
    "id": 26,
    "name": "Rolled Back",
    "color": "#FF8B00",
    "group": "DONE"
  }
]', '[
  {
    "from": { "id": 16, "name": "Draft",             "color": "#808080", "group": "TODO" },
    "to":   { "id": 17, "name": "Submitted",          "color": "#4C9AFF", "group": "TODO" },
    "name": "Submit",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 17, "name": "Submitted",          "color": "#4C9AFF", "group": "TODO" },
    "to":   { "id": 18, "name": "Under Assessment",   "color": "#6554C0", "group": "TODO" },
    "name": "Start Assessment",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 18, "name": "Under Assessment",   "color": "#6554C0", "group": "TODO" },
    "to":   { "id": 16, "name": "Draft",               "color": "#808080", "group": "TODO" },
    "name": "Send Back to Draft",
    "validator": [
      "com.takypok.workflowservice.function.validator.RequireRejectionNoteValidator"
    ],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.RecordRejectionFunction"
    ]
  },
  {
    "from": { "id": 18, "name": "Under Assessment",   "color": "#6554C0", "group": "TODO" },
    "to":   { "id": 24, "name": "CR Rejected",         "color": "#FF5630", "group": "DONE" },
    "name": "Reject",
    "validator": [
      "com.takypok.workflowservice.function.validator.RequireRejectionNoteValidator"
    ],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.RecordRejectionFunction"
    ]
  },
  {
    "from": { "id": 18, "name": "Under Assessment",   "color": "#6554C0", "group": "TODO" },
    "to":   { "id": 19, "name": "Pending Approval",   "color": "#FF8B00", "group": "TODO" },
    "name": "Approve",
    "validator": [],
    "postFunctions": [
      "com.takypok.workflowservice.function.postfunction.RecordApprovalFunction"
    ]
  },
  {
    "from": { "id": 19, "name": "Pending Approval",   "color": "#FF8B00", "group": "TODO" },
    "to":   { "id": 20, "name": "Scheduled",           "color": "#00B8D9", "group": "TODO" },
    "name": "Schedule",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 20, "name": "Scheduled",           "color": "#00B8D9", "group": "TODO" },
    "to":   { "id": 21, "name": "Implementing",        "color": "#0052CC", "group": "PROCESSING" },
    "name": "Start Implementation",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 21, "name": "Implementing",        "color": "#0052CC", "group": "PROCESSING" },
    "to":   { "id": 25, "name": "Failed",               "color": "#FF5630", "group": "DONE" },
    "name": "Mark Failed",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 21, "name": "Implementing",        "color": "#0052CC", "group": "PROCESSING" },
    "to":   { "id": 26, "name": "Rolled Back",          "color": "#FF8B00", "group": "DONE" },
    "name": "Rollback",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 21, "name": "Implementing",        "color": "#0052CC", "group": "PROCESSING" },
    "to":   { "id": 22, "name": "Under Review (PIR)",  "color": "#6554C0", "group": "PROCESSING" },
    "name": "Complete Implementation",
    "validator": [],
    "postFunctions": []
  },
  {
    "from": { "id": 22, "name": "Under Review (PIR)",  "color": "#6554C0", "group": "PROCESSING" },
    "to":   { "id": 23, "name": "CR Closed",            "color": "#008000", "group": "DONE" },
    "name": "Close",
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
       ('Service Request', 'SERVICE_REQUEST',  1, 2, now(), 'admin', now(), 'admin'),
       ('Problem',         'PROBLEM',          1, 3, now(), 'admin', now(), 'admin'),
       ('Change Request',  'CHANGE_REQUEST',   1, 4, now(), 'admin', now(), 'admin');
