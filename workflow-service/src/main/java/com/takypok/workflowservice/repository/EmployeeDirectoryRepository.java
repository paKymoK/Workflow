package com.takypok.workflowservice.repository;

import com.takypok.workflowservice.model.entity.EmployeeDirectory;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface EmployeeDirectoryRepository extends R2dbcRepository<EmployeeDirectory, String> {

  @Query(
      """
      SELECT * FROM employee_directory
      WHERE name ILIKE CONCAT('%', :q, '%') OR email ILIKE CONCAT('%', :q, '%')
      ORDER BY name
      LIMIT :limit
      """)
  Flux<EmployeeDirectory> search(String q, int limit);
}
