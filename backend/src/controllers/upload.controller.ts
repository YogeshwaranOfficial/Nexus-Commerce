import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/asyncHandler';

// ─── Cloudinary config ────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer: memory storage ───────────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB per file, max 10
});

// ─── Upload to Cloudinary from buffer ─────────────────────
async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  options: Record<string, unknown> = {},
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `nexus/${folder}`,
        transformation: [
          { quality: 'auto:good', fetch_format: 'auto' },
          { width: 1200, height: 1200, crop: 'limit' },
        ],
        ...options,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

// ─── POST /upload/products ────────────────────────────────
export const uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    throw new AppError('No files uploaded', 400);
  }

  const files = req.files as Express.Multer.File[];
  const uploads = await Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer, 'products', { tags: ['product'] })),
  );

  res.json({ success: true, data: { images: uploads } });
});

// ─── POST /upload/avatar ──────────────────────────────────
export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const result = await uploadToCloudinary(req.file.buffer, 'avatars', {
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
    tags: ['avatar'],
  });

  res.json({ success: true, data: result });
});

// ─── POST /upload/category ────────────────────────────────
export const uploadCategoryImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const result = await uploadToCloudinary(req.file.buffer, 'categories', {
    transformation: [{ width: 600, height: 400, crop: 'fill' }, { quality: 'auto:good' }],
  });

  res.json({ success: true, data: result });
});

// ─── DELETE /upload ───────────────────────────────────────
export const deleteUpload = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.body;
  if (!publicId) throw new AppError('Public ID required', 400);

  await cloudinary.uploader.destroy(publicId);
  res.json({ success: true, message: 'Image deleted' });
});
