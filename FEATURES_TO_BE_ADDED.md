# FEATURES_TO_BE_ADDED

## Goal
Create a clean, predictable, low-clutter gameplay flow using explicit app states, while preserving current working logic (local, computer, multiplayer, review, draw/resign, promotion).

This document evaluates the proposed state machine and refines it into an implementation-ready version.

---

## Executive Decision Summary

### Keep as-is
1. `LOBBY`
2. `STARTING`
3. `PLAYING`
4. `PROMOTION`
5. `GAME_OVER`
6. `ANALYSIS`

### Keep but adjust
1. `GAME_OVER -> ANALYSIS` trigger behavior should be explicit, not implicit side effects.
2. `PLAYING -> ANALYSIS` mid-game entry should be feature-flagged and disabled in multiplayer for v1.
3. `STARTING` should be a short transition state (500-1200ms max) to avoid perceived lag.
4. Chat should be treated as `multiplayer-only optional panel`, not a mandatory state element.

### Defer for now (to avoid clutter/risk)
1. Full multiplayer chat UI (keep message/status minimal first).
2. Mid-game analysis for multiplayer.
3. Too many simultaneous buttons in mobile PLAYING state.

---

## Consultant Review: What Is Strong In Your Proposal

1. Strong separation between gameplay and analysis.
2. Correctly isolating promotion as blocking state.
3. Correct emphasis on transition rules and disabled capabilities by state.
4. Correct requirement that timer must pause in analysis.
5. Correct idea that UI should only show what works in the current state.

This is exactly the right direction for a professional UX.

---

## Where To Improve (Important)

## 1) Avoid mixed boolean state explosion
Current app uses many booleans (`gameStarted`, `isReviewMode`, `showPromotionUI`, `showGameOverUI`, etc.).

Recommendation:
1. Add one authoritative `uiState` enum.
2. Keep existing booleans temporarily for backward compatibility.
3. Gradually migrate feature gates to `uiState` checks.

Why:
1. Fewer bugs from contradictory state combos.
2. Cleaner transitions.
3. Easier multiplayer and analysis scaling.

---

## 2) Simplify PLAYING controls on mobile
Your proposed PLAYING state currently risks button overload.

Recommendation:
1. Primary row only: `Resign`, `Offer Draw`.
2. Secondary actions inside compact menu/sheet (`New Game`, `Flip`, `Settings`).

Why:
1. Reduces accidental touches.
2. Preserves visual hierarchy.

---

## 3) Define exact ownership of transitions
Some transitions are currently implicit in event handlers.

Recommendation:
1. Centralize transitions through a single function `transitionTo(nextState, reason)`.
2. Log transition reason for debugging.

Why:
1. Multiplayer desync and review bugs become easier to diagnose.

---

## 4) ANALYSIS should be read-only by default
In v1, analysis mode should never alter game state.

Recommendation:
1. Disable move execution and game actions entirely in `ANALYSIS`.
2. Allow only navigation and autoplay.

Why:
1. Keeps behavior intuitive.
2. Prevents hidden state corruption.

---

## Refined State Specification (Final Suggested)

## 1. LOBBY
Show:
1. setup controls (mode/time/difficulty/color)
2. start actions
Hide:
1. move list, game actions, review controls
Allow:
1. settings edits
2. multiplayer entry

## 2. STARTING
Show:
1. board skeleton/loading overlay
2. `Starting game...`
Block:
1. all interactive controls
Auto-transition:
1. to `PLAYING` when initialization is complete

## 3. PLAYING
Show:
1. board
2. move list
3. core actions (`Resign`, `Offer Draw`)
4. minimal secondary actions
Multiplayer extras:
1. connection status
2. optional compact message area (not full chat in v1)
Allow:
1. legal move input
2. draw offer / resign
3. optional review entry for local-only mid-game analysis

## 4. PROMOTION
Show:
1. promotion picker modal
Block:
1. all other interactions
Exit:
1. to `PLAYING` after piece selected

