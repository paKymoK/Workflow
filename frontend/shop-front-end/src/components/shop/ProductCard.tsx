import { Card, Button, Tag } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ShopProduct } from "../../api/types";
import { useCart } from "../../context/CartContext";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Tag color="error">Out of Stock</Tag>;
  if (stock <= 4) return <Tag color="warning">Low Stock — {stock} left</Tag>;
  return <Tag color="success">In Stock</Tag>;
}

export default function ProductCard({ product }: { product: ShopProduct }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const outOfStock = product.stock === 0;

  return (
    <Card
      hoverable={!outOfStock}
      cover={
        <div className="relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`h-48 w-full object-cover cursor-pointer transition-all ${outOfStock ? "opacity-40 grayscale cursor-default" : ""}`}
            onClick={() => !outOfStock && navigate(`/${product.id}`)}
          />
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-black/60 text-white text-sm font-semibold px-4 py-1 tracking-widest uppercase">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      }
      actions={[
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          disabled={outOfStock}
          onClick={() => addItem({ productId: product.id })}
        >
          {outOfStock ? "Unavailable" : "Add to Cart"}
        </Button>,
      ]}
    >
      <Card.Meta
        title={
          <span
            className={`transition-opacity ${outOfStock ? "opacity-40 cursor-default" : "cursor-pointer hover:opacity-75"}`}
            onClick={() => !outOfStock && navigate(`/${product.id}`)}
          >
            {product.name}
          </span>
        }
        description={
          <div className="space-y-2 mt-1">
            <div className="flex items-center justify-between">
              <span className={`font-semibold text-base ${outOfStock ? "opacity-40" : ""}`}>
                {product.currency} {product.price}
              </span>
              <span className="text-xs opacity-50 uppercase tracking-wider">{product.type}</span>
            </div>
            <StockBadge stock={product.stock} />
          </div>
        }
      />
    </Card>
  );
}
