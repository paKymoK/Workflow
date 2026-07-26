package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.TrainingCompletion;
import java.util.Collection;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface TrainingCompletionRepository extends R2dbcRepository<TrainingCompletion, Long> {

  Mono<TrainingCompletion> findByTrainingMaterialIdAndEmployeeSub(
      Long trainingMaterialId, String employeeSub);

  Flux<TrainingCompletion> findByTrainingMaterialIdIn(Collection<Long> trainingMaterialIds);
}
