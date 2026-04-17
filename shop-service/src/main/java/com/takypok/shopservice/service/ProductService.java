package com.takypok.shopservice.service;

import com.takypok.core.model.PageResponse;
import com.takypok.shopservice.model.entity.Product;
import com.takypok.shopservice.model.entity.ProductInformation;
import com.takypok.shopservice.model.request.FilterProductRequest;
import reactor.core.publisher.Mono;

public interface ProductService {
  Mono<PageResponse<Product<ProductInformation>>> get(FilterProductRequest request);
}
