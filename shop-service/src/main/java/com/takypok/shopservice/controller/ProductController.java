package com.takypok.shopservice.controller;

import com.takypok.core.model.PageResponse;
import com.takypok.core.model.ResultMessage;
import com.takypok.shopservice.model.entity.Product;
import com.takypok.shopservice.model.entity.ProductInformation;
import com.takypok.shopservice.model.request.FilterProductRequest;
import com.takypok.shopservice.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/product")
public class ProductController {
  private final ProductService productService;

  @GetMapping("")
  public Mono<ResultMessage<PageResponse<Product<ProductInformation>>>> get(
      @Valid FilterProductRequest request) {
    return productService.get(request).map(ResultMessage::success);
  }
}
