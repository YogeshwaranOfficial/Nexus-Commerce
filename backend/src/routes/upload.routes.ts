import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { upload, uploadProductImages, uploadAvatar, uploadCategoryImage, deleteUpload } from '../controllers/upload.controller';

const router = Router();
router.use(protect);
router.post('/products', upload.array('images', 10), uploadProductImages);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.post('/category', upload.single('image'), uploadCategoryImage);
router.delete('/', deleteUpload);

export default router;
