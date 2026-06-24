
import { theme } from '../constants/theme';
import CapturedPiecesList from './CapturedPiecesList';
import { useAtomValue } from 'jotai';
import { pieceStyleAtom } from '@/state/themeState';

export default function PlayerCard({
  color, // 'w' or 'b'
  playerName,
  capturedPieces = [],
  opponentCapturedPieces = [],
}) {
  const pieceStyle = useAtomValue(pieceStyleAtom);

  return (
    <>
      <div className={`${theme.playerCardBorder} px-2 py-1 rounded-xl flex items-center gap-2 bg-transparent`}>
        <div className={`w-8 h-8 ${color === 'w' ? 'bg-cyan-800' : 'bg-gray-700'} rounded flex items-center justify-center overflow-hidden`}>
          <img 
            src="https://www.chess.com/bundles/web/images/user-image.svg" 
            alt="avatar" 
            className="w-full h-full" 
          />
        </div>
        <div className={`${theme.textPrimary} font-semibold text-m flex items-center`}>{playerName}</div>
        <CapturedPiecesList
          capturedPieces={capturedPieces}
          opponentCapturedPieces={opponentCapturedPieces}
          color={color}
          pieceStyle={pieceStyle}
          scale={0.55}
        />
      </div>
    </>
  );
}
