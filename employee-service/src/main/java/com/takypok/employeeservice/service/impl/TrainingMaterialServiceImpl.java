package com.takypok.employeeservice.service.impl;

import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.PageResponse;
import com.takypok.employeeservice.exception.TrainingMaterialNotFoundException;
import com.takypok.employeeservice.model.entity.EmploymentStatus;
import com.takypok.employeeservice.model.entity.TrainingCompletion;
import com.takypok.employeeservice.model.entity.TrainingFormat;
import com.takypok.employeeservice.model.entity.TrainingMaterial;
import com.takypok.employeeservice.model.entity.TrainingStatus;
import com.takypok.employeeservice.model.request.CreateTrainingMaterialRequest;
import com.takypok.employeeservice.model.request.FilterTrainingMaterialRequest;
import com.takypok.employeeservice.model.request.UpdateTrainingMaterialRequest;
import com.takypok.employeeservice.model.response.TrainingMaterialResponse;
import com.takypok.employeeservice.repository.EmployeeRepository;
import com.takypok.employeeservice.repository.TrainingCompletionRepository;
import com.takypok.employeeservice.repository.TrainingMaterialRepository;
import com.takypok.employeeservice.service.TrainingMaterialService;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class TrainingMaterialServiceImpl implements TrainingMaterialService {

  private final TrainingMaterialRepository trainingMaterialRepository;
  private final TrainingCompletionRepository trainingCompletionRepository;
  private final EmployeeRepository employeeRepository;

  @Override
  public Mono<PageResponse<TrainingMaterialResponse>> list(
      FilterTrainingMaterialRequest request, String currentSub) {
    String format = request.getFormat() == null ? null : request.getFormat().name();
    String status = request.getStatus() == null ? null : request.getStatus().name();
    int size = request.getSize().intValue();
    long offset = request.getPage() * size;
    return trainingMaterialRepository
        .feed(request.getCategory(), format, status, size, offset)
        .collectList()
        .zipWith(trainingMaterialRepository.countFeed(request.getCategory(), format, status))
        .flatMap(
            tuple ->
                enrichList(tuple.getT1(), currentSub)
                    .map(
                        responses ->
                            buildPageResponse(
                                responses, request.getPage(), request.getSize(), tuple.getT2())));
  }

  @Override
  public Mono<TrainingMaterialResponse> getById(Long id, String currentSub) {
    return findMaterialOrError(id).flatMap(material -> enrichOne(material, currentSub));
  }

  @Override
  public Mono<TrainingMaterialResponse> create(
      CreateTrainingMaterialRequest request, String currentSub) {
    return validateFormatFields(request.getFormat(), request.getVideoId(), request.getFileUrl())
        .then(
            Mono.defer(
                () -> {
                  TrainingMaterial material = new TrainingMaterial();
                  material.setCategory(request.getCategory());
                  material.setTitle(request.getTitle());
                  material.setFormat(request.getFormat());
                  material.setVideoId(request.getVideoId());
                  material.setDuration(request.getDuration());
                  material.setFileUrl(request.getFileUrl());
                  material.setFileName(request.getFileName());
                  material.setFileSize(request.getFileSize());
                  material.setStatus(TrainingStatus.ACTIVE);
                  return trainingMaterialRepository.save(material);
                }))
        .flatMap(saved -> enrichOne(saved, currentSub));
  }

  @Override
  public Mono<TrainingMaterialResponse> update(
      Long id, UpdateTrainingMaterialRequest request, String currentSub) {
    return validateFormatFields(request.getFormat(), request.getVideoId(), request.getFileUrl())
        .then(findMaterialOrError(id))
        .flatMap(
            material -> {
              material.setCategory(request.getCategory());
              material.setTitle(request.getTitle());
              material.setFormat(request.getFormat());
              material.setVideoId(request.getVideoId());
              material.setDuration(request.getDuration());
              material.setFileUrl(request.getFileUrl());
              material.setFileName(request.getFileName());
              material.setFileSize(request.getFileSize());
              return trainingMaterialRepository.save(material);
            })
        .flatMap(saved -> enrichOne(saved, currentSub));
  }

  @Override
  public Mono<TrainingMaterialResponse> setArchived(Long id, boolean archived, String currentSub) {
    return findMaterialOrError(id)
        .flatMap(
            material -> {
              material.setStatus(archived ? TrainingStatus.ARCHIVED : TrainingStatus.ACTIVE);
              return trainingMaterialRepository.save(material);
            })
        .flatMap(saved -> enrichOne(saved, currentSub));
  }

  @Override
  public Mono<TrainingMaterialResponse> complete(Long id, String currentSub) {
    return findMaterialOrError(id)
        .flatMap(
            material ->
                trainingCompletionRepository
                    .findByTrainingMaterialIdAndEmployeeSub(id, currentSub)
                    .flatMap(existing -> Mono.just(material))
                    .switchIfEmpty(
                        Mono.defer(
                            () -> {
                              TrainingCompletion completion = new TrainingCompletion();
                              completion.setTrainingMaterialId(id);
                              completion.setEmployeeSub(currentSub);
                              return trainingCompletionRepository
                                  .save(completion)
                                  .thenReturn(material);
                            })))
        .flatMap(material -> enrichOne(material, currentSub));
  }

  private Mono<Void> validateFormatFields(TrainingFormat format, String videoId, String fileUrl) {
    boolean videoIdPresent = videoId != null && !videoId.isBlank();
    boolean fileUrlPresent = fileUrl != null && !fileUrl.isBlank();
    if (format == TrainingFormat.VIDEO) {
      if (!videoIdPresent || fileUrlPresent) {
        return Mono.error(
            new ApplicationException(
                Message.Application.ERROR, "A video material needs a videoId and no fileUrl"));
      }
    } else {
      if (!fileUrlPresent || videoIdPresent) {
        return Mono.error(
            new ApplicationException(
                Message.Application.ERROR,
                "A PDF or slides material needs a fileUrl and no videoId"));
      }
    }
    return Mono.empty();
  }

  private Mono<TrainingMaterial> findMaterialOrError(Long id) {
    return trainingMaterialRepository
        .findById(id)
        .switchIfEmpty(
            Mono.error(
                new TrainingMaterialNotFoundException("No training material with id " + id)));
  }

  private Mono<TrainingMaterialResponse> enrichOne(TrainingMaterial material, String currentSub) {
    return enrichList(List.of(material), currentSub).map(list -> list.get(0));
  }

  /** Batches completion lookups across the whole page, one query each. */
  private Mono<List<TrainingMaterialResponse>> enrichList(
      List<TrainingMaterial> materials, String currentSub) {
    if (materials.isEmpty()) {
      return Mono.just(List.of());
    }
    List<Long> materialIds = materials.stream().map(TrainingMaterial::getId).toList();

    Mono<Map<Long, Collection<TrainingCompletion>>> completionsByMaterial =
        trainingCompletionRepository
            .findByTrainingMaterialIdIn(materialIds)
            .collectMultimap(TrainingCompletion::getTrainingMaterialId);
    Mono<Long> totalActiveEmployees =
        employeeRepository.count(null, null, null, EmploymentStatus.ACTIVE.name(), null);

    return Mono.zip(completionsByMaterial, totalActiveEmployees)
        .map(
            tuple ->
                materials.stream()
                    .map(
                        material ->
                            buildTrainingMaterialResponse(
                                material,
                                tuple.getT2(),
                                (Collection<TrainingCompletion>)
                                    tuple.getT1().getOrDefault(material.getId(), List.of()),
                                currentSub))
                    .toList());
  }

  private TrainingMaterialResponse buildTrainingMaterialResponse(
      TrainingMaterial material,
      Long totalActiveEmployees,
      Collection<TrainingCompletion> completions,
      String currentSub) {
    boolean completedByMe =
        completions.stream().anyMatch(c -> c.getEmployeeSub().equals(currentSub));

    TrainingMaterialResponse response = new TrainingMaterialResponse();
    response.setId(material.getId());
    response.setCategory(material.getCategory());
    response.setTitle(material.getTitle());
    response.setFormat(material.getFormat());
    response.setVideoId(material.getVideoId());
    response.setDuration(material.getDuration());
    response.setFileUrl(material.getFileUrl());
    response.setFileName(material.getFileName());
    response.setFileSize(material.getFileSize());
    response.setStatus(material.getStatus());
    response.setCompletedByMe(completedByMe);
    response.setCompletedCount((long) completions.size());
    response.setTotalActiveEmployees(totalActiveEmployees);
    response.setCreatedAt(material.getCreatedAt());
    response.setModifiedAt(material.getModifiedAt());
    return response;
  }

  private PageResponse<TrainingMaterialResponse> buildPageResponse(
      List<TrainingMaterialResponse> content, long page, long size, long totalElements) {
    long totalPages = size == 0 ? 0 : (long) Math.ceil((double) totalElements / size);
    return new PageResponse<>(content, page, size, totalElements, totalPages);
  }
}
