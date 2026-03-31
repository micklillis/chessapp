export default function GameReview({ review, isLoading, onClose, onRequestReview, gameStatus }) {
  const isGameOver = gameStatus === 'checkmate' || gameStatus === 'stalemate' || gameStatus === 'draw';

  if (!isGameOver) return null;

  function gradeColor(grade) {
    if (!grade) return '#aaa';
    const letter = grade.charAt(0).toUpperCase();
    const colors = { A: '#22c55e', B: '#4ade80', C: '#facc15', D: '#f97316', F: '#ef4444' };
    return colors[letter] || '#aaa';
  }

  return (
    <>
      {!review && (
        <button className="btn btn-accent review-btn" onClick={onRequestReview} disabled={isLoading}>
          {isLoading ? 'Analyzing game...' : '📋 Review Game'}
        </button>
      )}

      {review && (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📋 Game Report Card</h2>
              <button className="modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="review-body">
              <div className="review-section review-assessment">
                <p className="review-overall">{review.overall_assessment}</p>
              </div>

              <div className="review-grid">
                <div className="review-card review-best">
                  <div className="review-card-label">🌟 Best Moment</div>
                  <div className="review-move-badge">{review.best_moment?.move}</div>
                  <p>{review.best_moment?.explanation}</p>
                </div>

                <div className="review-card review-mistake">
                  <div className="review-card-label">⚠️ Biggest Mistake</div>
                  <div className="review-move-badge">{review.biggest_mistake?.move}</div>
                  <p>{review.biggest_mistake?.explanation}</p>
                </div>
              </div>

              <div className="review-section">
                <div className="review-opening-grade">
                  <span className="review-label">Opening Grade:</span>
                  <span
                    className="grade-badge"
                    style={{ backgroundColor: gradeColor(review.opening_grade) }}
                  >
                    {review.opening_grade?.charAt(0)}
                  </span>
                  <span className="grade-explanation">
                    {review.opening_grade?.substring(1).trim()}
                  </span>
                </div>
              </div>

              <div className="review-section">
                <div className="review-label">💡 Key Lesson</div>
                <p className="review-key-lesson">{review.key_lesson}</p>
              </div>

              {review.recommended_study?.length > 0 && (
                <div className="review-section">
                  <div className="review-label">📚 Recommended Study</div>
                  <ul className="study-list">
                    {review.recommended_study.map((topic, i) => (
                      <li key={i}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button className="btn btn-secondary modal-close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
