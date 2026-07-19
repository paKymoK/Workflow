package com.takypok.workflowservice.controller;

import com.takypok.core.model.ResultMessage;
import com.takypok.workflowservice.function.postfunction.index.PostFunctionInterface;
import com.takypok.workflowservice.function.validator.index.ParameterizedValidatorInterface;
import com.takypok.workflowservice.function.validator.index.ValidatorInterface;
import com.takypok.workflowservice.model.response.FunctionResponse;
import java.util.LinkedHashMap;
import java.util.Map;
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
                            postFunction.getClass().getName(),
                            false))
                .toList())
        .map(ResultMessage::success);
  }

  @GetMapping("/validator")
  public Mono<ResultMessage<?>> getListValidator() {
    // ParameterizedValidatorInterface doesn't extend ValidatorInterface, so a bean implementing
    // only the former (e.g. RoleValidator, SpecificApproverValidator) is invisible to
    // getBeansOfType(ValidatorInterface.class) — both bean sets have to be queried and merged.
    Map<String, Object> byClassName = new LinkedHashMap<>();
    context
        .getBeansOfType(ValidatorInterface.class)
        .values()
        .forEach(v -> byClassName.put(v.getClass().getName(), v));
    context
        .getBeansOfType(ParameterizedValidatorInterface.class)
        .values()
        .forEach(v -> byClassName.put(v.getClass().getName(), v));

    return Mono.just(
            byClassName.values().stream()
                .map(
                    validator ->
                        new FunctionResponse(
                            validator.getClass().getSimpleName(),
                            validator.getClass().getName(),
                            validator instanceof ParameterizedValidatorInterface))
                .toList())
        .map(ResultMessage::success);
  }
}
