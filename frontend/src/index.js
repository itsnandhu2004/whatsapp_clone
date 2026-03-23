import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Suppress known benign ResizeObserver errors in development (specifically from emoji-picker-react)
const _ResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
  constructor(callback) {
    super((entries, observer) => {
      window.requestAnimationFrame(() => {
        callback(entries, observer);
      });
    });
  }
};

window.addEventListener("error", (e) => {
  if (
    e.message === "ResizeObserver loop limit exceeded" ||
    e.message === "ResizeObserver loop completed with undelivered notifications."
  ) {
    const resizeObserverErrDiv = document.getElementById(
      "webpack-dev-server-client-overlay-div"
    );
    const resizeObserverErr = document.getElementById(
      "webpack-dev-server-client-overlay"
    );
    if (resizeObserverErr) resizeObserverErr.setAttribute("style", "display: none");
    if (resizeObserverErrDiv) resizeObserverErrDiv.setAttribute("style", "display: none");
    e.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
