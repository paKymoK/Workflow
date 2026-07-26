package com.takypok.employeeservice.model.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateDocumentRequest {
  @NotBlank private String category;
  @NotBlank private String title;
  private String version;
  private String content;
  private String fileUrl;
  private String fileName;
  private Long fileSize;
}
