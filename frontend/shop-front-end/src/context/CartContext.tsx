import { createContext, useContext, type ReactNode } from "react";
import { message } from "antd";
import type { CartItem } from "../api/types";
import { useCartQuery, useCheckoutCart, useRemoveCartItem, useUpsertCartItem } from "../hooks/useCart";

type CheckoutResult = { orderId: string; totalAmount: number };

type CartContextType = {
  items: CartItem[];
  addItem: (product: { productId: number }) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  updateQty: (productId: number, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: () => Promise<CheckoutResult>;
  totalPrice: number;
  totalItems: number;
  isLoading: boolean;
  isCheckoutLoading: boolean;
};

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useCartQuery();
  const upsertMutation = useUpsertCartItem();
  const removeMutation = useRemoveCartItem();
  const checkoutMutation = useCheckoutCart();

  const items = data?.items ?? [];
  const totalPrice = data?.totalPrice ?? 0;
  const totalItems = data?.totalItems ?? 0;

  const addItem = async (product: { productId: number }) => {
    const existing = items.find((item) => item.productId === product.productId);
    const quantity = existing ? existing.quantity + 1 : 1;
    await upsertMutation.mutateAsync({ productId: product.productId, quantity });
    message.success("Added to cart");
  };

  const removeItem = async (productId: number) => {
    await removeMutation.mutateAsync(productId);
  };

  const updateQty = async (productId: number, qty: number) => {
    if (qty <= 0) {
      await removeItem(productId);
      return;
    }
    await upsertMutation.mutateAsync({ productId, quantity: qty });
  };

  const clearCart = async () => {
    await Promise.all(items.map((item) => removeMutation.mutateAsync(item.productId)));
  };

  const checkout = async (): Promise<CheckoutResult> => {
    const result = await checkoutMutation.mutateAsync();
    return { orderId: result.orderId, totalAmount: result.totalAmount };
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        checkout,
        totalPrice,
        totalItems,
        isLoading,
        isCheckoutLoading: checkoutMutation.isPending,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
