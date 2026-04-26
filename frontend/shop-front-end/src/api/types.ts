export interface ResultMessage<T> {
  status: { code: string; message: string };
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ProductDetail {
  data: string;
}

export interface ShopProduct {
  id: number;
  name: string;
  type: string;
  imageUrl: string;
  detail: ProductDetail | null;
  stock: number;
  price: number;
  currency: string;
}

export interface FilterProductRequest {
  page: number;
  size: number;
  sortBy?: "id" | "price" | "name";
  sortDir?: "asc" | "desc";
}

export interface CartItem {
  productId: number;
  name: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  lineTotal: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface UpsertCartItemRequest {
  productId: number;
  quantity: number;
}

export interface CheckoutResponse {
  cartId: number;
  orderId: string;
  totalAmount: number;
  currency: string;
  totalItems: number;
}

export interface PaymentCreateResponse {
  orderId: string;
  paymentUrl: string;
}
