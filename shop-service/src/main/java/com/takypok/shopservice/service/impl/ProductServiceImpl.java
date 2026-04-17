package com.takypok.shopservice.service.impl;

import com.takypok.core.model.PageResponse;
import com.takypok.shopservice.model.entity.Product;
import com.takypok.shopservice.model.entity.ProductInformation;
import com.takypok.shopservice.model.request.FilterProductRequest;
import com.takypok.shopservice.repository.ProductRepository;
import com.takypok.shopservice.service.ProductService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
  private final ProductRepository<ProductInformation> productRepository;

  @Override
  public Mono<PageResponse<Product<ProductInformation>>> get(FilterProductRequest request) {
    int page = request.getPage().intValue();
    int size = request.getSize().intValue();
    int offset = page * size;
    return Mono.zip(
            productRepository.findAllPaged(size, offset).collectList(), productRepository.count())
        .map(
            tuple -> {
              List<Product<ProductInformation>> content = tuple.getT1();
              long totalElements = tuple.getT2();
              return PageResponse.<Product<ProductInformation>>builder()
                  .content(content)
                  .page(page)
                  .size(size)
                  .totalElements(totalElements)
                  .totalPages(totalElements == 0 ? 0 : (totalElements + size - 1) / size)
                  .build();
            });
  }
}
