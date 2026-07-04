package com.takypok.chatservice.model.response;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.takypok.chatservice.model.entity.Message;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

// @JsonUnwrapped keeps the wire shape flat (id/content/... alongside reactions) instead of
// nesting the message under a "message" key, so the frontend's existing ChatMessage shape only
// needs one new field added, not a restructure.
@Getter
@AllArgsConstructor
public class MessageResponse {
  @JsonUnwrapped private Message message;
  private List<ReactionSummary> reactions;
}
