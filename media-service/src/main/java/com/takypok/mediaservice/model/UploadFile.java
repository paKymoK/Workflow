package com.takypok.mediaservice.model;

import com.takypok.core.model.BaseEntity;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;

@Getter
@Setter
@NoArgsConstructor
public class UploadFile extends BaseEntity {

  public UploadFile(String name) {
    this.name = name;
  }

  @Id private UUID id;
  private String name;
}
