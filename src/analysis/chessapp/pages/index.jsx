import { jsx, jsxs } from "react/jsx-runtime";
import Board from "@analysis/sections/analysis/board";
import PanelHeader from "@analysis/sections/analysis/panelHeader";
import PanelToolBar from "@analysis/sections/analysis/panelToolbar";
import AnalysisTab from "@analysis/sections/analysis/panelBody/analysisTab";
import ClassificationTab from "@analysis/sections/analysis/panelBody/classificationTab";
import { boardAtom, gameAtom, gameEvalAtom } from "@analysis/sections/analysis/states";
import {
  Button,
  Box,
  Divider,
  Grid,
  Tab,
  Tabs
} from "@mui/material";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import EngineSettingsButton from "@analysis/sections/engineSettings/engineSettingsButton";
import GraphTab from "@analysis/sections/analysis/panelBody/graphTab";
import { PageTitle } from "@analysis/components/pageTitle";
function GameAnalysis() {
  const [tab, setTab] = useState(0);
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const tabPanelSx = {
    width: "100%",
    minHeight: 0,
    flex: 1,
    overflowY: "auto",
    paddingRight: { xs: 0.25, sm: 0.75 },
    scrollbarWidth: "thin",
    "&::-webkit-scrollbar": {
      width: "0.45rem"
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(34, 211, 238, 0.45)",
      borderRadius: "999px"
    }
  };
  const analysisMenuSx = {
    background: "linear-gradient(164deg, rgba(5, 18, 29, 0.96) 0%, rgba(12, 55, 85, 0.86) 44%, rgba(13, 69, 72, 0.82) 100%)",
    borderColor: "rgba(103, 232, 249, 0.5)",
    borderWidth: 1,
    boxShadow: "0 14px 46px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)"
  };
  const tabListSx = {
    minHeight: 0,
    "& .MuiTabs-indicator": {
      backgroundColor: "#22d3ee",
      height: 3,
      borderRadius: 1
    }
  };
  const tabSx = {
    textTransform: "none",
    minHeight: 15,
    padding: "5px 0em 12px",
    color: "rgba(207, 250, 254, 0.72)",
    "&.Mui-selected": {
      color: "#ecfeff"
    }
  };
  const showMovesTab = game.history().length > 0 || board.history().length > 0;
  useEffect(() => {
    if (tab === 1 && !showMovesTab) setTab(0);
    if (tab === 2 && !gameEval) setTab(0);
  }, [showMovesTab, gameEval, tab]);
  return /* @__PURE__ */ jsxs(Grid, { container: true, gap: 2, justifyContent: "center", alignItems: "start", sx: { width: "100%", maxWidth: "1360px", marginX: "auto", minHeight: "100%", py: { xs: 1, md: 1.5 }, px: { xs: 1, sm: 1.5 }, overflowY: "auto", overflowX: "hidden", boxSizing: "border-box", paddingBottom: { xs: 2.5, md: 1.5 } }, children: [
    /* @__PURE__ */ jsx(PageTitle, { title: "Chesskit Game Analysis" }),
    /* @__PURE__ */ jsx(
      Grid,
      {
        container: true,
        size: 12,
        justifyContent: "flex-end",
        children: /* @__PURE__ */ jsx(
          Button,
          {
            size: "small",
            variant: "outlined",
            onClick: () => {
              window.location.assign("/");
            },
            startIcon: /* @__PURE__ */ jsx(Icon, { icon: "ri:play-fill", height: 16 }),
            sx: {
              borderColor: "rgba(103, 232, 249, 0.65)",
              color: "#ecfeff",
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              '&:hover': {
                borderColor: "#67e8f9",
                backgroundColor: "rgba(34, 211, 238, 0.24)"
              }
            },
            children: "Go to Play"
          }
        )
      }
    ),
    /* @__PURE__ */ jsx(Board, {}),
    /* @__PURE__ */ jsxs(
      Grid,
      {
        container: true,
        justifyContent: "start",
        alignItems: "stretch",
        borderRadius: 3,
        border: 1,
        borderColor: "rgba(103, 232, 249, 0.4)",
        sx: analysisMenuSx,
        padding: { xs: 1, sm: 1.25, md: 1.5 },
        style: {
          maxWidth: "1200px"
        },
        rowGap: 1.25,
        minHeight: { xs: "27rem", lg: "40rem" },
        maxHeight: { xs: "76vh", lg: "82vh" },
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flexWrap: "nowrap",
        size: {
          xs: 12,
          lg: "grow"
        },
        children: [
          /* @__PURE__ */ jsxs(Box, { width: "100%", children: [
            /* @__PURE__ */ jsx(PanelHeader, {}, "analysis-panel-header"),
            /* @__PURE__ */ jsx(Divider, { sx: { marginX: "3%", marginTop: 1.25, borderColor: "rgba(34, 211, 238, 0.38)" } })
          ] }),
          /* @__PURE__ */ jsx(
            Box,
            {
              width: "100%",
              sx: {
                borderBottom: 1,
                borderColor: "rgba(34, 211, 238, 0.35)",
                marginX: { sm: "3%", xs: 0 },
                paddingX: { xs: 0.35, sm: 0.5 }
              },
              children: /* @__PURE__ */ jsxs(
                Tabs,
                {
                  value: tab,
                  onChange: (_, newValue) => setTab(newValue),
                  "aria-label": "basic tabs example",
                  variant: "fullWidth",
                  sx: tabListSx,
                  children: [
                    /* @__PURE__ */ jsx(
                      Tab,
                      {
                        label: "Analysis",
                        id: "tab0",
                        icon: /* @__PURE__ */ jsx(Icon, { icon: "mdi:magnify", height: 15 }),
                        iconPosition: "start",
                        sx: tabSx,
                        disableFocusRipple: true
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Tab,
                      {
                        label: "Moves",
                        id: "tab1",
                        icon: /* @__PURE__ */ jsx(Icon, { icon: "mdi:format-list-bulleted", height: 15 }),
                        iconPosition: "start",
                        sx: {
                          ...tabSx,
                          display: showMovesTab ? void 0 : "none",
                          padding: tabSx.padding
                        },
                        disableFocusRipple: true
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Tab,
                      {
                        label: "Graph",
                        id: "tab2",
                        icon: /* @__PURE__ */ jsx(Icon, { icon: "mdi:chart-line", height: 15 }),
                        iconPosition: "start",
                        sx: {
                          ...tabSx,
                          display: gameEval ? void 0 : "none",
                          padding: tabSx.padding
                        },
                        disableFocusRipple: true
                      }
                    )
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs(Box, { sx: tabPanelSx, children: [
            /* @__PURE__ */ jsx(
              AnalysisTab,
              {
                role: "tabpanel",
                hidden: tab !== 0,
                id: "tabContent0"
              }
            ),
            /* @__PURE__ */ jsx(
              ClassificationTab,
              {
                role: "tabpanel",
                hidden: tab !== 1,
                id: "tabContent1"
              }
            ),
            /* @__PURE__ */ jsx(
              GraphTab,
              {
                role: "tabpanel",
                hidden: tab !== 2,
                id: "tabContent2"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(Box, { width: "100%", children: [
            /* @__PURE__ */ jsx(Divider, { sx: { marginX: "3%", marginBottom: 1, borderColor: "rgba(34, 211, 238, 0.45)" } }),
            /* @__PURE__ */ jsx(PanelToolBar, {}, "review-panel-toolbar")
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx(EngineSettingsButton, {})
  ] });
}
export {
  GameAnalysis as default
};

