import mongoose, { Document, Schema, Model } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'stripe' | 'razorpay' | 'cod' | 'wallet';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  variantId?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
  sku: string;
  attributes?: Record<string, string>;
}

export interface ITrackingEvent {
  status: OrderStatus;
  message: string;
  timestamp: Date;
  location?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
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
    gatewayOrderId?: string;
    paidAt?: Date;
    refundAmount?: number;
    refundedAt?: Date;
  };
  status: OrderStatus;
  tracking: ITrackingEvent[];
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  variantId: String,
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
  sku: { type: String, required: true },
  attributes: { type: Map, of: String },
}, { _id: false });

const TrackingEventSchema = new Schema<ITrackingEvent>({
  status: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  location: String,
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, unique: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [OrderItemSchema], required: true },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  pricing: {
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    walletUsed: { type: Number, default: 0, min: 0 },
    couponCode: String,
    couponDiscount: { type: Number, default: 0, min: 0 },
  },
  payment: {
    method: { type: String, enum: ['stripe', 'razorpay', 'cod', 'wallet'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'], default: 'pending' },
    transactionId: String,
    gatewayOrderId: String,
    paidAt: Date,
    refundAmount: Number,
    refundedAt: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded'],
    default: 'pending',
    index: true,
  },
  tracking: [TrackingEventSchema],
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  notes: String,
  invoiceUrl: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ─── Indexes ──────────────────────────────────────────────
OrderSchema.index({ user: 1, status: 1, createdAt: -1 });
OrderSchema.index({ 'payment.status': 1 });
OrderSchema.index({ createdAt: -1 });

// ─── Auto-generate order number ───────────────────────────
OrderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `NX-${timestamp}-${random}`;
  }
  next();
});

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
