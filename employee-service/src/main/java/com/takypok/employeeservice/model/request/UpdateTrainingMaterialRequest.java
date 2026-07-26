package com.takypok.employeeservice.model.request;

import com.takypok.employeeservice.model.entity.TrainingFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateTrainingMaterialRequest {
  @NotBlank private String category;
  @NotBlank private String title;
  @NotNull private TrainingFormat format;
  private String videoId;
  private String duration;
  private String fileUrl;
  private String fileName;
  private Long fileSize;
}
