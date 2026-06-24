import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Room from "./pages/Room";

import { RoomProvider } from "./context/RoomContext";

import "./index.css";   // CSS variables + reset (must be first)
import "./App.css";     // Room UI component styles

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <RoomProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </RoomProvider>
  </BrowserRouter>
);