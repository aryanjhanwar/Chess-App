import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_BOARD_SURFACE_OPTIONS } from '../../constants/uiPresets.js';
import { BOARD_IMAGE_MAP } from '../../constants/boardThemes';
import { toAssetPath } from '../../utils/assetPath.js';

export function useAssetManifest() {
  const [assetManifest, setAssetManifest] = useState({
    boards: [],
    pieceSets: [],
    pieceFilesBySet: {},
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`${toAssetPath('asset-manifest.json')}?ts=${Date.now()}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || cancelled) return;
        setAssetManifest({
          boards: Array.isArray(data.boards) ? data.boards : [],
          pieceSets: Array.isArray(data.pieceSets) ? data.pieceSets : [],
          pieceFilesBySet: data.pieceFilesBySet && typeof data.pieceFilesBySet === 'object' ? data.pieceFilesBySet : {},
        });
      })
      .catch(() => {
        if (cancelled) return;
        setAssetManifest({ boards: [], pieceSets: [], pieceFilesBySet: {} });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dynamicBoardImageMap = useMemo(() => {
    if (!assetManifest.boards.length) return BOARD_IMAGE_MAP;
    const fromManifest = { none: null };
    for (const board of assetManifest.boards) {
      if (!board?.id || !board?.path) continue;
      fromManifest[board.id] = toAssetPath(board.path);
    }
    return fromManifest;
  }, [assetManifest.boards]);

  const boardSurfaceOptions = useMemo(() => {
    if (!assetManifest.boards.length) return DEFAULT_BOARD_SURFACE_OPTIONS;
    return [
      { id: 'none', label: 'Plain Board', image: null },
      ...assetManifest.boards.map((board) => ({
        id: board.id,
        label: board.label || board.id,
        image: toAssetPath(board.path),
      })),
    ];
  }, [assetManifest.boards]);

  const pieceSetOptions = useMemo(() => {
    return assetManifest.pieceSets;
  }, [assetManifest.pieceSets]);

  return {
    assetManifest,
    dynamicBoardImageMap,
    boardSurfaceOptions,
    pieceSetOptions,
  };
}
