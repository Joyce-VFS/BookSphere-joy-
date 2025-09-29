import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase, User } from './mongodb';
import { config } from '../config/env';

const JWT_SECRET = config.jwt.secret;

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;
  token?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthResponse> {
  try {
    const { db } = await connectToDatabase();
    const users = db.collection<User>('users');

    // Check if user already exists
    const existingUser = await users.findOne({ email: userData.email });
    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists',
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const newUser: Omit<User, '_id'> = {
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(newUser as User);
    const user = await users.findOne({ _id: result.insertedId });

    if (!user) {
      return {
        success: false,
        message: 'Failed to create user',
      };
    }

    const token = generateToken(user._id!.toString());

    return {
      success: true,
      message: 'User created successfully',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      message: 'Internal server error',
    };
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const { db } = await connectToDatabase();
    const users = db.collection<User>('users');

    const user = await users.findOne({ email });
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    const token = generateToken(user._id!.toString());

    return {
      success: true,
      message: 'Authentication successful',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return {
      success: false,
      message: 'Internal server error',
    };
  }
}

export async function getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
  try {
    const { db } = await connectToDatabase();
    const users = db.collection<User>('users');

    const user = await users.findOne({ _id: userId });
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}
