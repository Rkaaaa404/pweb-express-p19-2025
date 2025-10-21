import { Request, Response } from 'express';
import { prisma } from '../prisma'; 
import { signToken } from '../utils/jwt'; 
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

export const register = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  // Validasi simpel
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Email and password are required' });
  }

  try {
    // Hash password-nya
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        username: username, // username ini opsional [cite: 1]
      },
    });

    // Balikin data sesuai spek Postman
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.createdAt,
      },
    });
  } catch (error) {
    // Error handling buat kalo email-nya udah ada (unique constraint)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res
          .status(400)
          .json({ success: false, message: 'Email already exists' });
      }
    }
    // Error generik
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
};

// POST login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id });

    return res.status(200).json({
      success: true,
      message: 'Login successfully',
      data: {
        access_token: token,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
};

// GET /auth/me
export const getMe = async (req: Request, res: Response) => {
  // Ambil userId yang udah ditempel sama middleware 'protect'
  const userId = (req as any).userId;

  if (!userId) {
    // Harusnya nggak bakal kejadian kalo 'protect' dipake
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      // Select field yang perlu aja, JANGAN SAMPE PASSWORD KEBAWA
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res
      .status(200)
      .json({ success: true, message: 'Get me successfully', data: user });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
};