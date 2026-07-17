package com.takypok.employeeservice.exception;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;

public class InvalidManagerException extends ApplicationException {
  public InvalidManagerException(String message) {
    super(Message.Application.ERROR, message);
  }
}
