import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

type EventHandler = (payload: unknown) => void;
type RealtimeContextValue = { subscribe: (event: string, handler: EventHandler) => () => void };

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

function getSocketUrl() {
  return import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:3000';
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const handlersRef = useRef(new Map<string, Set<EventHandler>>());

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(getSocketUrl(), { transports: ['websocket'], auth: { token } });
    const eventNames = [
      'shoppingListUpdated',
      'tasksListUpdated',
      'ideasPlansListUpdated',
      'recipeListUpdated',
      'expensesUpdated',
      'calendarEventsUpdated',
      'taskPlanUpdated',
    ];

    for (const eventName of eventNames) {
      socket.on(eventName, (payload: unknown) => {
        handlersRef.current.get(eventName)?.forEach((handler) => handler(payload));
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const subscribe = useCallback((event: string, handler: EventHandler) => {
    const handlers = handlersRef.current.get(event) ?? new Set<EventHandler>();
    handlers.add(handler);
    handlersRef.current.set(event, handlers);
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) handlersRef.current.delete(event);
    };
  }, []);

  return <RealtimeContext.Provider value={{ subscribe }}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime debe usarse dentro de RealtimeProvider');
  return context;
}
