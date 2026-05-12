package com.takypok.mediaservice.model.entity;

import com.takypok.core.model.authentication.User;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;

@Getter
@Setter
@NoArgsConstructor
public class Comment {
  @Id private UUID id;
  private Long ticketId;
  private User commenter;
  private String content;

  @Column("mentioned_subs")
  private String[] mentionedSubs;
}
