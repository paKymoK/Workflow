package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.IdEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TrainingMaterial extends IdEntity {
  private String category;
  private String title;
  private TrainingFormat format;
  private String videoId;
  private String duration;
  private String fileUrl;
  private String fileName;
  private Long fileSize;
  private TrainingStatus status;
}
