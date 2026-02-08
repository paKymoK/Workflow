package com.takypok.workflowservice.model.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class FilterTicketRequest {
    @Min(0)
    private Long page;
    @Min(1)
    @Max(100)
    private Long size;
}
