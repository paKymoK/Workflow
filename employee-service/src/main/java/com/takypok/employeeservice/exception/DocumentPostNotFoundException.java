package com.takypok.employeeservice.exception;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;

public class DocumentPostNotFoundException extends ApplicationException {
  public DocumentPostNotFoundException(String message) {
    super(Message.Application.ERROR, message);
  }
}
