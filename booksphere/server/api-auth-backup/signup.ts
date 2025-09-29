import { createUser, authenticateUser } from '../../../lib/auth';

export const signupHandler = async (data: { email: string; password: string; firstName: string; lastName: string }) => {
  try {
    const user = await createUser(data); // returns your user object
    return { success: true, user };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
};

export const loginHandler = async (data: { email: string; password: string }) => {
  try {
    const user = await authenticateUser(data.email, data.password);
    return { success: true, user };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
};
