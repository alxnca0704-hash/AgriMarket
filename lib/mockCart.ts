import { CartItem } from '@/types/product';

const STORAGE_KEY = 'agrimarket_cart';
const EMPTY_CART: CartItem[] = [];

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearCart(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

const cartListeners = new Set<() => void>();
let cartSnapshot: CartItem[] | null = null;

export function getCartSnapshot(): CartItem[] {
  if (cartSnapshot === null) cartSnapshot = getCart();
  return cartSnapshot;
}

export function getEmptyCartSnapshot(): CartItem[] {
  return EMPTY_CART;
}

export function subscribeCart(listener: () => void): () => void {
  cartListeners.add(listener);
  return () => {
    cartListeners.delete(listener);
  };
}

export function updateCart(next: CartItem[]): void {
  cartSnapshot = next;
  saveCart(next);
  cartListeners.forEach((listener) => listener());
}