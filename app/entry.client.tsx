import React from "react";
import ReactDOM from "react-dom/client";
import { HydratedRouter } from "react-router-dom";

ReactDOM.hydrateRoot(
  document, // Hydrate the whole document
  // <React.StrictMode>
  <HydratedRouter />,
  // </React.StrictMode>
);
