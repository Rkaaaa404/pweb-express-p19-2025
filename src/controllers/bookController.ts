import { Request, Response } from 'express';
import { prisma } from '../prisma';

// POST /books
export const createBook = async (req: Request, res: Response) => {
  const { title, writer, publisher, publication_year, description, price, stock_quantity, genre_id } = req.body;

  // Validasi field yang required
  if (!title || !writer || !publisher || !publication_year || !price || !stock_quantity || !genre_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Title, writer, publisher, publication_year, price, stock_quantity, and genre_id are required' 
    });
  }

  try {
    // Cek apakah genre exists dan tidak soft deleted
    const genre = await prisma.genre.findFirst({
      where: { id: genre_id, deletedAt: null },
    });

    if (!genre) {
      return res.status(400).json({ 
        success: false, 
        message: 'Genre not found' 
      });
    }

    // Cek apakah title sudah ada (untuk buku yang tidak soft deleted)
    const existingBook = await prisma.book.findFirst({
      where: { title, deletedAt: null },
    });

    if (existingBook) {
      return res.status(400).json({ 
        success: false, 
        message: 'Book title already exists' 
      });
    }

    const book = await prisma.book.create({
      data: {
        title,
        writer,
        publisher,
        publicationYear: parseInt(publication_year),
        description,
        price: parseFloat(price),
        stockQuantity: parseInt(stock_quantity),
        genreId: genre_id,
      },
    });

    res.status(201).json({ 
      success: true, 
      message: 'Book added successfully', 
      data: {
        id: book.id,
        title: book.title,
        created_at: book.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// GET /books
export const getAllBooks = async (req: Request, res: Response) => {
  const { page = '1', limit = '10', search, orderByTitle, orderByPublishDate } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  let where: any = {
    deletedAt: null,
  };

  // Filter berdasarkan search (title, writer, atau publisher)
  if (search) {
    where.OR = [
      {
        title: {
          contains: search as string,
          mode: 'insensitive',
        },
      },
      {
        writer: {
          contains: search as string,
          mode: 'insensitive',
        },
      },
      {
        publisher: {
          contains: search as string,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Sorting
  let orderBy: any = {};
  if (orderByTitle === 'asc' || orderByTitle === 'desc') {
    orderBy.title = orderByTitle;
  } else if (orderByPublishDate === 'asc' || orderByPublishDate === 'desc') {
    orderBy.publicationYear = orderByPublishDate;
  }

  try {
    const books = await prisma.book.findMany({
      skip: skip,
      take: limitNum,
      where: where,
      orderBy: orderBy,
      include: {
        genre: true,
      },
    });

    const totalBooks = await prisma.book.count({ where: where });
    const totalPages = Math.ceil(totalBooks / limitNum);

    res.status(200).json({
      success: true,
      message: 'Get all book successfully',
      data: books,
      meta: {
        page: pageNum,
        limit: limitNum,
        prev_page: pageNum > 1 ? pageNum - 1 : null,
        next_page: pageNum < totalPages ? pageNum + 1 : null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// GET /books/genre/:id
export const getBooksByGenre = async (req: Request, res: Response) => {
  const { id: genreId } = req.params;
  const { page = '1', limit = '10', search, orderByTitle, orderByPublishDate } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  let where: any = {
    deletedAt: null,
    genreId: genreId,
  };

  // Filter berdasarkan search (title, writer, atau publisher)
  if (search) {
    where.OR = [
      {
        title: {
          contains: search as string,
          mode: 'insensitive',
        },
      },
      {
        writer: {
          contains: search as string,
          mode: 'insensitive',
        },
      },
      {
        publisher: {
          contains: search as string,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Sorting
  let orderBy: any = {};
  if (orderByTitle === 'asc' || orderByTitle === 'desc') {
    orderBy.title = orderByTitle;
  } else if (orderByPublishDate === 'asc' || orderByPublishDate === 'desc') {
    orderBy.publicationYear = orderByPublishDate;
  }

  try {
    // Cek apakah genre exists
    const genre = await prisma.genre.findFirst({
      where: { id: genreId, deletedAt: null },
    });

    if (!genre) {
      return res.status(404).json({ 
        success: false, 
        message: 'Genre not found' 
      });
    }

    const books = await prisma.book.findMany({
      skip: skip,
      take: limitNum,
      where: where,
      orderBy: orderBy,
      include: {
        genre: true,
      },
    });

    const totalBooks = await prisma.book.count({ where: where });
    const totalPages = Math.ceil(totalBooks / limitNum);

    res.status(200).json({
      success: true,
      message: 'Get all book by genre successfully',
      data: books,
      meta: {
        page: pageNum,
        limit: limitNum,
        prev_page: pageNum > 1 ? pageNum - 1 : null,
        next_page: pageNum < totalPages ? pageNum + 1 : null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// GET /books/:id
export const getBookById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const book = await prisma.book.findFirst({
      where: { id: id, deletedAt: null },
      include: {
        genre: true,
      },
    });

    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Get book detail successfully', 
      data: book 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// PATCH /books/:id
export const updateBook = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description, price, stock_quantity } = req.body;

  // Berdasarkan dokumentasi, hanya bisa edit description, price, dan stock_quantity
  if (!description && !price && !stock_quantity) {
    return res.status(400).json({ 
      success: false, 
      message: 'At least one field (description, price, stock_quantity) is required for update' 
    });
  }

  try {
    // Cek apakah book exists dan tidak soft deleted
    const existing = await prisma.book.findFirst({
      where: { id, deletedAt: null },
    });
    
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found' 
      });
    }

    // Prepare data untuk update
    const updateData: any = {};
    if (description !== undefined) updateData.description = description; // Allow empty string
    if (price) updateData.price = parseFloat(price);
    if (stock_quantity) updateData.stockQuantity = parseInt(stock_quantity);

    const updatedBook = await prisma.book.update({
      where: { id: id },
      data: updateData,
      include: {
        genre: true,
      },
    });

    res.status(200).json({ 
      success: true, 
      message: 'Book updated successfully', 
      data: {
        id: updatedBook.id,
        title: updatedBook.title,
        updated_at: updatedBook.updatedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// DELETE /books/:id
export const deleteBook = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const book = await prisma.book.findFirst({
      where: { id, deletedAt: null },
    });

    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found' 
      });
    }

    // Soft delete
    await prisma.book.update({
      where: { id: id },
      data: {
        deletedAt: new Date(),
      },
    });

    res.status(200).json({ 
      success: true, 
      message: 'Book removed successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};