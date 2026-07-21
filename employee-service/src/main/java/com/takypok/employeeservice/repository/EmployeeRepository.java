package com.takypok.employeeservice.repository;

import com.takypok.employeeservice.model.entity.Employee;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface EmployeeRepository extends R2dbcRepository<Employee, String> {

  Flux<Employee> findByManagerSubOrderByName(String managerSub);

  @Query("SELECT sub FROM employee WHERE status = :status AND sub != :excludeSub")
  Flux<String> findSubsByStatusExcluding(String status, String excludeSub);

  @Query(
      """
      SELECT * FROM employee
      WHERE (:q IS NULL OR name ILIKE CONCAT('%', :q, '%')
                        OR email ILIKE CONCAT('%', :q, '%')
                        OR sub ILIKE CONCAT('%', :q, '%'))
        AND (:departmentId IS NULL OR department_id = :departmentId)
        AND (:unitId IS NULL OR unit_id = :unitId)
        AND (:status IS NULL OR status = :status)
        AND (:managerSub IS NULL OR manager_sub = :managerSub)
      ORDER BY name
      LIMIT :size OFFSET :offset
      """)
  Flux<Employee> search(
      String q,
      Long departmentId,
      Long unitId,
      String status,
      String managerSub,
      int size,
      long offset);

  @Query(
      """
      SELECT COUNT(*) FROM employee
      WHERE (:q IS NULL OR name ILIKE CONCAT('%', :q, '%')
                        OR email ILIKE CONCAT('%', :q, '%')
                        OR sub ILIKE CONCAT('%', :q, '%'))
        AND (:departmentId IS NULL OR department_id = :departmentId)
        AND (:unitId IS NULL OR unit_id = :unitId)
        AND (:status IS NULL OR status = :status)
        AND (:managerSub IS NULL OR manager_sub = :managerSub)
      """)
  Mono<Long> count(String q, Long departmentId, Long unitId, String status, String managerSub);
}
