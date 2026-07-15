import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { VocabularyPage } from '../pages/vocabulary/VocabularyPage';
import { StudyPage } from '../pages/study/StudyPage';
import { FlashcardSessionPage } from '../pages/study/FlashcardSessionPage';
import { QuizSessionPage } from '../pages/study/QuizSessionPage';
import { PronunciationSessionPage } from '../pages/study/PronunciationSessionPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/vocabulary', element: <VocabularyPage /> },
      { path: '/study', element: <StudyPage /> },
      { path: '/study/flashcards', element: <FlashcardSessionPage /> },
      { path: '/study/quiz', element: <QuizSessionPage /> },
      { path: '/study/pronunciation', element: <PronunciationSessionPage /> },
    ],
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
