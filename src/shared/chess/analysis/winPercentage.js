import { ceilsNumber } from "@/shared/chess/analysis/math";
const getPositionWinPercentage = (position) => {
  return getLineWinPercentage(position.lines[0]);
};
const getLineWinPercentage = (line) => {
  if (line.cp !== void 0) {
    return getWinPercentageFromCp(line.cp);
  }
  if (line.mate !== void 0) {
    return getWinPercentageFromMate(line.mate);
  }
  throw new Error("No cp or mate in line");
};
const getWinPercentageFromMate = (mate) => {
  return mate > 0 ? 100 : 0;
};
const getWinPercentageFromCp = (cp) => {
  const cpCeiled = ceilsNumber(cp, -1e3, 1e3);
  const MULTIPLIER = -368208e-8;
  const winChances = 2 / (1 + Math.exp(MULTIPLIER * cpCeiled)) - 1;
  return 50 + 50 * winChances;
};
export {
  getLineWinPercentage,
  getPositionWinPercentage
};
