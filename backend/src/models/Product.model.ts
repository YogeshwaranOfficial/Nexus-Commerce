import { Types } from "mongoose";
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProductImage {
  url: string;
  publicId: string;
  alt?: string;
}

export interface IVariant {
  _id?: Types.ObjectId;
  sku: string;
  name: string; // e.g. "Red / XL"
  attributes: Record<string, string>; // { color: 'Red', size: 'XL' }
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: IProductImage[];
  weight?: number;
}

export interface IProduct extends Document {
  seller: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: IProductImage[];
  variants: IVariant[];
  basePrice: number;
  compareAtPrice?: number;
  stock: number; // total stock across variants
  sku: string;
  barcode?: string;
  tags: string[];
  brand?: string;
  attributes: Record<string, string[]>; // { color: ['Red', 'Blue'], size: ['S', 'M', 'L'] }
  ratings: {
    average: number;
    count: number;
    distribution: Record<string, number>; // { '5': 100, '4': 80, ... }
  };
  isPublished: boolean;
  isFeatured: boolean;
  isFlashSale: boolean;
  flashSalePrice?: number;
  flashSaleEndsAt?: Date;
  shipping: {
    weight: number; // grams
    dimensions: { length: number; width: number; height: number }; // cm
    isFreeShipping: boolean;
    processingTime: number; // days
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  analytics: {
    views: number;
    wishlistCount: number;
    salesCount: number;
  };
  returnPolicy?: string;
  warranty?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  alt: String,
}, { _id: false });

const VariantSchema = new Schema<IVariant>({
  sku: { type: String, required: true },
  name: { type: String, required: true },
  attributes: { type: Map, of: String },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  images: [ImageSchema],
  weight: Number,
});

const ProductSchema = new Schema<IProduct>({
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  subcategory: { type: Schema.Types.ObjectId, ref: 'Category' },
  name: { type: String, required: true, trim: true, maxlength: 300 },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  shortDescription: { type: String, maxlength: 500 },
  images: { type: [ImageSchema], required: true },
  variants: [VariantSchema],
  basePrice: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0, index: true },
  sku: { type: String, required: true, unique: true },
  barcode: String,
  tags: { type: [String], index: true },
  brand: { type: String, index: true },
  attributes: { type: Map, of: [String] },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    distribution: { type: Map, of: Number, default: {} },
  },
  isPublished: { type: Boolean, default: false, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  isFlashSale: { type: Boolean, default: false, index: true },
  flashSalePrice: { type: Number, min: 0 },
  flashSaleEndsAt: Date,
  shipping: {
    weight: { type: Number, default: 500 },
    dimensions: {
      length: { type: Number, default: 10 },
      width: { type: Number, default: 10 },
      height: { type: Number, default: 10 },
    },
    isFreeShipping: { type: Boolean, default: false },
    processingTime: { type: Number, default: 2 },
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
  },
  analytics: {
    views: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
  },
  returnPolicy: String,
  warranty: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// ─── Compound indexes ─────────────────────────────────────
ProductSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' }, {
  weights: { name: 10, tags: 5, brand: 3, description: 1 },
  name: 'product_text_index',
});
ProductSchema.index({ basePrice: 1, 'ratings.average': -1 });
ProductSchema.index({ isPublished: 1, isFeatured: -1 });
ProductSchema.index({ category: 1, isPublished: 1, basePrice: 1 });
ProductSchema.index({ seller: 1, isPublished: 1 });

// ─── Virtual: effectivePrice ───────────────────────────────
ProductSchema.virtual('effectivePrice').get(function (this: IProduct) {
  if (this.isFlashSale && this.flashSalePrice) return this.flashSalePrice;
  return this.basePrice;
});

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
