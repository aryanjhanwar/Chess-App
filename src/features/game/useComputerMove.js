import { useCallback, useEffect } from 'react';
import { getDifficultySettings } from '../../utils/stockfishUtils';
import { uciToV2Move } from '../../hooks/useGameEngine';

export function useComputerMove({
  stockfish,
  gameMode,
  uiCapabilities,
  fen,
  legalMovesMap,
  currentTurn,
  playerColor,
  computerDifficulty,
  performMove,
}) {
  const isComputerTurn = useCallback((turn = currentTurn) => {
    if (gameMode !== 'computer') return false;
    return (
      (playerColor === 'white' && turn === 'b') ||
      (playerColor === 'black' && turn === 'w')
    );
  }, [currentTurn, gameMode, playerColor]);

  const makeComputerMove = useCallback(async () => {
    if (!stockfish.isEngineReady || gameMode !== 'computer' || !uiCapabilities.canMovePieces) return;

    if (!isComputerTurn()) return;

    try {
      const requestFen = fen;

      await stockfish.setPosition(requestFen);

      const settings = getDifficultySettings(computerDifficulty);
      let uciMove = await stockfish.getBestMove(settings.depth, settings.moveTime);

      if (!uciMove) {
        console.warn('No move from Stockfish, retrying once...');
        uciMove = await stockfish.getBestMove(settings.depth, settings.moveTime);
        if (!uciMove) {
          console.error('No move from Stockfish after retry');
          return;
        }
      }

      if (requestFen !== fen) {
        console.warn('Discarding stale Stockfish result due to position change');
        return;
      }

      console.log('Computer UCI move:', uciMove);

      const v2Move = uciToV2Move(uciMove, legalMovesMap);
      if (!v2Move) {
        console.error('Could not match UCI move to legal move:', uciMove);
        return;
      }

      performMove(v2Move);
    } catch (error) {
      console.error('Error making computer move:', error);
    }
  }, [computerDifficulty, fen, gameMode, isComputerTurn, legalMovesMap, performMove, stockfish, uiCapabilities.canMovePieces]);

  useEffect(() => {
    if (!uiCapabilities.canMovePieces) return;
    if (isComputerTurn()) {
      const timer = setTimeout(() => {
        void makeComputerMove();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, gameMode, playerColor, uiCapabilities.canMovePieces, isComputerTurn, makeComputerMove]);

  return {
    makeComputerMove,
    isComputerTurn,
  };
}
