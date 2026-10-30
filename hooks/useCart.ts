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
            const variant = product?.variants?.find((candidate) => candidate.id === item.variantId);
            return {
              productId: item.productId,
              variantId: item.variantId,
              name: product?.name ?? 'Unknown product',
              variantName: variant?.name ?? 'Unavailable type',
              price: variant?.price ?? item.priceAtAdd ?? product?.price ?? 0,
              priceUpdated: item.priceAtAdd !== undefined && variant !== undefined && item.priceAtAdd !== variant.price,
              unavailable: !variant || variant.archived || variant.stock <= 0,
              imageUrl: product?.imageUrl ?? '',
              stockQty: variant?.stock ?? 0,
              qty: item.qty,
              selected: cart.isProductSelected(item.productId, item.variantId),
            } satisfies CartLineItem;
          });
        return {
          seller,
          lines,
          subtotal: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
        };
      });
  }, [cart, sellerById, productById]);

  const selectedGroups: CartSellerGroupInfo[] = useMemo(
    () =>
      groups
        .map((group) => {
          const lines = group.lines.filter((line) => line.selected);
          return {
            seller: group.seller,
            lines,
            subtotal: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
          };
        })
        .filter((group) => group.lines.length > 0),
    [groups]
  );

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
    selectedGroups,
    itemCount: cart.itemCount,
    selectedItemCount: cart.selectedItemCount,
    subtotal: cart.subtotal,
    deliveryFee: cart.deliveryFee,
    total: cart.total,
    allSelected: cart.allSelected,
    handleToggleItem: cart.toggleProduct,
    handleToggleGroup: cart.setGroupSelected,
    handleToggleAll: cart.setAllSelected,
    handleQtyChange: cart.updateQty,
    handleRemove: cart.removeItem,
    handleClear: cart.clearCart,
  };
}
