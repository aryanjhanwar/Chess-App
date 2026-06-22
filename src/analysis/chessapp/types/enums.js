var GameOrigin = /* @__PURE__ */ ((GameOrigin2) => {
  GameOrigin2["Pgn"] = "pgn";
  GameOrigin2["ChessCom"] = "chesscom";
  GameOrigin2["Lichess"] = "lichess";
  return GameOrigin2;
})(GameOrigin || {});
var EngineName = /* @__PURE__ */ ((EngineName2) => {
  EngineName2["Stockfish17"] = "stockfish_17";
  EngineName2["Stockfish17Lite"] = "stockfish_17_lite";
  EngineName2["Stockfish16_1"] = "stockfish_16_1";
  EngineName2["Stockfish16_1Lite"] = "stockfish_16_1_lite";
  EngineName2["Stockfish16NNUE"] = "stockfish_16_nnue";
  EngineName2["Stockfish16"] = "stockfish_16";
  EngineName2["Stockfish11"] = "stockfish_11";
  return EngineName2;
})(EngineName || {});
var MoveClassification = /* @__PURE__ */ ((MoveClassification2) => {
  MoveClassification2["Blunder"] = "blunder";
  MoveClassification2["Mistake"] = "mistake";
  MoveClassification2["Inaccuracy"] = "inaccuracy";
  MoveClassification2["Miss"] = "miss";
  MoveClassification2["Good"] = "good";
  MoveClassification2["Excellent"] = "excellent";
  MoveClassification2["Best"] = "best";
  MoveClassification2["Book"] = "book";
  MoveClassification2["Great"] = "great";
  MoveClassification2["Brilliant"] = "brilliant";
  return MoveClassification2;
})(MoveClassification || {});
var Color = /* @__PURE__ */ ((Color2) => {
  Color2["White"] = "w";
  Color2["Black"] = "b";
  return Color2;
})(Color || {});
export {
  Color,
  EngineName,
  GameOrigin,
  MoveClassification
};
