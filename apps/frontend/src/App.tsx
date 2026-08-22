import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Register } from './pages/Register';
import { JoinFamily } from './pages/JoinFamily';
import { Dashboard } from './pages/Dashboard';
import { ShoppingList } from './pages/ShoppingList';
import { TasksList } from './pages/TasksList';
import { IdeasPlansList } from './pages/IdeasPlansList';
import { RecipesList } from './pages/RecipesList';
import { ExpensesDashboard } from './pages/ExpensesDashboard';
import { CalendarPage } from './pages/CalendarPage';
import { VerifyEmail } from './pages/VerifyEmail';
import ScrollToTop from './components/ScrollToTop';
import { RealtimeProvider } from './context/RealtimeContext';

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/join" element={<JoinFamily />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* 👇 2. Envolver la ruta destino con <ProtectedRoute> */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopping"
            element={
              <ProtectedRoute>
                <ShoppingList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ideas-plans"
            element={
              <ProtectedRoute>
                <IdeasPlansList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRoute>
                <RecipesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <ExpensesDashboard />
              </ProtectedRoute>
            }
          />
          </Routes>
        </BrowserRouter>
      </RealtimeProvider>
    </AuthProvider>
  );
}
