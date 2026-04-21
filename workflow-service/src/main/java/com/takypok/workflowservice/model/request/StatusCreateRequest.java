package com.takypok.workflowservice.model.request;

import com.takypok.workflowservice.model.entity.custom.GroupStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class StatusCreateRequest {
  @NotNull private String name;
  @NotNull private String color;
  @NotNull private GroupStatus group;
}
