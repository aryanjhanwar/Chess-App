import fs from 'fs';
import path from 'path';

const file = './src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  return (
    <GamePage
      appBackgroundStyle={appBackgroundStyle}
      showMultiplayerModal={showMultiplayerModal}
      setShowMultiplayerModal={setShowMultiplayerModal}
      handleCreateMultiplayerGame={handleCreateMultiplayerGame}
      handleJoinMultiplayerGame={handleJoinMultiplayerGame}
      handleCancelMultiplayerGame={handleCancelMultiplayerGame}
      multiplayerRoomId={multiplayerRoomId}
      multiplayerRole={multiplayerRole}
      multiplayerNotice={multiplayerNotice}
      setMultiplayerNotice={setMultiplayerNotice}
      isGameOverUIState={isGameOverUIState}
      gameState={gameState}
      currentTurn={currentTurn}
      handleNewGame={handleNewGame}
      handleRematch={handleRematch}
      handleGameReview={handleGameReview}
      setShowGameOverUI={setShowGameOverUI}
      showDrawOffer={showDrawOffer}
      incomingDrawOfferSide={incomingDrawOfferSide}
      handleAcceptDraw={handleAcceptDraw}
      handleDeclineDraw={handleDeclineDraw}
      handleModeSelect={handleModeSelect}
      setShowAppSettings={setShowAppSettings}
      handleRefreshBoardView={handleRefreshBoardView}
      handlePlaySelectFromNav={handlePlaySelectFromNav}
      effectiveBoardFlipped={effectiveBoardFlipped}
      playerNames={playerNames}
      activeCapturedPieces={activeCapturedPieces}
      whiteTime={whiteTime}
      blackTime={blackTime}
      formatTime={formatTime}
      displayFen={displayFen}
      isValidMoveSource={isValidMoveSource}
      displayLegalMovesMap={displayLegalMovesMap}
      selectedSquare={selectedSquare}
      displayLastMove={displayLastMove}
      handleSquareClick={handleSquareClick}
      displayRankLabels={displayRankLabels}
      displayFileLabels={displayFileLabels}
      isReviewMode={isReviewMode}
      activePieceImages={activePieceImages}
      boardThemeColors={boardThemeColors}
      uiSettings={uiSettings}
      setShowGameSettings={setShowGameSettings}
      setIsBoardFlipped={setIsBoardFlipped}
      showPromotionUI={showPromotionUI}
      promotionSquare={promotionSquare}
      handlePromotion={handlePromotion}
      handleCancelPromotion={handleCancelPromotion}
      showAppSettings={showAppSettings}
      handleUiSettingsChange={handleUiSettingsChange}
      handleApplyThemePreset={handleApplyThemePreset}
      handleResetVisualSettings={handleResetVisualSettings}
      boardSurfaceOptions={boardSurfaceOptions}
      pieceSetOptions={pieceSetOptions}
      showGameSettings={showGameSettings}
      updatePlayerName={updatePlayerName}
      resetPlayerNames={resetPlayerNames}
      isMultiplayerGame={isMultiplayerGame}
      multiplayerSide={multiplayerSide}
      handleResign={handleResign}
      handleOfferDraw={handleOfferDraw}
      uiCapabilities={uiCapabilities}
      showMobileStartPanel={showMobileStartPanel}
      selectedTimeControl={selectedTimeControl}
      handleSelectTimeControl={handleSelectTimeControl}
      gameMode={gameMode}
      handleSelectGameMode={handleSelectGameMode}
      computerDifficulty={computerDifficulty}
      handleComputerDifficultyChange={handleComputerDifficultyChange}
      handleStartConfiguredGame={handleStartConfiguredGame}
      stockfish={stockfish}
      gameStarted={gameStarted}
      activeMoveHistory={activeMoveHistory}
      highlightResign={highlightResign}
      reviewIndex={reviewIndex}
      reviewHistoryLength={reviewHistoryLength}
      isPlaying={isPlaying}
      handleReviewPrevious={handleReviewPrevious}
      handleReviewNext={handleReviewNext}
      handleReviewStart={handleReviewStart}
      handleReviewEnd={handleReviewEnd}
      handleReviewTogglePlay={handleReviewTogglePlay}
      handleExitReview={handleExitReview}
      handleOpenGameAnalysis={handleOpenGameAnalysis}
      handleNewGameRequest={handleNewGameRequest}
      handlePlayFriend={handlePlayFriend}
    />
  );
}

export default App;
`;

const startIdx = content.indexOf('  return (\n    <div\n      className={`h-screen w-screen');
if (startIdx !== -1) {
    content = content.substring(0, startIdx) + replacement;
    // Add import
    const importStr = "import GamePage from './pages/GamePage';\n";
    content = content.replace("import Sidebar", importStr + "import Sidebar");
    fs.writeFileSync(file, content);
    console.log('Success');
} else {
    // maybe line endings are crlf
    const altStartIdx = content.indexOf('  return (\r\n    <div\r\n      className={`h-screen w-screen');
    if (altStartIdx !== -1) {
        content = content.substring(0, altStartIdx) + replacement;
        const importStr = "import GamePage from './pages/GamePage';\r\n";
        content = content.replace("import Sidebar", importStr + "import Sidebar");
        fs.writeFileSync(file, content);
        console.log('Success with CRLF');
    } else {
        console.log('Could not find start index');
    }
}
