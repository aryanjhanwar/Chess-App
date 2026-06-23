import { useMemo } from 'react';

import {
  BOARD_THEME_MAP,
  BOARD_TEXTURE_MAP,
  BOARD_IMAGE_MAP,
  BACKGROUND_PRESETS,
} from '../../constants/boardThemes';

import { toAssetPath } from '../../utils/assetPath';
import { buildPieceImages } from '../../constants/theme';

export function useBoardAppearance(
  uiSettings,
  assetManifest
) {
  const dynamicBoardImageMap = useMemo(() => {
    if (!assetManifest.boards.length) {
      return BOARD_IMAGE_MAP;
    }

    const fromManifest = {
      none: null,
    };

    for (const board of assetManifest.boards) {
      if (!board?.id || !board?.path) continue;

      fromManifest[board.id] = toAssetPath(
        board.path
      );
    }

    return fromManifest;
  }, [assetManifest.boards]);

  const boardSurfaceOptions = useMemo(() => {
    if (!assetManifest.boards.length) {
      return [];
    }

    return [
      {
        id: 'none',
        label: 'Plain Board',
        image: null,
      },

      ...assetManifest.boards.map((board) => ({
        id: board.id,
        label: board.label || board.id,
        image: toAssetPath(board.path),
      })),
    ];
  }, [assetManifest.boards]);

  const pieceSetOptions = useMemo(() => {
    return assetManifest.pieceSets || [];
  }, [assetManifest.pieceSets]);

  const boardThemeColors = useMemo(() => {
    const preset =
      BOARD_THEME_MAP[
        uiSettings.boardTheme
      ] ||
      BOARD_THEME_MAP['classic-blue'];

    const useCustomColors =
      uiSettings.useCustomBoardColors;

    return {
      ...preset,

      light: useCustomColors
        ? (
            uiSettings.customLightSquare ||
            preset.light
          )
        : preset.light,

      dark: useCustomColors
        ? (
            uiSettings.customDarkSquare ||
            preset.dark
          )
        : preset.dark,

      textureImage:
        BOARD_TEXTURE_MAP[
          uiSettings.boardTexture
        ] || null,

      boardImage:
        dynamicBoardImageMap[
          uiSettings.boardSurface
        ] || null,
    };
  }, [
    uiSettings.boardTheme,
    uiSettings.boardSurface,
    uiSettings.customLightSquare,
    uiSettings.customDarkSquare,
    uiSettings.useCustomBoardColors,
    uiSettings.boardTexture,
    dynamicBoardImageMap,
  ]);

  const activePieceSet =
    uiSettings.pieceStyle || 'staunty';

  const activePieceImages = useMemo(() => {
    return buildPieceImages(
      activePieceSet,
      assetManifest.pieceFilesBySet?.[
        activePieceSet
      ] || null
    );
  }, [
    activePieceSet,
    assetManifest.pieceFilesBySet,
  ]);

  const appBackgroundStyle = useMemo(() => {
    if (
      uiSettings.backgroundStyle ===
      'bg-custom-solid'
    ) {
      return {
        background:
          uiSettings.customBackgroundColor ||
          '#17212c',
      };
    }

    return (
      BACKGROUND_PRESETS[
        uiSettings.backgroundStyle
      ]?.style ||
      BACKGROUND_PRESETS['bg-classic']
        .style
    );
  }, [
    uiSettings.backgroundStyle,
    uiSettings.customBackgroundColor,
  ]);

  return {
    dynamicBoardImageMap,
    boardSurfaceOptions,
    pieceSetOptions,
    boardThemeColors,
    activePieceSet,
    activePieceImages,
    appBackgroundStyle,
  };
}