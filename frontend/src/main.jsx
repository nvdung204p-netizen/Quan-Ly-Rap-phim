import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./assets/styles/styles.css";
import "./assets/styles/booking.css";
import "./assets/styles/pages.css";
import "./assets/styles/content.css";
import "./assets/styles/phong-chieu.css";
import "./assets/styles/membership.css";




createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
