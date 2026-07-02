package com.takypok.chatservice.chat.model.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RenameConversationRequest {
  @NotBlank private String name;
}
