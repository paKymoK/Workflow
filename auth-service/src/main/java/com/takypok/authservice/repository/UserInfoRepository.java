package com.takypok.authservice.repository;

import com.takypok.authservice.model.entity.Userinfo;
import com.takypok.authservice.model.response.OrgChartProjection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UserInfoRepository extends JpaRepository<Userinfo, String> {

  @Query(value = "SELECT * FROM userinfo WHERE sub = :sub ", nativeQuery = true)
  Userinfo getBySub(String sub);

  @Query(
      value =
          """
                  WITH RECURSIVE org_tree AS (
                      SELECT
                          u.sub,
                          u.name,
                          u.email,
                          u.title,
                          u.department,
                          u.manager_sub,
                          0                        AS depth,
                          ARRAY[u.sub]::VARCHAR[]  AS path
                      FROM userinfo u
                      WHERE u.manager_sub IS NULL

                      UNION ALL

                      SELECT
                          u.sub,
                          u.name,
                          u.email,
                          u.title,
                          u.department,
                          u.manager_sub,
                          ot.depth + 1,
                          ot.path || u.sub
                      FROM userinfo u
                      JOIN org_tree ot ON u.manager_sub = ot.sub
                      WHERE u.sub != ALL(ot.path)
                  )
                  SELECT * FROM org_tree
                  ORDER BY depth, name;
                  """,
      nativeQuery = true)
  List<OrgChartProjection> getOrgChart();
}
