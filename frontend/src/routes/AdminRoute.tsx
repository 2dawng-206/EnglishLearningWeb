import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth-store';

// Nest this inside <ProtectedRoute> — it relies on ProtectedRoute already
// having handled the isInitializing/isAuthenticated checks, and only adds
// the role check on top. Non-admins are bounced to the dashboard rather
// than /login, since they're already legitimately signed in.
export function AdminRoute({ children }: { children: ReactNode }) {
  const role = useAuthStore((state) => state.user?.role);

  if (role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}