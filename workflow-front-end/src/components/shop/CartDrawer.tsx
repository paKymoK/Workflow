import { Drawer, Button, InputNumber, Empty, Divider } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useCart } from "../../context/CartContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();

  return (
    <Drawer
      title="Cart"
      open={open}
      onClose={onClose}
      width={360}
      footer={
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <Button type="primary" block disabled={items.length === 0}>
            Checkout
          </Button>
          {items.length > 0 && (
            <Button block danger onClick={clearCart}>
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
            <div key={item.id} className="flex gap-3 items-start">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs opacity-60">${item.price} each</p>
                <div className="flex items-center gap-2 mt-1">
                  <InputNumber
                    min={1}
                    max={99}
                    size="small"
                    value={item.quantity}
                    onChange={(val) => updateQty(item.id, val ?? 1)}
                    className="w-16"
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(item.id)}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold flex-shrink-0">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <Divider />
        </div>
      )}
    </Drawer>
  );
}
