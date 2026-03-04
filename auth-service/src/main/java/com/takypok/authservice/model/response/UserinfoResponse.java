package com.takypok.authservice.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserinfoResponse {
  private String sub;
  private String name;
  private String email;
  private String title;
  private String department;
}
