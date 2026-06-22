import { jsx, jsxs } from "react/jsx-runtime";
import { Color } from "@analysis/types/enums";
import { Avatar, Grid, Stack, Typography } from "@mui/material";
import CapturedPieces from "./capturedPieces";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { getPaddedNumber } from "@analysis/lib/helpers";
function PlayerHeader({ color, player, gameAtom }) {
  const game = useAtomValue(gameAtom);
  const gameFen = game.fen();
  const clock = useMemo(() => {
    const turn = game.turn();
    if (turn === color) {
      const history = game.history({ verbose: true });
      const previousFen = history.at(-1)?.before;
      const comment2 = game.getComments().find(({ fen }) => fen === previousFen)?.comment;
      return getClock(comment2);
    }
    const comment = game.getComment();
    return getClock(comment);
  }, [game, color]);
  return /* @__PURE__ */ jsxs(
    Grid,
    {
      container: true,
      justifyContent: "space-between",
      alignItems: "center",
      size: 12,
      children: [
        /* @__PURE__ */ jsxs(Stack, { direction: "row", children: [
          /* @__PURE__ */ jsx(
            Avatar,
            {
              src: player.avatarUrl,
              alt: player.name,
              variant: "circular",
              sx: {
                width: 40,
                height: 40,
                backgroundColor: color === Color.White ? "white" : "black",
                color: color === Color.White ? "black" : "white",
                border: "1px solid black"
              },
              children: player.name[0].toUpperCase()
            }
          ),
          /* @__PURE__ */ jsxs(Stack, { marginLeft: 1, children: [
            /* @__PURE__ */ jsxs(Stack, { direction: "row", children: [
              /* @__PURE__ */ jsx(Typography, { fontSize: "0.9rem", children: player.name }),
              player.rating && /* @__PURE__ */ jsxs(Typography, { marginLeft: 0.5, fontSize: "0.9rem", fontWeight: "200", children: [
                "(",
                player.rating,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsx(CapturedPieces, { fen: gameFen, color })
          ] })
        ] }),
        clock && /* @__PURE__ */ jsxs(
          Typography,
          {
            align: "center",
            sx: {
              backgroundColor: color === Color.White ? "white" : "black",
              color: color === Color.White ? "black" : "white"
            },
            borderRadius: "5px",
            padding: 0.8,
            border: "1px solid #424242",
            width: "5rem",
            textAlign: "right",
            children: [
              clock.hours ? `${clock.hours}:` : "",
              getPaddedNumber(clock.minutes),
              ":",
              getPaddedNumber(clock.seconds),
              clock.hours || clock.minutes || clock.seconds > 20 ? "" : `.${clock.tenths}`
            ]
          }
        )
      ]
    }
  );
}
const getClock = (comment) => {
  if (!comment) return void 0;
  const match = comment.match(/\[%clk (\d+):(\d+):(\d+)(?:\.(\d*))?\]/);
  if (!match) return void 0;
  return {
    hours: parseInt(match[1]),
    minutes: parseInt(match[2]),
    seconds: parseInt(match[3]),
    tenths: match[4] ? parseInt(match[4]) : 0
  };
};
export {
  PlayerHeader as default
};

