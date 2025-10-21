import { Request, Response } from 'express';
import { prisma } from '../prisma';

// POST /genre
export const createGenre = async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  try {
    const existingGenre = await prisma.genre.findFirst({
      where: { name, deletedAt: null },
    });

    if (existingGenre) {
      return res
        .status(400)
        .json({ success: false, message: 'Genre name already exists' });
    }

    const genre = await prisma.genre.create({
      data: { name },
    });

    res
      .status(201)
      .json({ success: true, message: 'Genre created successfully', data: genre });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /genre
export const getAllGenres = async (req: Request, res: Response) => {
  const { page = '1', limit = '10', search, orderByName } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  let where: any = {
    deletedAt: null,
  };

  if (search) {
    where.name = {
      contains: search as string,
      mode: 'insensitive',
    };
  }

  let orderBy: any = {};
  if (orderByName === 'asc' || orderByName === 'desc') {
    orderBy.name = orderByName;
  }

  try {
    const genres = await prisma.genre.findMany({
      skip: skip,
      take: limitNum,
      where: where,
      orderBy: orderBy,
    });

    const totalGenres = await prisma.genre.count({ where: where });
    const totalPages = Math.ceil(totalGenres / limitNum);

    res.status(200).json({
      success: true,
      message: 'Get all genre successfully',
      data: genres,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: totalGenres,
        prev_page: pageNum > 1 ? pageNum - 1 : null,
        next_page: pageNum < totalPages ? pageNum + 1 : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /genre/:id
export const getGenreById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const genre = await prisma.genre.findFirst({
      where: { id: id, deletedAt: null },
    });

    if (!genre) {
      return res.status(404).json({ success: false, message: 'Genre not found' });
    }

    res
      .status(200)
      .json({ success: true, message: 'Get genre detail successfully', data: genre });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PATCH /genre/:id
export const updateGenre = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  try {
    const existing = await prisma.genre.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Genre not found' });
    }

    const duplicateName = await prisma.genre.findFirst({
      where: { name, id: { not: id }, deletedAt: null },
    });
    if (duplicateName) {
      return res
        .status(400)
        .json({ success: false, message: 'Genre name already exists' });
    }

    const updatedGenre = await prisma.genre.update({
      where: { id: id },
      data: { name: name },
    });

    res
      .status(200)
      .json({ success: true, message: 'Genre updated successfully', data: updatedGenre });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /genre/:id
export const deleteGenre = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const genre = await prisma.genre.findFirst({
      where: { id, deletedAt: null },
    });

    if (!genre) {
      return res.status(4404).json({ success: false, message: 'Genre not found' });
    }

    await prisma.genre.update({
      where: { id: id },
      data: {
        deletedAt: new Date(), // Ini soft-delete manual
      },
    });

    res.status(200).json({ success: true, message: 'Genre removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};