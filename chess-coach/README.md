# ChessCoach ♟

An AI-powered chess learning app that provides live coaching after every move, opening drill mode, and post-game review — powered by Claude AI.

## Features

- **Interactive Chess Board** — Drag-and-drop moves with full validation via chess.js
- **Live AI Coaching** — Claude analyzes every position: opening name, move quality, key ideas, and suggested moves
- **Opening Drill Mode** — Practice common opening positions with AI feedback
- **Post-Game Review** — Get a full report card after checkmate or draw
- **Move History** — Scrollable algebraic notation with undo support

## Tech Stack

- React + Vite
- react-chessboard
- chess.js
- Anthropic API (claude-sonnet-4-20250514)

## Local Development

```bash
cd chess-coach
cp .env.example .env
# Edit .env and add your Anthropic API key
npm install
npm run dev
```

## Deployment

This app is deployed automatically to GitHub Pages via GitHub Actions on every push to main.

### First-time setup — Adding your Anthropic API key as a GitHub Secret

1. Get your Anthropic API key from https://console.anthropic.com
2. In your GitHub repo, go to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Set the name to: ANTHROPIC_API_KEY
5. Paste your key as the value and click "Add secret"
6. Push any change to main to trigger the first deployment
7. Go to Settings → Pages and confirm the source is set to "GitHub Actions"

Once set up, every push to main automatically rebuilds and redeploys with your key injected securely at build time. The key is never stored in your code or repository.
