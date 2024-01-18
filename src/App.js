import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import "./style.css";
import Alphalabels from "./member";
const App = () => {
  const webcamRef = useRef(null);

  useEffect(() => {
    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    ]).then(() => {
      requestCameraPermission();
    });
  }, []);

  const requestCameraPermission = async () => {
    try {
      await startWebcam();
      setupFaceDetection();
    } catch (error) {
      console.error("Error requesting camera permission:", error);
    }
  };
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (webcamRef.current) {
        webcamRef.current.video.srcObject = stream;

        await new Promise((resolve) => {
          webcamRef.current.video.onloadedmetadata = () => {
            resolve();
          };
        });
        const displaySize = {
          width: webcamRef.current.video.videoWidth,
          height: webcamRef.current.video.videoHeight,
        };
        return Promise.resolve();
      } else {
        return Promise.reject("Webcam element not found");
      }
    } catch (error) {
      console.error("Error accessing the camera:", error);
      return Promise.reject(error);
    }
  };

  const getLabeledFaceDescriptionsFirst = async () => {
    return Promise.all(
      Alphalabels.labels.map(async (label) => {
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
  const getLabeledFaceDescriptionsSecond = async () => {
    return Promise.all(
      Alphalabels.labels.map(async (label, index) => {
        const rawDescriptors = Alphalabels.data[index].descriptors;
        let float32Descriptors = [];
        rawDescriptors.map((item, i) => {
          float32Descriptors[i] = new Float32Array([...item]);
        });
        return new faceapi.LabeledFaceDescriptors(label, float32Descriptors);
      })
    );
  };
  const getLabeledFaceDescriptionsUrl = async () => {
    const demoLabel1 = ["Ronak-Patel"];
    return Promise.all(
      demoLabel1.map(async (label, index) => {
        const descriptions = [];
        const image = await loadRandomImage();

        const detections = await faceapi
          .detectSingleFace(image)
          .withFaceLandmarks()
          .withFaceDescriptor();

        console.log("==detections==", detections);

        descriptions.push(detections.descriptor);

        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      })
    );
  };

  function loadRandomImage() {
    const image = new Image();
    image.crossOrigin = true;
    return new Promise((resolve, reject) => {
      image.addEventListener("error", (error) => reject(error));
      image.addEventListener("load", () => resolve(image));
      image.src =
        "https://www.alphaebarcode.com/images/team/HarshadLunagaria.png";
    });
  }

  const setupFaceDetection = async () => {
    const labeledFaceDescriptors = await getLabeledFaceDescriptionsSecond();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    if (webcamRef.current) {
      const displaySize = {
        width: webcamRef.current.video.videoWidth,
        height: webcamRef.current.video.videoHeight,
      };

      //Display Name Dialogue
      const infoBox = document.createElement("div");
      infoBox.style.position = "fixed";
      infoBox.style.bottom = "50%";
      infoBox.style.left = "50%";
      infoBox.style.transform = "translateX(-50%)";
      infoBox.style.backgroundColor = "rgba(255, 255, 255)";
      infoBox.style.padding = "10px";
      infoBox.style.border = "2px solid black";
      infoBox.style.height = "50px";

      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(webcamRef.current.video)
          .withFaceLandmarks()
          .withFaceDescriptors(true);

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        const results = resizedDetections.map((d) => {
          return faceMatcher.findBestMatch(d.descriptor);
        });

        results.some(({ label, distance }, i) => {
          if (1 - distance > 0.55) {
            infoBox.innerHTML = `Name: ${label}, Accuracy: ${(
              1 - distance
            ).toFixed(2)}`;

            if (!infoBox.parentNode) {
              document.body.appendChild(infoBox);
            }
            return true;
          }
          infoBox.innerHTML = "";
          if (infoBox.parentNode) {
            infoBox.parentNode.removeChild(infoBox);
          }
          return false;
        });
      }, 500);
    }
  };

  return (
    <div>
      <Webcam ref={webcamRef} width={600} height={450} />
    </div>
  );
};

export default App;