## 5. GAME_OVER
Show:
1. result modal (winner + reason)
2. read-only move list
3. actions (`New Game`, `Rematch` in multiplayer, `Review`)
Allow:
1. transition to `ANALYSIS`
2. transition to `STARTING` for new game
Block:
1. board move input

## 6. ANALYSIS
Show:
1. review controls (`<< < play > >>`)
2. clickable move list
3. analysis panel (eval/best move/quality tags)
4. exit review
Hide:
1. gameplay actions (`Resign`, `Offer Draw`)
2. multiplayer chat UI
Rules:
1. timer paused
2. no move execution

---

## Transition Rules (Clean Version)

1. `LOBBY -> STARTING`
Trigger: Start Game

2. `STARTING -> PLAYING`
Trigger: Game initialization complete

3. `PLAYING -> PROMOTION`
Trigger: Pawn reaches final rank

4. `PROMOTION -> PLAYING`
Trigger: Piece selected

5. `PLAYING -> GAME_OVER`
Trigger: checkmate/stalemate/timeout/resign/draw/abandon

6. `GAME_OVER -> ANALYSIS`
Trigger: Review button

7. `ANALYSIS -> GAME_OVER`
Trigger: Exit Review

8. `PLAYING -> STARTING`
Trigger: New Game

9. `GAME_OVER -> STARTING`
Trigger: New Game/Rematch

10. Optional local-only: `PLAYING -> ANALYSIS`
Trigger: move-list review entry
Constraint: disabled in multiplayer v1

---

## Capability Matrix (Recommended)

| Feature | LOBBY | STARTING | PLAYING | PROMOTION | GAME_OVER | ANALYSIS |
|---|---|---|---|---|---|---|
| Move pieces | No | No | Yes | No | No | No |
| Resign | No | No | Yes | No | No | No |
| Offer Draw | No | No | Yes | No | No | No |
| Review nav | No | No | Optional local only | No | Yes (entry only) | Yes |
| Timer running | No | No | Yes | Paused | No | No |
| Multiplayer status | Optional | Optional | Yes | Yes | Yes | Minimal |
| Settings edit | Yes | No | Limited | No | Limited | No |

---

## What Can Be Implemented Smoothly Right Now

1. Add `uiState` enum and transition helper without removing existing booleans.
2. Gate rendering by `uiState` first in top-level view decisions.
3. Pause timer in analysis via single guard.
4. Hide game actions in analysis mode.
5. Normalize game-over entry and review exit transitions.

These are low-risk and high-impact.

---

## What Is Harder / Should Be Phased

1. Full chat system in multiplayer:
Needs transport schema, ordering, reconnect, moderation limits.

2. Mid-game analysis in multiplayer:
Can confuse authoritative game flow and desync states.

3. Full refactor away from all booleans in one pass:
High regression risk; migrate in layers.

---

## Implementation Order (Recommended)

### Phase A: State Foundation
1. Introduce `uiState` enum and transition helper.
2. Map current booleans to derived `uiState` as temporary bridge.
3. Add transition logging in dev mode.

### Phase B: UX Cleanup by State
1. Render controls only if state permits.
2. Hide analysis controls outside analysis.
3. Hide gameplay actions in analysis.
4. Ensure timer paused in `ANALYSIS` and `GAME_OVER`.

### Phase C: Multiplayer Tightening
1. Enforce same transitions for both peers.
2. On disconnect, force `GAME_OVER` reason `abandoned`.
3. Restrict mid-game review in multiplayer.

---

## Analysis Architecture Plan (No Implementation Yet)

### Product behavior target
1. After game end, user enters `ANALYSIS` from game-over flow.
2. User can click `Analyze` to process every move deeply.
3. UI shows per-move quality + per-player accuracy + game rating estimate.
4. Analysis uses a dedicated read-only board state so gameplay state is never mutated.

