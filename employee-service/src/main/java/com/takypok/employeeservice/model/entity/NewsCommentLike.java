package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.IdEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A binary like on a comment — no emoji choice, unlike post reactions. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NewsCommentLike extends IdEntity {
  private Long commentId;
  private String participantSub;
}
