import { useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';

const DRILL_POSITIONS = [
  {
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    description: "White played 1.e4. What's the most classical response?"
  },
  {
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    description: "The Open Game (1.e4 e5). What's the best developing move for White?"
  },
  {
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    description: "After 1.e4 e5 2.Nf3. How should Black defend the e5 pawn?"
  },
  {
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    description: "Two Knights position. What's the best move for White?"
  },
  {
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2',
    description: "After 1.e4 d5 — the Scandinavian Defense. How should White respond?"
  },
  {
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2',
    description: "After 1.e4 c5 — the Sicilian Defense. What's White's most popular reply?"
  },
  {
    fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1',
    description: "White opened with 1.d4. What's Black's most solid response?"
  },
  {
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2',
    description: "The Queen's Gambit (1.d4 d5 2.c4). Should Black accept or decline?"
  }
];

export function useChessGame() {
  const chess = useRef(new Chess());
  const [fen, setFen] = useState(chess.current.fen());
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [gameStatus, setGameStatus] = useState('playing');
  const [isDrillMode, setIsDrillMode] = useState(false);
  const [drillPosition, setDrillPosition] = useState(null);
  const [drillIndex, setDrillIndex] = useState(0);

  const getGameStatus = useCallback((chessInstance) => {
    if (chessInstance.isCheckmate()) return 'checkmate';
    if (chessInstance.isStalemate()) return 'stalemate';
    if (chessInstance.isDraw()) return 'draw';
    if (chessInstance.isCheck()) return 'check';
    return 'playing';
  }, []);

  const makeMove = useCallback((move) => {
    let result = null;
    try {
      result = chess.current.move(move);
    } catch {
      return false;
    }
    if (result === null) return false;

    setFen(chess.current.fen());
    setLastMove({ from: result.from, to: result.to, san: result.san });
    setMoveHistory(prev => [...prev, result]);
    setGameStatus(getGameStatus(chess.current));
    return true;
  }, [getGameStatus]);

  const undoMove = useCallback(() => {
    if (moveHistory.length === 0) return;
    chess.current.undo();
    setFen(chess.current.fen());
    setMoveHistory(prev => prev.slice(0, -1));
    setLastMove(moveHistory.length >= 2 ? {
      from: moveHistory[moveHistory.length - 2].from,
      to: moveHistory[moveHistory.length - 2].to,
      san: moveHistory[moveHistory.length - 2].san
    } : null);
    setGameStatus(getGameStatus(chess.current));
  }, [moveHistory, getGameStatus]);

  const resetGame = useCallback(() => {
    chess.current = new Chess();
    setFen(chess.current.fen());
    setMoveHistory([]);
    setLastMove(null);
    setGameStatus('playing');
  }, []);

  const startDrillMode = useCallback(() => {
    setIsDrillMode(true);
    const pos = DRILL_POSITIONS[drillIndex % DRILL_POSITIONS.length];
    setDrillPosition(pos);
    chess.current = new Chess(pos.fen);
    setFen(chess.current.fen());
    setMoveHistory([]);
    setLastMove(null);
    setGameStatus('playing');
  }, [drillIndex]);

  const nextDrill = useCallback(() => {
    const nextIndex = (drillIndex + 1) % DRILL_POSITIONS.length;
    setDrillIndex(nextIndex);
    const pos = DRILL_POSITIONS[nextIndex];
    setDrillPosition(pos);
    chess.current = new Chess(pos.fen);
    setFen(chess.current.fen());
    setMoveHistory([]);
    setLastMove(null);
    setGameStatus('playing');
  }, [drillIndex]);

  const exitDrillMode = useCallback(() => {
    setIsDrillMode(false);
    setDrillPosition(null);
    chess.current = new Chess();
    setFen(chess.current.fen());
    setMoveHistory([]);
    setLastMove(null);
    setGameStatus('playing');
  }, []);

  const getPgn = useCallback(() => {
    return chess.current.pgn();
  }, [fen]); // fen dep ensures pgn stays in sync

  return {
    fen,
    pgn: getPgn(),
    moveHistory,
    lastMove,
    gameStatus,
    currentTurn: chess.current.turn() === 'w' ? 'White' : 'Black',
    isDrillMode,
    drillPosition,
    makeMove,
    undoMove,
    resetGame,
    startDrillMode,
    nextDrill,
    exitDrillMode
  };
}
