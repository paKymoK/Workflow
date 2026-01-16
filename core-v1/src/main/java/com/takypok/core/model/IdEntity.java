package com.takypok.core.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;

@Getter
@Setter
public class IdEntity extends BaseEntity {
  @Id private Long id;
}
