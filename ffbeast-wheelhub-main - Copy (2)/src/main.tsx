import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { initStoreCoordinator } from "./stores";

const cleanup = initStoreCoordinator();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanup();
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
