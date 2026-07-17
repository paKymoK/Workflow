package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.Employee;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface EmployeeRepository extends R2dbcRepository<Employee, Long> {

  Mono<Employee> findBySub(String sub);

  Flux<Employee> findByManagerIdOrderByName(Long managerId);

  @Query(
      """
      SELECT * FROM employee
      WHERE (:q IS NULL OR name ILIKE CONCAT('%', :q, '%')
                        OR email ILIKE CONCAT('%', :q, '%')
                        OR employee_code ILIKE CONCAT('%', :q, '%'))
        AND (:department IS NULL OR department = :department)
        AND (:line IS NULL OR line = :line)
        AND (:status IS NULL OR status = :status)
        AND (:managerId IS NULL OR manager_id = :managerId)
      ORDER BY name
      LIMIT :size OFFSET :offset
      """)
  Flux<Employee> search(
      String q,
      String department,
      String line,
      String status,
      Long managerId,
      int size,
      long offset);

  @Query(
      """
      SELECT COUNT(*) FROM employee
      WHERE (:q IS NULL OR name ILIKE CONCAT('%', :q, '%')
                        OR email ILIKE CONCAT('%', :q, '%')
                        OR employee_code ILIKE CONCAT('%', :q, '%'))
        AND (:department IS NULL OR department = :department)
        AND (:line IS NULL OR line = :line)
        AND (:status IS NULL OR status = :status)
        AND (:managerId IS NULL OR manager_id = :managerId)
      """)
  Mono<Long> count(String q, String department, String line, String status, Long managerId);
}
