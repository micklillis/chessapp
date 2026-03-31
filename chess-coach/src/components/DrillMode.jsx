import { useState } from 'react';

const QUALITY_COLORS = {
  Excellent: '#22c55e',
  Good: '#4ade80',
  Inaccuracy: '#facc15',
  Mistake: '#f97316',
  Blunder: '#ef4444'
};

export default function DrillMode({
  isDrillMode,
  drillPosition,
  onStartDrill,
  onExitDrill,
  onNextDrill,
  onDrillMove,
  lastMove,
  isApiKeyMissing
}) {
  const [drillResult, setDrillResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  async function handleDrillMove(move) {
    if (!move || drillResult) return;
    setIsEvaluating(true);
    const result = await onDrillMove(move);
    setDrillResult(result);
    setIsEvaluating(false);
  }

  function handleNext() {
    setDrillResult(null);
    onNextDrill();
  }

  if (!isDrillMode) {
    return (
      <div className="drill-cta">
        <button className="btn btn-accent" onClick={onStartDrill}>
          🎯 Start Drill Mode
        </button>
        <p className="drill-cta-hint">Practice common opening positions with AI feedback</p>
      </div>
    );
  }

  return (
    <div className="drill-panel">
      <div className="drill-panel-header">
        <h3 className="drill-panel-title">🎯 Drill Mode</h3>
        <button className="btn btn-secondary btn-small" onClick={onExitDrill}>
          Exit Drills
        </button>
      </div>

      {drillPosition && (
        <p className="drill-instruction">{drillPosition.description}</p>
      )}

      {isEvaluating && (
        <div className="drill-evaluating">
          <div className="spinner"></div>
          <span>Evaluating your move...</span>
        </div>
      )}

      {isApiKeyMissing && (
        <div className="drill-no-api">
          <p>API key not configured — drill evaluation unavailable.</p>
          <p>You can still practice moves on the board.</p>
        </div>
      )}

      {drillResult && !isEvaluating && (
        <div className={`drill-result ${drillResult.correct ? 'drill-correct' : 'drill-incorrect'}`}>
          <div className="drill-result-header">
            {drillResult.correct ? '✅ Correct!' : '❌ Not the best'}
          </div>
          <p className="drill-explanation">{drillResult.explanation}</p>
          <div className="drill-best-move">
            Best move: <strong>{drillResult.best_move}</strong>
          </div>
          <p className="drill-encouragement">{drillResult.encouragement}</p>
          <button className="btn btn-accent" onClick={handleNext}>
            Next Drill →
          </button>
        </div>
      )}

      {!drillResult && !isEvaluating && (
        <div className="drill-hint">
          <p>Make a move on the board to submit your answer.</p>
          {lastMove && (
            <button
              className="btn btn-primary"
              onClick={() => handleDrillMove(lastMove.san)}
            >
              Submit: {lastMove.san}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
