import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkoutCart, fetchCart, removeCartItem, upsertCartItem } from "../api/ticketApi";
import type { UpsertCartItemRequest } from "../api/types";
import { productKeys } from "./useProducts";

export const cartKeys = {
  all: () => ["cart"] as const,
};

export function useCartQuery() {
  return useQuery({
    queryKey: cartKeys.all(),
    queryFn: fetchCart,
  });
}

export function useUpsertCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertCartItemRequest) => upsertCartItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all() });
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => removeCartItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all() });
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
    },
  });
}

export function useCheckoutCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkoutCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all() });
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
    },
  });
}
