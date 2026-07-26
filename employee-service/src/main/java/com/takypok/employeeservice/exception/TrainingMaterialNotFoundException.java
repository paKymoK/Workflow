package com.takypok.employeeservice.exception;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;

public class TrainingMaterialNotFoundException extends ApplicationException {
  public TrainingMaterialNotFoundException(String message) {
    super(Message.Application.ERROR, message);
  }
}
