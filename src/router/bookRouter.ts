import { Router } from 'express';
import {
  createBook,
  getAllBooks,
  getBookById,
  getBooksByGenre,
  updateBook,
  deleteBook,
} from '../controllers/bookController'; 
import { protect } from '../middleware/authMiddleware'; 

const router = Router();

// All routes require authentication based on documentation
router.post('/', protect, createBook);
router.get('/', protect, getAllBooks);
router.get('/genre/:id', protect, getBooksByGenre);
router.get('/:id', protect, getBookById);
router.patch('/:id', protect, updateBook);
router.delete('/:id', protect, deleteBook);

export default router;