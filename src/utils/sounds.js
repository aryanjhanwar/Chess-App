/**
 * Chess Sound Effects using actual audio files
 * Professional chess sounds from chess.com
 */

// Create audio instances
const createSound = (filename) => {
  const audio = new Audio(`/sounds/${filename}`);
  audio.preload = 'auto';
  return audio;
};

// Preload all sounds
const sounds = {
  gameStart: createSound('game-start.mp3'),
  gameEnd: createSound('game-end.webm'),
  capture: createSound('capture.mp3'),
  castle: createSound('castle.mp3'),
  premove: createSound('premove.mp3'),
  moveSelf: createSound('move-self.mp3'),
  moveOpponent: createSound('move-opponent.mp3'),
  moveCheck: createSound('move-check.mp3'),
  promote: createSound('promote.mp3'),
  notify: createSound('notify.mp3'),
  illegal: createSound('illegal.mp3'),
  tenseconds: createSound('tenseconds.mp3'),
};

// Helper to play sound
const playSound = (audio) => {
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(err => console.log('Sound play failed:', err));
  }
};

/**
 * Play a move sound (standard move)
 */
export const playMoveSound = () => {
  playSound(sounds.moveSelf);
};

/**
 * Play a capture sound
 */
export const playCaptureSound = () => {
  playSound(sounds.capture);
};

/**
 * Play a check sound
 */
export const playCheckSound = () => {
  playSound(sounds.moveCheck);
};

/**
 * Play a castle sound
 */
export const playCastleSound = () => {
  playSound(sounds.castle);
};

/**
 * Play a game start sound
 */
export const playGameStartSound = () => {
  playSound(sounds.gameStart);
};

/**
 * Play a checkmate/game end sound
 * @param {boolean} isCheckmate - Whether the game ended with checkmate (king in check)
 */
export const playGameEndSound = (isCheckmate = false) => {
  // Only play check sound if it's actually checkmate (king in check)
  if (isCheckmate) {
    playSound(sounds.moveCheck);
    setTimeout(() => playSound(sounds.gameEnd), 300);
  } else {
    playSound(sounds.gameEnd);
  }
};

/**
 * Play promotion sound
 */
export const playPromotionSound = () => {
  playSound(sounds.promote);
};

/**
 * Play opponent move sound
 */
export const playOpponentMoveSound = () => {
  playSound(sounds.moveOpponent);
};

/**
 * Play premove sound
 */
export const playPremoveSound = () => {
  playSound(sounds.premove);
};

/**
 * Play notification sound
 */
export const playNotifySound = () => {
  playSound(sounds.notify);
};

/**
 * Play illegal move sound
 */
export const playIllegalSound = () => {
  playSound(sounds.illegal);
};

/**
 * Play low time warning sound
 */
export const playTenSecondsSound = () => {
  playSound(sounds.tenseconds);
};
