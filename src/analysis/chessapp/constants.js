import { EngineName, MoveClassification } from "./types/enums";
const MAIN_THEME_COLOR = "#3B9AC6";
const LINEAR_PROGRESS_BAR_COLOR = "#3B9AC6";
const CLASSIFICATION_COLORS = {
  [MoveClassification.Book]: "#dbac86",
  [MoveClassification.Brilliant]: "#19d4af",
  [MoveClassification.Great]: "#3894eb",
  [MoveClassification.Best]: "#22ac38",
  [MoveClassification.Excellent]: "#22ac38",
  [MoveClassification.Good]: "#74b038",
  [MoveClassification.Miss]: "#d57ba2",
  [MoveClassification.Inaccuracy]: "#f2be1f",
  [MoveClassification.Mistake]: "#e69f00",
  [MoveClassification.Blunder]: "#df5353"
};
const DEFAULT_ENGINE = EngineName.Stockfish17Lite;
const STRONGEST_ENGINE = EngineName.Stockfish17;
const ENGINE_LABELS = {
  [EngineName.Stockfish18]: {
    full: "Stockfish 18 (108MB)",
    small: "Stockfish 18",
    sizeMb: 108
  },
  [EngineName.Stockfish18Lite]: {
    full: "Stockfish 18 Lite (7MB)",
    small: "Stockfish 18 Lite",
    sizeMb: 7
  },
  [EngineName.Stockfish17_1]: {
    full: "Stockfish 17.1 (75MB)",
    small: "Stockfish 17.1",
    sizeMb: 75
  },
  [EngineName.Stockfish17_1Lite]: {
    full: "Stockfish 17.1 Lite (7MB)",
    small: "Stockfish 17.1 Lite",
    sizeMb: 7
  },
  [EngineName.Stockfish17]: {
    full: "Stockfish 17 (75MB)",
    small: "Stockfish 17",
    sizeMb: 75
  },
  [EngineName.Stockfish17Lite]: {
    full: "Stockfish 17 Lite (6MB)",
    small: "Stockfish 17 Lite",
    sizeMb: 6
  },
  [EngineName.Stockfish16_1]: {
    full: "Stockfish 16.1 (64MB)",
    small: "Stockfish 16.1",
    sizeMb: 64
  },
  [EngineName.Stockfish16_1Lite]: {
    full: "Stockfish 16.1 Lite (6MB)",
    small: "Stockfish 16.1 Lite",
    sizeMb: 6
  },
  [EngineName.Stockfish16NNUE]: {
    full: "Stockfish 16 (40MB)",
    small: "Stockfish 16",
    sizeMb: 40
  },
  [EngineName.Stockfish16]: {
    full: "Stockfish 16 Lite (HCE)",
    small: "Stockfish 16 Lite",
    sizeMb: 2
  },
  [EngineName.Stockfish11]: {
    full: "Stockfish 11 (HCE)",
    small: "Stockfish 11",
    sizeMb: 2
  }
};
const PIECE_SETS = [
  "alpha",
  "anarcandy",
  "caliente",
  "california",
  "cardinal",
  "cburnett",
  "celtic",
  "chess7",
  "chessnut",
  "chicago",
  "companion",
  "cooke",
  "dubrovny",
  "fantasy",
  "firi",
  "fresca",
  "gioco",
  "governor",
  "horsey",
  "icpieces",
  "iowa",
  "kiwen-suwi",
  "kosal",
  "leipzig",
  "letter",
  "maestro",
  "merida",
  "monarchy",
  "mpchess",
  "oslo",
  "pirouetti",
  "pixel",
  "reillycraig",
  "rhosgfx",
  "riohacha",
  "shapes",
  "spatial",
  "staunty",
  "symmetric",
  "tatiana",
  "xkcd"
];
export {
  CLASSIFICATION_COLORS,
  DEFAULT_ENGINE,
  ENGINE_LABELS,
  LINEAR_PROGRESS_BAR_COLOR,
  MAIN_THEME_COLOR,
  PIECE_SETS,
  STRONGEST_ENGINE
};
