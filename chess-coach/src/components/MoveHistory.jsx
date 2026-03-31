import { useEffect, useRef } from 'react';

export default function MoveHistory({ moveHistory, onUndo, onReset }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moveHistory]);

  const movePairs = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moveHistory[i]?.san,
      black: moveHistory[i + 1]?.san
    });
  }

  return (
    <div className="move-history">
      <div className="move-history-header">
        <span className="move-history-title">Move History</span>
        <div className="move-history-actions">
          <button
            className="btn btn-secondary btn-small"
            onClick={onUndo}
            disabled={moveHistory.length === 0}
          >
            ↩ Undo
          </button>
          <button
            className="btn btn-danger btn-small"
            onClick={onReset}
          >
            ↺ Reset
          </button>
        </div>
      </div>
      <div className="move-history-scroll" ref={scrollRef}>
        {movePairs.length === 0 ? (
          <p className="no-moves">No moves yet. Make a move to start!</p>
        ) : (
          <table className="moves-table">
            <tbody>
              {movePairs.map(pair => (
                <tr key={pair.number}>
                  <td className="move-number">{pair.number}.</td>
                  <td className="move-white">{pair.white}</td>
                  <td className="move-black">{pair.black || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
