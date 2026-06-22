import { atomWithStorage } from "jotai/utils";
const pieceSetAtom = atomWithStorage(
  "pieceSet",
  "maestro"
);
const boardHueAtom = atomWithStorage("boardHue", 0);
export {
  boardHueAtom,
  pieceSetAtom
};
