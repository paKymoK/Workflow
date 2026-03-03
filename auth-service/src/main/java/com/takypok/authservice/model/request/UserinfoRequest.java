package com.takypok.authservice.model.request;

import com.takypok.authservice.model.entity.Userinfo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserinfoRequest {
  @NotBlank private String username;
  @NotBlank private String password;
  @NotNull private Userinfo userinfo;
}
