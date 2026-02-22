package com.takypok.workflowservice.model.entity;

import com.takypok.workflowservice.model.enums.StatusSla;
import java.time.ZonedDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class SlaStatus {
  private StatusSla response;
  private Boolean isResponseOverdue;
  private ZonedDateTime responseTime;
  private StatusSla resolution;
  private Boolean isResolutionOverdue;
  private ZonedDateTime resolutionTime;

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null) {
      return false;
    }

    if (!(o instanceof SlaStatus obj)) {
      return false;
    }
    return this.response == obj.response
        && this.isResponseOverdue == obj.isResponseOverdue
        && this.resolution == obj.resolution
        && this.isResolutionOverdue == obj.isResolutionOverdue;
  }
}
