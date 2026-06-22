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

  // Match ChessApp: choose the side-to-move best line while keeping white-perspective scores.
  const isWhiteToPlay = typeof fen === 'string' && fen.split(' ')[1] === 'w';
  if (!isWhiteToPlay) {
    lines.reverse();
  }

  return lines.map((line, index) => ({
    ...line,
    rank: index + 1,
  }));
}

export async function getLichessEval(fen, multiPv = 1) {
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
