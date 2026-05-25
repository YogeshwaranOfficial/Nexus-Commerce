import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'seller' | 'admin';

export interface IAddress {
  _id?: mongoose.Types.ObjectId;
  label: string; // Home, Work, etc.
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  addresses: IAddress[];
  loyaltyPoints: number;
  walletBalance: number;
  oauth: {
    googleId?: string;
    githubId?: string;
  };
  otp?: {
    code: string;
    expiresAt: Date;
    purpose: 'email-verify' | 'password-reset' | 'login';
  };
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
  lastLogin?: Date;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    currency: string;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeJSON(): Omit<IUser, 'password' | 'refreshTokens' | 'otp'>;
}

const AddressSchema = new Schema<IAddress>({
  label: { type: String, default: 'Home' },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'IN' },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: { type: String, minlength: 8, select: false },
  avatar: String,
  phone: String,
  role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user', index: true },
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  addresses: [AddressSchema],
  loyaltyPoints: { type: Number, default: 0, min: 0 },
  walletBalance: { type: Number, default: 0, min: 0 },
  oauth: {
    googleId: { type: String, sparse: true, index: true },
    githubId: { type: String, sparse: true, index: true },
  },
  otp: {
    code: String,
    expiresAt: Date,
    purpose: { type: String, enum: ['email-verify', 'password-reset', 'login'] },
  },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  refreshTokens: { type: [String], select: false, default: [] },
  lastLogin: Date,
  preferences: {
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en' },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ─── Indexes ──────────────────────────────────────────────
UserSchema.index({ email: 1, role: 1 });

// ─── Hash password before save ────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Methods ──────────────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.otp;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
