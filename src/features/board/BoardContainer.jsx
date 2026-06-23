import PlayerCard from '../../components/PlayerCard';
import EvaluationBar from '../../components/EvaluationBar';
import ChessBoardView from '../../components/ChessBoardView';

export default function BoardContainer({
  effectiveBoardFlipped,
  playerNames = { white: 'White', black: 'Black' },
  activeCapturedPieces = { w: [], b: [] },

  whiteTime,
  blackTime,
  formatTime,

  isMultiplayerGame,
  isMultiplayerStarted,
  multiplayerNotice,
  multiplayerSide,

  evalValue,
  mateValue,
  stockfish,
  displayTurn,

  boardViewKey,
  displayBoard,
  displaySelectedSquare,
  displayValidMoves,
  displayKingInCheckPos,
  displayLastMove,

  handleSquareClick,

  displayRankLabels,
  displayFileLabels,

  gameState,
  isReviewMode,

  activePieceImages,
  boardThemeColors,

  uiSettings,
}) {
  return (
    <div className="flex flex-col items-center w-full max-w-[600px]">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          <PlayerCard
            color={effectiveBoardFlipped ? 'w' : 'b'}
            playerName={
              effectiveBoardFlipped
                ? (playerNames.white || 'White')
                : (playerNames.black || 'Black')
            }
            capturedPieces={
              effectiveBoardFlipped
                ? (activeCapturedPieces?.b ?? [])
                : (activeCapturedPieces?.w ?? [])
            }
            opponentCapturedPieces={
              effectiveBoardFlipped
                ? (activeCapturedPieces?.w ?? [])
                : (activeCapturedPieces?.b ?? [])
            }
          />
        </div>

        <div
          className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-lg sm:text-xl transition-all font-mono min-w-[100px] sm:min-w-[120px] text-center ${(effectiveBoardFlipped ? whiteTime : blackTime) < 10000
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
              : 'bg-gray-700 text-gray-100'
            }`}
        >
          {formatTime(effectiveBoardFlipped ? whiteTime : blackTime)}
        </div>
      </div>

      {/* Multiplayer Notice */}
      {isMultiplayerGame && isMultiplayerStarted && (
        <div
          className="w-full mb-2 text-center text-xs sm:text-sm text-white/90 backdrop-blur-sm rounded-lg py-2 px-3"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          {multiplayerNotice ||
            `Connected (${multiplayerSide === 'w' ? 'White' : 'Black'})`}
        </div>
      )}

      {/* Board + Eval */}
      <div className="relative flex flex-row items-stretch w-full">
        <EvaluationBar
          evaluation={evalValue}
          mate={mateValue}
          depth={stockfish?.depth ?? 0}
          isThinking={stockfish?.isThinking ?? false}
          isBoardFlipped={effectiveBoardFlipped}
          currentTurn={displayTurn}
        />

        <ChessBoardView
          key={boardViewKey}
          board={displayBoard}
          selectedSquare={displaySelectedSquare}
          validMoves={displayValidMoves}
          kingInCheckPos={displayKingInCheckPos}
          lastMove={displayLastMove}
          onSquareClick={handleSquareClick}
          rankLabels={displayRankLabels}
          fileLabels={displayFileLabels}
          gameState={gameState}
          isReviewMode={isReviewMode}
          activePieceImages={activePieceImages}
          boardTheme={boardThemeColors}
          showCoordinates={uiSettings.showCoordinates}
          showLegalMoves={uiSettings.showLegalMoveDots}
          highlightLastMove={uiSettings.highlightLastMove}
          pieceAnimation={
            uiSettings.enableAnimations &&
            uiSettings.pieceAnimation
          }
          dragAnimation={
            uiSettings.enableAnimations &&
            uiSettings.dragAnimation &&
            uiSettings.pieceMovement === 'smooth'
          }
          compactMode={uiSettings.compactMode}
          showAnalysisMoveIcon={false}
          analysisMoveClassification={null}
          analysisMoveTo={null}
        />
      </div>

      {/* Bottom Bar */}
      <div className="w-full flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 flex-1">
          <PlayerCard
            color={effectiveBoardFlipped ? 'b' : 'w'}
            playerName={
              effectiveBoardFlipped
                ? (playerNames.black || 'Black')
                : (playerNames.white || 'White')
            }
            capturedPieces={
              effectiveBoardFlipped
                ? (activeCapturedPieces?.w ?? [])
                : (activeCapturedPieces?.b ?? [])
            }
            opponentCapturedPieces={
              effectiveBoardFlipped
                ? (activeCapturedPieces?.b ?? [])
                : (activeCapturedPieces?.w ?? [])
            }
          />
        </div>

        <div
          className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg font-bold text-lg sm:text-xl transition-all font-mono min-w-[100px] sm:min-w-[120px] text-center ${(effectiveBoardFlipped ? blackTime : whiteTime) < 10000
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
              : 'bg-gray-700 text-gray-100'
            }`}
        >
          {formatTime(effectiveBoardFlipped ? blackTime : whiteTime)}
        </div>
      </div>
    </div>
  );
}
