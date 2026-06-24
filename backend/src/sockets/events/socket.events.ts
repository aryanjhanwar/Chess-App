/**
 * Socket event name constants.
 *
 * All event names are defined here as a single source of truth.
 * Import this object everywhere instead of using raw strings.
 * This prevents typos and makes refactoring safe.
 */
export const SOCKET_EVENTS = {
  // Connection lifecycle
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // Queue
  QUEUE_JOIN: 'queue:join',
  QUEUE_LEAVE: 'queue:leave',
  QUEUE_JOINED: 'queue:joined',   // Server → client confirmation
  QUEUE_LEFT: 'queue:left',       // Server → client confirmation

  // Match
  MATCH_FOUND: 'match:found',

  // Game
  GAME_MOVE: 'game:move',
  GAME_UPDATE: 'game:update',
  GAME_OVER: 'game:over',
  GAME_STATE: 'game:state',       // Full state sent on reconnect
  GAME_RESIGN: 'game:resign',

  // Presence
  ONLINE_UPDATE: 'online:update',

  // Errors
  ERROR: 'error',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
