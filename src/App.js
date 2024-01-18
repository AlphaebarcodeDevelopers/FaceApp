import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import "./style.css";
import Alphalabels from "./member";
import doneImage from "./assets/done.png";
import ProgressBar from "react-bootstrap/ProgressBar";
import "bootstrap/dist/css/bootstrap.min.css";
let isApiCall = false;
let detectCount = 0;

const App = () => {
  let prevName = "";
  const webcamRef = useRef(null);
  let infoBox = "";
  const [now, setNow] = useState(0);

  useEffect(() => {
    detectCount = 0;
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

  // To Store Data in Server First Time...

  // const storageData = await getLabeledFaceDescriptionsFirst()
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
      infoBox = document.createElement("div");
      infoBox.style.position = "fixed";
      infoBox.style.bottom = "50%";
      infoBox.style.left = "50%";
      infoBox.style.transform = "translateX(-50%)";
      infoBox.style.backgroundColor = "rgba(255, 255, 255)";
      infoBox.style.padding = "10px";
      infoBox.style.border = "2px solid black";
      infoBox.style.height = "10%";

      setInterval(async () => {
        if (!isApiCall) {
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
            if (1 - distance > 0.6) {
              if (label == prevName) {
                detectCount++;
              } else {
                detectCount = 0;
                setNow(0);
              }
              prevName = label;
              setNow(Math.round(((detectCount + 1) / 3) * 100));
              if (detectCount >= 3) {
                detectCount = 0;
                isApiCall = true;
                setNow(0);

                infoBox.innerHTML = `Name: ${label} <br> Accuracy: ${(
                  1 - distance
                ).toFixed(
                  2
                )} <br><img src=${doneImage}  width="30" height="30"> <strong>Attendance Marked</strong>`;

                if (!infoBox.parentNode) {
                  document.body.appendChild(infoBox);
                }
                DialogClose();
                return true;
              } else {
                // console.log("====================================");
                // console.log("Label = ", label, "    COunt = ", detectCount);
                // console.log("====================================");
              }

              return false;
            }
          });
        }
      }, 1000);
    }
  };

  const DialogClose = () => {
    setTimeout(() => {
      infoBox.innerHTML = "";
      if (infoBox.parentNode) {
        infoBox.parentNode.removeChild(infoBox);
      }
      isApiCall = false;
    }, 3000);
  };

  return (
    <div>
      <Webcam ref={webcamRef} width={600} height={450} mirrored={true} />
      <ProgressBar animated now={now} label={`${now}%`} />
    </div>
  );
};

export default App;
