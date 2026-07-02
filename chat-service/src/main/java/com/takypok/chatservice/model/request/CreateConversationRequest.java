package com.takypok.chatservice.model.request;

import com.takypok.chatservice.model.ConversationType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateConversationRequest {
  @NotNull private ConversationType type;

  private String name; // required for GROUP, ignored for DIRECT

  @NotEmpty private List<String> participantSubs; // other participants, excluding the caller
}
