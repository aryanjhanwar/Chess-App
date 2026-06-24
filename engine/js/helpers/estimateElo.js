import { ceilsNumber } from "@/lib/math";
export const computeEstimatedElo = (positions, whiteElo, blackElo) => {
  if (positions.length < 2) {
    return void 0;
  }
  const { whiteCpl, blackCpl } = getPlayersAverageCpl(positions);
  const whiteEstimatedElo = getEloFromRatingAndCpl(
    whiteCpl,
    whiteElo ?? blackElo
  );
  const blackEstimatedElo = getEloFromRatingAndCpl(
    blackCpl,
    blackElo ?? whiteElo
  );
  return { white: whiteEstimatedElo, black: blackEstimatedElo };
};
const getPositionCp = (position) => {
  const line = position.lines[0];
  if (line.cp !== void 0) {
    return ceilsNumber(line.cp, -1e3, 1e3);
  }
  if (line.mate !== void 0) {
    return ceilsNumber(line.mate * Infinity, -1e3, 1e3);
  }
  throw new Error("No cp or mate in line");
};
const getPlayersAverageCpl = (positions) => {
  let previousCp = getPositionCp(positions[0]);
  const { whiteCpl, blackCpl } = positions.slice(1).reduce(
    (acc, position, index) => {
      const cp = getPositionCp(position);
      if (index % 2 === 0) {
        acc.whiteCpl += cp > previousCp ? 0 : Math.min(previousCp - cp, 1e3);
      } else {
        acc.blackCpl += cp < previousCp ? 0 : Math.min(cp - previousCp, 1e3);
      }
      previousCp = cp;
      return acc;
    },
    { whiteCpl: 0, blackCpl: 0 }
  );
  return {
    whiteCpl: whiteCpl / Math.ceil((positions.length - 1) / 2),
    blackCpl: blackCpl / Math.floor((positions.length - 1) / 2)
  };
};
const getEloFromAverageCpl = (averageCpl) => 3100 * Math.exp(-0.01 * averageCpl);
const getAverageCplFromElo = (elo) => -100 * Math.log(Math.min(elo, 3100) / 3100);
const getEloFromRatingAndCpl = (gameCpl, rating) => {
  const eloFromCpl = getEloFromAverageCpl(gameCpl);
  if (!rating) return eloFromCpl;
  const expectedCpl = getAverageCplFromElo(rating);
  const cplDiff = gameCpl - expectedCpl;
  if (cplDiff === 0) return eloFromCpl;
  if (cplDiff > 0) {
    return rating * Math.exp(-5e-3 * cplDiff);
  } else {
    return rating / Math.exp(-5e-3 * -cplDiff);
  }
};
