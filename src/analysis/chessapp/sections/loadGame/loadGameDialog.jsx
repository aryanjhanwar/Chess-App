import { jsx, jsxs } from "react/jsx-runtime";
import { useGameDatabase } from "@analysis/hooks/useGameDatabase";
import { getGameFromPgn } from "@analysis/lib/chess";
import { GameOrigin } from "@analysis/types/enums";
import {
  MenuItem,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  OutlinedInput,
  DialogActions,
  Grid,
  Snackbar,
  Alert
} from "@mui/material";
import { setContext as setSentryContext } from "@analysis/shims/sentryReact";
import { useRef, useState } from "react";
import GamePgnInput from "./gamePgnInput";
import ChessComInput from "./chessComInput";
import { useLocalStorage } from "@analysis/hooks/useLocalStorage";
import LichessInput from "./lichessInput";
import { useSetAtom } from "jotai";
import { boardOrientationAtom } from "../analysis/states";
function NewGameDialog({ open, onClose, setGame }) {
  const [pgn, setPgn] = useState("");
  const [gameOrigin, setGameOrigin] = useLocalStorage(
    "preferred-game-origin",
    GameOrigin.ChessCom
  );
  const [parsingError, setParsingError] = useState("");
  const parsingErrorTimeout = useRef(null);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const { addGame } = useGameDatabase();
  const handleAddGame = async (pgn2, boardOrientation) => {
    if (!pgn2) return;
    try {
      const gameToAdd = getGameFromPgn(pgn2);
      setSentryContext("loadedGame", { pgn: pgn2 });
      if (setGame) {
        await setGame(gameToAdd);
      } else {
        await addGame(gameToAdd);
      }
      setBoardOrientation(boardOrientation ?? true);
      handleClose();
    } catch (error) {
      console.error(error);
      if (parsingErrorTimeout.current) {
        clearTimeout(parsingErrorTimeout.current);
      }
      setParsingError(
        error instanceof Error ? `${error.message} !` : "Invalid PGN: unknown error !"
      );
      parsingErrorTimeout.current = setTimeout(() => {
        setParsingError("");
      }, 3e3);
    }
  };
  const handleClose = () => {
    setPgn("");
    setParsingError("");
    if (parsingErrorTimeout.current) {
      clearTimeout(parsingErrorTimeout.current);
    }
    onClose();
  };
  return /* @__PURE__ */ jsxs(
    Dialog,
    {
      open,
      onClose: handleClose,
      maxWidth: "md",
      slotProps: {
        paper: {
          sx: {
            position: "fixed",
            top: 0,
            width: "calc(100% - 10px)",
            marginY: { xs: "3vh", sm: 5 },
            maxHeight: { xs: "calc(100% - 5vh)", sm: "calc(100% - 64px)" }
          }
        }
      },
      children: [
        /* @__PURE__ */ jsx(DialogTitle, { marginY: 1, variant: "h5", children: setGame ? "Load a game" : "Add a game to your database" }),
        /* @__PURE__ */ jsx(DialogContent, { sx: { padding: { xs: 2, md: 3 } }, children: /* @__PURE__ */ jsxs(
          Grid,
          {
            container: true,
            marginTop: 1,
            alignItems: "center",
            justifyContent: "start",
            rowGap: 2,
            children: [
              /* @__PURE__ */ jsxs(FormControl, { sx: { my: 1, mr: 2, width: 150 }, children: [
                /* @__PURE__ */ jsx(InputLabel, { id: "dialog-select-label", children: "Game origin" }),
                /* @__PURE__ */ jsx(
                  Select,
                  {
                    labelId: "dialog-select-label",
                    id: "dialog-select",
                    displayEmpty: true,
                    input: /* @__PURE__ */ jsx(OutlinedInput, { label: "Game origin" }),
                    value: gameOrigin ?? "",
                    onChange: (e) => {
                      setGameOrigin(e.target.value);
                      setParsingError("");
                    },
                    children: Object.entries(gameOriginLabel).map(([origin, label]) => /* @__PURE__ */ jsx(MenuItem, { value: origin, children: label }, origin))
                  }
                )
              ] }),
              gameOrigin === GameOrigin.Pgn && /* @__PURE__ */ jsx(GamePgnInput, { pgn, setPgn }),
              gameOrigin === GameOrigin.ChessCom && /* @__PURE__ */ jsx(ChessComInput, { onSelect: handleAddGame }),
              gameOrigin === GameOrigin.Lichess && /* @__PURE__ */ jsx(LichessInput, { onSelect: handleAddGame }),
              /* @__PURE__ */ jsx(Snackbar, { open: !!parsingError, children: /* @__PURE__ */ jsx(
                Alert,
                {
                  onClose: () => setParsingError(""),
                  severity: "error",
                  variant: "filled",
                  sx: { width: "100%" },
                  children: parsingError
                }
              ) })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxs(DialogActions, { sx: { m: 2 }, children: [
          /* @__PURE__ */ jsx(Button, { variant: "outlined", onClick: handleClose, children: "Cancel" }),
          gameOrigin === GameOrigin.Pgn && /* @__PURE__ */ jsx(
            Button,
            {
              variant: "contained",
              sx: { marginLeft: 2 },
              onClick: () => {
                handleAddGame(pgn);
              },
              children: "Add"
            }
          )
        ] })
      ]
    }
  );
}
const gameOriginLabel = {
  [GameOrigin.ChessCom]: "Chess.com",
  [GameOrigin.Lichess]: "Lichess.org",
  [GameOrigin.Pgn]: "PGN"
};
export {
  NewGameDialog as default
};

