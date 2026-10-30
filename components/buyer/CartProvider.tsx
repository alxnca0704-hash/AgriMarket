'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  selectedItemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  selectedLines: Array<{ productId: string; variantId: string }>;
  allSelected: boolean;
  isProductSelected: (productId: string, variantId: string) => boolean;
  toggleProduct: (productId: string, variantId: string) => void;
  setGroupSelected: (sellerId: string, selected: boolean) => void;
  setAllSelected: (selected: boolean) => void;
  addItem: (productId: string, variantId: string, qty?: number) => Promise<void>;
  updateQty: (productId: string, variantId: string, qty: number) => void;
  removeItem: (productId: string, variantId: string) => void;
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
            variantId: productById.get(item.productId)?.variants?.find((variant) => !variant.archived)?.id ?? `legacy-${item.productId}`,
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
        variantId: row.variantId ?? `legacy-${row.productId}`,
        priceAtAdd: row.priceAtAdd,
        sellerId: row.stallId,
        qty: row.qty,
      });
    }
    return next;
  }, [remoteItems, productById]);

  // Selection defaults to every cart item; deselected product IDs are tracked
  // so newly added items are selected automatically. Stale IDs for removed
  // items are ignored because selection is always derived from current items.
  const [deselectedIds, setDeselectedIds] = useState<ReadonlySet<string>>(
    () => new Set<string>()
  );

  const selectedItems = useMemo(
    () => items.filter((i) => !deselectedIds.has(`${i.productId}:${i.variantId}`)),
    [items, deselectedIds]
  );

  const isProductSelected = useCallback(
    (productId: string, variantId: string) => !deselectedIds.has(`${productId}:${variantId}`),
    [deselectedIds]
  );

  const toggleProduct = useCallback((productId: string, variantId: string) => {
    const key = `${productId}:${variantId}`;
    setDeselectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const setGroupSelected = useCallback(
    (sellerId: string, selected: boolean) => {
      setDeselectedIds((prev) => {
        const next = new Set(prev);
        for (const item of items) {
          if (item.sellerId !== sellerId) continue;
          const key = `${item.productId}:${item.variantId}`;
          if (selected) next.delete(key);
          else next.add(key);
        }
        return next;
      });
    },
    [items]
  );

  const setAllSelected = useCallback(
    (selected: boolean) => {
      if (selected) {
        setDeselectedIds(new Set<string>());
        return;
      }
      setDeselectedIds(new Set(items.map((i) => `${i.productId}:${i.variantId}`)));
    },
    [items]
  );

  const addItem = async (productId: string, variantId: string, qty = 1) => {
    try {
      await addItemMutation({ productId: productId as Id<'products'>, variantId, qty });
    } catch {
      message.error('Could not add to cart. Please sign in and try again.');
    }
  };

  const updateQty = (productId: string, variantId: string, qty: number) => {
    const product = productById.get(productId);
    const variant = product?.variants?.find((candidate) => candidate.id === variantId);
    const clamped = Math.min(Math.max(1, qty), variant?.stock ?? qty);
    updateQtyMutation({ productId: productId as Id<'products'>, variantId, qty: clamped }).catch(() => {
      message.error('Could not update your cart. Please try again.');
    });
  };

  const removeItem = (productId: string, variantId: string) => {
    removeItemMutation({ productId: productId as Id<'products'>, variantId }).catch(() => {
      message.error('Could not remove the item. Please try again.');
    });
  };

  const clearCart = async () => {
    await clearCartMutation({});
  };

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  const selectedItemCount = selectedItems.reduce((sum, i) => sum + i.qty, 0);

  const subtotal = selectedItems.reduce((sum, i) => {
    const product = productById.get(i.productId);
    const variant = product?.variants?.find((candidate) => candidate.id === i.variantId);
    return sum + (variant ? variant.price * i.qty : 0);
  }, 0);

  const sellerIds = useMemo(
    () => Array.from(new Set(selectedItems.map((i) => i.sellerId))),
    [selectedItems]
  );

  const deliveryFee = sellerIds.reduce((sum, id) => {
    const seller = sellerById.get(id);
    return sum + (seller ? seller.deliveryFeePeso : 0);
  }, 0);

  const selectedLines = useMemo(
    () => selectedItems.map(({ productId, variantId }) => ({ productId, variantId })),
    [selectedItems]
  );

  const allSelected = items.length > 0 && selectedItems.length === items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading: remoteItems === undefined,
        itemCount,
        selectedItemCount,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        selectedLines,
        allSelected,
        isProductSelected,
        toggleProduct,
        setGroupSelected,
        setAllSelected,
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
