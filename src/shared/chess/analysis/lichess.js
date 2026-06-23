import { sortLines } from "@/shared/chess/stockfish/helpers/parseResults";
import {
  LichessError
} from "@analysis/types/lichess";
import { logErrorToSentry } from "@analysis/lib/sentry";
import { formatUciPv } from "./chess";
const getLichessEval = async (fen, multiPv = 1) => {
  try {
    const data = await fetchLichessEval(fen, multiPv);
    if ("error" in data) {
      if (data.error === LichessError.NotFound) {
        return {
          bestMove: "",
          lines: []
        };
      }
      throw new Error(data.error);
    }
    const lines = data.pvs.map((pv, index) => ({
      pv: formatUciPv(fen, pv.moves.split(" ")),
      cp: pv.cp,
      mate: pv.mate,
      depth: data.depth,
      multiPv: index + 1
    }));
    lines.sort(sortLines);
    const isWhiteToPlay = fen.split(" ")[1] === "w";
    if (!isWhiteToPlay) lines.reverse();
    const bestMove = lines[0].pv[0];
    const linesToKeep = lines.slice(0, multiPv);
    return {
      bestMove,
      lines: linesToKeep
    };
  } catch (error) {
    logErrorToSentry(error, { fen, multiPv });
    return {
      bestMove: "",
      lines: []
    };
  }
};
const getLichessUserRecentGames = async (username, signal) => {
  const res = await fetch(
    `https://lichess.org/api/games/user/${username}?until=${Date.now()}&max=50&pgnInJson=true&sort=dateDesc&clocks=true`,
    { method: "GET", headers: { accept: "application/x-ndjson" }, signal }
  );
  if (res.status >= 400) {
    throw new Error("Error fetching games from Lichess");
  }
  const rawData = await res.text();
  const games = rawData.split("\n").filter((game) => game.length > 0).map((game) => JSON.parse(game));
  return games.map(formatLichessGame);
};
const fetchLichessEval = async (fen, multiPv) => {
  try {
    const init = { method: "GET" };
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      init.signal = AbortSignal.timeout(1200);
    }
    const res = await fetch(
      `https://lichess.org/api/cloud-eval?fen=${fen}&multiPv=${multiPv}`,
      init
    );
    if (!res.ok) {
      return { error: LichessError.NotFound };
    }
    return res.json();
  } catch (error) {
    const isTimeoutOrAbort = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    if (!isTimeoutOrAbort) {
      console.error(error);
    }
    return { error: LichessError.NotFound };
  }
};
const fetchLichessGame = async (gameId, signal) => {
  try {
    const res = await fetch(
      `https://lichess.org/game/export/${gameId}?pgnInJson=true&clocks=true`,
      { method: "GET", headers: { accept: "application/x-ndjson" }, signal }
    );
    if (res.status >= 400) {
      throw new Error(`Error fetching game ${gameId} from Lichess`);
    }
    const gameData = await res.json();
    return gameData.pgn;
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};
const formatLichessGame = (data) => {
  return {
    id: data.id,
    pgn: data.pgn || "",
    white: {
      name: data.players.white.user?.name || "White",
      rating: data.players.white.rating,
      title: data.players.white.user?.title
    },
    black: {
      name: data.players.black.user?.name || "Black",
      rating: data.players.black.rating,
      title: data.players.black.user?.title
    },
    result: getGameResult(data),
    timeControl: `${Math.floor(data.clock?.initial / 60 || 0)}+${data.clock?.increment || 0}`,
    date: new Date(data.createdAt || data.lastMoveAt).toLocaleDateString(),
    movesNb: data.moves?.split(" ").length || 0,
    url: `https://lichess.org/${data.id}`
  };
};
const getGameResult = (data) => {
  if (data.status === "draw") return "1/2-1/2";
  if (data.winner) return data.winner === "white" ? "1-0" : "0-1";
  return "*";
};
function toScore(score) {
  if (!score) return null;

  if (typeof score.cp === 'number') {
    return {
      type: 'cp',
      value: score.cp / 100,
    };
  }

  if (typeof score.mate === 'number') {
    return {
      type: 'mate',
      value: score.mate,
    };
  }

  return null;
}

function scoreCompare(a, b) {
  const aScore = a?.score;
  const bScore = b?.score;

  if (!aScore && !bScore) return 0;
  if (!aScore) return 1;
  if (!bScore) return -1;

  if (aScore.type === 'mate' && bScore.type === 'mate') {
    if (aScore.value > 0 && bScore.value < 0) return -1;
    if (aScore.value < 0 && bScore.value > 0) return 1;
    return aScore.value - bScore.value;
  }

  if (aScore.type === 'mate') {
    return -aScore.value;
  }

  if (bScore.type === 'mate') {
    return bScore.value;
  }

  return bScore.value - aScore.value;
}

function normalizeCloudLines(fen, pvs, defaultDepth) {
  const lines = pvs
    .map((pv, index) => {
      const score = toScore(pv);
      const moves = typeof pv?.moves === 'string'
        ? pv.moves.split(' ').filter(Boolean)
        : Array.isArray(pv?.moves)
          ? pv.moves
          : [];

      return {
        rank: index + 1,
        uci: moves[0] || null,
        score,
        pv: moves,
        depth: typeof pv?.depth === 'number' ? pv.depth : defaultDepth,
      };
    })
    .filter((line) => line.score || line.uci);

  lines.sort(scoreCompare);

  const isWhiteToPlay = typeof fen === 'string' && fen.split(' ')[1] === 'w';
  if (!isWhiteToPlay) {
    lines.reverse();
  }

  return lines.map((line, index) => ({
    ...line,
    rank: index + 1,
  }));
}

export async function getLichessEvalForEngine(fen, multiPv = 1) {
  if (!fen || typeof fetch !== 'function') return null;

  const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(
    fen
  )}&multiPv=${Math.max(1, Number(multiPv || 1))}`;

  const init = {};
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    init.signal = AbortSignal.timeout(250);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch {
    return null;
  }

  if (!response.ok) return null;

  let body;
  try {
    body = await response.json();
  } catch {
    return null;
  }

  const rawPvs = Array.isArray(body?.pvs) ? body.pvs : [];
  const bodyDepth = typeof body?.depth === 'number' ? body.depth : 0;
  const lines = normalizeCloudLines(fen, rawPvs, bodyDepth);
  const multipv = lines.slice(0, Math.max(1, Number(multiPv || 1)));

  const first = multipv[0] || null;
  return {
    bestMove: first?.uci || null,
    evaluation: first?.score || null,
    depth: bodyDepth || first?.depth || 0,
    nodes: null,
    nps: null,
    timeMs: null,
    multipv,
    backend: 'lichess',
  };
}

export {
  fetchLichessGame,
  getLichessEval,
  getLichessUserRecentGames
};
