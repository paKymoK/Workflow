package com.takypok.shopservice.service;

import com.takypok.core.model.PageResponse;
import com.takypok.shopservice.model.entity.Product;
import com.takypok.shopservice.model.entity.ProductInformation;
import com.takypok.shopservice.model.request.CreateProductRequest;
import com.takypok.shopservice.model.request.FilterProductRequest;
import com.takypok.shopservice.model.request.UpdateProductRequest;
import reactor.core.publisher.Mono;

public interface ProductService {
  Mono<PageResponse<Product<ProductInformation>>> get(FilterProductRequest request);

  Mono<Product<ProductInformation>> get(Long id);

  Mono<Product<ProductInformation>> create(CreateProductRequest request);

  Mono<Product<ProductInformation>> update(UpdateProductRequest request);

  Mono<Void> delete(Long id);
}
