// // import { useEffect, useRef, useState } from "react";

// import * as faceapi from "face-api.js";
// import FaceDetectionComponent from "./FaceDetectionComponent";
// import { useEffect } from "react";

// function App() {
//   // const [imageFile1, setImageFile1] = useState(null);
//   // const [imageFile2, setImageFile2] = useState(null);
//   // const [result, setResult] = useState("");

//   // const handleFileChange = (event, setImageFile) => {
//   //   const file = event.target.files[0];
//   //   setImageFile(file);
//   // };

//   // useEffect(() => {
//   //   const getModel = async () => {
//   //     await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
//   //     await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
//   //     await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
//   //     await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
//   //     await faceapi.nets.faceExpressionNet.loadFromUri("/models");
//   //   };
//   //   getModel();
//   // }, []);

//   // const compareFaces = async () => {
//   //   try {
//   //     // Check if the models are loaded

//   //     if (
//   //       !faceapi.nets.tinyFaceDetector.params ||
//   //       !faceapi.nets.faceLandmark68Net.params ||
//   //       !faceapi.nets.faceRecognitionNet.params ||
//   //       !faceapi.nets.ssdMobilenetv1.params
//   //     ) {
//   //       // Models are not yet loaded, display a message or return
//   //       console.warn("Models are not loaded yet.");
//   //       return;
//   //     }

//   //     // Read image files
//   //     const image1 = await faceapi.bufferToImage(imageFile1);
//   //     const image2 = await faceapi.bufferToImage(imageFile2);
//   //     const faces = await faceapi.detectAllFaces(image1);
//   //     console.log("Img 1 : ", JSON.stringify(faces));
//   //     // Detect faces
//   //     const face1 = await faceapi
//   //       .detectSingleFace(image1)
//   //       .withFaceLandmarks()
//   //       .withFaceDescriptor();
//   //     const face2 = await faceapi
//   //       .detectSingleFace(image2)
//   //       .withFaceLandmarks()
//   //       .withFaceDescriptor();

//   //     // Compare faces
//   //     const distance = faceapi.euclideanDistance(
//   //       face1.descriptor,
//   //       face2.descriptor
//   //     );

//   //     // Set result
//   //     setResult(`Face similarity: ${1 - distance.toFixed(4)}`);
//   //   } catch (error) {
//   //     console.error("Error:", error);
//   //     setResult("An error occurred. Please try again.");
//   //   }
//   // };

//   return (
//     <>
//       <h1>Face Comparison</h1>
//       <div>
//         <FaceDetectionComponent />
//       </div>

//       {/* <div>
//         <label>Image 1:</label>
//         <input
//           type="file"
//           onChange={(e) => handleFileChange(e, setImageFile1)}
//         />
//       </div>
//       <div>
//         <label>Image 2:</label>
//         <input
//           type="file"
//           onChange={(e) => handleFileChange(e, setImageFile2)}
//         />
//       </div>
//       <button onClick={compareFaces}>Compare Faces</button>

//       <div>
//         <p>{result}</p>
//       </div> */}
//     </>
//   );
// }

// export default App;
import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import "./style.css";
const App = () => {
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
    const labels = [
      "Rohit",
      "Ronak",
      "Mayur",
      "Dhaval",
      "Bhavik",
      "Mayur",
      "Mansi",
      "Nikul",
    ];
    return Promise.all(
      labels.map(async (label) => {
        const descriptions = [];
        for (let i = 1; i <= 2; i++) {
          const img = await faceapi.fetchImage(
            require(`./labels/${label}/${i}.png`)
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
          .withFaceDescriptors(true);

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        canvas.willReadFrequently = true;
        const results = resizedDetections.map((d) => {
          return faceMatcher.findBestMatch(d.descriptor);
        });

        results.some(({ label, distance }, i) => {
          const box = resizedDetections[i].detection.box;
          if (1 - distance > 0.3) {
            const drawBox = new faceapi.draw.DrawBox(box, {
              label: label.toString() + "  " + (1 - distance).toFixed(2),
            });

            drawBox.draw(canvas);
            return true;
          }
          return false;
        });
      }, 500);
    }
  };

  return (
    <div>
      <Webcam ref={webcamRef} width={600} height={450} />
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default App;
