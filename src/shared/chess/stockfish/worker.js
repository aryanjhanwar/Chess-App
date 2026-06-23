import { isIosDevice, isMobileDevice } from './shared.js';
import { toPublicPath } from '@/utils/assetPath.js';

export const getEngineWorker = (enginePath) => {
  const worker = new Worker(toPublicPath(enginePath));

  const engineWorker = {
    isReady: false,
    uci: (command) => worker.postMessage(command),
    listen: () => null,
    terminate: () => worker.terminate(),
  };

  worker.onmessage = (event) => {
    engineWorker.listen(event.data);
  };

  return engineWorker;
};

export const sendCommandsToWorker = (
  worker,
  commands,
  finalMessage,
  onNewMessage
) => {
  return new Promise((resolve) => {
    const messages = [];

    worker.listen = (data) => {
      messages.push(data);
      onNewMessage?.(messages);

      if (typeof data === 'string' && data.startsWith(finalMessage)) {
        resolve(messages);
      }
    };

    for (const command of commands) {
      worker.uci(command);
    }
  });
};

export const getRecommendedWorkersNb = () => {
  const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
    ? navigator.hardwareConcurrency
    : 2;

  const maxWorkersNbFromThreads = Math.max(
    1,
    Math.round(cores - 4),
    Math.floor((cores * 2) / 3)
  );

  const maxWorkersNbFromMemory =
    typeof navigator !== 'undefined' &&
    'deviceMemory' in navigator &&
    typeof navigator.deviceMemory === 'number'
      ? Math.max(1, Math.round(navigator.deviceMemory))
      : 4;

  const maxWorkersNbFromDevice = isIosDevice() ? 2 : isMobileDevice() ? 4 : 8;

  return Math.min(
    maxWorkersNbFromThreads,
    maxWorkersNbFromMemory,
    maxWorkersNbFromDevice
  );
};
