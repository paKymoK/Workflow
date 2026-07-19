package com.takypok.employeeservice.model.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NewsAuthorResponse {
  private String sub;
  private String name;
  private String title;
  private String avatarUrl;
}
