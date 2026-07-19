package com.takypok.employeeservice.model.entity;

import com.takypok.core.model.IdEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One reaction per person per post — re-reacting with the same emoji un-toggles it. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NewsReaction extends IdEntity {
  private Long postId;
  private String participantSub;
  private String emoji;
}
