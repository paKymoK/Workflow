package com.takypok.chatservice.model.response;

import com.takypok.chatservice.model.ConversationType;
import com.takypok.chatservice.model.entity.Message;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConversationSummaryResponse {
  private UUID id;
  private ConversationType type;
  private String name;
  private List<String> participantSubs;
  private Message lastMessage;
  private long unreadCount;
}
