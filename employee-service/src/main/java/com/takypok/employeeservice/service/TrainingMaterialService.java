package com.takypok.employeeservice.service;

import com.takypok.core.model.PageResponse;
import com.takypok.employeeservice.model.request.CreateTrainingMaterialRequest;
import com.takypok.employeeservice.model.request.FilterTrainingMaterialRequest;
import com.takypok.employeeservice.model.request.UpdateTrainingMaterialRequest;
import com.takypok.employeeservice.model.response.TrainingMaterialResponse;
import reactor.core.publisher.Mono;

public interface TrainingMaterialService {
  Mono<PageResponse<TrainingMaterialResponse>> list(
      FilterTrainingMaterialRequest request, String currentSub);

  Mono<TrainingMaterialResponse> getById(Long id, String currentSub);

  Mono<TrainingMaterialResponse> create(CreateTrainingMaterialRequest request, String currentSub);

  Mono<TrainingMaterialResponse> update(
      Long id, UpdateTrainingMaterialRequest request, String currentSub);

  Mono<TrainingMaterialResponse> setArchived(Long id, boolean archived, String currentSub);

  Mono<TrainingMaterialResponse> complete(Long id, String currentSub);
}
