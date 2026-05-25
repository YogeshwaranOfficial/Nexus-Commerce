// ─── Product ──────────────────────────────────────────────
export interface ProductImage {
  url: string;
  publicId: string;
  alt?: string;
}

export interface Variant {
  _id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: ProductImage[];
}

export interface Product {
  _id: string;
  seller: { _id: string; name: string; avatar?: string };
  category: { _id: string; name: string; slug: string };
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: ProductImage[];
  variants: Variant[];
  basePrice: number;
  compareAtPrice?: number;
  flashSalePrice?: number;
  flashSaleEndsAt?: string;
  isFlashSale: boolean;
  stock: number;
  sku: string;
  brand?: string;
  tags: string[];
  attributes: Record<string, string[]>;
  ratings: { average: number; count: number; distribution: Record<string, number> };
  isPublished: boolean;
  isFeatured: boolean;
  effectivePrice: number;
  analytics: { views: number; wishlistCount: number; salesCount: number };
  createdAt: string;
}

// ─── Category ─────────────────────────────────────────────
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { url: string; publicId: string };
  parent?: string;
  level: number;
  children?: Category[];
}

// ─── Order ────────────────────────────────────────────────
export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing' | 'shipped'
  | 'out_for_delivery' | 'delivered' | 'cancelled'
  | 'return_requested' | 'returned' | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'stripe' | 'razorpay' | 'cod' | 'wallet';

export interface OrderItem {
  product: string | Product;
  seller: string;
  variantId?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
  sku: string;
  attributes?: Record<string, string>;
}

export interface TrackingEvent {
  status: OrderStatus;
  message: string;
  timestamp: string;
  location?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | { _id: string; name: string; email: string; avatar?: string };
  items: OrderItem[];
  shippingAddress: Address;
  pricing: {
    subtotal: number;
    discount: number;
    shippingFee: number;
    tax: number;
    total: number;
    walletUsed: number;
    couponCode?: string;
    couponDiscount: number;
  };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    paidAt?: string;
  };
  status: OrderStatus;
  tracking: TrackingEvent[];
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
}

// ─── Address ──────────────────────────────────────────────
export interface Address {
  _id?: string;
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

// ─── Review ───────────────────────────────────────────────
export interface Review {
  _id: string;
  product: string;
  user: { _id: string; name: string; avatar?: string };
  rating: number;
  title: string;
  body: string;
  images: { url: string; publicId: string }[];
  isVerifiedPurchase: boolean;
  helpfulVotes: string[];
  sellerReply?: { message: string; repliedAt: string };
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────
export interface Notification {
  _id: string;
  type: 'order' | 'payment' | 'promo' | 'review' | 'stock' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Pagination ───────────────────────────────────────────
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Filters ─────────────────────────────────────────────
export interface ProductFilters {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  isFlashSale?: boolean;
  search?: string;
}
