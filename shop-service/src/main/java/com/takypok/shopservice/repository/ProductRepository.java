package com.takypok.shopservice.repository;

import com.takypok.shopservice.model.entity.Product;
import com.takypok.shopservice.model.entity.ProductInformation;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import reactor.core.publisher.Flux;

public interface ProductRepository<T extends ProductInformation>
    extends R2dbcRepository<Product<T>, Long> {

  @Query(
      """
          SELECT *
          FROM product
          ORDER BY id DESC
          LIMIT :limit OFFSET :offset
          """)
  Flux<Product<T>> findAllPaged(int limit, int offset);
}
