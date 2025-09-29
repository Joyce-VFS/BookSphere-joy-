// Mock authentication for demo purposes
// This is for testing ONLY and this will work without MongoDB connection

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;
  token?: string;
}

// Mock users storage (in-memory)
const mockUsers: User[] = [];

export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthResponse> {
  try {
    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === userData.email);
    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists',
      };
    }

    // Create user
    const newUser: User = {
      _id: Date.now().toString(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    const token = `mock-token-${Date.now()}`;

    return {
      success: true,
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
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
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    // For demo purposes, accept any password.....
    const token = `mock-token-${Date.now()}`;

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
    const user = mockUsers.find(u => u._id === userId);
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

export function verifyToken(token: string): { userId: string } | null {
  // For demo purposes, accept any token that starts with "mock-token-"....
  if (token.startsWith('mock-token-')) {
    return { userId: token.split('-')[2] || '1' };
  }
  return null;
}

