package com.takypok.employeeservice.model.entity;

public enum EmploymentStatus {
  // Account confirmed by auth-service, but HR hasn't filled in the profile yet.
  PENDING,
  ACTIVE,
  ON_LEAVE,
  SUSPENDED,
  TERMINATED
}
