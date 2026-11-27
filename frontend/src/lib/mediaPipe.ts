import { PoseState } from '../types';

export class AlignmentTracker {
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private animFrameId: number | null = null;
  private onStateChange: (state: PoseState) => void;

  constructor(onStateChange: (state: PoseState) => void) {
    this.onStateChange = onStateChange;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 160;
    this.canvas.height = 120;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  startTracking(video: HTMLVideoElement) {
    this.videoElement = video;
    this.loop();
  }

  private loop = () => {
    if (!this.videoElement || this.videoElement.paused || this.videoElement.ended) {
      this.animFrameId = requestAnimationFrame(this.loop);
      return;
    }

    if (this.ctx && this.videoElement.videoWidth > 0) {
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      const frameData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const pose = this.analyzeFrame(frameData);
      this.onStateChange(pose);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private analyzeFrame(imageData: ImageData): PoseState {
    const { width, height, data } = imageData;
    
    // Quick brightness & foreground skin/torso centroid analysis
    let totalBrightness = 0;
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let foregroundPixels = 0;

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;

        // Simple motion/contrast foreground estimation
        if (brightness > 45 && brightness < 235) {
          foregroundPixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const coverage = foregroundPixels / ((width * height) / 4);

    if (coverage < 0.15) {
      return {
        isPersonDetected: false,
        isAligned: false,
        guidanceText: 'Step into frame'
      };
    }

    // Person occupies too much of the screen (head/torso too close to camera)
    if (coverage > 0.72) {
      return {
        isPersonDetected: true,
        isAligned: false,
        guidanceText: 'Step back'
      };
    }

    // Centered and properly proportioned
    const centerX = (minX + maxX) / 2;
    const isCentered = Math.abs(centerX - width / 2) < width * 0.22;

    if (!isCentered) {
      return {
        isPersonDetected: true,
        isAligned: false,
        guidanceText: 'Center yourself'
      };
    }

    return {
      isPersonDetected: true,
      isAligned: true,
      guidanceText: 'Aligned'
    };
  }

  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
