package com.takypok.authservice.service.impl;

import com.takypok.authservice.model.response.OrgChartProjection;
import com.takypok.authservice.repository.UserInfoRepository;
import com.takypok.authservice.service.OrganizationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationServiceImpl implements OrganizationService {
  private final UserInfoRepository userInfoRepository;

  @Override
  public List<OrgChartProjection> getOrgChart() {
    return userInfoRepository.getOrgChart();
  }
}
