import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Heart, Share2, Shield, Truck, RefreshCcw,
  ChevronRight, Minus, Plus, Star, CheckCircle, Zap,
} from 'lucide-react';
import { productApi, wishlistApi, reviewApi } from '../../services/api';
import { useSEO } from '../../hooks/useSEO';
import { Product, Review } from '../../types';
import { useCartStore, useAuthStore, useUIStore } from '../../stores';
import { formatCurrency, calcDiscount, formatDate, formatRelativeTime, getApiError } from '../../utils';
import { StarRating, Skeleton, EmptyState, Badge } from '../../components/ui/index';
import ProductCard from '../../components/product/ProductCard';
import { useCountdown } from '../../hooks';

// ─── Image Gallery ────────────────────────────────────────
function Gallery({ images }: { images: { url: string }[] }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="flex gap-4">
      {/* Thumbnails */}
      <div className="flex flex-col gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
              selected === i ? 'border-brand-500' : 'border-surface-border dark:border-surface-border-dark'
            }`}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div
        className="flex-1 aspect-square rounded-2xl overflow-hidden bg-surface-card dark:bg-surface-card-dark relative cursor-zoom-in"
        onClick={() => setZoomed(true)}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={selected}
            src={images[selected]?.url}
            alt="Product"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(false)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8 cursor-zoom-out"
          >
            <img src={images[selected]?.url} alt="Product" className="max-h-full max-w-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="py-5 border-b border-surface-border dark:border-surface-border-dark last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center shrink-0 text-white text-sm font-bold overflow-hidden">
          {review.user.avatar ? (
            <img src={review.user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            review.user.name[0].toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-ink dark:text-ink-dark">{review.user.name}</p>
              {review.isVerifiedPurchase && (
                <span className="flex items-center gap-0.5 text-2xs text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle size={11} className="fill-current" /> Verified
                </span>
              )}
            </div>
            <span className="text-xs text-ink-muted dark:text-ink-muted-dark">{formatRelativeTime(review.createdAt)}</span>
          </div>
          <StarRating rating={review.rating} showCount={false} size={13} />
          <h4 className="font-semibold text-sm text-ink dark:text-ink-dark mt-1.5">{review.title}</h4>
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark leading-relaxed mt-1">{review.body}</p>
          {review.images?.length > 0 && (
            <div className="flex gap-2 mt-2">
              {review.images.map((img, i) => (
                <img key={i} src={img.url} alt="" className="w-16 h-16 rounded-xl object-cover" />
              ))}
            </div>
          )}
          {review.sellerReply && (
            <div className="mt-3 p-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-800">
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">Seller Reply</p>
              <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark">{review.sellerReply.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────
export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { showNotification } = useUIStore();

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'specs'>('description');
  const [wishlistActive, setWishlistActive] = useState(false);

  useSEO({
    title: productData?.name,
    description: productData?.shortDescription || productData?.description?.slice(0, 155),
    image: productData?.images?.[0]?.url,
    type: 'product',
    url: `/products/${slug}`,
  });

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productApi.getBySlug(slug!).then((r) => r.data.data.product as Product),
    enabled: !!slug,
  });

  const { data: relatedData } = useQuery({
    queryKey: ['related', productData?._id],
    queryFn: () => productApi.getRelated(productData!._id).then((r) => r.data.data.products as Product[]),
    enabled: !!productData?._id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', productData?._id],
    queryFn: () => reviewApi.getByProduct(productData!._id).then((r) => r.data.data),
    enabled: !!productData?._id,
  });

  const wishlistMutation = useMutation({
    mutationFn: () => wishlistActive
      ? wishlistApi.remove(productData!._id)
      : wishlistApi.add(productData!._id),
    onSuccess: () => {
      setWishlistActive(!wishlistActive);
      showNotification('success', wishlistActive ? 'Removed from wishlist' : 'Saved to wishlist');
    },
  });

  const countdown = useCountdown(productData?.flashSaleEndsAt ?? null);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <Skeleton className="aspect-square rounded-2xl w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-8 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-1/3 rounded-full" />
            <Skeleton className="h-12 w-1/4 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <EmptyState
        title="Product not found"
        description="This product may have been removed or is unavailable."
        action={<button onClick={() => navigate('/products')} className="btn-primary">Browse Products</button>}
        className="min-h-[60vh]"
      />
    );
  }

  const product = productData;
  const variant = selectedVariant ? product.variants.find((v) => v._id === selectedVariant) : null;
  const effectivePrice = variant?.price ?? (product.isFlashSale && product.flashSalePrice ? product.flashSalePrice : product.basePrice);
  const comparePrice = variant?.compareAtPrice ?? product.compareAtPrice ?? (product.isFlashSale ? product.basePrice : undefined);
  const discount = comparePrice ? calcDiscount(comparePrice, effectivePrice) : 0;
  const maxStock = variant?.stock ?? product.stock;
  const inStock = maxStock > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem({
      productId: product._id,
      variantId: selectedVariant ?? undefined,
      name: product.name,
      image: (variant?.images[0]?.url || product.images[0]?.url),
      price: effectivePrice,
      quantity: qty,
      sku: variant?.sku ?? product.sku,
      stock: maxStock,
      attributes: variant?.attributes,
    });
    showNotification('success', 'Added to cart');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  // Build unique attribute keys for variant selector
  const attributeKeys = Object.keys(product.attributes ?? {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted dark:text-ink-muted-dark mb-6">
        <Link to="/" className="hover:text-brand-500 transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-brand-500 transition-colors">Products</Link>
        {product.category && (
          <>
            <ChevronRight size={12} />
            <Link to={`/products?category=${product.category._id}`} className="hover:text-brand-500 transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-ink dark:text-ink-dark truncate max-w-48">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        {/* Gallery */}
        <Gallery images={product.images} />

        {/* Info */}
        <div>
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {product.brand && <span className="badge bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400">{product.brand}</span>}
            {product.isFlashSale && <span className="badge bg-red-500 text-white flex items-center gap-0.5"><Zap size={11} className="fill-current" /> Flash Sale</span>}
            {!inStock && <Badge variant="danger">Out of Stock</Badge>}
          </div>

          <h1 className="text-2xl lg:text-3xl font-black text-ink dark:text-ink-dark leading-tight mb-3">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={product.ratings.average} count={product.ratings.count} size={16} />
            <button
              onClick={() => setActiveTab('reviews')}
              className="text-xs text-brand-500 hover:underline font-medium"
            >
              {product.ratings.count} reviews
            </button>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-black text-ink dark:text-ink-dark">{formatCurrency(effectivePrice)}</span>
            {comparePrice && (
              <span className="text-lg text-ink-muted dark:text-ink-muted-dark line-through">{formatCurrency(comparePrice)}</span>
            )}
            {discount > 0 && (
              <span className="badge bg-green-500 text-white font-bold">{discount}% OFF</span>
            )}
          </div>

          {/* Flash sale countdown */}
          {product.isFlashSale && product.flashSaleEndsAt && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Zap size={14} className="text-red-500" />
              <span className="text-ink-secondary dark:text-ink-secondary-dark">Ends in:</span>
              <div className="flex items-center gap-1 font-mono font-bold text-red-500">
                <span className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-lg">
                  {String(countdown.hours).padStart(2, '0')}h
                </span>
                <span>:</span>
                <span className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-lg">
                  {String(countdown.minutes).padStart(2, '0')}m
                </span>
                <span>:</span>
                <span className="bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-lg">
                  {String(countdown.seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>
          )}

          {/* Variants */}
          {attributeKeys.map((attrKey) => {
            const values = product.attributes[attrKey];
            return (
              <div key={attrKey} className="mb-4">
                <p className="text-sm font-semibold text-ink dark:text-ink-dark mb-2 capitalize">{attrKey}</p>
                <div className="flex flex-wrap gap-2">
                  {values.map((val) => {
                    const matchingVariant = product.variants.find(
                      (v) => v.attributes[attrKey] === val,
                    );
                    const isSelected = selectedVariant === matchingVariant?._id;
                    const outOfStock = matchingVariant ? matchingVariant.stock === 0 : false;
                    return (
                      <button
                        key={val}
                        onClick={() => !outOfStock && setSelectedVariant(matchingVariant?._id ?? null)}
                        disabled={outOfStock}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
                            : outOfStock
                            ? 'border-surface-border dark:border-surface-border-dark text-ink-muted dark:text-ink-muted-dark opacity-50 cursor-not-allowed line-through'
                            : 'border-surface-border dark:border-surface-border-dark text-ink dark:text-ink-dark hover:border-brand-300 dark:hover:border-brand-700'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center border border-surface-border dark:border-surface-border-dark rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors"
              >
                <Minus size={15} />
              </button>
              <span className="w-12 text-center font-semibold text-ink dark:text-ink-dark">{qty}</span>
              <button
                onClick={() => setQty(Math.min(maxStock, qty + 1))}
                disabled={qty >= maxStock}
                className="w-10 h-10 flex items-center justify-center text-ink-secondary dark:text-ink-secondary-dark hover:bg-surface-card dark:hover:bg-surface-card-dark transition-colors disabled:opacity-40"
              >
                <Plus size={15} />
              </button>
            </div>
            <span className="text-sm text-ink-muted dark:text-ink-muted-dark">
              {inStock ? (maxStock <= 10 ? <span className="text-red-500 font-medium">Only {maxStock} left!</span> : `${maxStock} in stock`) : 'Out of stock'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mb-5">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="btn-secondary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={18} /> Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!inStock}
              className="btn-primary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) { showNotification('info', 'Please sign in to save items'); return; }
                wishlistMutation.mutate();
              }}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
                wishlistActive ? 'bg-red-500 border-red-500 text-white' : 'border-surface-border dark:border-surface-border-dark text-ink-muted dark:text-ink-muted-dark hover:border-red-300 hover:text-red-500'
              }`}
            >
              <Heart size={18} className={wishlistActive ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3 py-4 border-t border-surface-border dark:border-surface-border-dark">
            {[
              { icon: Truck, label: 'Free shipping\nabove ₹999' },
              { icon: Shield, label: '100% secure\npayment' },
              { icon: RefreshCcw, label: '30-day\nreturns' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <Icon size={18} className="text-brand-500" />
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark leading-tight whitespace-pre-line">{label}</p>
              </div>
            ))}
          </div>

          {/* Seller info */}
          {product.seller && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-card dark:bg-surface-card-dark mt-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {product.seller.avatar ? <img src={product.seller.avatar} alt="" className="w-full h-full object-cover" /> : product.seller.name[0]}
              </div>
              <div>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Sold by</p>
                <p className="text-sm font-semibold text-ink dark:text-ink-dark">{product.seller.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-12">
        <div className="flex border-b border-surface-border dark:border-surface-border-dark mb-6 gap-1">
          {(['description', 'reviews', 'specs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 -mb-px capitalize transition-colors ${
                activeTab === tab
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-ink-secondary dark:text-ink-secondary-dark hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              {tab}{tab === 'reviews' ? ` (${product.ratings.count})` : ''}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'description' && (
              <div className="prose dark:prose-invert max-w-none text-sm text-ink-secondary dark:text-ink-secondary-dark leading-relaxed">
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {/* Rating summary */}
                <div className="flex flex-col sm:flex-row gap-8 mb-8 p-5 card">
                  <div className="text-center">
                    <p className="text-5xl font-black text-ink dark:text-ink-dark">{product.ratings.average.toFixed(1)}</p>
                    <StarRating rating={product.ratings.average} count={product.ratings.count} size={18} />
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">Based on {product.ratings.count} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((r) => {
                      const count = product.ratings.distribution?.[r] || 0;
                      const pct = product.ratings.count > 0 ? (count / product.ratings.count) * 100 : 0;
                      return (
                        <div key={r} className="flex items-center gap-3 text-sm">
                          <span className="w-3 text-ink-muted dark:text-ink-muted-dark shrink-0">{r}</span>
                          <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                          <div className="flex-1 h-1.5 bg-surface-card dark:bg-surface-card-dark rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-ink-muted dark:text-ink-muted-dark text-xs shrink-0">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews list */}
                {reviewsData?.reviews?.length ? (
                  reviewsData.reviews.map((review: Review) => <ReviewCard key={review._id} review={review} />)
                ) : (
                  <EmptyState title="No reviews yet" description="Be the first to review this product." />
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(product.attributes ?? {}).map(([key, values]) => (
                  <div key={key} className="flex items-start gap-2 p-3 rounded-xl bg-surface-card dark:bg-surface-card-dark">
                    <span className="text-sm font-semibold text-ink dark:text-ink-dark capitalize w-28 shrink-0">{key}</span>
                    <span className="text-sm text-ink-secondary dark:text-ink-secondary-dark">{Array.isArray(values) ? values.join(', ') : values}</span>
                  </div>
                ))}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-card dark:bg-surface-card-dark">
                  <span className="text-sm font-semibold text-ink dark:text-ink-dark w-28 shrink-0">SKU</span>
                  <span className="text-sm text-ink-secondary dark:text-ink-secondary-dark font-mono">{product.sku}</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Related products */}
      {relatedData && relatedData.length > 0 && (
        <section>
          <h2 className="text-xl font-black text-ink dark:text-ink-dark mb-5">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {relatedData.slice(0, 4).map((p: Product) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
