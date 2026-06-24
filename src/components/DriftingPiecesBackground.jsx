import React, { useState } from 'react';
import { pieceImages } from '../constants/theme';

function generateDriftingPieces(vw, vh) {
  const pieces = [];
  const sprites = Object.values(pieceImages);
  for (let i = 0; i < 15; i++) {
    pieces.push({
      id: i,
      sprite: sprites[Math.floor(Math.random() * sprites.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      sizePx: 40 + Math.random() * 80,
      opacity: 0.1 + Math.random() * 0.2,
      blurPx: Math.random() * 3,
      durationSec: 15 + Math.random() * 20,
      delaySec: -(Math.random() * 20)
    });
  }
  return pieces;
}

export default function DriftingPiecesBackground() {
  const [driftingPieces] = useState(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1366;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
    return generateDriftingPieces(vw, vh);
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {driftingPieces.map((piece) => (
        <img
          key={piece.id}
          src={piece.sprite}
          alt=""
          className="absolute mode-bg-piece"
          style={{
            left: `${piece.left}%`,
            top: `${piece.top}%`,
            width: `${piece.sizePx}px`,
            height: `${piece.sizePx}px`,
            opacity: Number(piece.opacity) * 0.6,
            filter: piece.blurPx ? `blur(${piece.blurPx}px)` : 'none',
            animationDuration: `${piece.durationSec}s`,
            animationDelay: `${piece.delaySec}s`,
          }}
        />
      ))}
    </div>
  );
}
