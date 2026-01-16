package com.takypok.core.config;

import static com.takypok.core.util.LogUtil.getExceptionMessageChain;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.ResultMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.MethodNotAllowedException;
import org.springframework.web.server.MissingRequestValueException;

@Slf4j
@RestControllerAdvice
public class AdviceController {
  @ExceptionHandler(ApplicationException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ResultMessage<?> handleApplicationException(ApplicationException ex) {
    log.error("Exception: {}", getExceptionMessageChain(ex));
    return ResultMessage.error(
        Message.get(
            Message.Application.REASON_ERROR,
            Message.get(ex.getApplication(), ex.getArgs()).message()));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ResultMessage<?> handleDuplicateKeyException(DataIntegrityViolationException ex) {
    log.error("Exception: {}", getExceptionMessageChain(ex));
    return ResultMessage.error(
        Message.get(Message.Application.REASON_ERROR, ex.getRootCause().getMessage()));
  }

  @ExceptionHandler(DuplicateKeyException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ResultMessage<?> handleDuplicateKeyException(DuplicateKeyException ex) {
    log.error("Exception: {}", getExceptionMessageChain(ex));
    return ResultMessage.error(
        Message.get(Message.Application.REASON_ERROR, ex.getRootCause().getMessage()));
  }

  @ExceptionHandler(MethodNotAllowedException.class)
  @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
  public ResultMessage<?> handleMethodNotAllowedException(MethodNotAllowedException ex) {
    log.error("Exception: {}", getExceptionMessageChain(ex));
    return ResultMessage.error(Message.get(Message.Application.REASON_ERROR, ex.getReason()));
  }

  @ExceptionHandler(MissingRequestValueException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ResultMessage<?> handleMissingRequestValueException(MissingRequestValueException ex) {
    log.error("Exception: {}", getExceptionMessageChain(ex));
    return ResultMessage.error(Message.get(Message.Application.REASON_ERROR, ex.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ResultMessage<?> handleException(Exception ex) {
    ex.printStackTrace();
    log.error("Exception: {}", getExceptionMessageChain(ex));
    return ResultMessage.error(Message.get(Message.Application.UNKNOWN_ERROR));
  }
}
