package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.TrainingMaterial;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface TrainingMaterialRepository extends R2dbcRepository<TrainingMaterial, Long> {

  @Query(
      """
      SELECT * FROM training_material
      WHERE (:category IS NULL OR category = :category)
        AND (:format IS NULL OR format = :format)
        AND (:status IS NULL OR status = :status)
      ORDER BY created_at DESC
      LIMIT :size OFFSET :offset
      """)
  Flux<TrainingMaterial> feed(String category, String format, String status, int size, long offset);

  @Query(
      """
      SELECT COUNT(*) FROM training_material
      WHERE (:category IS NULL OR category = :category)
        AND (:format IS NULL OR format = :format)
        AND (:status IS NULL OR status = :status)
      """)
  Mono<Long> countFeed(String category, String format, String status);
}
