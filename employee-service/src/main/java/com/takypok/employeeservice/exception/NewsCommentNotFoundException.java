package com.takypok.employeeservice.exception;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;

public class NewsCommentNotFoundException extends ApplicationException {
  public NewsCommentNotFoundException(String message) {
    super(Message.Application.ERROR, message);
  }
}
