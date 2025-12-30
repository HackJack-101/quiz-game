'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(gameId?: number) {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!gameId) return;

    // Connect to the same host that serves the page
    const s = io();
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setSocket(s);

    s.on('connect', () => {
      console.log('Connected to WebSocket');
      setConnected(true);
      s.emit('join-game', gameId);
    });

    s.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [gameId]);

  return {
    socket,
    connected,
  };
}
