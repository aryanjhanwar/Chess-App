import { useAtomValue } from "jotai";
import { useGameDatabase } from "./useGameDatabase";
import { useQuery } from "@tanstack/react-query";
import { getChessComUserAvatar } from "@analysis/lib/chessCom";
const usePlayersData = (gameAtom) => {
  const game = useAtomValue(gameAtom);
  const { gameFromUrl } = useGameDatabase();
  const headers = game.getHeaders();
  const headersWhiteName = headers.White && headers.White !== "?" ? headers.White : void 0;
  const headersBlackName = headers.Black && headers.Black !== "?" ? headers.Black : void 0;
  const whiteName = gameFromUrl?.white?.name || headersWhiteName || "White";
  const blackName = gameFromUrl?.black?.name || headersBlackName || "Black";
  const whiteElo = gameFromUrl?.white?.rating || Number(headers.WhiteElo) || void 0;
  const blackElo = gameFromUrl?.black?.rating || Number(headers.BlackElo) || void 0;
  const siteHeader = gameFromUrl?.site || headers.Site || "unknown";
  const isChessCom = siteHeader.toLowerCase().includes("chess.com");
  const whiteAvatarUrl = usePlayerAvatarUrl(
    whiteName,
    isChessCom && !!whiteName && whiteName !== "White"
  );
  const blackAvatarUrl = usePlayerAvatarUrl(
    blackName,
    isChessCom && !!blackName && blackName !== "Black"
  );
  return {
    white: {
      name: whiteName,
      rating: whiteElo,
      avatarUrl: whiteAvatarUrl ?? void 0
    },
    black: {
      name: blackName,
      rating: blackElo,
      avatarUrl: blackAvatarUrl ?? void 0
    }
  };
};
const usePlayerAvatarUrl = (playerName, enabled) => {
  const { data: avatarUrl } = useQuery({
    queryKey: ["CCAvatar", playerName],
    enabled,
    queryFn: () => getChessComUserAvatar(playerName),
    staleTime: 1e3 * 60 * 60,
    // 1 hour
    gcTime: 1e3 * 60 * 60 * 24
    // 1 day
  });
  return avatarUrl;
};
export {
  usePlayersData
};
