import { useState, useCallback, useRef } from 'react';

const API_URL = '/api/analyze';

// Extract completed fields from a partial JSON string as it streams in.
function parsePartialAnalysis(text) {
  const result = {};
  const stringFields = [
    'opening_name', 'opening_description', 'position_assessment',
    'last_move_quality', 'last_move_explanation', 'key_idea',
    'suggested_moves_explanation', 'fun_fact'
  ];
  for (const field of stringFields) {
    const match = text.match(
      new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\s\\S])*)"`));
    if (match) {
      result[field] = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }
  const arrayMatch = text.match(/"suggested_moves"\s*:\s*\[([^\]]*)\]/);
  if (arrayMatch) {
    try { result.suggested_moves = JSON.parse('[' + arrayMatch[1] + ']'); } catch {}
  }
  return result;
}

// Read an SSE stream to completion and return the accumulated text content.
async function readSSEText(reader) {
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') continue;
      try {
        const event = JSON.parse(raw);
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          text += event.delta.text;
        }
      } catch {}
    }
  }
  return text;
}

export function useClaudeCoach(chess) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [gameReview, setGameReview] = useState(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  const isApiKeyMissing = false;
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const analyzePosition = useCallback((fen, pgn, lastMove, playerColour = 'w') => {
    if (isApiKeyMissing) return;

    // Cancel pending debounce and abort any in-flight request
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setIsStreaming(true);
      setError(null);
      setAnalysis({});

      const playerName = playerColour === 'w' ? 'White' : 'Black';

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
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

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';
        const extractedKeys = new Set();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') continue;
            try {
              const event = JSON.parse(raw);
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                accumulated += event.delta.text;
                const partial = parsePartialAnalysis(accumulated);
                const newKeys = Object.keys(partial).filter(k => !extractedKeys.has(k));
                if (newKeys.length > 0) {
                  newKeys.forEach(k => extractedKeys.add(k));
                  setAnalysis(prev => ({ ...prev, ...partial }));
                }
              }
            } catch {}
          }
        }

        // Validate suggested moves against legal moves
        const legalMoves = chess?.current?.moves() ?? [];
        const finalPartial = parsePartialAnalysis(accumulated);
        const validMoves = (finalPartial.suggested_moves ?? []).filter(m => legalMoves.includes(m));

        if (validMoves.length > 0 || legalMoves.length === 0) {
          setAnalysis(prev => ({ ...prev, suggested_moves: validMoves }));
        } else {
          // All suggestions illegal — retry with legal moves list
          setAnalysis(prev => ({ ...prev, suggested_moves: [], suggested_moves_explanation: 'Analysing position...' }));
          try {
            const retryResp = await fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                system: 'You are a chess coach. Respond ONLY with a JSON object in this exact format: {"suggested_moves": ["move1", "move2", "move3"], "suggested_moves_explanation": "brief explanation"}',
                messages: [{
                  role: 'user',
                  content: `Legal moves available: ${legalMoves.join(', ')}\nFrom this list only, suggest the 3 best moves for the player.`
                }]
              })
            });
            if (retryResp.ok) {
              const retryText = await readSSEText(retryResp.body.getReader());
              const retryMatch = retryText.match(/\{[\s\S]*\}/);
              if (retryMatch) {
                const retryParsed = JSON.parse(retryMatch[0]);
                const retryValid = (retryParsed.suggested_moves ?? []).filter(m => legalMoves.includes(m));
                setAnalysis(prev => ({
                  ...prev,
                  suggested_moves: retryValid,
                  suggested_moves_explanation: retryParsed.suggested_moves_explanation ?? ''
                }));
              }
            }
          } catch {}
        }

      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to get analysis');
          setAnalysis(null);
        }
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    }, 300);
  }, [chess, isApiKeyMissing]);

  const evaluateDrillMove = useCallback(async (fen, move) => {
    if (isApiKeyMissing) return null;
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      const text = await readSSEText(response.body.getReader());
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Invalid response format');
      return JSON.parse(match[0]);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      const text = await readSSEText(response.body.getReader());
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Invalid response format');
      setGameReview(JSON.parse(match[0]));
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

  const retryAnalysis = useCallback((fen, pgn, lastMove, playerColour) => {
    analyzePosition(fen, pgn, lastMove, playerColour);
  }, [analyzePosition]);

  return {
    analysis,
    isLoading,
    isStreaming,
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
