package com.takypok.authservice.repository;

import com.takypok.authservice.model.entity.EmployeeMirror;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeMirrorRepository extends JpaRepository<EmployeeMirror, String> {

  @Query(value = "SELECT * FROM employee_mirror WHERE sub = :sub", nativeQuery = true)
  EmployeeMirror getBySub(String sub);
}
