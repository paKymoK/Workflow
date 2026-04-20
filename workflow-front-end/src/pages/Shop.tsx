import { useMemo, useState } from "react";
import { Select, Pagination } from "antd";
import ProductCard from "../components/shop/ProductCard";
import { useProductList } from "../hooks/useProducts";
import type { FilterProductRequest } from "../api/types";

type SortOption = "id-desc" | "id-asc" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

const PAGE_SIZE = 6;

function mapSort(sort: SortOption): Pick<FilterProductRequest, "sortBy" | "sortDir"> {
  switch (sort) {
    case "id-asc":
      return { sortBy: "id", sortDir: "asc" };
    case "price-asc":
      return { sortBy: "price", sortDir: "asc" };
    case "price-desc":
      return { sortBy: "price", sortDir: "desc" };
    case "name-asc":
      return { sortBy: "name", sortDir: "asc" };
    case "name-desc":
      return { sortBy: "name", sortDir: "desc" };
    default:
      return { sortBy: "id", sortDir: "desc" };
  }
}

export default function Shop() {
  const [sort, setSort] = useState<SortOption>("id-desc");
  const [page, setPage] = useState(1);

  const params = useMemo<FilterProductRequest>(() => {
    const sortParams = mapSort(sort);
    return {
      page: page - 1,
      size: PAGE_SIZE,
      sortBy: sortParams.sortBy,
      sortDir: sortParams.sortDir,
    };
  }, [page, sort]);

  const { data, isLoading, isError } = useProductList(params);
  const products = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Select
          value={sort}
          onChange={(val) => {
            setSort(val);
            setPage(1);
          }}
          style={{ width: 190 }}
          options={[
            { value: "id-desc", label: "Newest" },
            { value: "id-asc", label: "Oldest" },
            { value: "price-asc", label: "Price: Low → High" },
            { value: "price-desc", label: "Price: High → Low" },
            { value: "name-asc", label: "Name: A → Z" },
            { value: "name-desc", label: "Name: Z → A" },
          ]}
        />
      </div>

      <p className="text-xs opacity-50 tracking-widest uppercase">
        {total} product{total !== 1 ? "s" : ""} found
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 opacity-40 text-sm tracking-widest uppercase">
          Loading products...
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center h-48 opacity-40 text-sm tracking-widest uppercase">
          Failed to load products.
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 opacity-40 text-sm tracking-widest uppercase">
          No products available.
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex justify-center pt-2">
          <Pagination
            current={(data?.page ?? 0) + 1}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
