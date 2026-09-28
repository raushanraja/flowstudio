/**
 * Simulation Video Recorder for FlowStudio
 * Records canvas SVG simulation playback directly to WebM video using HTML5 Canvas captureStream & MediaRecorder.
 */

export function isRecordingSupported() {
  return (
    typeof window !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

export class SimulationRecorder {
  constructor(svgElement, options = {}) {
    this.svgElement = svgElement;
    this.fps = options.fps || 25;
    this.bgColor = options.bgColor || "#0f172a";
    this.onTick = options.onTick || null;
    this.onComplete = options.onComplete || null;
    this.onError = options.onError || null;

    this.mediaRecorder = null;
    this.stream = null;
    this.canvas = null;
    this.ctx = null;
    this.chunks = [];
    this.intervalId = null;
    this.timerId = null;
    this.isRecording = false;
    this.startTime = 0;
    this.durationSec = 0;
    this.width = 1200;
    this.height = 800;
  }

  start() {
    if (!isRecordingSupported()) {
      const err = new Error("Video recording is not supported in this browser.");
      if (this.onError) this.onError(err);
      throw err;
    }
    if (!this.svgElement) {
      const err = new Error("SVG element not found for recording.");
      if (this.onError) this.onError(err);
      throw err;
    }

    const rect = this.svgElement.getBoundingClientRect();
    this.width = Math.round(rect.width) || 1200;
    this.height = Math.round(rect.height) || 800;

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: false });

    if (this.ctx) {
      this.ctx.fillStyle = this.bgColor;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    try {
      this.stream = this.canvas.captureStream(this.fps);
    } catch (e) {
      if (this.onError) this.onError(e);
      throw e;
    }

    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];
    let selectedMime = "";
    for (const m of candidates) {
      if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(m)) {
        selectedMime = m;
        break;
      }
    }

    try {
      this.mediaRecorder = new MediaRecorder(
        this.stream,
        selectedMime ? { mimeType: selectedMime } : undefined,
      );
    } catch {
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    this.chunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start(250);
    this.isRecording = true;
    this.startTime = Date.now();
    this.durationSec = 0;

    if (this.onTick) this.onTick(0);

    this.timerId = setInterval(() => {
      if (!this.isRecording) return;
      this.durationSec = Math.round((Date.now() - this.startTime) / 1000);
      if (this.onTick) this.onTick(this.durationSec);
      if (this.durationSec >= 180) {
        this.stop();
      }
    }, 1000);

    let isCapturing = false;
    const frameInterval = Math.round(1000 / this.fps);

    this.intervalId = setInterval(() => {
      if (isCapturing || !this.isRecording || !this.svgElement || !this.ctx) return;
      isCapturing = true;

      try {
        const clone = this.svgElement.cloneNode(true);
        clone.setAttribute("width", this.width);
        clone.setAttribute("height", this.height);
        clone.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);

        const xml = new XMLSerializer().serializeToString(clone);
        const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
          if (this.ctx && this.isRecording) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.drawImage(img, 0, 0, this.width, this.height);
          }
          URL.revokeObjectURL(url);
          isCapturing = false;
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          isCapturing = false;
        };

        img.src = url;
      } catch {
        isCapturing = false;
      }
    }, frameInterval);
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.isRecording) {
        resolve(null);
        return;
      }

      this.isRecording = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }

      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.onstop = () => {
          const type = this.mediaRecorder?.mimeType || "video/webm";
          const blob = new Blob(this.chunks, { type });
          this.chunks = [];
          if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
          }
          if (this.onComplete) this.onComplete(blob);
          resolve(blob);
        };
        try {
          this.mediaRecorder.stop();
        } catch {
          resolve(null);
        }
      } else {
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }
        resolve(null);
      }
    });
  }
}
