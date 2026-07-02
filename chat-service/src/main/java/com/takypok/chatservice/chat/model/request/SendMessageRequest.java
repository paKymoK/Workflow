package com.takypok.chatservice.chat.model.request;

import com.takypok.chatservice.chat.model.Attachment;
import com.takypok.chatservice.chat.model.MessageType;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SendMessageRequest {
  private String content;
  private MessageType messageType = MessageType.TEXT;
  private List<Attachment> attachments;
}
