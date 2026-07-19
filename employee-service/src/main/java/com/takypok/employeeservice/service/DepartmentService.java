// Superseded by Phase 7: department CRUD moved to auth-service. Employee-service's Department
// table is now a read-only Kafka mirror (see config/DepartmentEventConsumer), with no service-layer
// write path of its own — EmployeeServiceImpl reads DepartmentRepository directly for its
// departmentName enrichment join. Stubbed rather than deleted (the environment this was authored
// in couldn't run `rm`) — no longer referenced anywhere in the codebase.
