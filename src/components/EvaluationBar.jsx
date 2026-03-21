import React from "react";
import "./EvaluationBar.css";

/**
 * Chess.com-style evaluation bar with dark theme
 * When white has advantage: white dominates (fills more space) - show +value
 * When black has advantage: black dominates (fills more space) - show -value
 */
export default function EvaluationBar({ evaluation, mate, depth, isThinking, isBoardFlipped, currentTurn }) {
  const MAX_PAWNS = 10; // Clamp at ±10 pawns

  // Fix #10: Stockfish reports score from the side-to-move's perspective.
  // When it's white's turn and white is winning, score is positive → keep as-is (white advantaged).
  // When it's black's turn and white is winning, score is negative → negate so white still shows as positive.
  // In short: if black to move, negate; if white to move, keep sign.
  let pawns = typeof evaluation === "number"
    ? (currentTurn === 'b' ? -evaluation : evaluation)
    : 0;
  pawns = Math.max(-MAX_PAWNS, Math.min(MAX_PAWNS, pawns));

  // Calculate fill percentages
  // Positive pawns = white advantage = white should dominate
  // Negative pawns = black advantage = black should dominate
  let whitePercentage, blackPercentage;

  if (mate) {
    // Fix #10: same currentTurn correction for mate
    const actualMate = currentTurn === 'b' ? -mate : mate;
    if (actualMate > 0) {
      // White is mating - white dominates
      whitePercentage = 100;
      blackPercentage = 0;
    } else {
      // Black is mating - black dominates
      whitePercentage = 0;
      blackPercentage = 100;
    }
  } else {
    // Convert pawns to percentage
    whitePercentage = 50 + (pawns / MAX_PAWNS) * 50;
    blackPercentage = 100 - whitePercentage;
  }

  whitePercentage = Math.max(0, Math.min(100, whitePercentage));
  blackPercentage = Math.max(0, Math.min(100, blackPercentage));

  // If board is flipped, swap the percentages
  if (isBoardFlipped) {
    [whitePercentage, blackPercentage] = [blackPercentage, whitePercentage];
  }

  // Display text with sign showing advantage
  let displayText;
  if (mate) {
    const actualMate = currentTurn === 'b' ? -mate : mate;
    if (actualMate > 0) {
      displayText = `+M${Math.abs(actualMate)}`;
    } else {
      displayText = `-M${Math.abs(actualMate)}`;
    }
  } else {
    // Show + for white advantage, - for black advantage
    if (pawns > 0) {
      displayText = `+${pawns.toFixed(1)}`;
    } else if (pawns < 0) {
      displayText = pawns.toFixed(1); // Already has minus sign
    } else {
      displayText = '0.0';
    }
  }

  // Show text in the smaller section
  const showTextInBlack = blackPercentage < whitePercentage;
  const textPosition = showTextInBlack ? 'top' : 'bottom';
  const textOffset = '8px';

  return (
    <div className="eval-container-outer">
      <div className="eval-bar-track">
        {/* Black section (top) - dominates when black has advantage */}
        <div
          className="eval-black-fill"
          style={{ height: `${blackPercentage}%` }}
        />

        {/* White section (bottom) - dominates when white has advantage */}
        <div
          className={`eval-white-fill ${isThinking ? 'thinking' : ''}`}
          style={{ height: `${whitePercentage}%` }}
        />

        {/* Evaluation number - shown in smaller section */}
        <div
          className="eval-number"
          style={{
            [textPosition]: textOffset
          }}
        >
          {displayText}
        </div>
      </div>
    </div>
  );
}
