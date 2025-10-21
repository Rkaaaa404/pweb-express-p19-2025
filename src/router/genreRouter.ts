import { Router } from 'express';
import {
  createGenre,
  getAllGenres,
  getGenreById,
  updateGenre,
  deleteGenre,
} from '../controllers/genreController'; 
import { protect } from '../middleware/authMiddleware'; 

const router = Router();

router.post('/', protect, createGenre);
router.patch('/:id', protect, updateGenre);
router.delete('/:id', protect, deleteGenre);
router.get('/', getAllGenres);
router.get('/:id', getGenreById);

export default router;