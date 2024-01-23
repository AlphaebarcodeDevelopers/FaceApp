import React from "react";
import "./App.css";
import FaceRecognition from "./FaceRecognition";
import ImagePicker from "./ImagePicker";
import { Route, Routes } from "react-router-dom";
const App = () => {
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<FaceRecognition />} />
        <Route path="/addface" element={<ImagePicker />} />
      </Routes>
    </div>
  );
};

export default App;
