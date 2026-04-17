import { useState } from "react";
import { Button, Select, Pagination } from "antd";
import { products, CATEGORIES } from "../data/products";
import ProductCard from "../components/shop/ProductCard";

type SortOption = "default" | "price-asc" | "price-desc";
type StockFilter = "all" | "in-stock" | "out-of-stock";

const PAGE_SIZE = 6;

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState<SortOption>("default");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);

  const filtered = products
    .filter((p) => activeCategory === "All" || p.category === activeCategory)
    .filter((p) => {
      if (stockFilter === "in-stock") return p.stock > 0;
      if (stockFilter === "out-of-stock") return p.stock === 0;
      return true;
    })
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return 0;
    });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              type={activeCategory === cat ? "primary" : "default"}
              onClick={() => { setActiveCategory(cat); resetPage(); }}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Stock filter */}
          <Select
            value={stockFilter}
            onChange={(val) => { setStockFilter(val); resetPage(); }}
            style={{ width: 150 }}
            options={[
              { value: "all",          label: "All Stock" },
              { value: "in-stock",     label: "In Stock" },
              { value: "out-of-stock", label: "Out of Stock" },
            ]}
          />

          {/* Sort */}
          <Select
            value={sort}
            onChange={(val) => { setSort(val); resetPage(); }}
            style={{ width: 160 }}
            options={[
              { value: "default",    label: "Default Order" },
              { value: "price-asc",  label: "Price: Low → High" },
              { value: "price-desc", label: "Price: High → Low" },
            ]}
          />
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs opacity-50 tracking-widest uppercase">
        {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Product grid */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 opacity-40 text-sm tracking-widest uppercase">
          No products match your filters.
        </div>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex justify-center pt-2">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
