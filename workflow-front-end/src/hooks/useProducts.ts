import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchProductById, fetchProducts } from "../api/ticketApi";
import type { FilterProductRequest } from "../api/types";

export const productKeys = {
  all: () => ["products"] as const,
  lists: () => ["products", "list"] as const,
  list: (p: FilterProductRequest) => ["products", "list", p] as const,
  details: () => ["products", "detail"] as const,
  detail: (id: string | number) => ["products", "detail", id] as const,
};

export function useProductList(params: FilterProductRequest) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => fetchProducts(params),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string | number | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id!),
    queryFn: () => fetchProductById(id!),
    enabled: !!id,
  });
}
