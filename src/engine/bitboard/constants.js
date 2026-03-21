/**
 * Chess Bitboard Constants
 * Converted from C++ enginecode.cpp
 * Uses BigInt for 64-bit bitboard operations
 */

// ========================================
// PIECE CONSTANTS
// ========================================
export const WP = 0;  // White Pawn
export const WN = 1;  // White Knight
export const WB = 2;  // White Bishop
export const WR = 3;  // White Rook
export const WQ = 4;  // White Queen
export const WK = 5;  // White King
export const BP = 6;  // Black Pawn
export const BN = 7;  // Black Knight
export const BB = 8;  // Black Bishop
export const BR = 9;  // Black Rook
export const BQ = 10; // Black Queen
export const BK = 11; // Black King

// Piece ranges
export const WHITE_START_INDEX = WP;
export const WHITE_END_INDEX = WK;
export const BLACK_START_INDEX = BP;
export const BLACK_END_INDEX = BK;

// ========================================
// SQUARE INDICES (A8=0, H1=63)
// ========================================
export const A8 = 0,  B8 = 1,  C8 = 2,  D8 = 3,  E8 = 4,  F8 = 5,  G8 = 6,  H8 = 7;
export const A7 = 8,  B7 = 9,  C7 = 10, D7 = 11, E7 = 12, F7 = 13, G7 = 14, H7 = 15;
export const A6 = 16, B6 = 17, C6 = 18, D6 = 19, E6 = 20, F6 = 21, G6 = 22, H6 = 23;
export const A5 = 24, B5 = 25, C5 = 26, D5 = 27, E5 = 28, F5 = 29, G5 = 30, H5 = 31;
export const A4 = 32, B4 = 33, C4 = 34, D4 = 35, E4 = 36, F4 = 37, G4 = 38, H4 = 39;
export const A3 = 40, B3 = 41, C3 = 42, D3 = 43, E3 = 44, F3 = 45, G3 = 46, H3 = 47;
export const A2 = 48, B2 = 49, C2 = 50, D2 = 51, E2 = 52, F2 = 53, G2 = 54, H2 = 55;
export const A1 = 56, B1 = 57, C1 = 58, D1 = 59, E1 = 60, F1 = 61, G1 = 62, H1 = 63;
export const NO_SQUARE = 64;

// ========================================
// RANK BITBOARDS
// ========================================
export const RANK_1_BITBOARD = 0xFF00000000000000n;
export const RANK_2_BITBOARD = 0x00FF000000000000n;
export const RANK_3_BITBOARD = 0x0000FF0000000000n;
export const RANK_4_BITBOARD = 0x000000FF00000000n;
export const RANK_5_BITBOARD = 0x00000000FF000000n;
export const RANK_6_BITBOARD = 0x0000000000FF0000n;
export const RANK_7_BITBOARD = 0x000000000000FF00n;
export const RANK_8_BITBOARD = 0x00000000000000FFn;

// ========================================
// FILE BITBOARDS
// ========================================
export const FILE_A_BITBOARD = 0x0101010101010101n;
export const FILE_B_BITBOARD = 0x0202020202020202n;
export const FILE_C_BITBOARD = 0x0404040404040404n;
export const FILE_D_BITBOARD = 0x0808080808080808n;
export const FILE_E_BITBOARD = 0x1010101010101010n;
export const FILE_F_BITBOARD = 0x2020202020202020n;
export const FILE_G_BITBOARD = 0x4040404040404040n;
export const FILE_H_BITBOARD = 0x8080808080808080n;

// ========================================
// CASTLING CONSTANTS
// ========================================
export const WKS_CASTLE_RIGHTS = 0; // White King Side
export const WQS_CASTLE_RIGHTS = 1; // White Queen Side
export const BKS_CASTLE_RIGHTS = 2; // Black King Side
export const BQS_CASTLE_RIGHTS = 3; // Black Queen Side

