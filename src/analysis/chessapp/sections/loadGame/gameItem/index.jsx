import { jsx, jsxs } from "react/jsx-runtime";
import {
  ListItem,
  ListItemText,
  Typography,
  Box,
  useTheme
} from "@mui/material";
import TimeControlChip from "./timeControlChip";
import MovesNbChip from "./movesNbChip";
import DateChip from "./dateChip";
import GameResultChip from "./gameResultChip";
const GameItem = ({
  game,
  onClick,
  perspectiveUserColor
}) => {
  const theme = useTheme();
  const { white, black, result, timeControl, date, movesNb } = game;
  const whiteWon = result === "1-0";
  const blackWon = result === "0-1";
  return /* @__PURE__ */ jsx(
    ListItem,
    {
      alignItems: "flex-start",
      sx: {
        borderRadius: 2,
        mb: 1.5,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
          boxShadow: theme.shadows[3]
        },
        border: `1px solid ${theme.palette.divider}`,
        cursor: "pointer"
      },
      onClick,
      children: /* @__PURE__ */ jsx(
        ListItemText,
        {
          disableTypography: true,
          primary: /* @__PURE__ */ jsxs(
            Box,
            {
              sx: {
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, sm: 1.5 },
                mb: 1
              },
              children: [
                /* @__PURE__ */ jsxs(
                  Typography,
                  {
                    variant: "subtitle1",
                    component: "span",
                    noWrap: true,
                    sx: {
                      fontWeight: "700",
                      color: whiteWon ? theme.palette.success.main : theme.palette.text.primary,
                      opacity: whiteWon ? 1 : blackWon ? 0.7 : 0.8
                    },
                    children: [
                      formatPlayerName(white),
                      " (",
                      white.rating,
                      ")"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  Typography,
                  {
                    variant: "body2",
                    component: "span",
                    sx: {
                      color: theme.palette.text.secondary,
                      fontWeight: "500"
                    },
                    children: "vs"
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Typography,
                  {
                    variant: "subtitle1",
                    component: "span",
                    noWrap: true,
                    sx: {
                      fontWeight: "700",
                      color: blackWon ? theme.palette.success.main : theme.palette.text.primary,
                      opacity: blackWon ? 1 : whiteWon ? 0.7 : 0.8
                    },
                    children: [
                      formatPlayerName(black),
                      " (",
                      black.rating,
                      ")"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  GameResultChip,
                  {
                    result,
                    perspectiveUserColor
                  }
                )
              ]
            }
          ),
          secondary: /* @__PURE__ */ jsxs(
            Box,
            {
              sx: {
                display: "flex",
                gap: 1,
                alignItems: "center"
              },
              children: [
                /* @__PURE__ */ jsx(TimeControlChip, { timeControl }),
                /* @__PURE__ */ jsx(MovesNbChip, { movesNb }),
                /* @__PURE__ */ jsx(DateChip, { date })
              ]
            }
          )
        }
      )
    }
  );
};
const formatPlayerName = (player) => {
  return player.title ? `${player.title} ${player.name}` : player.name;
};
export {
  GameItem
};
