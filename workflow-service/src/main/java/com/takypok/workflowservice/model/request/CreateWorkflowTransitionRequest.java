package com.takypok.workflowservice.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Objects;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class CreateWorkflowTransitionRequest {
  @NotBlank private String name;
  @NotNull private Long from;
  @NotNull private Long to;
  @NotNull private List<String> validator;
  @NotNull private List<String> postFunctions;

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    CreateWorkflowTransitionRequest request = (CreateWorkflowTransitionRequest) o;
    return Objects.equals(name, request.name)
        && Objects.equals(from, request.from)
        && Objects.equals(to, request.to);
  }

  @Override
  public int hashCode() {
    return Objects.hash(name, from, to);
  }
}
