import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Hace scroll suave o instantáneo al inicio de la página al cambiar la ruta
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth', // Cambia a 'smooth' o 'instant' si prefieres una animación suave o una instantenea
    });
  }, [pathname]);

  return null; // Este componente no renderiza nada en HTML
}