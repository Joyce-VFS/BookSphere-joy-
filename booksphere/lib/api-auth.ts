// lib/api-auth.ts
export async function signupUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const response = await fetch('http://localhost:5000/api/auth/register', { // <- your Express register route path
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function signinUser(email: string, password: string) {
  const response = await fetch('http://localhost:5000/api/auth/login', { // <- your Express login route path
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function verifyUserToken(token: string) {
  const response = await fetch('http://localhost:5000/api/auth/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}
