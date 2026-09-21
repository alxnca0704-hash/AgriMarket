'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { App } from 'antd';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { CartItem, Product, Seller } from '@/types/product';
import { toBuyerProduct, toBuyerSeller } from '@/lib/convexSync';
import { clearCart as clearStoredCart, getCart } from '@/lib/mockCart';

interface CartContextValue {
  items: CartItem[];
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addItem: (productId: string, qty?: number) => Promise<void>;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { message } = App.useApp();

  const remoteItems = useQuery(api.cart.getMyCart);
  const addItemMutation = useMutation(api.cart.addItem);
  const updateQtyMutation = useMutation(api.cart.updateQty);
  const removeItemMutation = useMutation(api.cart.removeItem);
  const clearCartMutation = useMutation(api.cart.clearCart);

  const rawStalls = useQuery(api.market.listStalls);
  const rawProducts = useQuery(api.market.listActiveProducts);

  const stallById = useMemo(() => {
    const map = new Map<string, NonNullable<typeof rawStalls>[number]['stall']>();
    (Array.isArray(rawStalls) ? rawStalls : []).forEach(({ stall }) => map.set(stall._id, stall));
    return map;
  }, [rawStalls]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    if (Array.isArray(rawProducts)) {
      for (const raw of rawProducts) {
        const stall = stallById.get(raw.stallId);
        if (!stall) continue;
        map.set(raw._id, toBuyerProduct(raw, stall));
      }
    }
    return map;
  }, [rawProducts, stallById]);

  const sellerById = useMemo(() => {
    const map = new Map<string, Seller>();
    (Array.isArray(rawStalls) ? rawStalls : []).forEach(({ stall, ownerName }) => {
      map.set(stall._id, toBuyerSeller(stall, ownerName));
    });
    return map;
  }, [rawStalls]);

  const migratedRef = useRef(false);

  useEffect(() => {
    if (
      remoteItems === undefined ||
      productById.size === 0 ||
      migratedRef.current
    ) {
      return;
    }
    migratedRef.current = true;
    if (Array.isArray(remoteItems)) {
      const local = getCart();
      if (local.length > 0) {
        local.forEach((item) => {
          if (!productById.has(item.productId)) return;
          addItemMutation({
            productId: item.productId as Id<'products'>,
            qty: item.qty,
          }).catch(() => {});
        });
        clearStoredCart();
      }
    }
  }, [remoteItems, productById, addItemMutation]);

  const items: CartItem[] = useMemo(() => {
    if (!Array.isArray(remoteItems)) return [];
    const next: CartItem[] = [];
    for (const row of remoteItems) {
      const product = productById.get(row.productId);
      if (!product) continue;
      next.push({
        productId: row.productId,
        sellerId: row.stallId,
        qty: Math.min(row.qty, Math.max(1, product.stockQty)),
      });
    }
    return next;
  }, [remoteItems, productById]);

  const addItem = async (productId: string, qty = 1) => {
    try {
      await addItemMutation({ productId: productId as Id<'products'>, qty });
    } catch {
      message.error('Could not add to cart. Please sign in and try again.');
    }
  };

  const updateQty = (productId: string, qty: number) => {
    const product = productById.get(productId);
    const clamped = Math.min(Math.max(1, qty), product?.stockQty ?? qty);
    updateQtyMutation({ productId: productId as Id<'products'>, qty: clamped }).catch(() => {
      message.error('Could not update your cart. Please try again.');
    });
  };

  const removeItem = (productId: string) => {
    removeItemMutation({ productId: productId as Id<'products'> }).catch(() => {
      message.error('Could not remove the item. Please try again.');
    });
  };

  const clearCart = async () => {
    await clearCartMutation({});
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
        isLoading: remoteItems === undefined,
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