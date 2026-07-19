package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.Shift;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

/**
 * name/email are no longer accepted here (Phase 7) — they're auth-service-owned data now, updated
 * via {@code PATCH /auth-service/v1/users/{sub}/profile} and flowed in through
 * AccountEventConsumer.
 */
@Getter
@Setter
public class UpdateEmployeeRequest {
  private String avatarUrl;
  private String title;
  private Long departmentId;
  private Long unitId;
  private String workLocation;
  private LocalDate joinedDate;
  private Shift shift;
  private String shiftHours;
}
