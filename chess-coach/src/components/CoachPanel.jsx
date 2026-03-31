import LoadingSkeleton from './LoadingSkeleton';

const QUALITY_COLORS = {
  Excellent: '#22c55e',
  Good: '#4ade80',
  Inaccuracy: '#facc15',
  Mistake: '#f97316',
  Blunder: '#ef4444'
};

export default function CoachPanel({
  analysis,
  isLoading,
  error,
  isApiKeyMissing,
  lastMove,
  onRetry,
  onSuggestedMove,
  fen,
  pgn,
  playerColour
}) {
  if (isApiKeyMissing) {
    return (
      <div className="coach-panel">
        <div className="coach-header">
          <h2 className="coach-title">♟ ChessCoach AI</h2>
        </div>
        <div className="api-key-banner">
          <div className="api-key-icon">🔑</div>
          <h3>API key not configured</h3>
          <p>See deployment instructions to add your Anthropic API key.</p>
          <div className="api-key-steps">
            <p>1. Get your key from console.anthropic.com</p>
            <p>2. Add it as ANTHROPIC_API_KEY in GitHub Secrets</p>
            <p>3. Push to main to rebuild</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="coach-panel">
      <div className="coach-header">
        <h2 className="coach-title">♟ ChessCoach AI</h2>
        <span className="coach-perspective">
          Coaching you as {playerColour === 'b' ? 'Black' : 'White'}
        </span>
        {isLoading && <span className="coach-loading-indicator">Analyzing...</span>}
      </div>

      {!analysis && !isLoading && !error && (
        <div className="coach-welcome">
          <div className="coach-welcome-icon">♟</div>
          <p>Make a move to receive AI coaching analysis!</p>
          <p className="coach-welcome-hint">I'll analyze every position and help you improve.</p>
        </div>
      )}

      {isLoading && <LoadingSkeleton />}

      {error && !isLoading && (
        <div className="coach-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => onRetry(fen, pgn, lastMove?.san)}
          >
            Retry Analysis
          </button>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="analysis-content">
          <div className="analysis-section opening-section">
            <div className="section-header">
              <span className="section-icon">📖</span>
              <span className="section-title">Opening</span>
            </div>
            <div className="opening-name">{analysis.opening_name}</div>
            {analysis.opening_description && (
              <p className="opening-description">{analysis.opening_description}</p>
            )}
          </div>

          <div className="analysis-section position-section">
            <div className="section-header">
              <span className="section-icon">⚖️</span>
              <span className="section-title">Position</span>
            </div>
            <p className="position-assessment">{analysis.position_assessment}</p>
          </div>

          {lastMove && (
            <div className="analysis-section last-move-section">
              <div className="section-header">
                <span className="section-icon">🎯</span>
                <span className="section-title">Last Move: {lastMove.san}</span>
                {analysis.last_move_quality && (
                  <span
                    className="quality-badge"
                    style={{ backgroundColor: QUALITY_COLORS[analysis.last_move_quality] || '#888' }}
                  >
                    {analysis.last_move_quality}
                  </span>
                )}
              </div>
              <p className="last-move-explanation">{analysis.last_move_explanation}</p>
            </div>
          )}

          <div className="analysis-section key-idea-section">
            <div className="section-header">
              <span className="section-icon">💡</span>
              <span className="section-title">Key Idea</span>
            </div>
            <p className="key-idea">{analysis.key_idea}</p>
          </div>

          {analysis.suggested_moves?.length > 0 && (
            <div className="analysis-section suggestions-section">
              <div className="section-header">
                <span className="section-icon">➡️</span>
                <span className="section-title">Try These Moves</span>
              </div>
              <div className="move-chips">
                {analysis.suggested_moves.map((move, i) => (
                  <button
                    key={i}
                    className="move-chip"
                    onClick={() => onSuggestedMove && onSuggestedMove(move)}
                    title="Click to attempt this move"
                  >
                    {move}
                  </button>
                ))}
              </div>
              {analysis.suggested_moves_explanation && (
                <p className="suggestions-explanation">{analysis.suggested_moves_explanation}</p>
              )}
            </div>
          )}

          {analysis.fun_fact && (
            <div className="analysis-section fun-fact-section">
              <div className="section-header">
                <span className="section-icon">🌟</span>
                <span className="section-title">Fun Fact</span>
              </div>
              <p className="fun-fact">{analysis.fun_fact}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
