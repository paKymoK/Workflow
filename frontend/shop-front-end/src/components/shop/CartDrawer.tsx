import { Drawer, Button, InputNumber, Empty, Divider } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useCart } from "../../context/CartContext";
import { message } from "antd";

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

  const onCheckout = async () => {
    try {
      await checkout();
      onClose();
    } catch (error) {
      message.error(formatError(error));
    }
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
      onClose={onClose}
      width={360}
      loading={isLoading}
      footer={
        <div className="space-y-3">
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
