import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx"; // Check this import

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* The ThemeProvider MUST wrap the App */}
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Router>
  </StrictMode>
);