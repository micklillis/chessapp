import { Chessboard } from 'react-chessboard';
import { useMemo } from 'react';

export default function ChessBoard({
  fen,
  onMove,
  lastMove,
  gameStatus,
  currentTurn,
  isDrillMode,
  drillPosition
}) {
  const customSquareStyles = useMemo(() => {
    const styles = {};
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 100, 0.4)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 100, 0.4)' };
    }
    return styles;
  }, [lastMove]);

  const statusText = useMemo(() => {
    switch (gameStatus) {
      case 'checkmate':
        return `Checkmate! ${currentTurn === 'White' ? 'Black' : 'White'} wins!`;
      case 'stalemate':
        return 'Stalemate — Draw!';
      case 'draw':
        return 'Draw!';
      case 'check':
        return `${currentTurn} is in check!`;
      default:
        return `${currentTurn}'s turn`;
    }
  }, [gameStatus, currentTurn]);

  const statusClass = useMemo(() => {
    switch (gameStatus) {
      case 'checkmate': return 'status-checkmate';
      case 'stalemate':
      case 'draw': return 'status-draw';
      case 'check': return 'status-check';
      default: return `status-playing status-${currentTurn.toLowerCase()}`;
    }
  }, [gameStatus, currentTurn]);

  function onDrop(sourceSquare, targetSquare, piece) {
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw') {
      return false;
    }
    const moveObj = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    };
    return onMove(moveObj);
  }

  return (
    <div className="chess-board-container">
      {isDrillMode && drillPosition && (
        <div className="drill-banner">
          <span className="drill-label">DRILL MODE</span>
          <span className="drill-description">{drillPosition.description}</span>
        </div>
      )}
      <div className={`game-status ${statusClass}`}>
        {statusText}
      </div>
      <div className="board-wrapper">
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          customSquareStyles={customSquareStyles}
          boardWidth={Math.min(560, typeof window !== 'undefined' ? window.innerWidth * 0.55 : 560)}
          customBoardStyle={{
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)'
          }}
          customDarkSquareStyle={{ backgroundColor: '#0f3460' }}
          customLightSquareStyle={{ backgroundColor: '#e8d5b7' }}
        />
      </div>
    </div>
  );
}
