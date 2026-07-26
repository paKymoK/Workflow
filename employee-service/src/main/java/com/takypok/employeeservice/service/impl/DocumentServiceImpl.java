package com.takypok.employeeservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.PageResponse;
import com.takypok.employeeservice.exception.DocumentPostNotFoundException;
import com.takypok.employeeservice.model.entity.DocumentAcknowledgment;
import com.takypok.employeeservice.model.entity.DocumentPost;
import com.takypok.employeeservice.model.entity.DocumentStatus;
import com.takypok.employeeservice.model.entity.EmploymentStatus;
import com.takypok.employeeservice.model.request.CreateDocumentRequest;
import com.takypok.employeeservice.model.request.FilterDocumentRequest;
import com.takypok.employeeservice.model.request.UpdateDocumentRequest;
import com.takypok.employeeservice.model.response.DocumentResponse;
import com.takypok.employeeservice.repository.DocumentAcknowledgmentRepository;
import com.takypok.employeeservice.repository.DocumentPostRepository;
import com.takypok.employeeservice.repository.EmployeeRepository;
import com.takypok.employeeservice.service.DocumentService;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

  private final DocumentPostRepository documentPostRepository;
  private final DocumentAcknowledgmentRepository documentAcknowledgmentRepository;
  private final EmployeeRepository employeeRepository;

  @Override
  public Mono<PageResponse<DocumentResponse>> list(
      FilterDocumentRequest request, String currentSub) {
    String status = request.getStatus() == null ? null : request.getStatus().name();
    int size = request.getSize().intValue();
    long offset = request.getPage() * size;
    return documentPostRepository
        .feed(request.getCategory(), status, size, offset)
        .collectList()
        .zipWith(documentPostRepository.countFeed(request.getCategory(), status))
        .flatMap(
            tuple ->
                enrichList(tuple.getT1(), currentSub)
                    .map(
                        responses ->
                            buildPageResponse(
                                responses, request.getPage(), request.getSize(), tuple.getT2())));
  }

  @Override
  public Mono<DocumentResponse> getById(Long id, String currentSub) {
    return findDocumentOrError(id).flatMap(doc -> enrichOne(doc, currentSub));
  }

  @Override
  public Mono<DocumentResponse> create(CreateDocumentRequest request, String currentSub) {
    return validateContentOrFile(request.getContent(), request.getFileUrl())
        .then(
            Mono.defer(
                () -> {
                  DocumentPost doc = new DocumentPost();
                  doc.setCategory(request.getCategory());
                  doc.setTitle(request.getTitle());
                  doc.setVersion(request.getVersion());
                  doc.setContent(request.getContent());
                  doc.setFileUrl(request.getFileUrl());
                  doc.setFileName(request.getFileName());
                  doc.setFileSize(request.getFileSize());
                  doc.setStatus(DocumentStatus.ACTIVE);
                  return documentPostRepository.save(doc);
                }))
        .flatMap(saved -> enrichOne(saved, currentSub));
  }

  @Override
  public Mono<DocumentResponse> update(Long id, UpdateDocumentRequest request, String currentSub) {
    return validateContentOrFile(request.getContent(), request.getFileUrl())
        .then(findDocumentOrError(id))
        .flatMap(
            doc -> {
              doc.setCategory(request.getCategory());
              doc.setTitle(request.getTitle());
              doc.setVersion(request.getVersion());
              doc.setContent(request.getContent());
              doc.setFileUrl(request.getFileUrl());
              doc.setFileName(request.getFileName());
              doc.setFileSize(request.getFileSize());
              return documentPostRepository.save(doc);
            })
        .flatMap(saved -> enrichOne(saved, currentSub));
  }

  @Override
  public Mono<DocumentResponse> setArchived(Long id, boolean archived, String currentSub) {
    return findDocumentOrError(id)
        .flatMap(
            doc -> {
              doc.setStatus(archived ? DocumentStatus.ARCHIVED : DocumentStatus.ACTIVE);
              return documentPostRepository.save(doc);
            })
        .flatMap(saved -> enrichOne(saved, currentSub));
  }

  @Override
  public Mono<DocumentResponse> acknowledge(Long id, String currentSub) {
    return findDocumentOrError(id)
        .flatMap(
            doc ->
                documentAcknowledgmentRepository
                    .findByDocumentIdAndEmployeeSub(id, currentSub)
                    .flatMap(existing -> Mono.just(doc))
                    .switchIfEmpty(
                        Mono.defer(
                            () -> {
                              DocumentAcknowledgment ack = new DocumentAcknowledgment();
                              ack.setDocumentId(id);
                              ack.setEmployeeSub(currentSub);
                              return documentAcknowledgmentRepository.save(ack).thenReturn(doc);
                            })))
        .flatMap(doc -> enrichOne(doc, currentSub));
  }

  private Mono<Void> validateContentOrFile(String content, String fileUrl) {
    if ((content == null || content.isBlank()) && (fileUrl == null || fileUrl.isBlank())) {
      return Mono.error(
          new ApplicationException(
              Message.Application.ERROR, "A document needs content, a file, or both"));
    }
    return Mono.empty();
  }

  private Mono<DocumentPost> findDocumentOrError(Long id) {
    return documentPostRepository
        .findById(id)
        .switchIfEmpty(Mono.error(new DocumentPostNotFoundException("No document with id " + id)));
  }

  private Mono<DocumentResponse> enrichOne(DocumentPost doc, String currentSub) {
    return enrichList(List.of(doc), currentSub).map(list -> list.get(0));
  }

  /** Batches acknowledgment lookups across the whole page, one query each. */
  private Mono<List<DocumentResponse>> enrichList(List<DocumentPost> docs, String currentSub) {
    if (docs.isEmpty()) {
      return Mono.just(List.of());
    }
    List<Long> docIds = docs.stream().map(DocumentPost::getId).toList();

    Mono<Map<Long, Collection<DocumentAcknowledgment>>> acksByDoc =
        documentAcknowledgmentRepository
            .findByDocumentIdIn(docIds)
            .collectMultimap(DocumentAcknowledgment::getDocumentId);
    Mono<Long> totalActiveEmployees =
        employeeRepository.count(null, null, null, EmploymentStatus.ACTIVE.name(), null);

    return Mono.zip(acksByDoc, totalActiveEmployees)
        .map(
            tuple ->
                docs.stream()
                    .map(
                        doc ->
                            buildDocumentResponse(
                                doc,
                                tuple.getT2(),
                                (Collection<DocumentAcknowledgment>)
                                    tuple.getT1().getOrDefault(doc.getId(), List.of()),
                                currentSub))
                    .toList());
  }

  private DocumentResponse buildDocumentResponse(
      DocumentPost doc,
      Long totalActiveEmployees,
      Collection<DocumentAcknowledgment> acks,
      String currentSub) {
    boolean acknowledgedByMe = acks.stream().anyMatch(a -> a.getEmployeeSub().equals(currentSub));

    DocumentResponse response = new DocumentResponse();
    response.setId(doc.getId());
    response.setCategory(doc.getCategory());
    response.setTitle(doc.getTitle());
    response.setVersion(doc.getVersion());
    response.setContent(doc.getContent());
    response.setFileUrl(doc.getFileUrl());
    response.setFileName(doc.getFileName());
    response.setFileSize(doc.getFileSize());
    response.setStatus(doc.getStatus());
    response.setAcknowledgedByMe(acknowledgedByMe);
    response.setAcknowledgedCount((long) acks.size());
    response.setTotalActiveEmployees(totalActiveEmployees);
    response.setCreatedAt(doc.getCreatedAt());
    response.setModifiedAt(doc.getModifiedAt());
    return response;
  }

  private PageResponse<DocumentResponse> buildPageResponse(
      List<DocumentResponse> content, long page, long size, long totalElements) {
    long totalPages = size == 0 ? 0 : (long) Math.ceil((double) totalElements / size);
    return new PageResponse<>(content, page, size, totalElements, totalPages);
  }
}
