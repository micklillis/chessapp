import { useState, useCallback } from 'react';

const API_URL = '/api/analyze';

export function useClaudeCoach() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gameReview, setGameReview] = useState(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  const isApiKeyMissing = false;

  const analyzePosition = useCallback(async (fen, pgn, lastMove, playerColour = 'w') => {
    if (isApiKeyMissing) return;
    setIsLoading(true);
    setError(null);

    const playerName = playerColour === 'w' ? 'White' : 'Black';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are ChessCoach, an expert chess coach and opening theorist.
    The player you are coaching is playing as ${playerName}. Focus your analysis, suggestions and key ideas specifically for that player's perspective. When suggesting moves, only suggest moves for the player's colour when it is their turn.
    After each move, analyze the position and respond ONLY in this exact JSON format with no extra text:
    {
      "opening_name": "Name of the opening or variation, or 'Opening phase complete' if past move 15",
      "opening_description": "1-2 sentences describing this opening's key ideas and goals",
      "position_assessment": "Brief assessment of the current position balance (e.g. Equal, Slight advantage White, etc)",
      "last_move_quality": "Excellent | Good | Inaccuracy | Mistake | Blunder",
      "last_move_explanation": "1-2 sentences explaining why the last move was good or bad",
      "key_idea": "The most important strategic or tactical idea in the current position",
      "suggested_moves": ["move1", "move2", "move3"],
      "suggested_moves_explanation": "Brief explanation of why these moves are worth considering",
      "fun_fact": "An interesting fact about this opening or position (optional, leave empty string if none)"
    }`,
          messages: [{
            role: 'user',
            content: `Current FEN: ${fen}\nGame PGN: ${pgn}\nLast move played: ${lastMove}\nAnalyze this position.`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format from Claude');
      const parsed = JSON.parse(jsonMatch[0]);
      setAnalysis(parsed);
    } catch (err) {
      setError(err.message || 'Failed to get analysis');
    } finally {
      setIsLoading(false);
    }
  }, [isApiKeyMissing]);

  const evaluateDrillMove = useCallback(async (fen, move) => {
    if (isApiKeyMissing) return null;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: `You are a chess coach running a drilling exercise.
Respond ONLY in JSON:
{
  "correct": true/false,
  "explanation": "Why this move is good or bad",
  "best_move": "The objectively best move in this position",
  "encouragement": "Short encouraging message for the student"
}`,
          messages: [{
            role: 'user',
            content: `Position FEN: ${fen}. The student played: ${move}. Is this a good move in this opening?`
          }]
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }, [isApiKeyMissing]);

  const reviewGame = useCallback(async (pgn) => {
    if (isApiKeyMissing) return;
    setIsReviewLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a chess coach reviewing a completed game.
Respond ONLY in JSON:
{
  "overall_assessment": "1-2 sentence summary of how the game went",
  "best_moment": { "move": "move notation", "explanation": "why this was great" },
  "biggest_mistake": { "move": "move notation", "explanation": "what went wrong and what to play instead" },
  "opening_grade": "A/B/C/D/F with one sentence explanation",
  "key_lesson": "The single most important thing to learn from this game",
  "recommended_study": ["Topic 1 to study", "Topic 2 to study"]
}`,
          messages: [{
            role: 'user',
            content: `Please review this completed chess game:\n\nPGN: ${pgn}`
          }]
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const text = data.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid response format');
      setGameReview(JSON.parse(jsonMatch[0]));
    } catch (err) {
      setError(err.message || 'Failed to get game review');
    } finally {
      setIsReviewLoading(false);
    }
  }, [isApiKeyMissing]);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  const clearGameReview = useCallback(() => {
    setGameReview(null);
  }, []);

  const retryAnalysis = useCallback((fen, pgn, lastMove) => {
    analyzePosition(fen, pgn, lastMove);
  }, [analyzePosition]);

  return {
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
  };
}
