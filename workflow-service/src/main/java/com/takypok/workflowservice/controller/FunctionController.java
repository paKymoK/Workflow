package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.function.postfunction.index.PostFunctionInterface;
import com.takypok.workflowservice.function.validator.index.ValidatorInterface;
import com.takypok.workflowservice.model.response.FunctionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/function")
public class FunctionController {
  private final ApplicationContext context;

  @GetMapping("/postfunction")
  public Mono<ResultMessage<?>> getListPostFunction() {

    return Mono.just(
            context.getBeansOfType(PostFunctionInterface.class).values().stream()
                .map(
                    postFunction ->
                        new FunctionResponse(
                            postFunction.getClass().getSimpleName(),
                            postFunction.getClass().getName()))
                .toList())
        .map(ResultMessage::success);
  }

  @GetMapping("/validator")
  public Mono<ResultMessage<?>> getListValidator() {
    return Mono.just(
            context.getBeansOfType(ValidatorInterface.class).values().stream()
                .map(
                    validator ->
                        new FunctionResponse(
                            validator.getClass().getSimpleName(), validator.getClass().getName()))
                .toList())
        .map(ResultMessage::success);
  }
}
