package com.takypok.employeeservice.controller;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.PageResponse;
import com.takypok.core.model.ResultMessage;
import com.takypok.core.model.authentication.Roles;
import com.takypok.core.util.AuthenticationUtil;
import com.takypok.employeeservice.model.request.ArchiveTrainingMaterialRequest;
import com.takypok.employeeservice.model.request.CreateTrainingMaterialRequest;
import com.takypok.employeeservice.model.request.FilterTrainingMaterialRequest;
import com.takypok.employeeservice.model.request.UpdateTrainingMaterialRequest;
import com.takypok.employeeservice.model.response.TrainingMaterialResponse;
import com.takypok.employeeservice.service.TrainingMaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Training Materials — org-official content, either a video (media-service HLS pipeline) or an
 * uploaded PDF/slides file. Like DocumentController, every write is ADMIN-only and any admin may
 * edit any material (no per-author ownership check).
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/training-materials")
public class TrainingMaterialController {
  private final TrainingMaterialService trainingMaterialService;

  @GetMapping
  public Mono<ResultMessage<PageResponse<TrainingMaterialResponse>>> list(
      @Valid FilterTrainingMaterialRequest request, Authentication authentication) {
    return trainingMaterialService
        .list(request, authentication.getName())
        .map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<TrainingMaterialResponse>> getById(
      @PathVariable Long id, Authentication authentication) {
    return trainingMaterialService
        .getById(id, authentication.getName())
        .map(ResultMessage::success);
  }

  @PostMapping
  public Mono<ResultMessage<TrainingMaterialResponse>> create(
      @RequestBody @Valid CreateTrainingMaterialRequest request, Authentication authentication) {
    return requireAdmin(authentication)
        .then(trainingMaterialService.create(request, authentication.getName()))
        .map(ResultMessage::success);
  }

  @PutMapping("/{id}")
  public Mono<ResultMessage<TrainingMaterialResponse>> update(
      @PathVariable Long id,
      @RequestBody @Valid UpdateTrainingMaterialRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(trainingMaterialService.update(id, request, authentication.getName()))
        .map(ResultMessage::success);
  }

  @PatchMapping("/{id}/archive")
  public Mono<ResultMessage<TrainingMaterialResponse>> setArchived(
      @PathVariable Long id,
      @RequestBody @Valid ArchiveTrainingMaterialRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(
            trainingMaterialService.setArchived(
                id, request.getArchived(), authentication.getName()))
        .map(ResultMessage::success);
  }

  @PostMapping("/{id}/complete")
  public Mono<ResultMessage<TrainingMaterialResponse>> complete(
      @PathVariable Long id, Authentication authentication) {
    return trainingMaterialService
        .complete(id, authentication.getName())
        .map(ResultMessage::success);
  }

  private Mono<Void> requireAdmin(Authentication authentication) {
    if (AuthenticationUtil.getRoles(authentication).contains(Roles.ADMIN)) {
      return Mono.empty();
    }
    return Mono.error(new ApplicationException(Message.Application.ERROR, "Admin role required"));
  }
}
