import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { wishlistApi } from '../services/api';
import { Product } from '../types';
import { useCartStore, useAuthStore, useUIStore } from '../stores';
import { formatCurrency, calcDiscount, getApiError } from '../utils';
import { StarRating, EmptyState, ProductCardSkeleton } from '../components/ui/index';
import { useSEO } from '../hooks/useSEO';

export default function WishlistPage() {
  useSEO({ title: 'My Wishlist', noIndex: true });
  const qc = useQueryClient();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { showNotification } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.get().then((r) => r.data.data.products as Product[]),
    enabled: isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      showNotification('success', 'Removed from wishlist');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const handleAddToCart = (product: Product) => {
    const price = product.isFlashSale && product.flashSalePrice ? product.flashSalePrice : product.basePrice;
    addItem({
      productId: product._id,
      name: product.name,
      image: product.images[0]?.url || '',
      price,
      quantity: 1,
      sku: product.sku,
      stock: product.stock,
    });
    showNotification('success', 'Added to cart');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={<Heart size={32} />}
          title="Sign in to view wishlist"
          description="Save your favourite products and come back to them later."
          action={<Link to="/login" className="btn-primary">Sign In</Link>}
          className="min-h-[40vh]"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-8">
        <Heart size={22} className="text-red-500 fill-red-500" />
        <h1 className="text-2xl font-black text-ink dark:text-ink-dark">
          Wishlist <span className="text-ink-muted dark:text-ink-muted-dark font-normal text-lg">({data?.length ?? 0})</span>
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={<Heart size={32} />}
          title="Your wishlist is empty"
          description="Add products you love by clicking the heart icon on any product."
          action={
            <Link to="/products" className="btn-primary">
              Explore Products <ArrowRight size={16} />
            </Link>
          }
          className="min-h-[40vh]"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {data.map((product) => {
            const price = product.isFlashSale && product.flashSalePrice ? product.flashSalePrice : product.basePrice;
            const original = product.compareAtPrice ?? (product.isFlashSale ? product.basePrice : undefined);
            const discount = original ? calcDiscount(original, price) : 0;
            const inStock = product.stock > 0;

            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                layout
                className="card-hover overflow-hidden group"
              >
                {/* Image */}
                <div className="relative aspect-square bg-surface-card dark:bg-surface-card-dark overflow-hidden">
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 z-10 badge bg-green-500 text-white text-2xs">{discount}% OFF</span>
                  )}
                  <Link to={`/products/${product.slug}`}>
                    <img
                      src={product.images[0]?.url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <button
                    onClick={() => removeMutation.mutate(product._id)}
                    disabled={removeMutation.isPending}
                    className="absolute top-2 right-2 z-10 w-8 h-8 rounded-xl bg-white/90 dark:bg-[#13131a]/90 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3.5">
                  {product.brand && (
                    <p className="text-2xs font-semibold text-brand-500 uppercase tracking-wider mb-0.5">{product.brand}</p>
                  )}
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="text-sm font-medium text-ink dark:text-ink-dark line-clamp-2 hover:text-brand-500 transition-colors mb-1.5">
                      {product.name}
                    </h3>
                  </Link>
                  <StarRating rating={product.ratings.average} count={product.ratings.count} size={12} />
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-ink dark:text-ink-dark">{formatCurrency(price)}</span>
                      {original && <span className="text-xs text-ink-muted dark:text-ink-muted-dark line-through">{formatCurrency(original)}</span>}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!inStock}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        inStock
                          ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm'
                          : 'bg-surface-card dark:bg-surface-card-dark text-ink-muted dark:text-ink-muted-dark cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag size={15} />
                    </button>
                  </div>
                  {!inStock && <p className="text-2xs text-red-500 mt-1">Out of stock</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
