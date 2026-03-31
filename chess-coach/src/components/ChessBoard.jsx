import { Chessboard } from 'react-chessboard';
import { useMemo } from 'react';

export default function ChessBoard({
  fen,
  chess,
  setPosition,
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

  function onDrop({ sourceSquare, targetSquare }) {
    if (gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw') {
      return false;
    }
    let move = null;
    try {
      move = chess.current.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });
    } catch (e) {
      console.log('[ChessBoard] onDrop error:', e.message);
      return false;
    }
    console.log('[ChessBoard] onDrop move result:', move);
    if (move === null) return false;
    setPosition(chess.current.fen());
    onMove(move);
    return true;
  }

  const boardWidth = Math.min(560, typeof window !== 'undefined' ? window.innerWidth * 0.55 : 560);

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
          options={{
            position: fen,
            onPieceDrop: onDrop,
            squareStyles: customSquareStyles,
            boardStyle: {
              borderRadius: '8px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              width: `${boardWidth}px`
            },
            darkSquareStyle: { backgroundColor: '#0f3460' },
            lightSquareStyle: { backgroundColor: '#e8d5b7' }
          }}
        />
      </div>
    </div>
  );
}
