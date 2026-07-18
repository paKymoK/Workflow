-- Read-only local read-model of employee-service's General record, fed by consuming
-- the employee.events Kafka topic. Backs @mention search (MentionController) and
-- assignee resolution (ApplicationAssigneeResolver, TicketServiceImpl.updateAssignee)
-- without a live network call to employee-service on every request. No write path
-- back to employee-service.
CREATE TABLE IF NOT EXISTS employee_directory
(
    sub         varchar(200) NOT NULL,
    name        varchar(200),
    email       varchar(200),
    title       varchar(200),
    department  varchar(200),
    avatar_url  varchar(500),
    manager_sub varchar(200),
    PRIMARY KEY (sub)
);

CREATE INDEX IF NOT EXISTS idx_employee_directory_name ON employee_directory (name);
