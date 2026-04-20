package com.takypok.shopservice.exception;

public class CheckoutBusyException extends RuntimeException {
  public CheckoutBusyException(String message) {
    super(message);
  }
}
