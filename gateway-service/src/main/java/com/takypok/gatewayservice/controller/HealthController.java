package com.takypok.gatewayservice.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.cloud.client.loadbalancer.reactive.ReactorLoadBalancerExchangeFilterFunction;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

  private final ReactorLoadBalancerExchangeFilterFunction loadBalancerFilter;
  private final DiscoveryClient discoveryClient;

  private WebClient buildClient(String serviceId) {
    return WebClient.builder().filter(loadBalancerFilter).baseUrl("http://" + serviceId).build();
  }

  // Check a single service by name
  // GET /api/health/{serviceName}
  @GetMapping("/health/{serviceName}")
  public Mono<ResponseEntity<Map<String, Object>>> checkService(@PathVariable String serviceName) {
    return doHealthCheck(serviceName)
        .map(
            result -> {
              boolean isUp = "UP".equals(result.get("status"));
              return isUp
                  ? ResponseEntity.ok(result)
                  : ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(result);
            });
  }

  // Check all registered services at once
  // GET /api/health
  @GetMapping("/health")
  public Mono<ResponseEntity<Map<String, Object>>> checkAllServices() {
    List<String> services = discoveryClient.getServices();

    return Flux.fromIterable(services)
        .flatMap(this::doHealthCheck)
        .collectList()
        .map(
            results -> {
              boolean allUp = results.stream().allMatch(r -> "UP".equals(r.get("status")));

              Map<String, Object> response = new LinkedHashMap<>();
              response.put("overall", allUp ? "UP" : "DEGRADED");
              response.put("services", results);

              return allUp
                  ? ResponseEntity.ok(response)
                  : ResponseEntity.status(HttpStatus.MULTI_STATUS).body(response);
            });
  }

  // Shared health check logic
  private Mono<Map<String, Object>> doHealthCheck(String serviceName) {
    return buildClient(serviceName)
        .get()
        .uri("/actuator/health")
        .retrieve()
        .bodyToMono(Map.class)
        .map(
            body -> {
              Map<String, Object> result = new LinkedHashMap<>();
              result.put("service", serviceName);
              result.put("status", body.get("status"));
              return result;
            })
        .onErrorResume(
            ex -> {
              Map<String, Object> result = new LinkedHashMap<>();
              result.put("service", serviceName);
              result.put("status", "DOWN");
              result.put("reason", ex.getMessage());
              return Mono.just(result);
            });
  }
}
