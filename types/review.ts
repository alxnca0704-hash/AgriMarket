export interface Review {
  id: string;
  orderId: string;
  productId?: string;
  productName?: string;
  buyerId: string;
  sellerId: string;
  stallId: string;
  buyerName: string;
  rating: number;
  comment: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}
