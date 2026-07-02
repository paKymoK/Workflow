package com.takypok.chatservice.chat.model.event;

public record ChatEvent(ChatEventType type, Object payload) {
  public enum ChatEventType {
    MESSAGE_CREATED,
    PARTICIPANT_ADDED,
    PARTICIPANT_REMOVED,
    CONVERSATION_RENAMED
  }
}
