/**
 * @deprecated Use '@/components/CapturedPiecesList' directly.
 *
 * The unified CapturedPiecesList supports both the FEN-based format used
 * here and the array format used by the main play app. Pass `fen` and
 * `color` props to use the analysis (FEN) mode.
 *
 * Example:
 *   <CapturedPiecesList fen={game.fen()} color={Color.White} pieceStyle="staunty" />
 */
export { default } from '@/components/CapturedPiecesList';
