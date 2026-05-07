package com.takypok.mediaservice.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.ResourceHandlerRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebFluxConfigurer {

  private final StorageProperties storageProperties;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String imagesLocation = "file:" + storageProperties.getImagesDir() + "/";
    registry.addResourceHandler("/images/**").addResourceLocations(imagesLocation);
  }
}
