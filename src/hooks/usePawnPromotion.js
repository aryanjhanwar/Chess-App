import { useState } from 'react';

/**
 * Custom hook for handling pawn promotion
 *
 * Stores pending promotion v2 moves instead of board snapshots.
 * When promotion is detected (multiple moves with same from/to but
 * different promotion tags), the UI is shown and the user picks a piece.
 */
export const usePawnPromotion = () => {
  const [showPromotionUI, setShowPromotionUI] = useState(false);
  const [promotionSquare, setPromotionSquare] = useState(null);
  // Array of v2 promotion moves to choose from
  const [pendingPromotionMoves, setPendingPromotionMoves] = useState(null);

  /**
   * @param {Array} promotionMoves - v2 moves with different promo tags
   * @param {number} toRow - destination row (display coords)
   * @param {number} toCol - destination col (display coords)
   * @param {string} color - 'w' or 'b'
   */
  const initiatePromotion = (promotionMoves, toRow, toCol, color) => {
    setPendingPromotionMoves(promotionMoves);
    setPromotionSquare({ row: toRow, col: toCol, color });
    setShowPromotionUI(true);
  };

  const completePromotion = () => {
    setShowPromotionUI(false);
    setPromotionSquare(null);
    setPendingPromotionMoves(null);
  };

  const cancelPromotion = () => {
    setShowPromotionUI(false);
    setPromotionSquare(null);
    setPendingPromotionMoves(null);
  };

  return {
    showPromotionUI,
    promotionSquare,
    pendingPromotionMoves,
    initiatePromotion,
    completePromotion,
    cancelPromotion
  };
};
