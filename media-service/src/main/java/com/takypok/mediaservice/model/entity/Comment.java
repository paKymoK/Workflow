package com.takypok.mediaservice.model.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.takypok.core.model.BaseEntity;
import com.takypok.core.model.authentication.User;
import java.time.ZonedDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;

@Getter
@Setter
@NoArgsConstructor
public class Comment extends BaseEntity {
  @Id private UUID id;
  private Long ticketId;
  private User commenter;
  private String content;
  private Boolean isEdited = false;

  @Column("mentioned_subs")
  private String[] mentionedSubs;

  @Override
  @JsonProperty("modifiedAt")
  public ZonedDateTime getModifiedAt() {
    return super.getModifiedAt();
  }
}
