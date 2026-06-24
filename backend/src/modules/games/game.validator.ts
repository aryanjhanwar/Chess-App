import { Chess } from 'chess.js';
import { AppError } from '../../shared/errors/app.error';
import { MoveRequest } from './game.types';

/**
 * Game Validator — server-side chess move validation.
 *
 * Uses chess.js as the validation engine.
 * DESIGN: This layer is intentionally isolated so chess.js can be replaced
 * with the custom BitBoardTS engine without changing game.service.ts.
 *
 * The backend is THE authority on move legality.
 * Frontend move claims are NEVER trusted.
 */
export class GameValidator {
  /**
   * Validate that a move is legal in the given position.
   *
   * @param fen - The current board position
   * @param move - The move request from the client
   * @returns The resulting FEN after the move, if valid
   * @throws AppError if the move is illegal or the request is malformed
   */
  validateAndApplyMove(
    fen: string,
    move: MoveRequest,
  ): { newFen: string; san: string; isCheckmate: boolean; isDraw: boolean } {
    const chess = new Chess(fen);

    // Basic input sanity check
    if (!isValidSquare(move.from) || !isValidSquare(move.to)) {
      throw AppError.badRequest('Invalid square notation');
    }

    let result;
    try {
      result = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
    } catch {
      throw AppError.badRequest(`Illegal move: ${move.from} → ${move.to}`);
    }

    if (!result) {
      throw AppError.badRequest(`Illegal move: ${move.from} → ${move.to}`);
    }

    return {
      newFen: chess.fen(),
      san: result.san,
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw(),
    };
  }

  /**
   * Determine the active player's color from a FEN string.
   * FEN format: "rnbqkbnr/pppppppp/.../w KQkq - 0 1" — 'w' or 'b' is field [1]
   */
  getTurnFromFen(fen: string): 'w' | 'b' {
    const parts = fen.split(' ');
    return parts[1] === 'b' ? 'b' : 'w';
  }
}

/** Validates that a string is a valid chess square (a1–h8) */
function isValidSquare(square: string): boolean {
  return /^[a-h][1-8]$/.test(square);
}

export const gameValidator = new GameValidator();
