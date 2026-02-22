package com.takypok.mediaservice.model.entity;

import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;

@Getter
@Setter
@NoArgsConstructor
public class Comment {
  @Id private UUID id;
  private String name;
  private String path;
}
