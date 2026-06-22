/**
 * Chess Sound Effects using actual audio files
 * Lazy-initialized to avoid issues in SSR and to respect BASE_URL.
 */

let _sounds = null;

function getBaseUrl() {
  try {
    const base = import.meta.env?.BASE_URL || '/';
    return base.endsWith('/') ? base : `${base}/`;
  } catch {
    return '/';
  }
}

function getSounds() {
  if (_sounds) return _sounds;
  const base = getBaseUrl();
  const createSound = (filename) => {
    const audio = new Audio(`${base}sounds/${filename}`);
    audio.preload = 'auto';
    return audio;
  };
  _sounds = {
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
  return _sounds;
}

const soundPreferences = {
  enabled: true,
  moveEnabled: true,
  captureEnabled: true,
  checkEnabled: true,
  volume: 0.75,
};

export const setSoundPreferences = ({ enabled, moveEnabled, captureEnabled, checkEnabled, volume } = {}) => {
  if (typeof enabled === 'boolean') soundPreferences.enabled = enabled;
  if (typeof moveEnabled === 'boolean') soundPreferences.moveEnabled = moveEnabled;
  if (typeof captureEnabled === 'boolean') soundPreferences.captureEnabled = captureEnabled;
  if (typeof checkEnabled === 'boolean') soundPreferences.checkEnabled = checkEnabled;
  if (typeof volume === 'number') {
    soundPreferences.volume = Math.max(0, Math.min(1, volume));
  }
};

// Helper to play sound
const playSound = (soundKey) => {
  if (!soundPreferences.enabled) return;
  const sounds = getSounds();
  const audio = sounds[soundKey];
  if (audio) {
    audio.volume = soundPreferences.volume;
    audio.currentTime = 0;
    audio.play().catch(() => { /* silently ignore autoplay restrictions */ });
  }
};

/**
 * Play a move sound (standard move)
 */
export const playMoveSound = () => {
  if (!soundPreferences.moveEnabled) return;
  playSound('moveSelf');
};

/**
 * Play a capture sound
 */
export const playCaptureSound = () => {
  if (!soundPreferences.captureEnabled) return;
  playSound('capture');
};

/**
 * Play a check sound
 */
export const playCheckSound = () => {
  if (!soundPreferences.checkEnabled) return;
  playSound('moveCheck');
};

/**
 * Play a castle sound
 */
export const playCastleSound = () => {
  playSound('castle');
};

/**
 * Play a game start sound
 */
export const playGameStartSound = () => {
  playSound('gameStart');
};

/**
 * Play a checkmate/game end sound
 * @param {boolean} isCheckmate - Whether the game ended with checkmate (king in check)
 */
export const playGameEndSound = (isCheckmate = false) => {
  if (isCheckmate) {
    playSound('moveCheck');
    setTimeout(() => playSound('gameEnd'), 300);
  } else {
    playSound('gameEnd');
  }
};

/**
 * Play promotion sound
 */
export const playPromotionSound = () => {
  playSound('promote');
};

/**
 * Play opponent move sound
 */
export const playOpponentMoveSound = () => {
  playSound('moveOpponent');
};

/**
 * Play premove sound
 */
export const playPremoveSound = () => {
  playSound('premove');
};

/**
 * Play notification sound
 */
export const playNotifySound = () => {
  playSound('notify');
};

/**
 * Play illegal move sound
 */
export const playIllegalSound = () => {
  playSound('illegal');
};

/**
 * Play low time warning sound
 */
export const playTenSecondsSound = () => {
  playSound('tenseconds');
};
