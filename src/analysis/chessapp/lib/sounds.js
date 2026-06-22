let audioContext = null;
const soundsCache = /* @__PURE__ */ new Map();
const loadingPromises = /* @__PURE__ */ new Map();
const getBaseUrl = () => {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
};

const soundPath = (fileName) => `${getBaseUrl()}sounds/${fileName}`;

const soundUrls = {
  move: soundPath("move-self.mp3"),
  capture: soundPath("capture.mp3"),
  illegalMove: soundPath("illegal.mp3"),
  check: soundPath("move-check.mp3"),
  castle: soundPath("castle.mp3"),
  promotion: soundPath("promote.mp3")
};
const getAudioBuffer = async (sound) => {
  const url = soundUrls[sound];
  if (!url) return null;
  const cached = soundsCache.get(url);
  if (cached) return cached;
  const existingLoad = loadingPromises.get(url);
  if (existingLoad) return existingLoad;
  const loadPromise = (async () => {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    const buffer = await audioContext.decodeAudioData(data);
    soundsCache.set(url, buffer);
    loadingPromises.delete(url);
    return buffer;
  })().catch((error) => {
    loadingPromises.delete(url);
    soundsCache.delete(url);
    throw error;
  });
  loadingPromises.set(url, loadPromise);
  return loadPromise;
};
const play = async (sound) => {
  try {
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === "suspended") await audioContext.resume();
    const audioBuffer = await getAudioBuffer(sound);
    if (!audioBuffer) return;
    const audioSrc = audioContext.createBufferSource();
    audioSrc.buffer = audioBuffer;
    const volume = audioContext.createGain();
    volume.gain.value = 0.3;
    audioSrc.connect(volume);
    volume.connect(audioContext.destination);
    audioSrc.start(0);
  } catch {
    const url = soundUrls[sound];
    if (url) {
      soundsCache.delete(url);
      loadingPromises.delete(url);
    }
  }
};
const playCaptureSound = () => play("capture");
const playCastleSound = () => play("castle");
const playCheckSound = () => play("check");
const playIllegalMoveSound = () => play("illegalMove");
const playMoveSound = () => play("move");
const playPromotionSound = () => play("promotion");
const playSoundFromMove = (move) => {
  if (!move) return playIllegalMoveSound();

  const flags = String(move.flags || "");
  const san = String(move.san || "");
  const isCheck = san.includes("+") || san.includes("#");

  if (isCheck) return playCheckSound();
  if (flags.includes("k") || flags.includes("q")) return playCastleSound();
  if (move.promotion) return playPromotionSound();
  if (move.captured) return playCaptureSound();
  return playMoveSound();
};
export {
  play,
  playCastleSound,
  playCaptureSound,
  playCheckSound,
  playIllegalMoveSound,
  playMoveSound,
  playPromotionSound,
  playSoundFromMove
};
