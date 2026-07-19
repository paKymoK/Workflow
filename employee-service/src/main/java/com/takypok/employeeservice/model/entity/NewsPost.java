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
public class NewsPost extends IdEntity {
  private String authorSub;
  private Boolean isAnonymous = false;
  private NewsType type;
  private Boolean pinned = false;
  private String title;
  private String body;
  private String imageUrl;
  private ContentStatus status = ContentStatus.PUBLISHED;
}
