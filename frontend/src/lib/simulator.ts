import { Garment } from '../types';

export class TryOnSimulator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private activeGarment: Garment | null = null;
  private timeOffset: number = 0;

  // Smoothed body tracking state
  private torsoCenterX: number = 320;
  private neckY: number = 190;
  private shoulderWidth: number = 320;
  private torsoHeight: number = 300;

  // Cached garment images
  private garmentImageCache: Map<string, HTMLImageElement> = new Map();
  private loadedImage: HTMLImageElement | null = null;

  // Face detector in Chrome
  private faceDetector: any = null;
  private isDetecting: boolean = false;
  private lastDetectTime: number = 0;

  // Small analysis canvas
  private smallCanvas: HTMLCanvasElement;
  private smallCtx: CanvasRenderingContext2D | null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 480;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;

    this.smallCanvas = document.createElement('canvas');
    this.smallCanvas.width = 160;
    this.smallCanvas.height = 120;
    this.smallCtx = this.smallCanvas.getContext('2d', { willReadFrequently: true });

    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        const FaceDetectorClass = (window as any).FaceDetector;
        this.faceDetector = new FaceDetectorClass({ fastMode: true, maxDetectedFaces: 1 });
      } catch (e) {
        this.faceDetector = null;
      }
    }
  }

  setGarment(garment: Garment) {
    this.activeGarment = garment;
    this.preloadGarmentImage(garment);
  }

  private preloadGarmentImage(garment: Garment) {
    if (this.garmentImageCache.has(garment.id)) {
      this.loadedImage = this.garmentImageCache.get(garment.id) || null;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.garmentImageCache.set(garment.id, img);
      if (this.activeGarment?.id === garment.id) {
        this.loadedImage = img;
      }
    };
    img.src = garment.imageUrl;
  }

  startSimulation(video: HTMLVideoElement): MediaStream {
    this.stop();

    const loop = () => {
      this.timeOffset += 0.04;
      if (video && !video.paused && !video.ended && video.videoWidth > 0) {
        if (this.canvas.width !== video.videoWidth || this.canvas.height !== video.videoHeight) {
          this.canvas.width = video.videoWidth;
          this.canvas.height = video.videoHeight;
          this.torsoCenterX = this.canvas.width * 0.5;
          this.neckY = this.canvas.height * 0.42;
          this.shoulderWidth = this.canvas.width * 0.58;
          this.torsoHeight = this.canvas.height * 0.58;
        }

        // Run person tracking every ~70ms
        const now = performance.now();
        if (now - this.lastDetectTime > 70 && !this.isDetecting) {
          this.lastDetectTime = now;
          this.trackUserBody(video);
        }

        // 1. Draw webcam base video frame
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

        // 2. Render virtual garment dynamic overlay if selected
        if (this.activeGarment) {
          this.renderVirtualGarment(this.activeGarment);
        }
      }
      this.animId = requestAnimationFrame(loop);
    };

    loop();
    return this.canvas.captureStream(30);
  }

  private async trackUserBody(video: HTMLVideoElement) {
    this.isDetecting = true;
    let detected = false;

    // Chrome Shape Detection FaceDetector
    if (this.faceDetector) {
      try {
        const faces = await this.faceDetector.detect(video);
        if (faces && faces.length > 0) {
          const face = faces[0].boundingBox;
          const targetCenterX = face.x + face.width / 2;
          const targetNeckY = face.y + face.height * 0.95;
          const targetShoulderWidth = face.width * 3.3;
          const targetTorsoHeight = face.height * 3.8;

          this.torsoCenterX += (targetCenterX - this.torsoCenterX) * 0.4;
          this.neckY += (targetNeckY - this.neckY) * 0.4;
          this.shoulderWidth += (targetShoulderWidth - this.shoulderWidth) * 0.4;
          this.torsoHeight += (targetTorsoHeight - this.torsoHeight) * 0.4;
          detected = true;
        }
      } catch (err) {}
    }

    // Centroid fallback
    if (!detected && this.smallCtx) {
      try {
        const sw = this.smallCanvas.width;
        const sh = this.smallCanvas.height;
        this.smallCtx.drawImage(video, 0, 0, sw, sh);
        const data = this.smallCtx.getImageData(0, 0, sw, sh).data;

        let weightedX = 0;
        let weightedY = 0;
        let count = 0;

        for (let y = 0; y < sh * 0.7; y += 2) {
          for (let x = 0; x < sw; x += 2) {
            const i = (y * sw + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > 60 && g > 40 && b > 20 && r > g && r > b) {
              weightedX += x;
              weightedY += y;
              count++;
            }
          }
        }

        if (count > 30) {
          const headX = (weightedX / count) * (this.canvas.width / sw);
          const headY = (weightedY / count) * (this.canvas.height / sh);

          this.torsoCenterX += (headX - this.torsoCenterX) * 0.35;
          this.neckY += ((headY + 50) - this.neckY) * 0.35;
          this.shoulderWidth += (this.canvas.width * 0.58 - this.shoulderWidth) * 0.35;
          this.torsoHeight += (this.canvas.height * 0.58 - this.torsoHeight) * 0.35;
        }
      } catch (e) {}
    }

    this.isDetecting = false;
  }

  private renderVirtualGarment(garment: Garment) {
    const width = this.canvas.width;
    const height = this.canvas.height;

    const centerX = Math.max(width * 0.15, Math.min(width * 0.85, this.torsoCenterX));
    const neckY = Math.max(height * 0.2, Math.min(height * 0.65, this.neckY));
    const shoulderSpan = Math.max(240, Math.min(width * 0.9, this.shoulderWidth));
    const bottomY = Math.min(height, neckY + this.torsoHeight);

    const leftShoulderX = centerX - shoulderSpan * 0.5;
    const rightShoulderX = centerX + shoulderSpan * 0.5;
    const shoulderDropY = neckY + 48;

    this.ctx.save();

    // 1. Create upper body clipping path matching shoulders and torso
    this.ctx.beginPath();
    // Neck contour
    this.ctx.moveTo(centerX - shoulderSpan * 0.16, neckY);
    this.ctx.quadraticCurveTo(centerX, neckY + 22, centerX + shoulderSpan * 0.16, neckY);
    // Right shoulder
    this.ctx.lineTo(rightShoulderX, shoulderDropY);
    // Right sleeve
    this.ctx.lineTo(rightShoulderX + 40, bottomY);
    // Waist
    this.ctx.lineTo(leftShoulderX - 40, bottomY);
    // Left sleeve
    this.ctx.lineTo(leftShoulderX, shoulderDropY);
    this.ctx.closePath();

    this.ctx.clip();

    // 2. If high-res garment image is loaded, composite it with fabric warping
    if (this.loadedImage && this.loadedImage.complete && this.loadedImage.naturalWidth > 0) {
      this.ctx.globalAlpha = 0.92;
      const garmentW = shoulderSpan * 1.25;
      const garmentH = this.torsoHeight * 1.15;
      const garmentX = centerX - garmentW * 0.5;
      const garmentY = neckY - 20;

      this.ctx.drawImage(this.loadedImage, garmentX, garmentY, garmentW, garmentH);
    } else {
      // Procedural fallback matching the video garments
      if (garment.id === 'blue-wave-sweater') {
        this.ctx.fillStyle = '#1d4ed8';
        this.ctx.globalAlpha = 0.95;
        this.ctx.fillRect(0, 0, width, height);

        // Fluid white waves
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 14;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(centerX - shoulderSpan * 0.35, neckY + 60);
        this.ctx.bezierCurveTo(
          centerX - 40 + Math.sin(this.timeOffset) * 8,
          neckY + 130,
          centerX + 70,
          neckY + 70,
          centerX + shoulderSpan * 0.35,
          neckY + 150
        );
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(centerX - shoulderSpan * 0.3, neckY + 150);
        this.ctx.bezierCurveTo(
          centerX - 80,
          neckY + 220 + Math.cos(this.timeOffset) * 8,
          centerX + 40,
          neckY + 190,
          centerX + shoulderSpan * 0.38,
          neckY + 260
        );
        this.ctx.stroke();
      } else if (garment.id === 'charcoal-hoodie') {
        this.ctx.fillStyle = '#222428';
        this.ctx.globalAlpha = 0.96;
        this.ctx.fillRect(0, 0, width, height);

        // Pocket & drawstrings
        this.ctx.strokeStyle = '#373b42';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(centerX - 80, neckY + 160, 160, 100);

        this.ctx.strokeStyle = '#e4e4e7';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 18, neckY + 15);
        this.ctx.lineTo(centerX - 22, neckY + 105);
        this.ctx.moveTo(centerX + 18, neckY + 15);
        this.ctx.lineTo(centerX + 22, neckY + 105);
        this.ctx.stroke();
      } else if (garment.id === 'cream-mockneck') {
        this.ctx.fillStyle = '#f6f6f0';
        this.ctx.globalAlpha = 0.95;
        this.ctx.fillRect(0, 0, width, height);

        this.ctx.fillStyle = '#eaeae2';
        this.ctx.fillRect(centerX - 50, neckY - 14, 100, 26);
      } else {
        this.ctx.fillStyle = garment.color || '#2563eb';
        this.ctx.globalAlpha = 0.90;
        this.ctx.fillRect(0, 0, width, height);
      }
    }

    // Dynamic 3D lighting, shoulder shading, and folds
    const shadowGrad = this.ctx.createLinearGradient(0, neckY, 0, bottomY);
    shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    shadowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    this.ctx.fillStyle = shadowGrad;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.restore();
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}
