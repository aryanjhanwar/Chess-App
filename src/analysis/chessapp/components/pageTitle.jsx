import { jsx, jsxs } from "react/jsx-runtime";
import Head from "@analysis/shims/head";
const PageTitle = ({ title }) => {
  return /* @__PURE__ */ jsxs(Head, { children: [
    /* @__PURE__ */ jsx("title", { children: title }),
    /* @__PURE__ */ jsx("meta", { property: "og:title", content: title })
  ] });
};
export {
  PageTitle
};
