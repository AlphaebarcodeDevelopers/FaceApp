import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import "./style.css";
const FaceDetectionComponent = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (webcamRef.current) {
        webcamRef.current.video.srcObject = stream;

        // Wait for the video to load metadata (dimensions)
        await new Promise((resolve) => {
          webcamRef.current.video.onloadedmetadata = () => {
            resolve();
          };
        });

        // Ensure that the video dimensions are set
        const displaySize = {
          width: webcamRef.current.video.videoWidth,
          height: webcamRef.current.video.videoHeight,
        };

        // Update canvas dimensions to match video dimensions
        canvasRef.current.width = displaySize.width;
        canvasRef.current.height = displaySize.height;

        return Promise.resolve(); // Resolve the promise after successful setup
      } else {
        return Promise.reject("Webcam element not found");
      }
    } catch (error) {
      console.error("Error accessing the camera:", error);
      return Promise.reject(error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      await startWebcam();
      setupFaceDetection();
      console.log("call ");
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      // Handle the error (e.g., display a message to the user)
    }
  };

  useEffect(() => {
    // Initialize face-api.js
    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    ]).then(() => {
      // Start webcam and set up face detection
      requestCameraPermission();
    });
  }, []); // Empty dependency array to run the effect only once on mount

  const getLabeledFaceDescriptions = async () => {
    const labels = ["Rohit"];
    return Promise.all(
      labels.map(async (label) => {
        const descriptions = [];
        for (let i = 1; i < 2; i++) {
          const img = await faceapi.fetchImage(
            require(`./labels/${label}.png`)
          );
          const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
          descriptions.push(detections.descriptor);
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      })
    );
  };

  const setupFaceDetection = async () => {
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    if (webcamRef.current && canvasRef.current) {
      const canvas = faceapi.createCanvasFromMedia(webcamRef.current.video);
      document.body.append(canvas);
      const displaySize = {
        width: webcamRef.current.video.videoWidth,
        height: webcamRef.current.video.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(webcamRef.current.video)
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        canvas.willReadFrequently = true;
        const results = resizedDetections.map((d) => {
          return faceMatcher.findBestMatch(d.descriptor);
        });
        results.forEach((result, i) => {
          const box = resizedDetections[i].detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: result.toString(),
          });
          drawBox.draw(canvas);
        });
      }, 100);
    }
  };

  return (
    <div>
      {/* <button onClick={requestCameraPermission}>
        Request Camera Permission
      </button> */}
      <Webcam ref={webcamRef} width={600} height={450} />
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default FaceDetectionComponent;
