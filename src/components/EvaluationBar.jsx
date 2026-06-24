/**
 * src/components/EvaluationBar.jsx
 *
 * Unified evaluation bar component usable by both the main play app
 * and the analysis app.
 *
 * Two usage modes:
 *
 * 1. Direct props (main play app):
 *    <EvaluationBar evaluation={cp} mate={mateN} isThinking currentTurn="w" isBoardFlipped />
 *
 * 2. Atom-based (analysis app — passes a Jotai atom holding position data):
 *    <EvaluationBar currentPositionAtom={currentPositionAtom} height={400} boardOrientation={Color.White} />
 *
 * When `currentPositionAtom` is provided it takes precedence over direct props.
 */

import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { atom } from 'jotai';
import './EvaluationBar.css';
import { getChessAppEvalBarValue } from '../utils/stockfishUtils';
import { getEvaluationBarValue } from '@/shared/chess/analysis/chess';

// ── Lazy atom fallback (prevents hook-count errors when atom not provided) ─────
const _emptyAtom = atom({});

// ── Color enum compatibility ──────────────────────────────────────────────────
// The analysis app uses Color.White / Color.Black enum values.
// We treat Color.White === 'white' (or 0) as "white on bottom".
function isWhiteBottom(boardOrientation) {
  if (!boardOrientation) return true;
  if (boardOrientation === 'white' || boardOrientation === 'w' || boardOrientation === 0) return true;
  return false;
}

export default function EvaluationBar({
  // ── Mode 1: Main-app direct props ──
  evaluation,
  mate,
  isThinking,
  isBoardFlipped,
  currentTurn,

  // ── Mode 2: Analysis-app atom props ──
  currentPositionAtom,
  /** Height in pixels for the analysis bar (matches the board height). */
  height,
  /** Color enum from analysis app: Color.White | Color.Black */
  boardOrientation,
}) {
  // Always call useAtomValue to comply with hooks rules.
  // When no atom is provided we use the empty atom as a safe no-op.
  const atomToRead = currentPositionAtom ?? _emptyAtom;
  const position = useAtomValue(atomToRead);

  // ── Determine eval bar data ───────────────────────────────────────────────
  const evalBar = useMemo(() => {
    // Atom mode: derive from position.eval (analysis app format)
    if (currentPositionAtom) {
      const bestLine = position?.eval?.lines?.[0];
      if (!position?.eval || !bestLine || bestLine.depth < 6) {
        return { whiteBarPercentage: 50, label: '0.0' };
      }
      return getEvaluationBarValue(position.eval);
    }

    // Direct-props mode: derive from centipawn / mate values
    const baseEvalBar = getChessAppEvalBarValue(evaluation, mate, currentTurn);
    const hasMate = typeof mate === 'number' && mate !== 0;
    const hasEval = typeof evaluation === 'number';

    if (!hasMate && !hasEval && isThinking) {
      return { ...baseEvalBar, label: '...' };
    }
    return baseEvalBar;
  }, [currentPositionAtom, position, evaluation, mate, currentTurn, isThinking]);

  // ── Compute fill heights and colors ───────────────────────────────────────
  const whiteBar = Math.max(0, Math.min(100, evalBar.whiteBarPercentage));

  const flipped = currentPositionAtom
    ? !isWhiteBottom(boardOrientation)
    : Boolean(isBoardFlipped);

  const topColor = flipped ? '#ffffff' : '#424242';
  const bottomColor = flipped ? '#424242' : '#ffffff';
  
  const topHeight = flipped ? whiteBar : 100 - whiteBar;
  const bottomHeight = flipped ? 100 - whiteBar : whiteBar;

  const topLabelClass = flipped ? 'eval-number-light' : 'eval-number-dark';
  const bottomLabelClass = flipped ? 'eval-number-dark' : 'eval-number-light';

  const showTopLabel =
    (evalBar.whiteBarPercentage < 50 && !flipped) ||
    (evalBar.whiteBarPercentage >= 50 && flipped);

  const showBottomLabel = !showTopLabel;

  // ── Inline height style for analysis mode ────────────────────────────────
  const containerStyle = height ? { height: `${height}px` } : undefined;

  return (
    <div className="eval-container-outer" style={containerStyle}>
      <div className="eval-bar-track">
        <div
          className="eval-top-fill"
          style={{ height: `${topHeight}%`, background: topColor }}
        >
          {showTopLabel ? (
            <span className={`eval-number ${topLabelClass}`}>{evalBar.label}</span>
          ) : null}
        </div>

        <div
          className="eval-bottom-fill"
          style={{ height: `${bottomHeight}%`, background: bottomColor }}
        >
          {showBottomLabel ? (
            <span className={`eval-number ${bottomLabelClass}`}>{evalBar.label}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
