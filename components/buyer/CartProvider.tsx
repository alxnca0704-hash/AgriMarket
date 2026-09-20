'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CartItem, Product, Seller } from '@/types/product';
import { MOCK_CATALOG } from '@/lib/mockCatalog';
import { getCart, saveCart, clearCart as clearStoredCart } from '@/lib/mockCart';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addItem: (productId: string, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() =>
    typeof window === 'undefined' ? [] : getCart()
  );

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    MOCK_CATALOG.products.forEach((p) => map.set(p.id, p));
    return map;
  }, []);

  const sellerById = useMemo(() => {
    const map = new Map<string, Seller>();
    MOCK_CATALOG.sellers.forEach((s) => map.set(s.id, s));
    return map;
  }, []);

  const addItem = (productId: string, qty = 1) => {
    const product = productById.get(productId);
    if (!product) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        const nextQty = Math.min(existing.qty + qty, product.stockQty);
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: nextQty } : i
        );
      }
      return [...prev, { productId, sellerId: product.sellerId, qty: Math.min(qty, product.stockQty) }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    const product = productById.get(productId);
    const clamped = Math.min(Math.max(1, qty), product?.stockQty ?? qty);
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: clamped } : i))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
    clearStoredCart();
  };

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  const subtotal = items.reduce((sum, i) => {
    const product = productById.get(i.productId);
    return sum + (product ? product.price * i.qty : 0);
  }, 0);

  const sellerIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.sellerId))),
    [items]
  );

  const deliveryFee = sellerIds.reduce((sum, id) => {
    const seller = sellerById.get(id);
    return sum + (seller ? seller.deliveryFeePeso : 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        addItem,
        updateQty,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return ctx;
}