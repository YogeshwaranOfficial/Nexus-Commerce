// stores/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'seller' | 'admin';
  isEmailVerified: boolean;
  loyaltyPoints: number;
  walletBalance: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      updateUser: (data) => set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'nexus-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }),
    },
  ),
);

// ─── Cart Store ───────────────────────────────────────────
export interface CartItem {
  _id?: string;
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  sku: string;
  stock: number;
  attributes?: Record<string, string>;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  toggleCart: () => void;
  closeCart: () => void;
}

// ─── Cart selectors (computed outside store) ───────────────
export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const cartItemCount = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,
      isOpen: false,

      addItem: (newItem) => set((s) => {
        const key = `${newItem.productId}:${newItem.variantId || 'default'}`;
        const existing = s.items.find(
          (i) => `${i.productId}:${i.variantId || 'default'}` === key,
        );
        if (existing) {
          return {
            items: s.items.map((i) =>
              `${i.productId}:${i.variantId || 'default'}` === key
                ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.stock) }
                : i,
            ),
            isOpen: true,
          };
        }
        return { items: [...s.items, newItem], isOpen: true };
      }),

      removeItem: (productId, variantId) => set((s) => ({
        items: s.items.filter((i) => !(i.productId === productId && i.variantId === variantId)),
      })),

      updateQuantity: (productId, quantity, variantId) => set((s) => ({
        items: quantity <= 0
          ? s.items.filter((i) => !(i.productId === productId && i.variantId === variantId))
          : s.items.map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, quantity: Math.min(quantity, i.stock) }
                : i,
            ),
      })),

      clearCart: () => set({ items: [], couponCode: null, couponDiscount: 0 }),
      applyCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'nexus-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode, couponDiscount: s.couponDiscount }),
    },
  ),
);

// ─── UI Store ─────────────────────────────────────────────
interface UIState {
  theme: 'light' | 'dark' | 'system';
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  notification: { id: string; type: 'success' | 'error' | 'info'; message: string } | null;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleSearch: () => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      isMobileMenuOpen: false,
      isSearchOpen: false,
      notification: null,
      setTheme: (theme) => set({ theme }),
      toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
      toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
      showNotification: (type, message) => set({ notification: { id: Date.now().toString(), type, message } }),
      clearNotification: () => set({ notification: null }),
    }),
    { name: 'nexus-ui', partialize: (s) => ({ theme: s.theme }) },
  ),
);
