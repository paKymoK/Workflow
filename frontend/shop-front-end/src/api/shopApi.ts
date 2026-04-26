import type { ResultMessage, PageResponse, ShopProduct, FilterProductRequest, Cart, UpsertCartItemRequest, CheckoutResponse } from "./types";
import { api } from "@takypok/shared";

export async function fetchProducts(params: FilterProductRequest) {
  const { data } = await api.get<ResultMessage<PageResponse<ShopProduct>>>(
    "/shop-service/v1/product",
    { params },
  );
  return data.data;
}

export async function fetchProductById(id: string | number) {
  const { data } = await api.get<ResultMessage<ShopProduct>>(
    `/shop-service/v1/product/${id}`,
  );
  return data.data;
}

export async function fetchCart() {
  const { data } = await api.get<ResultMessage<Cart>>(
    "/shop-service/v1/cart",
  );
  return data.data;
}

export async function upsertCartItem(payload: UpsertCartItemRequest) {
  const { data } = await api.put<ResultMessage<Cart>>(
    "/shop-service/v1/cart/items",
    payload,
  );
  return data.data;
}

export async function removeCartItem(productId: string | number) {
  const { data } = await api.delete<ResultMessage<Cart>>(
    `/shop-service/v1/cart/items/${productId}`,
  );
  return data.data;
}

export async function checkoutCart() {
  const { data } = await api.post<ResultMessage<CheckoutResponse>>(
    "/shop-service/v1/cart/checkout",
  );
  return data.data;
}
