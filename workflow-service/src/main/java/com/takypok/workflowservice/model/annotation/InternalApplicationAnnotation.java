package com.takypok.workflowservice.model.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface InternalApplicationAnnotation {
  String value();

  /** Sub (username) of the person responsible for tickets in this application. */
  String assignee() default "";
}
