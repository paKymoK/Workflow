package com.takypok.employeeservice.model.response;

import java.time.ZonedDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NewsCommentResponse {
  private Long id;
  private Long postId;
  private NewsAuthorResponse commenter;
  private String content;
  private Boolean isEdited;
  private Long likeCount;
  private Boolean likedByMe;
  private Boolean isMine;
  private ZonedDateTime createdAt;
}
