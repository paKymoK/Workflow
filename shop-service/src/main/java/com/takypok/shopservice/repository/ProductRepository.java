package com.takypok.shopservice.repository;

import com.takypok.shopservice.model.entity.Product;
import com.takypok.shopservice.model.entity.ProductInformation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface ProductRepository<T extends ProductInformation>
    extends R2dbcRepository<Product<T>, Long> {

  Flux<Product<T>> findAllBy(Pageable pageable);
}
