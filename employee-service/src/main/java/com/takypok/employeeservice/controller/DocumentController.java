package com.takypok.employeeservice.controller;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.PageResponse;
import com.takypok.core.model.ResultMessage;
import com.takypok.core.model.authentication.Roles;
import com.takypok.core.util.AuthenticationUtil;
import com.takypok.employeeservice.model.request.ArchiveDocumentRequest;
import com.takypok.employeeservice.model.request.CreateDocumentRequest;
import com.takypok.employeeservice.model.request.FilterDocumentRequest;
import com.takypok.employeeservice.model.request.UpdateDocumentRequest;
import com.takypok.employeeservice.model.response.DocumentResponse;
import com.takypok.employeeservice.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Documents & Policies — org-official content, either an uploaded file, inline text, or both.
 * Unlike NewsController's employee-generated feed, every write here is ADMIN-only, and any admin
 * may edit any document (no per-author ownership check) since these aren't personal posts.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/documents")
public class DocumentController {
  private final DocumentService documentService;

  @GetMapping
  public Mono<ResultMessage<PageResponse<DocumentResponse>>> list(
      @Valid FilterDocumentRequest request, Authentication authentication) {
    return documentService.list(request, authentication.getName()).map(ResultMessage::success);
  }

  @GetMapping("/{id}")
  public Mono<ResultMessage<DocumentResponse>> getById(
      @PathVariable Long id, Authentication authentication) {
    return documentService.getById(id, authentication.getName()).map(ResultMessage::success);
  }

  @PostMapping
  public Mono<ResultMessage<DocumentResponse>> create(
      @RequestBody @Valid CreateDocumentRequest request, Authentication authentication) {
    return requireAdmin(authentication)
        .then(documentService.create(request, authentication.getName()))
        .map(ResultMessage::success);
  }

  @PutMapping("/{id}")
  public Mono<ResultMessage<DocumentResponse>> update(
      @PathVariable Long id,
      @RequestBody @Valid UpdateDocumentRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(documentService.update(id, request, authentication.getName()))
        .map(ResultMessage::success);
  }

  @PatchMapping("/{id}/archive")
  public Mono<ResultMessage<DocumentResponse>> setArchived(
      @PathVariable Long id,
      @RequestBody @Valid ArchiveDocumentRequest request,
      Authentication authentication) {
    return requireAdmin(authentication)
        .then(documentService.setArchived(id, request.getArchived(), authentication.getName()))
        .map(ResultMessage::success);
  }

  @PostMapping("/{id}/acknowledge")
  public Mono<ResultMessage<DocumentResponse>> acknowledge(
      @PathVariable Long id, Authentication authentication) {
    return documentService.acknowledge(id, authentication.getName()).map(ResultMessage::success);
  }

  private Mono<Void> requireAdmin(Authentication authentication) {
    if (AuthenticationUtil.getRoles(authentication).contains(Roles.ADMIN)) {
      return Mono.empty();
    }
    return Mono.error(new ApplicationException(Message.Application.ERROR, "Admin role required"));
  }
}
