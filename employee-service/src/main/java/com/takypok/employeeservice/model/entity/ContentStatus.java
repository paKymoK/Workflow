package com.takypok.employeeservice.model.entity;

/** Shared by news_post and news_comment — soft-delete only, no hard delete. */
public enum ContentStatus {
  PUBLISHED,
  DELETED
}
