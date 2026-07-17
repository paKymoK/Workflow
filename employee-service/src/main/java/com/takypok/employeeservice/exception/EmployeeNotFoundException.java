package com.takypok.employeeservice.exception;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;

public class EmployeeNotFoundException extends ApplicationException {
  public EmployeeNotFoundException(String message) {
    super(Message.Application.ERROR, message);
  }
}
