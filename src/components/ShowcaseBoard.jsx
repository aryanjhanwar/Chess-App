import React, { useState, useEffect, useRef, useMemo } from 'react';
import ChessBoardView from './ChessBoardView';
import { Chess } from 'chess.js';

// The user's specific Fried Liver Attack game
const SHOWCASE_PGN = `
[Event "Casual Game"]
[Site "Chessboard"]
[Date "2026"]
[White "Attacker"]
[Black "Defender"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7 7. Qf3+ Ke6 8. Nc3 Ncb4 9. Nxd5 Nxd5 10. d4 c6 11. O-O exd4 12. Re1+ Kd6 13. Bf4+ Kc5 14. Bxd5 Qxd5 15. b4+ Kxb4 16. Rab1+ Ka5 17. Bd2+ Ka6 18. Qd3+ b5 19. a4 Bf5 20. axb5+ cxb5 21. Ra1+ Kb6 22. Ba5+ 1-0
`;

export default function ShowcaseBoard() {
  const [boardDisplay, setBoardDisplay] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [movesToPlay, setMovesToPlay] = useState([]);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [currentMoveClass, setCurrentMoveClass] = useState(null);
  
  const chessRef = useRef(new Chess());

  // Parse PGN on mount
  useEffect(() => {
    try {
      const tempChess = new Chess();
      tempChess.loadPgn(SHOWCASE_PGN);
      const history = tempChess.history({ verbose: true });
      setMovesToPlay(history);
      
      chessRef.current = new Chess(); // Reset to start
      setBoardDisplay(chessRef.current.board());
    } catch (err) {
      console.error("Failed to parse showcase PGN:", err);
    }
  }, []);

  const moveIndexRef = useRef(0);

  // Animation Loop
  useEffect(() => {
    if (movesToPlay.length === 0) return;

    moveIndexRef.current = 0;
    chessRef.current = new Chess();
    setBoardDisplay(chessRef.current.board());
    setLastMove(null);
    setIsGameComplete(false);
    setCurrentMoveClass(null);

    const intervalId = setInterval(() => {
      const currentIndex = moveIndexRef.current;
      
      if (currentIndex >= movesToPlay.length) {
        setIsGameComplete(true);
        // Wait at the end for a few seconds before restarting
        if (currentIndex > movesToPlay.length + 3) {
           chessRef.current = new Chess();
           moveIndexRef.current = 0;
           setBoardDisplay(chessRef.current.board());
           setLastMove(null);
           setIsGameComplete(false);
           setCurrentMoveClass(null);
        } else {
           moveIndexRef.current = currentIndex + 1;
        }
        return;
      }

      const move = movesToPlay[currentIndex];
      if (move) {
        try {
          chessRef.current.move(move.san);
          setBoardDisplay(chessRef.current.board());
          setLastMove({ 
            from: algebraicToGrid(move.from), 
            to: algebraicToGrid(move.to) 
          });
          
          // Brilliant move tracking
          if (move.color === 'w' && (move.san === 'Nxf7' || move.san === 'Nxd5')) {
            setCurrentMoveClass('brilliant');
          } else {
            setCurrentMoveClass(null);
          }
        } catch (err) {
          console.error('Showcase move error:', err, move);
        }
      }
      
      moveIndexRef.current = currentIndex + 1;
    }, 1200);

    return () => clearInterval(intervalId);
  }, [movesToPlay]);

  // Convert chess.js board objects to strings for ChessBoardView
  const formattedBoard = useMemo(() => {
    if (!boardDisplay) return null;
    return boardDisplay.map(row => 
      row.map(p => p ? `${p.color}${p.type === 'p' ? 'p' : p.type.toUpperCase()}` : null)
    );
  }, [boardDisplay]);

  if (!formattedBoard) return null;

  return (
    <div className="relative w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/20 border border-white/10 glass-panel animate-fade-in pointer-events-none group">
      
      {/* Decorative overlay for cinematic feel */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/40 via-transparent to-purple-900/30 mix-blend-overlay z-10 pointer-events-none opacity-50"></div>
      
      {/* Vignette effect */}
      <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] z-20 pointer-events-none"></div>

      {/* Completion Overlay */}
      {isGameComplete && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="text-center transform scale-110 animate-bounce-slight">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-lg mb-2">PLAY & WIN</h2>
            <p className="text-white/80 font-semibold tracking-widest text-sm uppercase">At ChessPro</p>
          </div>
        </div>
      )}

      {/* The actual board */}
      <div className="w-full h-full relative z-0">
        <ChessBoardView
          board={formattedBoard}
          validMoves={[]}
          lastMove={lastMove}
          kingInCheckPos={chessRef.current.inCheck() ? findKingPos(boardDisplay, chessRef.current.turn()) : null}
          moveClassification={currentMoveClass}
          isFlipped={false}
          enableDrag={false}
          showCoordinates={false}
        />
      </div>

    </div>
  );
}

function findKingPos(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'k' && piece.color === color) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function algebraicToGrid(square) {
  if (!square || square.length < 2) return null;
  const col = square.charCodeAt(0) - 97;
  const row = 8 - parseInt(square[1], 10);
  return { row, col };
}
