import { Server } from 'socket.io';

import { Answer, Player } from './types';

export function getIo(): Server | undefined {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return (global as any).io;
}

export function emitGameStateUpdate(gameId: number) {
  const io = getIo();
  if (io) {
    console.log(`Emitting game-state-update for game-${gameId}`);
    io.to(`game-${gameId}`).emit('game-state-update', { gameId });
  } else {
    console.warn('Socket.IO instance not found on global object');
  }
}

export function emitPlayerJoined(gameId: number, player: Player) {
  const io = getIo();
  if (io) {
    console.log(`Emitting player-joined for game-${gameId}`);
    io.to(`game-${gameId}`).emit('player-joined', { gameId, player });
  }
}

export function emitAnswerSubmitted(gameId: number, answer: Answer) {
  const io = getIo();
  if (io) {
    console.log(`Emitting answer-submitted for game-${gameId}`);
    io.to(`game-${gameId}`).emit('answer-submitted', { gameId, answer });
  }
}
