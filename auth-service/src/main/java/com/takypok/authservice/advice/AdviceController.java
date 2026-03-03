package com.takypok.authservice.advice;

import com.takypok.core.model.Message;
import com.takypok.core.model.ResultMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@Component
@ControllerAdvice
@Slf4j
public class AdviceController {

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ResultMessage<String>> handleResourceNotFoundException(Exception ex) {
    log.error("Undefined Error: ", ex);
    return new ResponseEntity<>(
        ResultMessage.error(Message.get(Message.Application.UNKNOWN_ERROR), ex.getMessage()),
        HttpStatus.FORBIDDEN);
  }
}
