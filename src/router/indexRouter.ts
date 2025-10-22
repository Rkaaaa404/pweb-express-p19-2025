import { Router } from 'express';
import authRouter from './authRouter';
import genreRouter from './genreRouter';
import bookRouter from './bookRouter';
import transactionRouter from './transactionRouter';

const mainRouter = Router();

mainRouter.use('/auth', authRouter);
mainRouter.use('/genre', genreRouter);
mainRouter.use('/books', bookRouter);
mainRouter.use('/transactions', transactionRouter);

export default mainRouter;