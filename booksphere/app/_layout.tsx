import { AuthProvider } from '../contexts/AuthContext';
import { AuthGuard } from '../components/AuthGuard';
import { Stack } from 'expo-router';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <Stack>{children}</Stack>
      </AuthGuard>
    </AuthProvider>
  );
}
