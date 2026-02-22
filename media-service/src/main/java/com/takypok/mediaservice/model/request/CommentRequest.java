package com.takypok.mediaservice.model.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CommentRequest {
  private Long ticketId;
  private String user;
  private String content;
}
