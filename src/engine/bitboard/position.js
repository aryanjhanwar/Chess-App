/**
 * POSITION REPRESENTATION
 * Represents a chess position using bitboards
 * Converted from C++ enginecode.cpp
 */

import {
  WP, WN, WB, WR, WQ, WK,
  BP, BN, BB, BR, BQ, BK,
  FEN_STARTING_POSITION
} from './constants.js';

import {
  setBit,
  getBit,
  popBit,
  countBits,
  getSetBits,
  algebraicToSquare,
  squareToAlgebraic,
  pieceIsWhite
} from './utils.js';

// ========================================
// POSITION CLASS
// ========================================

export class Position {
  constructor() {
    // Bitboards for each piece type (12 total: 6 white + 6 black)
    // IMPORTANT: Must be BigInt values, not undefined
    this.bitboards = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];
    
    // Mailbox — O(1) piece-at-square lookup; -1 = empty, 0–11 = piece index
    this.mailbox = new Int8Array(64).fill(-1);
    
    // Occupancy bitboards
    this.whiteOccupancy = 0n;
    this.blackOccupancy = 0n;
    this.allOccupancy = 0n;
    
    // Game state
    this.sideToMove = 0; // 0 = white, 1 = black
    this.enPassantSquare = -1; // -1 = none, 0-63 = valid square
    this.castlingRights = 0; // Bits: 0=WK, 1=WQ, 2=BK, 3=BQ
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
    
