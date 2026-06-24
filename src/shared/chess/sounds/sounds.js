/**
 * Shared chess sound player.
 *
 * This is the canonical re-export point for all move sound functions.
 * Both the main play app and the analysis app should import from here
 * so that volume preferences are honoured consistently across all screens.
 *
 * The underlying implementation lives in `src/utils/sounds.js`.
 */

export {
  playMoveSound,
  playCaptureSound,
  playCheckSound,
  playCastleSound,
  playGameStartSound,
  playGameEndSound,
  playPromotionSound,
  playOpponentMoveSound,
  playIllegalSound,
  playPremoveSound,
  playNotifySound,
  playTenSecondsSound,
  // Analysis-app compatible helper:
  playSoundFromMove,
  // Volume control:
  setSoundPreferences,
  setSoundVolume,
  getSoundPreferences,
} from '@/utils/sounds.js';
