package com.takypok.authservice.service;

import com.takypok.authservice.model.response.OrgChartProjection;
import java.util.List;

public interface OrganizationService {
  List<OrgChartProjection> getOrgChart();
}
