import { useParams, useNavigate } from "react-router-dom";
import { Button, InputNumber, Tag } from "antd";
import { ArrowLeftOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useProduct } from "../hooks/useProducts";

function StockInfo({ stock }: { stock: number }) {
  if (stock === 0)
    return <Tag color="error" className="text-sm px-3 py-0.5">Out of Stock</Tag>;
  if (stock <= 4)
    return <Tag color="warning" className="text-sm px-3 py-0.5">Only {stock} left in stock</Tag>;
  return <Tag color="success" className="text-sm px-3 py-0.5">In Stock — {stock} available</Tag>;
}

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading, isError } = useProduct(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-lg opacity-60">Loading product...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-lg opacity-60">Product not found.</p>
        <Button onClick={() => navigate("/shop")}>Back to Shop</Button>
      </div>
    );
  }

  const outOfStock = product.stock === 0;

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addItem({
        id: String(product.id),
        name: product.name,
        price: Number(product.price),
        image: product.imageUrl,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/shop")}
        className="!px-0"
      >
        Back to Shop
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full object-cover border border-[var(--border-subtle)] transition-all ${outOfStock ? "opacity-40 grayscale" : ""}`}
            style={{ maxHeight: 400 }}
          />
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-black/60 text-white text-base font-semibold px-6 py-2 tracking-widest uppercase">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4 flex flex-col justify-center">
          <Tag className="w-fit">{product.type}</Tag>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-3xl font-bold">{product.currency} {product.price}</p>
          <StockInfo stock={product.stock} />
          <p className="opacity-70 leading-relaxed">{product.detail?.data ?? "No description."}</p>

          <div className="flex items-center gap-3 pt-2">
            <InputNumber
              min={1}
              max={product.stock}
              value={qty}
              onChange={(val) => setQty(val ?? 1)}
              className="w-20"
              disabled={outOfStock}
            />
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              size="large"
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>

          {outOfStock && (
            <p className="text-xs opacity-50">
              This item is currently unavailable. Check back later.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