    // Hash for position (not implemented yet, will be used later)
    this.hash = 0n;
  }
  
  /**
   * Parse FEN string and populate position
   * Converted from C++: ParseFen
   * 
   * @param {string} fen - FEN notation string
   * @returns {boolean} - Success/failure
   */
  fromFEN(fen) {
    try {
      // Ensure bitboards array exists
      if (!this.bitboards || !Array.isArray(this.bitboards)) {
        this.bitboards = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];
      } else {
        for (let i = 0; i < 12; i++) this.bitboards[i] = 0n;
      }
      // Clear mailbox
      this.mailbox.fill(-1);
      this.whiteOccupancy = 0n;
      this.blackOccupancy = 0n;
      this.allOccupancy = 0n;
      this.enPassantSquare = -1;
      this.castlingRights = 0;
      this.halfmoveClock = 0;
      this.fullmoveNumber = 1;
      
      const parts = fen.trim().split(/\s+/);
      if (parts.length < 4) {
        throw new Error('Invalid FEN: not enough parts');
      }
      
      // Part 1: Piece placement
      const ranks = parts[0].split('/');
      if (ranks.length !== 8) {
        throw new Error('Invalid FEN: must have 8 ranks');
      }
      
      let square = 0; // Start from a8 (square 0)
      
      for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
        const rank = ranks[rankIdx];
        let file = 0;
        
        for (let i = 0; i < rank.length; i++) {
          const char = rank[i];
          
          if (char >= '1' && char <= '8') {
            // Empty squares
            const emptyCount = parseInt(char);
            file += emptyCount;
            square += emptyCount;
          } else {
            // Piece
            const piece = this._charToPiece(char);
            if (piece === -1) {
              throw new Error(`Invalid FEN: unknown piece '${char}'`);
            }
            
            this.bitboards[piece] = setBit(this.bitboards[piece], square);
            this.mailbox[square] = piece;
            square++;
            file++;
          }
        }
        
        if (file !== 8) {
          throw new Error(`Invalid FEN: rank ${rankIdx + 1} has ${file} files (expected 8)`);
        }
      }
      
      // Part 2: Side to move
      if (parts[1] === 'w') {
        this.sideToMove = 0;
      } else if (parts[1] === 'b') {
        this.sideToMove = 1;
      } else {
        throw new Error(`Invalid FEN: side to move must be 'w' or 'b', got '${parts[1]}'`);
      }
      
      // Part 3: Castling rights
      if (parts[2] !== '-') {
        for (let i = 0; i < parts[2].length; i++) {
          const char = parts[2][i];
          if (char === 'K') this.castlingRights |= 1; // White kingside
          else if (char === 'Q') this.castlingRights |= 2; // White queenside
          else if (char === 'k') this.castlingRights |= 4; // Black kingside
          else if (char === 'q') this.castlingRights |= 8; // Black queenside
          else throw new Error(`Invalid FEN: unknown castling right '${char}'`);
        }
      }
      
      // Part 4: En passant square
      if (parts[3] !== '-') {
        this.enPassantSquare = algebraicToSquare(parts[3]);
        if (this.enPassantSquare === -1) {
          throw new Error(`Invalid FEN: invalid en passant square '${parts[3]}'`);
        }
      }
      
      // Part 5: Halfmove clock (optional)
      if (parts.length >= 5) {
        this.halfmoveClock = parseInt(parts[4]) || 0;
      }
      
      // Part 6: Fullmove number (optional)
      if (parts.length >= 6) {
        this.fullmoveNumber = parseInt(parts[5]) || 1;
      }
      
      // Update occupancy bitboards
      this._updateOccupancy();
      
      return true;
    } catch (error) {
      console.error('FEN parsing error:', error.message);
      return false;
    }
  }
  
  /**
   * Convert position to FEN string
   * Converted from C++: GenerateFen
   * 
   * @returns {string} - FEN notation
   */
  toFEN() {
    const PIECE_CHARS = 'PNBRQKpnbrqk';
    let fen = '';
    
    // Part 1: Piece placement (uses mailbox for O(1) lookup)
    for (let rank = 0; rank < 8; rank++) {
      let emptyCount = 0;
      const base = rank * 8;
      
      for (let file = 0; file < 8; file++) {
        const piece = this.mailbox[base + file];
        
        if (piece === -1) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          fen += PIECE_CHARS[piece];
        }
      }
      
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      
      if (rank < 7) {
        fen += '/';
      }
    }
    
    // Part 2: Side to move
    fen += ' ' + (this.sideToMove === 0 ? 'w' : 'b');
    
    // Part 3: Castling rights
    fen += ' ';
    let castlingStr = '';
    if (this.castlingRights & 1) castlingStr += 'K';
    if (this.castlingRights & 2) castlingStr += 'Q';
    if (this.castlingRights & 4) castlingStr += 'k';
    if (this.castlingRights & 8) castlingStr += 'q';
    fen += castlingStr || '-';
    
    // Part 4: En passant square
    fen += ' ';
    if (this.enPassantSquare === -1) {
      fen += '-';
    } else {
      fen += squareToAlgebraic(this.enPassantSquare);
    }
    
    // Part 5: Halfmove clock
    fen += ' ' + this.halfmoveClock;
    
    // Part 6: Fullmove number
    fen += ' ' + this.fullmoveNumber;
    
    return fen;
  }
  
  /**
   * Get piece at square
   * 
   * @param {number} square - Square index (0-63)
   * @returns {number} - Piece constant (WP-BK) or -1 if empty
   */
  getPieceAt(square) {
    return this.mailbox[square];
  }
  
  /**
   * Set piece at square (removes any existing piece)
   * 
   * @param {number} square - Square index (0-63)
   * @param {number} piece - Piece constant (WP-BK)
   */
  setPieceAt(square, piece) {
    // Remove any piece at this square first
    this.removePieceAt(square);
    
    // Place new piece
    this.bitboards[piece] = setBit(this.bitboards[piece], square);
    this.mailbox[square] = piece;
    
    // Update occupancy
    this._updateOccupancy();
  }
  
  /**
   * Remove piece from square
   * 
   * @param {number} square - Square index (0-63)
   */
  removePieceAt(square) {
    const piece = this.mailbox[square];
    if (piece !== -1) {
      this.bitboards[piece] = popBit(this.bitboards[piece], square);
      this.mailbox[square] = -1;
    }
    
    // Update occupancy
    this._updateOccupancy();
  }
  
  /**
   * Move piece from one square to another
   * 
   * @param {number} fromSquare - Source square (0-63)
   * @param {number} toSquare - Destination square (0-63)
   */
  movePiece(fromSquare, toSquare) {
    const piece = this.mailbox[fromSquare];
    if (piece === -1) {
      throw new Error(`No piece at square ${fromSquare}`);
    }
    
    // Remove any piece at destination
    const capPiece = this.mailbox[toSquare];
    if (capPiece !== -1) {
      this.bitboards[capPiece] = popBit(this.bitboards[capPiece], toSquare);
    }
    
    // Move piece
    this.bitboards[piece] = popBit(this.bitboards[piece], fromSquare);
    this.bitboards[piece] = setBit(this.bitboards[piece], toSquare);
    this.mailbox[fromSquare] = -1;
    this.mailbox[toSquare] = piece;
    
    // Update occupancy
    this._updateOccupancy();
  }
  
  /**
   * Get occupancy for white pieces
   * 
   * @returns {bigint} - White occupancy bitboard
   */
  getWhiteOccupancy() {
    return this.whiteOccupancy;
  }
  
  /**
   * Get occupancy for black pieces
   * 
   * @returns {bigint} - Black occupancy bitboard
   */
  getBlackOccupancy() {
    return this.blackOccupancy;
  }
  
  /**
   * Get occupancy for all pieces
   * 
   * @returns {bigint} - All pieces occupancy bitboard
   */
  getAllOccupancy() {
    return this.allOccupancy;
  }
  
  /**
   * Check if square is occupied
   * 
   * @param {number} square - Square index (0-63)
   * @returns {boolean} - True if occupied
   */
  isOccupied(square) {
    return getBit(this.allOccupancy, square);
  }
  
  /**
   * Check if square is occupied by white piece
   * 
   * @param {number} square - Square index (0-63)
   * @returns {boolean} - True if white piece
   */
  isWhitePiece(square) {
    return getBit(this.whiteOccupancy, square);
  }
  
  /**
   * Check if square is occupied by black piece
   * 
   * @param {number} square - Square index (0-63)
   * @returns {boolean} - True if black piece
   */
  isBlackPiece(square) {
    return getBit(this.blackOccupancy, square);
  }
  
  /**
   * Clone position (deep copy)
   * 
   * @returns {Position} - Cloned position
   */
  clone() {
    const cloned = new Position();
    
    // Copy bitboards
    for (let i = 0; i < 12; i++) {
      cloned.bitboards[i] = this.bitboards[i];
    }
    
    // Copy mailbox
    cloned.mailbox.set(this.mailbox);
    
    // Copy occupancy
    cloned.whiteOccupancy = this.whiteOccupancy;
    cloned.blackOccupancy = this.blackOccupancy;
    cloned.allOccupancy = this.allOccupancy;
    
    // Copy game state
    cloned.sideToMove = this.sideToMove;
    cloned.enPassantSquare = this.enPassantSquare;
    cloned.castlingRights = this.castlingRights;
    cloned.halfmoveClock = this.halfmoveClock;
    cloned.fullmoveNumber = this.fullmoveNumber;
    cloned.hash = this.hash;
    
    return cloned;
  }
  
  /**
   * Get piece count for a specific piece type
   * 
   * @param {number} piece - Piece constant (WP-BK)
   * @returns {number} - Count
   */
  getPieceCount(piece) {
    return countBits(this.bitboards[piece]);
  }
  
  /**
   * Get all squares occupied by a piece type
   * 
   * @param {number} piece - Piece constant (WP-BK)
   * @returns {number[]} - Array of square indices
   */
  getPieceSquares(piece) {
    return getSetBits(this.bitboards[piece]);
  }
  
  /**
   * Get material count (simple piece values)
   * 
   * @returns {object} - { white: number, black: number }
   */
  getMaterialCount() {
    const values = [1, 3, 3, 5, 9, 0]; // P, N, B, R, Q, K
    
    let whiteMaterial = 0;
    let blackMaterial = 0;
    
    for (let i = 0; i < 6; i++) {
      whiteMaterial += this.getPieceCount(i) * values[i];
      blackMaterial += this.getPieceCount(i + 6) * values[i];
    }
    
    return { white: whiteMaterial, black: blackMaterial };
  }
  
  /**
   * Print position to console (debug)
   */
  print() {
    console.log('\n  +---+---+---+---+---+---+---+---+');
    
    for (let rank = 0; rank < 8; rank++) {
      let line = (8 - rank) + ' |';
      
      for (let file = 0; file < 8; file++) {
        const square = rank * 8 + file;
        const piece = this.getPieceAt(square);
        
        if (piece === -1) {
          line += '   |';
        } else {
          line += ' ' + this._pieceToChar(piece) + ' |';
        }
      }
      
      console.log(line);
      console.log('  +---+---+---+---+---+---+---+---+');
    }
    
    console.log('    a   b   c   d   e   f   g   h\n');
    console.log('Side to move:', this.sideToMove === 0 ? 'White' : 'Black');
    console.log('Castling:', this._castlingToString());
    console.log('En passant:', this.enPassantSquare === -1 ? '-' : squareToAlgebraic(this.enPassantSquare));
    console.log('Halfmove:', this.halfmoveClock);
    console.log('Fullmove:', this.fullmoveNumber);
    console.log('FEN:', this.toFEN());
  }
  
  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================
  
  /**
   * Update occupancy bitboards from piece bitboards
   * @private
   */
  _updateOccupancy() {
    const bb = this.bitboards;
    this.whiteOccupancy = bb[0] | bb[1] | bb[2] | bb[3] | bb[4] | bb[5];
    this.blackOccupancy = bb[6] | bb[7] | bb[8] | bb[9] | bb[10] | bb[11];
    this.allOccupancy = this.whiteOccupancy | this.blackOccupancy;
  }
  
  /**
   * Convert FEN character to piece constant
   * @private
   */
  _charToPiece(char) {
    const pieceMap = {
      'P': WP, 'N': WN, 'B': WB, 'R': WR, 'Q': WQ, 'K': WK,
      'p': BP, 'n': BN, 'b': BB, 'r': BR, 'q': BQ, 'k': BK
    };
    return pieceMap[char] !== undefined ? pieceMap[char] : -1;
  }
  
  /**
   * Convert piece constant to FEN character
   * @private
   */
  _pieceToChar(piece) {
    const charMap = ['P', 'N', 'B', 'R', 'Q', 'K', 'p', 'n', 'b', 'r', 'q', 'k'];
    return charMap[piece] || '?';
  }
  
  /**
   * Convert castling rights to string
   * @private
   */
  _castlingToString() {
    let str = '';
    if (this.castlingRights & 1) str += 'K';
    if (this.castlingRights & 2) str += 'Q';
    if (this.castlingRights & 4) str += 'k';
    if (this.castlingRights & 8) str += 'q';
    return str || '-';
  }
}

// ========================================
// FACTORY FUNCTIONS
// ========================================

/**
 * Create position from FEN string
 * 
 * @param {string} fen - FEN notation
 * @returns {Position|null} - Position object or null on error
 */
export function createPositionFromFEN(fen) {
  const position = new Position();
  if (position.fromFEN(fen)) {
    return position;
  }
  return null;
}

/**
 * Create starting position
 * 
 * @returns {Position} - Starting position
 */
export function createStartingPosition() {
  return createPositionFromFEN(FEN_STARTING_POSITION);
}

/**
 * Create empty position
 * 
 * @returns {Position} - Empty position
 */
export function createEmptyPosition() {
  const position = new Position();
  const success = position.fromFEN('8/8/8/8/8/8/8/8 w - - 0 1');
  if (!success) {
    console.error('Failed to create empty position from FEN');
  }
  return position;
}
