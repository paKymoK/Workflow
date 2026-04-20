package com.takypok.shopservice.exception;

import com.takypok.core.model.Message;
import com.takypok.core.model.ResultMessage;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "com.takypok.shopservice")
public class ShopAdviceController {

  @ExceptionHandler(CheckoutBusyException.class)
  @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
  public ResultMessage<?> handleCheckoutBusyException(CheckoutBusyException ex) {
    return ResultMessage.error(Message.get(Message.Application.ERROR, ex.getMessage()));
  }

  @ExceptionHandler(InsufficientStockException.class)
  @ResponseStatus(HttpStatus.CONFLICT)
  public ResultMessage<?> handleInsufficientStockException(InsufficientStockException ex) {
    return ResultMessage.error(Message.get(Message.Application.ERROR, ex.getMessage()));
  }
}
