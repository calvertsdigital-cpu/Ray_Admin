import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * useRealtimeUpdates
 * Connects to the backend Socket.IO server and listens for real-time events.
 * Calls the appropriate callback when an event arrives.
 *
 * @param {Object} handlers - map of { eventName: callback(data) }
 * @param {boolean} enabled - set false to skip connecting (e.g. non-admin role)
 */
export function useRealtimeUpdates(handlers, enabled = true) {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);

  // Keep handlers ref fresh without re-connecting
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem('adminToken');
    const socket = io(import.meta.env.VITE_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Register all event handlers
    Object.keys(handlersRef.current).forEach((event) => {
      socket.on(event, (data) => {
        handlersRef.current[event]?.(data);
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  // Emit helper
  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit };
}
