// api/auth/login.ts
// Frontend helper to call the backend login endpoint.
// Adjust the BACKEND_URL if your backend is somewhere else.

export type LoginResponse = {
  success: boolean;
  message?: string;
  user?: {
    id?: string;
    _id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  token?: string;
};

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // Try to parse JSON even on non-2xx so we can show backend message
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      // backend may return { error: "..."} or { message: "..." }
      const message = (payload && (payload.error || payload.message)) || 'Login failed';
      return { success: false, message };
    }

    // Expected backend shape: { user: {...}, token: "..." }
    const user = payload.user || null;
    const token = payload.token || payload.accessToken || null;

    return {
      success: true,
      message: payload.message,
      user,
      token,
    };
  } catch (error: any) {
    // Network / unexpected error
    return {
      success: false,
      message: error?.message || 'Network error',
    };
  }
}

export default login;
