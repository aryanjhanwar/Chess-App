import { DEFAULT_ENGINE } from "@analysis/constants";
import { Color } from "@analysis/types/enums";
import { Chess } from "chess.js";
import { atom } from "jotai";
const gameAtom = atom(new Chess());
const gameDataAtom = atom({});
const playerColorAtom = atom(Color.White);
const enginePlayNameAtom = atom(DEFAULT_ENGINE);
const engineEloAtom = atom(1320);
const isGameInProgressAtom = atom(false);
export {
  engineEloAtom,
  enginePlayNameAtom,
  gameAtom,
  gameDataAtom,
  isGameInProgressAtom,
  playerColorAtom
};