// Empty squares required for castling
export const WKS_EMPTY_BITBOARD = 0x6000000000000000n; // f1, g1
export const WQS_EMPTY_BITBOARD = 0x0E00000000000000n; // b1, c1, d1
export const BKS_EMPTY_BITBOARD = 0x0000000000000060n; // f8, g8
export const BQS_EMPTY_BITBOARD = 0x000000000000000En; // b8, c8, d8

// ========================================
// MOVE TAG CONSTANTS
// ========================================
export const TAG_NONE = 0;
export const TAG_CAPTURE = 1;
export const TAG_WHITEEP = 2;
export const TAG_BLACKEP = 3;
export const TAG_WCASTLEKS = 4;
export const TAG_WCASTLEQS = 5;
export const TAG_BCASTLEKS = 6;
export const TAG_BCASTLEQS = 7;

// Promotions
export const TAG_BKnightPromotion = 8;
export const TAG_BBishopPromotion = 9;
export const TAG_BQueenPromotion = 10;
export const TAG_BRookPromotion = 11;
export const TAG_WKnightPromotion = 12;
export const TAG_WBishopPromotion = 13;
export const TAG_WQueenPromotion = 14;
export const TAG_WRookPromotion = 15;

// Capture Promotions
export const TAG_BCaptureKnightPromotion = 16;
export const TAG_BCaptureBishopPromotion = 17;
export const TAG_BCaptureQueenPromotion = 18;
export const TAG_BCaptureRookPromotion = 19;
export const TAG_WCaptureKnightPromotion = 20;
export const TAG_WCaptureBishopPromotion = 21;
export const TAG_WCaptureQueenPromotion = 22;
export const TAG_WCaptureRookPromotion = 23;

// Double Pawn Push
export const TAG_DoublePawnWhite = 24;
export const TAG_DoublePawnBlack = 25;

// Check
export const TAG_CHECK = 26;
export const TAG_CHECK_CAPTURE = 27;

// ========================================
// MOVE ENCODING INDICES
// ========================================
export const MOVE_STARTING = 0;
export const MOVE_TARGET = 1;
export const MOVE_PIECE = 2;
export const MOVE_TAG = 3;

// ========================================
// BITBOARD HELPERS
// ========================================
export const MAX_ULONG = 0xFFFFFFFFFFFFFFFFn;
export const EMPTY_BITBOARD = 0n;

// ========================================
// SQUARE BITBOARDS (Pre-computed for each square)
// ========================================
export const SQUARE_BBS = Array.from({ length: 64 }, (_, i) => 1n << BigInt(i));

// ========================================
// SQUARE NAME MAPPING
// ========================================
export const SQUARE_NAMES = [
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'
];

// ========================================
// FEN STARTING POSITION
// ========================================
export const FEN_STARTING_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// ========================================
// DEBRUIJN LOOKUP (for bitscan)
// ========================================
export const MAGIC = 0x03F79D71B4CB0A89n;

export const DEBRUIJN64 = [
   0, 47,  1, 56, 48, 27,  2, 60,
   57, 49, 41, 37, 28, 16,  3, 61,
   54, 58, 35, 52, 50, 42, 21, 44,
   38, 32, 29, 23, 17, 11,  4, 62,
   46, 55, 26, 59, 40, 36, 15, 53,
   34, 51, 20, 43, 31, 22, 10, 45,
   25, 39, 14, 33, 19, 30,  9, 24,
   13, 18,  8, 12,  7,  6,  5, 63
];

// ========================================
// PIECE CHARACTERS (for display)
// ========================================
export const PIECE_CHARS = ['P', 'N', 'B', 'R', 'Q', 'K', 'p', 'n', 'b', 'r', 'q', 'k'];
export const PIECE_UNICODE = {
  [WP]: '♙', [WN]: '♘', [WB]: '♗', [WR]: '♖', [WQ]: '♕', [WK]: '♔',
  [BP]: '♟', [BN]: '♞', [BB]: '♝', [BR]: '♜', [BQ]: '♛', [BK]: '♚'
};
