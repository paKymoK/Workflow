package com.takypok.shopservice.service.impl;

import static com.takypok.core.util.PostgresUtil.CLAZZ_NAME;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takypok.core.exception.ApplicationException;
import com.takypok.core.model.Message;
import com.takypok.core.model.PageResponse;
import com.takypok.shopservice.model.entity.Product;
import com.takypok.shopservice.model.entity.ProductInformation;
import com.takypok.shopservice.model.request.CreateProductRequest;
import com.takypok.shopservice.model.request.FilterProductRequest;
import com.takypok.shopservice.model.request.UpdateProductRequest;
import com.takypok.shopservice.repository.ProductRepository;
import com.takypok.shopservice.service.ProductService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {
  private final ProductRepository<ProductInformation> productRepository;
  private final ObjectMapper objectMapper;

  @Override
  public Mono<PageResponse<Product<ProductInformation>>> get(FilterProductRequest request) {
    int page = request.getPage().intValue();
    int size = request.getSize().intValue();
    Sort.Direction direction =
        "asc".equals(request.getSortDir()) ? Sort.Direction.ASC : Sort.Direction.DESC;
    PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, request.getSortBy()));

    Flux<Product<ProductInformation>> contentQuery = productRepository.findAllBy(pageable);

    return Mono.zip(contentQuery.collectList(), productRepository.count())
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

  @Override
  public Mono<Product<ProductInformation>> get(Long id) {
    return productRepository
        .findById(id)
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(Message.Application.ERROR, "Product does not exist")));
  }

  @Override
  public Mono<Product<ProductInformation>> create(CreateProductRequest request) {
    Product<ProductInformation> product = new Product<>();
    product.setName(request.getName());
    product.setType(request.getType());
    product.setImageUrl(request.getImageUrl());
    product.setDetail(resolveProductInformation(request.getDetail()));
    product.setStock(request.getStock());
    product.setPrice(request.getPrice());
    product.setCurrency(request.getCurrency());
    return productRepository.save(product);
  }

  @Override
  public Mono<Product<ProductInformation>> update(UpdateProductRequest request) {
    return productRepository
        .findById(request.getId())
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(Message.Application.ERROR, "Product does not exist")))
        .flatMap(
            product -> {
              product.setName(request.getName());
              product.setType(request.getType());
              product.setImageUrl(request.getImageUrl());
              product.setDetail(resolveProductInformation(request.getDetail()));
              product.setStock(request.getStock());
              product.setPrice(request.getPrice());
              product.setCurrency(request.getCurrency());
              return productRepository.save(product);
            });
  }

  @Override
  public Mono<Void> delete(Long id) {
    return productRepository
        .findById(id)
        .switchIfEmpty(
            Mono.error(
                new ApplicationException(Message.Application.ERROR, "Product does not exist")))
        .flatMap(productRepository::delete);
  }

  @SuppressWarnings("unchecked")
  private ProductInformation resolveProductInformation(Object detail) {
    try {
      JsonNode node = objectMapper.valueToTree(detail);
      String className = node.path(CLAZZ_NAME).asText();
      Class<? extends ProductInformation> cls =
          (Class<? extends ProductInformation>) Class.forName(className);
      return objectMapper.convertValue(detail, cls);
    } catch (ClassNotFoundException e) {
      log.error("Unable to resolve ProductInformation class: {}", e.getMessage(), e);
      throw new IllegalArgumentException(e);
    }
  }
}
