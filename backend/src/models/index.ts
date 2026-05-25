// ─────────────────────────────────────────────────────────
// models/Category.model.ts
// ─────────────────────────────────────────────────────────
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: { url: string; publicId: string };
  parent?: mongoose.Types.ObjectId;
  level: number; // 0 = root, 1 = subcategory, etc.
  isActive: boolean;
  sortOrder: number;
  seo: { metaTitle?: string; metaDescription?: string };
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: String,
  image: { url: String, publicId: String },
  parent: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
  level: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0 },
  seo: { metaTitle: String, metaDescription: String },
}, { timestamps: true, toJSON: { virtuals: true } });

CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

export const Category: Model<ICategory> = mongoose.model<ICategory>('Category', CategorySchema);

// ─────────────────────────────────────────────────────────
// models/Review.model.ts
// ─────────────────────────────────────────────────────────
export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  rating: number;
  title: string;
  body: string;
  images: { url: string; publicId: string }[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulVotes: mongoose.Types.ObjectId[];
  sellerReply?: { message: string; repliedAt: Date };
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxlength: 100 },
  body: { type: String, required: true, maxlength: 2000 },
  images: [{ url: String, publicId: String }],
  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false, index: true },
  helpfulVotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  sellerReply: { message: String, repliedAt: Date },
}, { timestamps: true });

ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.index({ product: 1, isApproved: 1, rating: -1 });

export const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);

// ─────────────────────────────────────────────────────────
// models/Cart.model.ts
// ─────────────────────────────────────────────────────────
export interface ICartItem {
  product: mongoose.Types.ObjectId;
  variantId?: string;
  quantity: number;
  price: number; // snapshot at time of add
  name: string;
  image: string;
  sku: string;
  attributes?: Record<string, string>;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  couponCode?: string;
  couponDiscount?: number;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: String,
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true, min: 0 },
  name: { type: String, required: true },
  image: { type: String, required: true },
  sku: { type: String, required: true },
  attributes: { type: Map, of: String },
}, { _id: true });

const CartSchema = new Schema<ICart>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  items: [CartItemSchema],
  couponCode: String,
  couponDiscount: { type: Number, default: 0 },
}, { timestamps: true });

export const Cart: Model<ICart> = mongoose.model<ICart>('Cart', CartSchema);

// ─────────────────────────────────────────────────────────
// models/Coupon.model.ts
// ─────────────────────────────────────────────────────────
export type DiscountType = 'percentage' | 'fixed' | 'free_shipping';

export interface ICoupon extends Document {
  code: string;
  type: DiscountType;
  value: number; // % or flat amount
  minOrderValue: number;
  maxDiscount?: number; // cap for percentage
  usageLimit?: number;
  usedCount: number;
  usedBy: mongoose.Types.ObjectId[];
  applicableCategories: mongoose.Types.ObjectId[];
  applicableProducts: mongoose.Types.ObjectId[];
  isActive: boolean;
  expiresAt: Date;
  description?: string;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  type: { type: String, enum: ['percentage', 'fixed', 'free_shipping'], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrderValue: { type: Number, default: 0, min: 0 },
  maxDiscount: Number,
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  isActive: { type: Boolean, default: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  description: String,
}, { timestamps: true });

export const Coupon: Model<ICoupon> = mongoose.model<ICoupon>('Coupon', CouponSchema);

// ─────────────────────────────────────────────────────────
// models/Wishlist.model.ts
// ─────────────────────────────────────────────────────────
export interface IWishlist extends Document {
  user: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

export const Wishlist: Model<IWishlist> = mongoose.model<IWishlist>('Wishlist', WishlistSchema);

// ─────────────────────────────────────────────────────────
// models/Notification.model.ts
// ─────────────────────────────────────────────────────────
export type NotificationType = 'order' | 'payment' | 'promo' | 'review' | 'stock' | 'system';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['order', 'payment', 'promo', 'review', 'stock', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: String,
  isRead: { type: Boolean, default: false, index: true },
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema);
