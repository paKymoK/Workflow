package com.takypok.authservice.repository;

import com.takypok.authservice.model.entity.ClientRoleAssignment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientRoleAssignmentRepository
    extends JpaRepository<ClientRoleAssignment, String> {

  List<ClientRoleAssignment> findByRegisteredClientId(String registeredClientId);

  boolean existsByRegisteredClientIdAndUserSub(String registeredClientId, String userSub);

  boolean existsByRegisteredClientIdAndGroupId(String registeredClientId, String groupId);

  /**
   * Resolves all roles for a user on a specific client — direct assignment UNION group assignments.
   * Runs at token issuance time.
   */
  @Query(
      """
      SELECT DISTINCT a.role FROM ClientRoleAssignment a
      WHERE a.registeredClientId = :clientId
        AND (
          a.userSub = :userSub
          OR a.groupId IN (
            SELECT m.groupId FROM UserGroupMember m WHERE m.userSub = :userSub
          )
        )
      """)
  List<String> findRolesForUserOnClient(
      @Param("clientId") String clientId, @Param("userSub") String userSub);
}
