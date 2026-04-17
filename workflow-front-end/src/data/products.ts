export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
};

export const CATEGORIES = ["All", "Electronics", "Clothing", "Books", "Accessories"];

export const products: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    description: "Premium noise-cancelling wireless headphones with 30-hour battery life and studio-quality sound. Compatible with all Bluetooth devices.",
    price: 299,
    image: "https://picsum.photos/seed/headphones/600/400",
    category: "Electronics",
    stock: 12,
  },
  {
    id: "2",
    name: "Mechanical Keyboard",
    description: "Compact TKL mechanical keyboard with RGB backlight and tactile switches. Built for precision and long typing sessions.",
    price: 149,
    image: "https://picsum.photos/seed/keyboard/600/400",
    category: "Electronics",
    stock: 3,
  },
  {
    id: "3",
    name: "Smart Watch",
    description: "Feature-packed smartwatch with health monitoring, GPS, and 7-day battery. Water-resistant up to 50 metres.",
    price: 399,
    image: "https://picsum.photos/seed/smartwatch/600/400",
    category: "Electronics",
    stock: 0,
  },
  {
    id: "4",
    name: "Graphic Tee",
    description: "100% organic cotton unisex tee with a minimalist circuit-board print. Available in dark and light colourways.",
    price: 39,
    image: "https://picsum.photos/seed/tshirt/600/400",
    category: "Clothing",
    stock: 20,
  },
  {
    id: "5",
    name: "Tech Hoodie",
    description: "Heavyweight fleece hoodie with a hidden cable management channel and thumb holes. Perfect for long coding sessions.",
    price: 89,
    image: "https://picsum.photos/seed/hoodie/600/400",
    category: "Clothing",
    stock: 0,
  },
  {
    id: "6",
    name: "Clean Code",
    description: "A handbook of agile software craftsmanship by Robert C. Martin. Essential reading for every developer.",
    price: 45,
    image: "https://picsum.photos/seed/cleancode/600/400",
    category: "Books",
    stock: 2,
  },
  {
    id: "7",
    name: "The Pragmatic Programmer",
    description: "Your journey to mastery — timeless lessons on software development philosophy and best practices.",
    price: 49,
    image: "https://picsum.photos/seed/pragprog/600/400",
    category: "Books",
    stock: 8,
  },
  {
    id: "8",
    name: "Desk Mat XL",
    description: "Extra-large anti-slip desk mat (90×40 cm) with stitched edges. Fits keyboard, mouse, and coffee.",
    price: 35,
    image: "https://picsum.photos/seed/deskmat/600/400",
    category: "Accessories",
    stock: 4,
  },
  {
    id: "9",
    name: "USB-C Hub 7-in-1",
    description: "Slim aluminium hub with HDMI 4K, 3× USB-A, SD card, and 100W PD pass-through.",
    price: 69,
    image: "https://picsum.photos/seed/usbhub/600/400",
    category: "Accessories",
    stock: 15,
  },
];
