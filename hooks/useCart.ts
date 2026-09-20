'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { MOCK_CATALOG } from '@/lib/mockCatalog';
import { DEMO_BUYER, getSessionUserSnapshot, subscribeSessionUser } from '@/lib/mockSession';
import { useCartContext } from '@/components/buyer/CartProvider';
import { CartLineItem } from '@/components/buyer/CartSellerGroup';
import { Seller } from '@/types/product';

export interface CartSellerGroupInfo {
  seller: Seller;
  lines: CartLineItem[];
  subtotal: number;
}

export function useCart() {
  const cart = useCartContext();

  const groups: CartSellerGroupInfo[] = useMemo(() => {
    return MOCK_CATALOG.sellers
      .filter((seller) => cart.items.some((i) => i.sellerId === seller.id))
      .map((seller) => {
        const lines = cart.items
          .filter((i) => i.sellerId === seller.id)
          .map((item) => {
            const product = MOCK_CATALOG.products.find((p) => p.id === item.productId);
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
  }, [cart.items]);

  const user = useSyncExternalStore(
    subscribeSessionUser,
    getSessionUserSnapshot,
    () => DEMO_BUYER
  );

  return {
    isLoading: false,
    error: null,
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