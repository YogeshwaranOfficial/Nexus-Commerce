import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Upload, X, Plus, ChevronLeft, ImagePlus, Loader2 } from 'lucide-react';
import { productApi, adminApi, api } from '../../services/api';
import { useUIStore } from '../../stores';
import { getApiError } from '../../utils';
import { Spinner } from '../../components/ui/index';
import { useSEO } from '../../hooks/useSEO';


const schema = z.object({
  name: z.string().min(3, 'Required'),
  description: z.string().min(20, 'At least 20 characters'),
  shortDescription: z.string().optional(),
  basePrice: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().optional(),
  stock: z.coerce.number().min(0),
  sku: z.string().min(2, 'Required'),
  brand: z.string().optional(),
  category: z.string().min(1, 'Select a category'),
  tags: z.string().optional(),
  weight: z.coerce.number().default(500),
  returnPolicy: z.string().optional(),
  warranty: z.string().optional(),
});
type ProductForm = z.infer<typeof schema>;

export default function AddProduct() {
  useSEO({ title: 'Add Product', noIndex: true });
  const navigate = useNavigate();
  const { showNotification } = useUIStore();
  const [images, setImages] = useState<{ url: string; publicId: string }[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories-flat'],
    queryFn: () => adminApi.getCategories().then((r) => r.data.data.categories),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: async (d: ProductForm) => {
      const tags = d.tags ? d.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const payload = {
        ...d,
        tags,
        images,
        shipping: { weight: d.weight, isFreeShipping: false, processingTime: 2 },
      };
      return productApi.create(payload as any);
    },
    onSuccess: () => {
      showNotification('success', 'Product created! Pending review.');
      navigate('/seller/products');
    },
    onError: (err) => showNotification('error', getApiError(err)),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('images', f));
      const res = await api.post('/upload/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages((prev) => [...prev, ...res.data.data.images]);
    } catch {
      showNotification('error', 'Image upload failed');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const Input = ({ label, name, type = 'text', placeholder = '', required = false, ...rest }: any) => (
    <div>
      <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input {...register(name)} type={type} placeholder={placeholder} className="input" {...rest} />
      {errors[name as keyof ProductForm] && (
        <p className="text-xs text-red-500 mt-1">{(errors[name as keyof ProductForm] as any)?.message}</p>
      )}
    </div>
  );

  return (
    <div>
      <button onClick={() => navigate('/seller/products')} className="flex items-center gap-1.5 text-sm text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 mb-5 transition-colors">
        <ChevronLeft size={16} /> Back to Products
      </button>
      <h1 className="text-2xl font-black text-ink dark:text-ink-dark mb-6">Add New Product</h1>

      <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="grid lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Images */}
          <div className="card p-5">
            <h3 className="font-semibold text-ink dark:text-ink-dark mb-4">Product Images <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 badge bg-brand-500 text-white text-2xs">Cover</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingImages}
                  className="aspect-square rounded-xl border-2 border-dashed border-surface-border dark:border-surface-border-dark hover:border-brand-400 transition-colors flex flex-col items-center justify-center gap-1 text-ink-muted dark:text-ink-muted-dark hover:text-brand-500 disabled:opacity-60"
                >
                  {uploadingImages ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                  <span className="text-xs">Upload</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-2">Up to 10 images. First image is the cover. Recommended: 1:1 ratio, min 800×800px.</p>
          </div>

          {/* Basic info */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-ink dark:text-ink-dark">Basic Information</h3>
            <Input label="Product Name" name="name" required placeholder="e.g. Premium Wireless Headphones" />
            <div>
              <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={5}
                placeholder="Detailed product description..."
                className="input resize-none"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Short Description</label>
              <textarea {...register('shortDescription')} rows={2} placeholder="Brief summary (displayed on listing)" className="input resize-none" />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-ink dark:text-ink-dark">Pricing & Inventory</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Selling Price (₹)" name="basePrice" type="number" required placeholder="0" />
              <Input label="Compare at Price (₹)" name="compareAtPrice" type="number" placeholder="Original / MRP" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Stock Quantity" name="stock" type="number" required placeholder="0" />
              <Input label="SKU" name="sku" required placeholder="e.g. WH-PRO-BLK-XL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Weight (grams)</label>
              <input {...register('weight')} type="number" className="input" placeholder="500" />
            </div>
          </div>

          {/* Policies */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-ink dark:text-ink-dark">Policies</h3>
            <div>
              <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Return Policy</label>
              <textarea {...register('returnPolicy')} rows={2} className="input resize-none" placeholder="e.g. 30-day return policy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Warranty</label>
              <input {...register('warranty')} className="input" placeholder="e.g. 1 year manufacturer warranty" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Category */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-ink dark:text-ink-dark">Organisation</h3>
            <div>
              <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Category <span className="text-red-500">*</span></label>
              <select {...register('category')} className="input">
                <option value="">Select category</option>
                {categories?.map((cat: any) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Brand</label>
              <input {...register('brand')} className="input" placeholder="e.g. Apple, Samsung" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-1.5">Tags</label>
              <input {...register('tags')} className="input" placeholder="wireless, audio, premium (comma separated)" />
              <p className="text-2xs text-ink-muted dark:text-ink-muted-dark mt-1">Separate with commas</p>
            </div>
          </div>

          {/* Submit */}
          <div className="card p-4 space-y-3">
            <button
              type="submit"
              disabled={createMutation.isPending || images.length === 0}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? <Spinner size={18} /> : 'Submit for Review'}
            </button>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark text-center">
              Your product will be reviewed by our team before going live.
            </p>
            {images.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center">⚠ At least 1 image required</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
