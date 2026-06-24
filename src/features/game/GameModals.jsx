import GameOverModal from '../../components/GameOverModal';
import DrawOfferModal from '../../components/DrawOfferModal';
import SettingsModal from '../../components/SettingsModal';
import GameSettingsModal from '../../components/GameSettingsModal';

export default function GameModals({
  isGameOverUIState,
  gameState,
  currentTurn,
  handleNewGame,
  handleRematch,
  handleGameReview,
  setShowGameOverUI,

  showDrawOffer,
  incomingDrawOfferSide,
  handleAcceptDraw,
  handleDeclineDraw,

  showAppSettings,
  setShowAppSettings,
  boardSurfaceOptions,
  pieceSetOptions,

  showGameSettings,
  setShowGameSettings,
  playerNames,
  updatePlayerName,
  resetPlayerNames,

  isMultiplayerGame,
  multiplayerSide,

  setIsBoardFlipped,

  handleResign,
  handleOfferDraw,

  uiCapabilities,
}) {
  return (
    <>
      {isGameOverUIState && (
        <GameOverModal
          gameState={gameState}
          currentTurn={currentTurn}
          onNewGame={handleNewGame}
          onRematch={handleRematch}
          onReview={handleGameReview}
          onClose={() => setShowGameOverUI(false)}
        />
      )}

      {showDrawOffer && (
        <DrawOfferModal
          currentTurn={currentTurn}
          offeringSide={incomingDrawOfferSide}
          onAccept={handleAcceptDraw}
          onDecline={handleDeclineDraw}
        />
      )}

      {showAppSettings && (
        <SettingsModal
          onClose={() => setShowAppSettings(false)}
          boardSurfaceOptions={boardSurfaceOptions}
          pieceSetOptions={pieceSetOptions}
        />
      )}

      {showGameSettings && (
        <GameSettingsModal
          onClose={() => setShowGameSettings(false)}
          whiteName={playerNames.white}
          blackName={playerNames.black}
          onWhiteNameChange={(value) => updatePlayerName('white', value)}
          onBlackNameChange={(value) => updatePlayerName('black', value)}
          onResetNames={resetPlayerNames}
          canEditWhite={!isMultiplayerGame || multiplayerSide === 'w'}
          canEditBlack={!isMultiplayerGame || multiplayerSide === 'b'}
          showReset={!isMultiplayerGame}
          onFlipBoard={() => setIsBoardFlipped((prev) => !prev)}
          onResign={handleResign}
          onOfferDraw={handleOfferDraw}
          canUseInGameActions={uiCapabilities.canUseInGameActions}
        />
      )}
    </>
  );
}