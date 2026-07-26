package com.takypok.employeeservice.service;

import com.takypok.core.model.PageResponse;
import com.takypok.employeeservice.model.request.CreateDocumentRequest;
import com.takypok.employeeservice.model.request.FilterDocumentRequest;
import com.takypok.employeeservice.model.request.UpdateDocumentRequest;
import com.takypok.employeeservice.model.response.DocumentResponse;
import reactor.core.publisher.Mono;

public interface DocumentService {
  Mono<PageResponse<DocumentResponse>> list(FilterDocumentRequest request, String currentSub);

  Mono<DocumentResponse> getById(Long id, String currentSub);

  Mono<DocumentResponse> create(CreateDocumentRequest request, String currentSub);

  Mono<DocumentResponse> update(Long id, UpdateDocumentRequest request, String currentSub);

  Mono<DocumentResponse> setArchived(Long id, boolean archived, String currentSub);

  Mono<DocumentResponse> acknowledge(Long id, String currentSub);
}
