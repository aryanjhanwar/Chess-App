import { jsx, jsxs } from "react/jsx-runtime";
import Slider from "@analysis/components/slider";
import { Color, EngineName } from "@analysis/types/enums";
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
  Typography,
  Grid,
  FormGroup,
  FormControlLabel,
  Switch,
  TextField
} from "@mui/material";
import { useAtomLocalStorage } from "@analysis/hooks/useAtomLocalStorage";
import { useAtom, useSetAtom } from "jotai";
import {
  engineEloAtom,
  playerColorAtom,
  isGameInProgressAtom,
  gameAtom,
  enginePlayNameAtom
} from "../states";
import { useChessActions } from "@analysis/hooks/useChessActions";
import { logAnalyticsEvent } from "@analysis/lib/firebase";
import { useEffect, useState } from "react";
import { isEngineSupported } from "@analysis/lib/engine/shared";
import { Stockfish16_1 } from "@analysis/lib/engine/stockfish16_1";
import { DEFAULT_ENGINE, ENGINE_LABELS, STRONGEST_ENGINE } from "@analysis/constants";
import { getGameFromPgn } from "@analysis/lib/chess";
function GameSettingsDialog({ open, onClose }) {
  const [engineElo, setEngineElo] = useAtomLocalStorage(
    "engine-elo",
    engineEloAtom
  );
  const [engineName, setEngineName] = useAtomLocalStorage(
    "engine-play-name",
    enginePlayNameAtom
  );
  const [playerColor, setPlayerColor] = useAtom(playerColorAtom);
  const setIsGameInProgress = useSetAtom(isGameInProgressAtom);
  const { reset: resetGame } = useChessActions(gameAtom);
  const [startingPositionInput, setStartingPositionInput] = useState("");
  const [parsingError, setParsingError] = useState("");
  const handleGameStart = () => {
    setParsingError("");
    try {
      const input = startingPositionInput.trim();
      const startingFen = input.startsWith("[") ? getGameFromPgn(input).fen() : input || void 0;
      resetGame({
        white: {
          name: playerColor === Color.White ? "You" : ENGINE_LABELS[engineName].small,
          rating: playerColor === Color.White ? void 0 : engineElo
        },
        black: {
          name: playerColor === Color.Black ? "You" : ENGINE_LABELS[engineName].small,
          rating: playerColor === Color.Black ? void 0 : engineElo
        },
        fen: startingFen
      });
    } catch (error) {
      console.error(error);
      setParsingError(
        error instanceof Error ? `${error.message} !` : "Unknown error while parsing input !"
      );
      return;
    }
    setIsGameInProgress(true);
    handleClose();
    logAnalyticsEvent("play_game", {
      engine: engineName,
      engineElo,
      playerColor
    });
  };
  useEffect(() => {
    if (!isEngineSupported(engineName)) {
      if (Stockfish16_1.isSupported()) {
        setEngineName(EngineName.Stockfish16_1Lite);
      } else {
        setEngineName(EngineName.Stockfish11);
      }
    }
  }, [setEngineName, engineName]);
  const handleClose = () => {
    onClose();
    setStartingPositionInput("");
    setParsingError("");
  };
  return /* @__PURE__ */ jsxs(Dialog, { open, onClose: handleClose, maxWidth: "md", fullWidth: true, children: [
    /* @__PURE__ */ jsx(DialogTitle, { marginY: 1, variant: "h5", children: "Set game parameters" }),
    /* @__PURE__ */ jsxs(DialogContent, { sx: { paddingBottom: 0 }, children: [
      /* @__PURE__ */ jsxs(Typography, { children: [
        ENGINE_LABELS[DEFAULT_ENGINE].small,
        " is the default engine if your device support its requirements. It offers the best balance between speed and strength. ",
        ENGINE_LABELS[STRONGEST_ENGINE].small,
        " is the strongest engine available, note that it requires a one time download of 75MB."
      ] }),
      /* @__PURE__ */ jsxs(
        Grid,
        {
          marginTop: 4,
          container: true,
          justifyContent: "center",
          alignItems: "center",
          rowGap: 3,
          size: 12,
          children: [
            /* @__PURE__ */ jsx(Grid, { container: true, justifyContent: "center", size: 12, children: /* @__PURE__ */ jsxs(FormControl, { variant: "outlined", children: [
              /* @__PURE__ */ jsx(InputLabel, { id: "dialog-select-label", children: "Bot's engine" }),
              /* @__PURE__ */ jsx(
                Select,
                {
                  labelId: "dialog-select-label",
                  id: "dialog-select",
                  displayEmpty: true,
                  input: /* @__PURE__ */ jsx(OutlinedInput, { label: "Engine" }),
                  value: engineName,
                  onChange: (e) => setEngineName(e.target.value),
                  sx: { width: 280, maxWidth: "100%" },
                  children: Object.values(EngineName).map((engine) => /* @__PURE__ */ jsx(
                    MenuItem,
                    {
                      value: engine,
                      disabled: !isEngineSupported(engine),
                      children: ENGINE_LABELS[engine].full
                    },
                    engine
                  ))
                }
              )
            ] }) }),
            /* @__PURE__ */ jsx(
              Slider,
              {
                label: "Bot Elo rating",
                value: engineElo,
                setValue: setEngineElo,
                min: 1320,
                max: 3190,
                step: 10,
                marksFilter: 374
              }
            ),
            /* @__PURE__ */ jsx(FormGroup, { children: /* @__PURE__ */ jsx(
              FormControlLabel,
              {
                control: /* @__PURE__ */ jsx(
                  Switch,
                  {
                    color: "default",
                    checked: playerColor === Color.White,
                    onChange: (e) => {
                      setPlayerColor(
                        e.target.checked ? Color.White : Color.Black
                      );
                    }
                  }
                ),
                label: playerColor === Color.White ? "You play as White" : "You play as Black"
              }
            ) }),
            /* @__PURE__ */ jsx(FormControl, { fullWidth: true, children: /* @__PURE__ */ jsx(
              TextField,
              {
                label: "Optional starting position (FEN or PGN)",
                variant: "outlined",
                multiline: true,
                value: startingPositionInput,
                onChange: (e) => setStartingPositionInput(e.target.value)
              }
            ) }),
            parsingError && /* @__PURE__ */ jsx(FormControl, { fullWidth: true, children: /* @__PURE__ */ jsx(Typography, { color: "salmon", textAlign: "center", marginTop: 1, children: parsingError }) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(DialogActions, { sx: { m: 2 }, children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "outlined",
          sx: { marginRight: 2 },
          onClick: handleClose,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(Button, { variant: "contained", onClick: handleGameStart, children: "Start game" })
    ] })
  ] });
}
export {
  GameSettingsDialog as default
};

