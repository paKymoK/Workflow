// Superseded by Phase 7: department/unit CRUD moved to auth-service
// (GET/POST/PUT/DELETE /auth-service/v1/departments). employee-service keeps a read-only,
// Kafka-fed mirror of the Department table (see config/DepartmentEventConsumer) but no longer
// exposes it via its own endpoints. Stubbed rather than deleted (the environment this was
// authored in couldn't run `rm`) — no longer referenced anywhere in the codebase.
