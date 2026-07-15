import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/AppRouter';
import { bootstrapSession } from './features/auth/auth-api';

export default function App() {
  useEffect(() => {
    // Runs once on load: if a refresh token survived a previous visit,
    // silently re-authenticates before any route decides whether to
    // redirect to /login. See ProtectedRoute for the loading state this
    // produces while it's in flight.
    void bootstrapSession();
  }, []);

  return <RouterProvider router={router} />;
}
