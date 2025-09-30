// server/lib/auth.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectToDatabase } = require('./mongodb');
const { ObjectId } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Create user
async function createUser(userData) {
  try {
    const { db } = await connectToDatabase();
    const users = db.collection('users');

    const existing = await users.findOne({ email: userData.email });
    if (existing) {
      return { success: false, message: 'Email already registered' };
    }

    const hashed = await hashPassword(userData.password);
    const now = new Date();

    const newUser = {
      email: userData.email,
      passwordHash: hashed,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      createdAt: now,
      updatedAt: now,
    };

    const result = await users.insertOne(newUser);
    const insertedId = result.insertedId;
    const user = await users.findOne({ _id: insertedId });

    if (!user) {
      return { success: false, message: 'Failed to create user' };
    }

    const token = generateToken(String(insertedId));

    return {
      success: true,
      message: 'User created',
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
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Internal server error' };
  }
}

// Authenticate user
async function authenticateUser(email, password) {
  try {
    const { db } = await connectToDatabase();
    const users = db.collection('users');

    const user = await users.findOne({ email });
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    const ok = await verifyPassword(password, user.passwordHash || user.password || '');
    if (!ok) return { success: false, message: 'Invalid credentials' };

    const token = generateToken(String(user._id));

    return {
      success: true,
      message: 'Authenticated',
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
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Internal server error' };
  }
}

// Get user by ID
async function getUserById(userId) {
  try {
    const { db } = await connectToDatabase();
    const users = db.collection('users');

    let filterId = null;
    try {
      filterId = new ObjectId(userId);
    } catch {
      return null;
    }

    const user = await users.findOne({ _id: filterId });
    if (!user) return null;

    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  createUser,
  authenticateUser,
  getUserById,
};
