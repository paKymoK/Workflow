import { useRef, useState } from "react";
import { Drawer, Button, InputNumber, Empty, Divider, Spin } from "antd";
import { DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../../context/CartContext";
import { createPayment } from "../../api/shopApi";
import { cartKeys } from "../../hooks/useCart";
import { productKeys } from "../../hooks/useProducts";
import { message } from "antd";

const SSE_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function formatError(error: unknown) {
  const axiosError = error as { response?: { data?: { status?: { message?: string } } } };
  return axiosError?.response?.data?.status?.message || "Operation failed";
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQty, totalPrice, clearCart, checkout, isLoading, isCheckoutLoading } =
    useCart();
  const queryClient = useQueryClient();

  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const cleanupPayment = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsWaitingForPayment(false);
  };

  const openSseStream = (orderId: string) => {
    const url = `${SSE_BASE_URL}/shop-service/v1/payment/stream/${orderId}`;
    const sse = new EventSource(url);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      if (event.data === "paid") {
        cleanupPayment();
        queryClient.invalidateQueries({ queryKey: cartKeys.all() });
        queryClient.invalidateQueries({ queryKey: productKeys.all() });
        message.success("Payment successful! Order confirmed.");
        onClose();
      }
    };

    sse.addEventListener("timeout", () => {
      cleanupPayment();
      queryClient.invalidateQueries({ queryKey: cartKeys.all() });
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
      message.error("Payment was not completed. Your cart has been restored.");
    });

    sse.onerror = () => {
      cleanupPayment();
      queryClient.invalidateQueries({ queryKey: cartKeys.all() });
      queryClient.invalidateQueries({ queryKey: productKeys.all() });
      message.error("Payment was not completed. Your cart has been restored.");
    };
  };

  const onCheckout = async () => {
    try {
      const { orderId } = await checkout();
      const { paymentUrl } = await createPayment(orderId);
      popupRef.current = window.open(paymentUrl, "vnpay", "width=800,height=600");
      setIsWaitingForPayment(true);
      openSseStream(orderId);
    } catch (error) {
      message.error(formatError(error));
      setIsWaitingForPayment(false);
    }
  };

  const onCancelPayment = () => {
    cleanupPayment();
    queryClient.invalidateQueries({ queryKey: cartKeys.all() });
    queryClient.invalidateQueries({ queryKey: productKeys.all() });
  };

  const onClearCart = async () => {
    try {
      await clearCart();
    } catch (error) {
      message.error(formatError(error));
    }
  };

  return (
    <Drawer
      title="Cart"
      open={open}
      onClose={() => {
        if (!isWaitingForPayment) onClose();
      }}
      closable={!isWaitingForPayment}
      width={360}
      loading={isLoading}
      footer={
        <div className="space-y-3">
          {isWaitingForPayment ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Spin indicator={<LoadingOutlined spin />} size="small" />
                <span>Waiting for payment...</span>
              </div>
              <Button block onClick={onCancelPayment}>
                Cancel Payment
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span>${Number(totalPrice).toFixed(2)}</span>
              </div>
              <Button
                type="primary"
                block
                disabled={items.length === 0}
                loading={isCheckoutLoading}
                onClick={onCheckout}
              >
                Checkout
              </Button>
              {items.length > 0 && (
                <Button block danger onClick={onClearCart}>
                  Clear Cart
                </Button>
              )}
            </>
          )}
        </div>
      }
    >
      {items.length === 0 ? (
        <Empty description="Your cart is empty" className="mt-16" />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-3 items-start">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-16 h-16 object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs opacity-60">${Number(item.unitPrice).toFixed(2)} each</p>
                <div className="flex items-center gap-2 mt-1">
                  <InputNumber
                    min={1}
                    max={99}
                    size="small"
                    value={item.quantity}
                    disabled={isWaitingForPayment}
                    onChange={async (val) => {
                      try {
                        await updateQty(item.productId, val ?? 1);
                      } catch (error) {
                        message.error(formatError(error));
                      }
                    }}
                    className="w-16"
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    disabled={isWaitingForPayment}
                    onClick={async () => {
                      try {
                        await removeItem(item.productId);
                      } catch (error) {
                        message.error(formatError(error));
                      }
                    }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold flex-shrink-0">
                ${Number(item.lineTotal).toFixed(2)}
              </span>
            </div>
          ))}
          <Divider />
        </div>
      )}
    </Drawer>
  );
}
