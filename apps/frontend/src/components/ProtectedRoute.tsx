import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta si es necesario

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token } = useAuth();
  const location = useLocation(); // Guardamos dónde quería ir el usuario
  const storedToken = token ?? localStorage.getItem('token');

  if (!storedToken) {
    // 1. Si no está logueado, redirigir a /login
    // Usamos 'state' para recordar la URL a la que intentaba acceder (por ejemplo, /dashboard)
    // Usamos 'replace' para que no pueda volver atrás con el navegador
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Si está logueado, renderizar el contenido normal
  return <>{children}</>;
};
