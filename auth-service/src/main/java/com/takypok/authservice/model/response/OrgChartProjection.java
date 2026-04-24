package com.takypok.authservice.model.response;

public interface OrgChartProjection {
  String getSub();

  String getName();

  String getEmail();

  String getTitle();

  String getDepartment();

  String getManagerSub();

  String getAvatar();

  Integer getDepth();
}
