export function parseUciInfoLine(line) {
  if (!line || typeof line !== 'string' || !line.startsWith('info')) return null;

  const depthMatch = line.match(/\bdepth\s+(\d+)\b/);
  const scoreMatch = line.match(/\bscore\s+(cp|mate)\s+(-?\d+)\b/);
  const nodesMatch = line.match(/\bnodes\s+(\d+)\b/);
  const npsMatch = line.match(/\bnps\s+(\d+)\b/);
  const timeMatch = line.match(/\btime\s+(\d+)\b/);
  const multiPvMatch = line.match(/\bmultipv\s+(\d+)\b/);
  const pvMatch = line.match(/\bpv\s+(.+)$/);

  const parsed = {
    depth: depthMatch ? parseInt(depthMatch[1], 10) : null,
    score: null,
    nodes: nodesMatch ? parseInt(nodesMatch[1], 10) : null,
    nps: npsMatch ? parseInt(npsMatch[1], 10) : null,
    timeMs: timeMatch ? parseInt(timeMatch[1], 10) : null,
    multiPv: multiPvMatch ? parseInt(multiPvMatch[1], 10) : 1,
    pv: pvMatch ? pvMatch[1].trim().split(/\s+/).filter(Boolean) : [],
  };

  if (scoreMatch) {
    const scoreType = scoreMatch[1];
    const scoreValue = parseInt(scoreMatch[2], 10);
    parsed.score = scoreType === 'cp'
      ? { type: 'cp', value: scoreValue / 100 }
      : { type: 'mate', value: scoreValue };
  }

  return parsed;
}

export function upsertMultiPvCandidate(candidates, parsedInfo) {
  if (!parsedInfo?.score) return;

  const rank = Math.max(1, parsedInfo.multiPv || 1);
  const currentDepth = parsedInfo.depth || 0;
  const previous = candidates[rank];
  if (previous && currentDepth < (previous.depth || 0)) {
    return;
  }

  candidates[rank] = {
    rank,
    uci: parsedInfo.pv?.[0] || null,
    score: parsedInfo.score,
    pv: parsedInfo.pv || [],
    depth: currentDepth,
  };
}

export function finalizeMultiPv(candidates) {
  return Object.values(candidates)
    .sort((a, b) => a.rank - b.rank)
    .map((item) => ({
      rank: item.rank,
      uci: item.uci,
      score: item.score,
      pv: item.pv,
      depth: item.depth,
    }));
}

export function normalizeAnalysisResult(raw) {
  if (!raw) return null;

  return {
    bestMove: raw.bestMove || null,
    evaluation: raw.evaluation || null,
    depth: raw.depth || 0,
    nodes: raw.nodes || null,
    nps: raw.nps || null,
    timeMs: raw.timeMs || null,
    multipv: Array.isArray(raw.multipv) ? raw.multipv : [],
    backend: 'stockfish',
  };
}
