import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Eye, Zap } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '../../types';
import { useCartStore, useAuthStore, useUIStore } from '../../stores';
import { wishlistApi } from '../../services/api';
import { formatCurrency, calcDiscount } from '../../utils';
import { StarRating } from '../ui/index';

interface Props {
  product: Product;
  wishlistedIds?: Set<string>;
  onWishlistToggle?: (id: string) => void;
}

export default function ProductCard({ product, wishlistedIds, onWishlistToggle }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { showNotification } = useUIStore();
  const qc = useQueryClient();

  const effectivePrice = product.flashSalePrice && product.isFlashSale ? product.flashSalePrice : product.basePrice;
  const originalPrice = product.compareAtPrice || (product.isFlashSale ? product.basePrice : undefined);
  const discount = originalPrice ? calcDiscount(originalPrice, effectivePrice) : 0;
  const isWishlisted = wishlistedIds?.has(product._id);
  const inStock = product.stock > 0;

  const wishlistMutation = useMutation({
    mutationFn: () =>
      isWishlisted ? wishlistApi.remove(product._id) : wishlistApi.add(product._id),
    onSuccess: () => {
      onWishlistToggle?.(product._id);
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      showNotification('success', isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    },
    onError: () => showNotification('error', 'Failed to update wishlist'),
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    addItem({
      productId: product._id,
      name: product.name,
      image: product.images[0]?.url || '',
      price: effectivePrice,
      quantity: 1,
      sku: product.sku,
      stock: product.stock,
    });
    showNotification('success', 'Added to cart');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { showNotification('info', 'Please sign in to save items'); return; }
    wishlistMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      <Link to={`/products/${product.slug}`} className="block card-hover overflow-hidden">
        {/* Image */}
        <div className="relative aspect-square bg-surface-card dark:bg-surface-card-dark overflow-hidden">
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
            {product.isFlashSale && (
              <span className="flex items-center gap-0.5 badge bg-red-500 text-white text-2xs font-bold">
                <Zap size={10} className="fill-current" /> FLASH
              </span>
            )}
            {discount > 0 && (
              <span className="badge bg-green-500 text-white text-2xs font-bold">{discount}% OFF</span>
            )}
            {!inStock && (
              <span className="badge bg-gray-600 text-white text-2xs">Out of Stock</span>
            )}
          </div>

          {/* Wishlist btn */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isWishlisted
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white/90 dark:bg-[#13131a]/90 text-ink-muted dark:text-ink-muted-dark opacity-0 group-hover:opacity-100 hover:text-red-500 shadow-sm'
            }`}
            aria-label="Wishlist"
          >
            <Heart size={15} className={isWishlisted ? 'fill-current' : ''} />
          </button>

          {/* Product image */}
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-surface-card dark:bg-surface-card-dark" />
          )}
          <motion.img
            src={product.images[0]?.url}
            alt={product.name}
            onLoad={() => setImgLoaded(true)}
            animate={{ scale: isHovered ? 1.06 : 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Quick view overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/50 to-transparent flex justify-center"
          >
            <span className="flex items-center gap-1.5 text-white text-xs font-medium">
              <Eye size={13} /> Quick View
            </span>
          </motion.div>
        </div>

        {/* Info */}
        <div className="p-3.5">
          {product.brand && (
            <p className="text-2xs font-semibold text-brand-500 uppercase tracking-wider mb-1">{product.brand}</p>
          )}
          <h3 className="text-sm font-medium text-ink dark:text-ink-dark leading-snug mb-1.5 line-clamp-2 group-hover:text-brand-500 transition-colors">
            {product.name}
          </h3>

          <StarRating rating={product.ratings.average} count={product.ratings.count} size={12} />

          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-ink dark:text-ink-dark">
                {formatCurrency(effectivePrice)}
              </span>
              {originalPrice && (
                <span className="text-xs text-ink-muted dark:text-ink-muted-dark line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                inStock
                  ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-glow'
                  : 'bg-surface-card dark:bg-surface-card-dark text-ink-muted dark:text-ink-muted-dark cursor-not-allowed'
              }`}
              aria-label="Add to cart"
            >
              <ShoppingBag size={16} />
            </motion.button>
          </div>

          {inStock && product.stock <= 10 && (
            <p className="text-2xs text-red-500 font-medium mt-1.5">Only {product.stock} left!</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
