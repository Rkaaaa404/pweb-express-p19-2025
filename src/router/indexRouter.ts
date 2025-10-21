import { Router } from 'express';
import authRouter from './authRouter';
import genreRouter from './genreRouter';
// Nanti tambahin router lain di sini (bookRouter, transactionRouter)

const mainRouter = Router();

mainRouter.use('/auth', authRouter);
mainRouter.use('/genre', genreRouter);
// mainRouter.use('/books', bookRouter);
// mainRouter.use('/transactions', transactionRouter);

export default mainRouter;