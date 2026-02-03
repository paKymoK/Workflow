package com.takypok.authservice.repository;

import com.takypok.authservice.model.UserInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UserInfoRepository extends JpaRepository<UserInfo, String> {

  @Query(value = "SELECT * FROM userinfo WHERE sub = :sub ", nativeQuery = true)
  UserInfo getBySub(String sub);
}
