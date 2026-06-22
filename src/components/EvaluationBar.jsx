import React, { useMemo } from "react";
import "./EvaluationBar.css";
import { getChessAppEvalBarValue } from "../utils/stockfishUtils";

export default function EvaluationBar({ evaluation, mate, isThinking, isBoardFlipped, currentTurn }) {
  const evalBar = useMemo(() => {
    const baseEvalBar = getChessAppEvalBarValue(evaluation, mate, currentTurn);
    const hasMate = typeof mate === "number" && mate !== 0;
    const hasEval = typeof evaluation === "number";

    if (!hasMate && !hasEval && isThinking) {
      return {
        ...baseEvalBar,
        label: "...",
      };
    }

    return baseEvalBar;
  }, [evaluation, mate, currentTurn, isThinking]);

  const { topHeight, bottomHeight } = useMemo(() => {
    const whiteBar = Math.max(0, Math.min(100, evalBar.whiteBarPercentage));
    if (!isBoardFlipped) {
      return {
        topHeight: 100 - whiteBar,
        bottomHeight: whiteBar,
      };
    }

    return {
      topHeight: whiteBar,
      bottomHeight: 100 - whiteBar,
    };
  }, [evalBar.whiteBarPercentage, isBoardFlipped]);

  const showTopLabel =
    (evalBar.whiteBarPercentage < 50 && !isBoardFlipped) ||
    (evalBar.whiteBarPercentage >= 50 && isBoardFlipped);

  const showBottomLabel =
    (evalBar.whiteBarPercentage >= 50 && !isBoardFlipped) ||
    (evalBar.whiteBarPercentage < 50 && isBoardFlipped);

  return (
    <div className="eval-container-outer">
      <div className="eval-bar-track">
        <div
          className="eval-black-fill"
          style={{ height: `${topHeight}%` }}
        >
          {showTopLabel ? <span className="eval-number eval-number-dark">{evalBar.label}</span> : null}
        </div>

        <div
          className="eval-white-fill"
          style={{ height: `${bottomHeight}%` }}
        >
          {showBottomLabel ? <span className="eval-number eval-number-light">{evalBar.label}</span> : null}
        </div>
      </div>
    </div>
  );
}