### Reference UX pattern
1. Follow the clarity style used by major chess apps (move list quality tags, accuracy summary card, best-line preview).
2. Keep controls minimal on mobile: one summary card + one expandable move details panel.

### State model extension
1. Keep `ANALYSIS` as a separate UI state.
2. Add `analysisStatus`: `idle | running | ready | failed`.
3. Add `analysisView`: `summary | move-details | board-line`.
4. Add `analysisCursor`: selected ply index for synced board + move list highlight.

### Data model (core)
1. `analysisResult` root:
	- `meta`: engine depth, nodes, time budget, version.
	- `players`: `{ white: { accuracy, ratingEstimate }, black: { accuracy, ratingEstimate } }`
	- `moves`: array indexed by ply.
2. Each move item:
	- `ply`, `san`, `uci`, `fenBefore`, `fenAfter`
	- `evalBefore`, `evalAfter`, `bestMove`, `bestLine[]`
	- `cpLoss`, `mateSwing`
	- `quality`: `best | excellent | good | inaccuracy | mistake | blunder | forced`
	- `annotation`: short explanation string for tooltip/card.

### Dedicated board state for analysis
1. Add `analysisBoardState` separate from live game board state.
2. Source of truth in analysis is `analysisResult.moves[analysisCursor].fenAfter`.
3. Navigation (`prev/next/start/end`) changes `analysisCursor` only.
4. No timers, no legal move input, no game mutation in this state.

### Engine pipeline
1. Input: finalized PGN/move list + initial FEN.
2. For each ply:
	- evaluate `fenBefore`
	- fetch best move + principal variation
	- compute played move delta (`cpLoss`, `mateSwing`)
3. Classify quality by thresholds (configurable constants).
4. Aggregate per-player accuracy from weighted move-quality scores.
5. Derive rating estimate from accuracy + opponent quality + game length bracket.

### Performance strategy
1. Run analysis in chunks to avoid UI freeze.
2. Show progressive status (`Analyzing move X/Y`).
3. Cache results by game hash (`initialFEN + moveList`) to skip recomputation.
4. Allow cancel + resume.

### UX layout (desktop)
1. Top summary row: White accuracy, Black accuracy, game rating estimate.
2. Left: analysis board with best-line mini strip.
3. Right: move list with quality badges.
4. Bottom: detail panel for selected move (`why`, `best move`, `cp loss`).

### UX layout (mobile)
1. Summary card pinned above move list.
2. Board + one compact nav row.
3. Move list quality badges in compact mode.
4. Detail drawer opens per selected move to avoid clutter.

### Integration checkpoints
1. Reuse existing review snapshots for fast cursor navigation.
2. Keep existing game-over modal entry path (`Game Review`) and map it to `ANALYSIS`.
3. Add one `Analyze` action inside analysis state that starts engine pipeline.
4. Keep chat/other panels hidden in analysis for v1.

### Milestone sequence
1. M1: `ANALYSIS` shell + dedicated analysis board state + nav sync.
2. M2: engine pipeline + per-move quality classification.
3. M3: player accuracy + rating estimate cards.
4. M4: best-line board overlays and polish.

### Phase D: Analysis Expansion
1. Opening book tags (first 8-12 moves).
2. Move quality classifications.
3. Player accuracy and game rating cards.

---

## Design Principles To Keep App Clean

1. One primary action per surface.
2. Never show disabled-looking controls without reason text.
3. Keep mobile controls minimal and thumb-safe.
4. Use progressive disclosure for advanced features.
5. Prefer predictable transitions over clever shortcuts.

---

## Final Recommendation

Your state model is fundamentally correct and can absolutely be implemented.

Best path:
1. Implement `uiState` first.
2. Refactor rendering to state-gated sections.
3. Add analysis features after state foundation stabilizes.

This will keep the app:
1. easy to use
2. uncluttered
3. scalable for multiplayer and analysis features
