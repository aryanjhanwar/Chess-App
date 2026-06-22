import { jsx, jsxs } from "react/jsx-runtime";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { useMemo } from "react";
import { red } from "@mui/material/colors";
import { useLocalStorage } from "@analysis/hooks/useLocalStorage";
import { MAIN_THEME_COLOR } from "@analysis/constants";
function Layout({ children }) {
  const [isDarkMode] = useLocalStorage("useDarkMode", true);
  const theme = useMemo(
    () => createTheme({
      palette: {
        mode: isDarkMode ? "dark" : "light",
        error: {
          main: red[400]
        },
        primary: {
          main: MAIN_THEME_COLOR
        },
        secondary: {
          main: isDarkMode ? "#424242" : "#ffffff"
        }
      }
    }),
    [isDarkMode]
  );
  if (isDarkMode === null) return null;
  return /* @__PURE__ */ jsxs(ThemeProvider, { theme, children: [
    /* @__PURE__ */ jsx(CssBaseline, {}),
    /* @__PURE__ */ jsx("main", { style: { margin: "1vh 1vw", minHeight: "calc(100vh - 2vh)", overflowY: "auto", overflowX: "hidden" }, children })
  ] });
}
export {
  Layout as default
};
