package com.takypok.employeeservice.model.response;

import com.takypok.employeeservice.model.entity.NewsType;
import java.time.ZonedDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NewsPostResponse {
  private Long id;
  private NewsType type;
  private Boolean pinned;
  private String title;
  private String body;
  private String imageUrl;
  private Boolean isAnonymous;

  /** Null exactly when isAnonymous is true — regardless of who's asking, including the author. */
  private NewsAuthorResponse author;

  /**
   * True when the caller is the real author — lets them manage their own post even if anonymous.
   */
  private Boolean isMine;

  private Long likeCount;
  private Map<String, Long> reactionCounts;
  private String myReaction;
  private Long commentCount;
  private ZonedDateTime createdAt;
}
