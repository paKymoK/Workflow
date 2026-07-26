package com.takypok.employeeservice.model.response;

import com.takypok.employeeservice.model.entity.TrainingFormat;
import com.takypok.employeeservice.model.entity.TrainingStatus;
import java.time.ZonedDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TrainingMaterialResponse {
  private Long id;
  private String category;
  private String title;
  private TrainingFormat format;
  private String videoId;
  private String duration;
  private String fileUrl;
  private String fileName;
  private Long fileSize;
  private TrainingStatus status;
  private Boolean completedByMe;
  private Long completedCount;
  private Long totalActiveEmployees;
  private ZonedDateTime createdAt;
  private ZonedDateTime modifiedAt;
}
