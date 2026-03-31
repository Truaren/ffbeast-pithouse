import "./styles/global.scss";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { patchLibrary } from "@/utils/library-patch";

import App from "./App";
import { initStoreCoordinator } from "./stores";

patchLibrary();

const cleanup = initStoreCoordinator();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanup();
  });
}

window.addEventListener("beforeunload", cleanup);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
