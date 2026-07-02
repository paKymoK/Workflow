package com.takypok.chatservice.chat.model.entity;

import com.takypok.chatservice.chat.model.ConversationType;
import com.takypok.core.model.BaseEntity;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Getter
@Setter
@NoArgsConstructor
@Table("conversation")
public class Conversation extends BaseEntity {
  @Id private UUID id;
  private ConversationType type;
  private String name; // meaningful for GROUP only, null for DIRECT
}
