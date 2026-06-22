import { isIosDevice, isMobileDevice } from "./shared";
const getEngineWorker = (enginePath) => {
  const worker = new window.Worker(enginePath);
  const engineWorker = {
    isReady: false,
    uci: (command) => worker.postMessage(command),
    listen: () => null,
    terminate: () => worker.terminate()
  };
  worker.onmessage = (event) => {
    engineWorker.listen(event.data);
  };
  return engineWorker;
};
const sendCommandsToWorker = (worker, commands, finalMessage, onNewMessage) => {
  return new Promise((resolve) => {
    const messages = [];
    worker.listen = (data) => {
      messages.push(data);
      onNewMessage?.(messages);
      if (data.startsWith(finalMessage)) {
        resolve(messages);
      }
    };
    for (const command of commands) {
      worker.uci(command);
    }
  });
};
const getRecommendedWorkersNb = () => {
  const maxWorkersNbFromThreads = Math.max(
    1,
    Math.round(navigator.hardwareConcurrency - 4),
    Math.floor(navigator.hardwareConcurrency * 2 / 3)
  );
  const maxWorkersNbFromMemory = "deviceMemory" in navigator && typeof navigator.deviceMemory === "number" ? Math.max(1, Math.round(navigator.deviceMemory)) : 4;
  const maxWorkersNbFromDevice = isIosDevice() ? 2 : isMobileDevice() ? 4 : 8;
  return Math.min(
    maxWorkersNbFromThreads,
    maxWorkersNbFromMemory,
    maxWorkersNbFromDevice
  );
};
export {
  getEngineWorker,
  getRecommendedWorkersNb,
  sendCommandsToWorker
};
