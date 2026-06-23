import { useCallback, useEffect, useRef } from 'react';
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
  // Store dynamic dependencies in a ref to avoid recreating makeComputerMove
  const propsRef = useRef({
    stockfish,
    gameMode,
    uiCapabilities,
    fen,
    legalMovesMap,
    currentTurn,
    playerColor,
    computerDifficulty,
    performMove,
  });

  propsRef.current = {
    stockfish,
    gameMode,
    uiCapabilities,
    fen,
    legalMovesMap,
    currentTurn,
    playerColor,
    computerDifficulty,
    performMove,
  };

  const isMovingRef = useRef(false);

  const isComputerTurn = useCallback((turn = currentTurn) => {
    if (gameMode !== 'computer') return false;
    return (
      (playerColor === 'white' && turn === 'b') ||
      (playerColor === 'black' && turn === 'w')
    );
  }, [currentTurn, gameMode, playerColor]);

  const makeComputerMove = useCallback(async () => {
    const {
      stockfish: currentStockfish,
      gameMode: currentGameMode,
      uiCapabilities: currentUiCapabilities,
      fen: currentFenVal,
      legalMovesMap: currentLegalMovesMap,
      computerDifficulty: currentDifficultyVal,
      performMove: currentPerformMove,
    } = propsRef.current;

    if (isMovingRef.current) return;
    if (!currentStockfish.isEngineReady || currentGameMode !== 'computer' || !currentUiCapabilities.canMovePieces) return;

    // Evaluate turn and color using latest values from ref
    const latestTurn = propsRef.current.currentTurn;
    const latestPlayerColor = propsRef.current.playerColor;
    const checkIsComputerTurn = (turn = latestTurn) => {
      if (currentGameMode !== 'computer') return false;
      return (
        (latestPlayerColor === 'white' && turn === 'b') ||
        (latestPlayerColor === 'black' && turn === 'w')
      );
    };

    if (!checkIsComputerTurn()) return;

    try {
      isMovingRef.current = true;
      const requestFen = currentFenVal;

      await currentStockfish.setPosition(requestFen);

      const settings = getDifficultySettings(currentDifficultyVal);
      let uciMove = await currentStockfish.getBestMove(settings.depth, settings.moveTime);

      if (!uciMove) {
        console.warn('No move from Stockfish, retrying once...');
        uciMove = await currentStockfish.getBestMove(settings.depth, settings.moveTime);
        if (!uciMove) {
          console.error('No move from Stockfish after retry');
          return;
        }
      }

      // Read current fen again from propsRef
      if (requestFen !== propsRef.current.fen) {
        console.warn('Discarding stale Stockfish result due to position change');
        return;
      }

      console.log('Computer UCI move:', uciMove);

      const v2Move = uciToV2Move(uciMove, currentLegalMovesMap);
      if (!v2Move) {
        console.error('Could not match UCI move to legal move:', uciMove);
        return;
      }

      currentPerformMove(v2Move);
    } catch (error) {
      console.error('Error making computer move:', error);
    } finally {
      isMovingRef.current = false;
    }
  }, []);

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
