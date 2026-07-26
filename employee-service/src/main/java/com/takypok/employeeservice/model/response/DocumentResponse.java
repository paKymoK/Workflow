package com.takypok.employeeservice.model.response;

import com.takypok.employeeservice.model.entity.DocumentStatus;
import java.time.ZonedDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
  private Long id;
  private String category;
  private String title;
  private String version;
  private String content;
  private String fileUrl;
  private String fileName;
  private Long fileSize;
  private DocumentStatus status;
  private Boolean acknowledgedByMe;
  private Long acknowledgedCount;
  private Long totalActiveEmployees;
  private ZonedDateTime createdAt;
  private ZonedDateTime modifiedAt;
}
