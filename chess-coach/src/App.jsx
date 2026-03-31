import { useEffect, useCallback, useState } from 'react';
import { useChessGame } from './hooks/useChessGame';
import { useClaudeCoach } from './hooks/useClaudeCoach';
import ChessBoard from './components/ChessBoard';
import CoachPanel from './components/CoachPanel';
import MoveHistory from './components/MoveHistory';
import DrillMode from './components/DrillMode';
import GameReview from './components/GameReview';
import './App.css';

export default function App() {
  const {
    chess,
    setPosition,
    fen,
    pgn,
    moveHistory,
    lastMove,
    gameStatus,
    currentTurn,
    isDrillMode,
    drillPosition,
    afterMove,
    makeMove,
    undoMove,
    resetGame,
    startDrillMode,
    nextDrill,
    exitDrillMode
  } = useChessGame();

  const [playerColour, setPlayerColour] = useState('w');

  const {
    analysis,
    isLoading,
    error,
    gameReview,
    isReviewLoading,
    isApiKeyMissing,
    analyzePosition,
    evaluateDrillMove,
    reviewGame,
    clearAnalysis,
    clearGameReview,
    retryAnalysis
  } = useClaudeCoach();

  useEffect(() => {
    if (lastMove && !isDrillMode) {
      analyzePosition(fen, pgn, lastMove.san, playerColour);
    }
  }, [lastMove, fen, pgn, isDrillMode, playerColour, analyzePosition]);

  const handleUndo = useCallback(() => {
    undoMove();
    clearAnalysis();
  }, [undoMove, clearAnalysis]);

  const handleReset = useCallback(() => {
    resetGame();
    clearAnalysis();
    clearGameReview();
  }, [resetGame, clearAnalysis, clearGameReview]);

  const handleDrillMove = useCallback(async (move) => {
    return await evaluateDrillMove(drillPosition?.fen || fen, move);
  }, [evaluateDrillMove, drillPosition, fen]);

  const handleStartDrill = useCallback(() => {
    clearAnalysis();
    clearGameReview();
    startDrillMode();
  }, [clearAnalysis, clearGameReview, startDrillMode]);

  const handleExitDrill = useCallback(() => {
    exitDrillMode();
    clearAnalysis();
  }, [exitDrillMode, clearAnalysis]);

  const handleSuggestedMove = useCallback((moveSan) => {
    makeMove(moveSan);
  }, [makeMove]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="app-logo">♟ ChessCoach</h1>
          <p className="app-tagline">AI-powered chess coaching at every move</p>
        </div>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <ChessBoard
            fen={fen}
            chess={chess}
            setPosition={setPosition}
            onMove={afterMove}
            lastMove={lastMove}
            gameStatus={gameStatus}
            currentTurn={currentTurn}
            isDrillMode={isDrillMode}
            drillPosition={drillPosition}
            playerColour={playerColour}
            onPlayerColourChange={setPlayerColour}
          />

          <MoveHistory
            moveHistory={moveHistory}
            onUndo={handleUndo}
            onReset={handleReset}
          />

          <GameReview
            review={gameReview}
            isLoading={isReviewLoading}
            onClose={clearGameReview}
            onRequestReview={() => reviewGame(pgn)}
            gameStatus={gameStatus}
          />
        </div>

        <div className="right-panel">
          <CoachPanel
            analysis={analysis}
            isLoading={isLoading}
            error={error}
            isApiKeyMissing={isApiKeyMissing}
            lastMove={lastMove}
            onRetry={retryAnalysis}
            onSuggestedMove={handleSuggestedMove}
            fen={fen}
            pgn={pgn}
            playerColour={playerColour}
          />

          <DrillMode
            isDrillMode={isDrillMode}
            drillPosition={drillPosition}
            onStartDrill={handleStartDrill}
            onExitDrill={handleExitDrill}
            onNextDrill={nextDrill}
            onDrillMove={handleDrillMove}
            lastMove={lastMove}
            isApiKeyMissing={isApiKeyMissing}
          />
        </div>
      </main>
    </div>
  );
}
