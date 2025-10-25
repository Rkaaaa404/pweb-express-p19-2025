import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

export const createTransaction = async (req: Request, res: Response) => {
  const { items } = req.body;
  const userId = (req as any).userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Items are required' });
  }

  try {
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Buat order utama
      const createdOrder = await tx.order.create({
        data: { userId },
      });

      for (const item of items) {
        const { bookId, quantity } = item;

        if (!bookId || !quantity || quantity <= 0) {
          throw { status: 400, message: 'Invalid bookId or quantity' };
        }

        const book = await tx.book.findFirst({
          where: { id: bookId, deletedAt: null },
        });

        if (!book) {
          throw { status: 404, message: `Book with id ${bookId} not found` };
        }

        if (book.stockQuantity < quantity) {
          throw { status: 400, message: `Insufficient stock for "${book.title}"` };
        }

        // Kurangi stok buku secara atomik (di dalam transaction)
        await tx.book.update({
          where: { id: bookId },
          data: { stockQuantity: book.stockQuantity - quantity },
        });

        // Tambahkan ke order_items
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            bookId,
            quantity,
          },
        });
      }

      return createdOrder;
    });

    res.status(201).json({
      success: true,
      message: 'Transaction (Order) created successfully',
      data: order,
    });
  } catch (error: any) {
    console.error(error);
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /transactions
export const getAllTransactions = async (req: Request, res: Response) => {
  const { page = '1', limit = '10' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const total = await prisma.order.count();
    const orders = await prisma.order.findMany({
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, email: true } },
        orderItems: {
          include: {
            book: { select: { id: true, title: true, price: true } },
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: 'Get all transactions successfully',
      data: orders,
      meta: {
        page: pageNum,
        limit: limitNum,
        prev_page: pageNum > 1 ? pageNum - 1 : null,
        next_page: pageNum < totalPages ? pageNum + 1 : null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /transactions/:id
export const getTransactionById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        orderItems: {
          include: {
            book: { select: { id: true, title: true, price: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Get transaction detail successfully',
      data: order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /transactions/statistics
export const getTransactionStatistics = async (req: Request, res: Response) => {
  try {
    const totalTransactions = await prisma.order.count();

    const genreStats = await prisma.$queryRaw<
      { genre_id: string; genre_name: string; txn_count: number }[]
    >`
      SELECT g.id as genre_id, g.name as genre_name, COUNT(DISTINCT oi."orderId") as txn_count
      FROM "order_items" oi
      JOIN "books" b ON oi."book_id" = b.id
      JOIN "genres" g ON b."genre_id" = g.id
      GROUP BY g.id, g.name
      ORDER BY txn_count DESC;
    `;

    const most = genreStats[0] || null;
    const least = genreStats[genreStats.length - 1] || null;

    res.status(200).json({
      success: true,
      message: 'Get transaction statistics successfully',
      data: {
        totalTransactions,
        mostGenre: most,
        leastGenre: least,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
