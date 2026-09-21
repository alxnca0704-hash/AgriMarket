'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toBuyerProduct, toBuyerSeller } from '@/lib/convexSync';
import { DEMO_BUYER, getSessionUserSnapshot, subscribeSessionUser } from '@/lib/mockSession';
import { useCartContext } from '@/components/buyer/CartProvider';
import { CartLineItem } from '@/components/buyer/CartSellerGroup';
import { Product, Seller } from '@/types/product';

export interface CartSellerGroupInfo {
  seller: Seller;
  lines: CartLineItem[];
  subtotal: number;
}

export function useCart() {
  const cart = useCartContext();

  const rawStalls = useQuery(api.market.listStalls);
  const rawProducts = useQuery(api.market.listActiveProducts);

  const stallById = useMemo(() => {
    const map = new Map<string, NonNullable<typeof rawStalls>[number]['stall']>();
    (Array.isArray(rawStalls) ? rawStalls : []).forEach(({ stall }) => map.set(stall._id, stall));
    return map;
  }, [rawStalls]);

  const sellerById = useMemo(() => {
    const map = new Map<string, Seller>();
    (Array.isArray(rawStalls) ? rawStalls : []).forEach(({ stall, ownerName }) => {
      map.set(stall._id, toBuyerSeller(stall, ownerName));
    });
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

  const isLoading =
    rawStalls === undefined || rawProducts === undefined || cart.isLoading;
  const error =
    rawStalls instanceof Error
      ? rawStalls.message
      : rawProducts instanceof Error
        ? rawProducts.message
        : null;

  const groups: CartSellerGroupInfo[] = useMemo(() => {
    return Array.from(sellerById.values())
      .filter((seller) => cart.items.some((i) => i.sellerId === seller.id))
      .map((seller) => {
        const lines = cart.items
          .filter((i) => i.sellerId === seller.id)
          .map((item) => {
            const product = productById.get(item.productId);
            return {
              productId: item.productId,
              name: product?.name ?? 'Unknown product',
              price: product?.price ?? 0,
              unit: product?.unit ?? '',
              imageUrl: product?.imageUrl ?? '',
              stockQty: product?.stockQty ?? 1,
              qty: item.qty,
            } satisfies CartLineItem;
          });
        return {
          seller,
          lines,
          subtotal: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
        };
      });
  }, [cart.items, sellerById, productById]);

  const user = useSyncExternalStore(
    subscribeSessionUser,
    getSessionUserSnapshot,
    () => DEMO_BUYER
  );

  return {
    isLoading,
    error,
    user,
    groups,
    itemCount: cart.itemCount,
    subtotal: cart.subtotal,
    deliveryFee: cart.deliveryFee,
    total: cart.total,
    handleQtyChange: cart.updateQty,
    handleRemove: cart.removeItem,
    handleClear: cart.clearCart,
  };
}