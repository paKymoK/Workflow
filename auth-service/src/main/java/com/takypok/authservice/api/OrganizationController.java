package com.takypok.authservice.api;

import com.takypok.authservice.model.response.OrgChartProjection;
import com.takypok.authservice.service.OrganizationService;
import com.takypok.core.model.ResultMessage;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/organization")
public class OrganizationController {
  private final OrganizationService organizationService;

  @GetMapping("/chart")
  public ResponseEntity<ResultMessage<List<OrgChartProjection>>> getById() {
    return ResponseEntity.ok(ResultMessage.success(organizationService.getOrgChart()));
  }
}
