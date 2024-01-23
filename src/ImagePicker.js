import React, { useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import frontImage from "./assets/front.png";

const ImagePicker = () => {
  const [front, setFront] = useState("");

  useEffect(() => {
    const loadmodel = async () => {
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    };
    loadmodel();
  }, []);

  const faceData = async (img) => {
    const image = new Image();
    image.crossOrigin = true;
    image.src = URL.createObjectURL(img);
    const detections = await faceapi
      .detectSingleFace(image)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detections.descriptor;
  };

  const handleChange = async (e) => {
    if (e.target.files.length) {
      setFront(URL.createObjectURL(e.target.files[0]));
      const face128Array = await faceData(e.target.files[0]);
      console.log("Face Data:", face128Array);
      //   alert(face128Array);
    }
  };
  const handleLongPress = () => {
    const userConfirmed = window.confirm(
      "Are you sure you want to remove the image?"
    );
    if (userConfirmed) {
      setFront(null);
    }
  };

  return (
    <div>
      <h1>Upload your Faces Here </h1>
      <div>
        <label htmlFor="upload-button">
          {front ? (
            <img
              src={front}
              alt="dummy"
              width="100"
              height="100"
              onContextMenu={handleLongPress}
            />
          ) : (
            <>
              <img src={frontImage} alt="dummy" width="100" height="100" />
              <h5 className="text-center">Front Face</h5>
            </>
          )}
        </label>
        {front ? (
          <div></div>
        ) : (
          <input
            type="file"
            accept="image/*"
            id="upload-button"
            style={{ display: "none" }}
            onChange={handleChange}
          />
        )}
      </div>
    </div>
  );
};

export default ImagePicker;
