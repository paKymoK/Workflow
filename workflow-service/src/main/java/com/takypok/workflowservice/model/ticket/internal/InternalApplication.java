package com.takypok.workflowservice.model.ticket.internal;

import lombok.*;

import java.time.ZonedDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public abstract class InternalApplication {
    private String department;
    private String region;
    private String location;
    private String phoneNumber;

    private String description;
    private String attachment;
    private String relatedLink;
    private String label;
    private ZonedDateTime committedDate;
    private String involvedUser;
}
