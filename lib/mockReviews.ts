import { SellerReview, SellerReviewReply } from '@/types/seller';
import { MOCK_CATALOG } from '@/lib/mockCatalog';
import { getListingsSnapshot } from '@/lib/mockListings';
import { DEMO_SELLER_ID } from '@/lib/mockStall';

const STORAGE_KEY = 'agrimarket_seller_replies';

function readReplies(): SellerReviewReply[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SellerReviewReply[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReplies(replies: SellerReviewReply[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(replies));
}

const reviewsListeners = new Set<() => void>();
let repliesSnapshot: Record<string, SellerReviewReply> | null = null;

function getReplyMap(): Record<string, SellerReviewReply> {
  if (repliesSnapshot === null) {
    repliesSnapshot = readReplies().reduce(
      (acc, reply) => ({ ...acc, [reply.reviewId]: reply }),
      {} as Record<string, SellerReviewReply>
    );
  }
  return repliesSnapshot;
}

export function subscribeReviews(listener: () => void): () => void {
  reviewsListeners.add(listener);
  return () => {
    reviewsListeners.delete(listener);
  };
}

function updateReplyMap(next: Record<string, SellerReviewReply>): void {
  repliesSnapshot = next;
  writeReplies(Object.values(next));
  reviewsListeners.forEach((listener) => listener());
}

export function getSellerReviews(): SellerReview[] {
  const productIds = getListingsSnapshot().map((l) => l.id);
  const productNameById = new Map(
    [...getListingsSnapshot(), ...MOCK_CATALOG.products].map((p) => [p.id, p.name])
  );
  const replyMap = getReplyMap();

  return MOCK_CATALOG.reviews
    .filter((r) => productIds.includes(r.productId))
    .map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: productNameById.get(r.productId) ?? 'Product',
      author: r.author,
      rating: r.rating,
      comment: r.comment,
      date: r.date,
      reply: replyMap[r.id],
    }));
}

export function submitReviewReply(reviewId: string, reply: string): void {
  const clean = reply.trim();
  if (!clean) return;
  const next = {
    ...getReplyMap(),
    [reviewId]: {
      reviewId,
      sellerId: DEMO_SELLER_ID,
      reply: clean,
      repliedAt: new Date().toISOString(),
    },
  };
  updateReplyMap(next);
}