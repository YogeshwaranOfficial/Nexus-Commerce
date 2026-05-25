import { Router } from 'express';
import { search, getSuggestions, getTrending } from '../controllers/search.controller';

const router = Router();
router.get('/', search);
router.get('/suggestions', getSuggestions);
router.get('/trending', getTrending);

export default router;
