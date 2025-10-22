import { Router } from 'express';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionStatistics,
} from '../controllers/transactionController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, createTransaction);
router.get('/', protect, getAllTransactions);
router.get('/statistics', protect, getTransactionStatistics);
router.get('/:id', protect, getTransactionById);

export default router;
