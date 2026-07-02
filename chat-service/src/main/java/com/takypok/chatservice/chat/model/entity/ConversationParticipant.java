package com.takypok.chatservice.chat.model.entity;

import com.takypok.chatservice.chat.model.ParticipantRole;
import java.time.ZonedDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Getter
@Setter
@NoArgsConstructor
@Table("conversation_participant")
public class ConversationParticipant {
  @Id private UUID id;

  @Column("conversation_id")
  private UUID conversationId;

  @Column("participant_sub")
  private String participantSub;

  private ParticipantRole role;

  @Column("joined_at")
  private ZonedDateTime joinedAt;

  @Column("last_read_at")
  private ZonedDateTime lastReadAt;
}
