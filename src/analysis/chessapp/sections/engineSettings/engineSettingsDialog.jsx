import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import Slider from "@analysis/components/slider";
import { EngineName } from "@analysis/types/enums";
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
  Box,
  useTheme
} from "@mui/material";
import {
  engineNameAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  engineWorkersNbAtom
} from "../analysis/states";
import ArrowOptions from "./arrowOptions";
import { useAtomLocalStorage } from "@analysis/hooks/useAtomLocalStorage";
import { useEffect } from "react";
import { isEngineSupported } from "@/shared/chess/stockfish/shared";
import { Stockfish16_1 } from "@/shared/chess/stockfish/stockfish16_1";
import { useAtom } from "jotai";
import { boardHueAtom, pieceSetAtom } from "@analysis/components/board/states";
import Image from "@analysis/shims/image";
import {
  DEFAULT_ENGINE,
  ENGINE_LABELS,
  PIECE_SETS,
  STRONGEST_ENGINE
} from "@analysis/constants";
import { getRecommendedWorkersNb } from "@/shared/chess/stockfish/worker";
import { toPublicPath } from "@/utils/assetPath";
function EngineSettingsDialog({ open, onClose }) {
  const [depth, setDepth] = useAtomLocalStorage(
    "engine-depth",
    engineDepthAtom
  );
  const [multiPv, setMultiPv] = useAtomLocalStorage(
    "engine-multi-pv",
    engineMultiPvAtom
  );
  const [engineName, setEngineName] = useAtomLocalStorage(
    "engine-name",
    engineNameAtom
  );
  const [boardHue, setBoardHue] = useAtom(boardHueAtom);
  const [pieceSet, setPieceSet] = useAtom(pieceSetAtom);
  const [engineWorkersNb, setEngineWorkersNb] = useAtom(engineWorkersNbAtom);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  useEffect(() => {
    if (!isEngineSupported(engineName)) {
      if (Stockfish16_1.isSupported()) {
        setEngineName(EngineName.Stockfish16_1Lite);
      } else {
        setEngineName(EngineName.Stockfish11);
      }
    }
  }, [setEngineName, engineName]);
  return /* @__PURE__ */ jsxs(Dialog, { open, onClose, maxWidth: "md", fullWidth: true, children: [
    /* @__PURE__ */ jsx(DialogTitle, { variant: "h5", sx: { paddingBottom: 1 }, children: "Settings" }),
    /* @__PURE__ */ jsx(DialogContent, { sx: { paddingBottom: 0 }, children: /* @__PURE__ */ jsxs(
      Grid,
      {
        container: true,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 1,
        spacing: 3,
        size: 12,
        children: [
          /* @__PURE__ */ jsx(
            Grid,
            {
              container: true,
              justifyContent: "center",
              size: { xs: 12, sm: 7, md: 8 },
              children: /* @__PURE__ */ jsxs(Typography, { variant: "body2", children: [
                ENGINE_LABELS[DEFAULT_ENGINE].small,
                " is the default engine if your device support its requirements. It offers the best balance between speed and strength.",
                " ",
                ENGINE_LABELS[STRONGEST_ENGINE].small,
                " is the strongest engine available, note that it requires a one time download of",
                " ",
                ENGINE_LABELS[STRONGEST_ENGINE].sizeMb,
                "MB and is much more compute intensive."
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            Grid,
            {
              container: true,
              justifyContent: "center",
              size: { xs: 12, sm: 5, md: 4 },
              children: /* @__PURE__ */ jsxs(FormControl, { variant: "outlined", children: [
                /* @__PURE__ */ jsx(InputLabel, { id: "dialog-select-label", children: "Engine" }),
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
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            Slider,
            {
              label: "Maximum depth",
              value: depth,
              setValue: setDepth,
              min: 10,
              max: 30,
              marksFilter: 2
            }
          ),
          /* @__PURE__ */ jsx(
            Slider,
            {
              label: "Number of lines",
              value: multiPv,
              setValue: setMultiPv,
              min: 2,
              max: 6,
              marksFilter: 1,
              size: 6
            }
          ),
          /* @__PURE__ */ jsx(ArrowOptions, {}),
          /* @__PURE__ */ jsx(
            Grid,
            {
              container: true,
              justifyContent: "center",
              size: { xs: 12, sm: 8, md: 9 },
              children: /* @__PURE__ */ jsx(
                Slider,
                {
                  label: "Board hue",
                  value: boardHue,
                  setValue: setBoardHue,
                  min: 0,
                  max: 360
                }
              )
            }
          ),
          /* @__PURE__ */ jsx(
            Grid,
            {
              container: true,
              justifyContent: "center",
              alignItems: "center",
              size: { xs: 12, sm: 4, md: 3 },
              children: /* @__PURE__ */ jsxs(FormControl, { variant: "outlined", children: [
                /* @__PURE__ */ jsx(InputLabel, { id: "dialog-select-label", children: "Piece set" }),
                /* @__PURE__ */ jsx(
                  Select,
                  {
                    labelId: "dialog-select-label",
                    id: "dialog-select",
                    displayEmpty: true,
                    input: /* @__PURE__ */ jsx(OutlinedInput, { label: "Piece set" }),
                    value: pieceSet,
                    onChange: (e) => setPieceSet(e.target.value),
                    sx: { width: 200, maxWidth: "100%" },
                    children: PIECE_SETS.map((name) => /* @__PURE__ */ jsx(MenuItem, { value: name, children: /* @__PURE__ */ jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [
                      /* @__PURE__ */ jsx(
                        Image,
                        {
                          loading: "lazy",
                          src: toPublicPath(`piece/${name}/${isDarkMode ? "w" : "b"}N.svg`),
                          alt: `${name} knight`,
                          width: 24,
                          height: 24
                        }
                      ),
                      name
                    ] }) }, name))
                  }
                )
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            Grid,
            {
              container: true,
              justifyContent: "center",
              alignItems: "center",
              size: { xs: 12, md: 11 },
              children: /* @__PURE__ */ jsx(
                Slider,
                {
                  label: "Number of threads",
                  value: engineWorkersNb,
                  setValue: setEngineWorkersNb,
                  min: 1,
                  max: 12,
                  marksFilter: 1,
                  infoContent: /* @__PURE__ */ jsxs(Fragment, { children: [
                    "More threads means faster analysis, but only if your device can handle them, otherwise it may have the opposite effect. The estimated optimal value for your device is",
                    " ",
                    getRecommendedWorkersNb(),
                    ". Due to privacy restrictions in some browsers, this value might be underestimated. Don't hesitate to try different values to find the best one for your device."
                  ] })
                }
              )
            }
          )
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(DialogActions, { sx: { m: 1 }, children: /* @__PURE__ */ jsx(Button, { variant: "contained", onClick: onClose, children: "Close" }) })
  ] });
}
export {
  EngineSettingsDialog as default
};

