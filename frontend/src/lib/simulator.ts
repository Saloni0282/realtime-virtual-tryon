import { Garment } from '../types';

export class TryOnSimulator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private activeGarment: Garment | null = null;
  private timeOffset: number = 0;

  // Smoothed body tracking state
  private torsoCenterX: number = 320;
  private neckY: number = 200;
  private shoulderWidth: number = 280;
  private torsoHeight: number = 280;

  // Native face detector if available in Chrome
  private faceDetector: any = null;
  private isDetecting: boolean = false;
  private lastDetectTime: number = 0;

  // Analysis canvas for low-res tracking
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

    // Initialize Chrome Shape Detection FaceDetector if available
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
          this.neckY = this.canvas.height * 0.44;
          this.shoulderWidth = this.canvas.width * 0.55;
          this.torsoHeight = this.canvas.height * 0.56;
        }

        // Run person tracking every ~80ms
        const now = performance.now();
        if (now - this.lastDetectTime > 80 && !this.isDetecting) {
          this.lastDetectTime = now;
          this.trackUserBody(video);
        }

        // Draw webcam base frame
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

        // Render virtual garment dynamic overlay if an item is selected
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

    // Method 1: Chrome native FaceDetector
    if (this.faceDetector) {
      try {
        const faces = await this.faceDetector.detect(video);
        if (faces && faces.length > 0) {
          const face = faces[0].boundingBox;
          const targetCenterX = face.x + face.width / 2;
          const targetNeckY = face.y + face.height * 0.95;
          const targetShoulderWidth = face.width * 3.1;
          const targetTorsoHeight = face.height * 3.6;

          // Smooth tracking coordinates
          this.torsoCenterX += (targetCenterX - this.torsoCenterX) * 0.35;
          this.neckY += (targetNeckY - this.neckY) * 0.35;
          this.shoulderWidth += (targetShoulderWidth - this.shoulderWidth) * 0.35;
          this.torsoHeight += (targetTorsoHeight - this.torsoHeight) * 0.35;
          detected = true;
        }
      } catch (err) {
        // Fallback to pixel analysis
      }
    }

    // Method 2: Fast skin & head centroid tracking fallback
    if (!detected && this.smallCtx) {
      try {
        const sw = this.smallCanvas.width;
        const sh = this.smallCanvas.height;
        this.smallCtx.drawImage(video, 0, 0, sw, sh);
        const imgData = this.smallCtx.getImageData(0, 0, sw, sh);
        const data = imgData.data;

        let weightedX = 0;
        let weightedY = 0;
        let skinPixels = 0;

        for (let y = 0; y < sh * 0.75; y += 2) {
          for (let x = 0; x < sw; x += 2) {
            const idx = (y * sw + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Skin color range heuristic
            if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
              weightedX += x;
              weightedY += y;
              skinPixels++;
            }
          }
        }

        if (skinPixels > 40) {
          const headX = (weightedX / skinPixels) * (this.canvas.width / sw);
          const headY = (weightedY / skinPixels) * (this.canvas.height / sh);

          const targetCenterX = headX;
          const targetNeckY = headY + 50;
          const targetShoulderWidth = this.canvas.width * 0.52;
          const targetTorsoHeight = this.canvas.height * 0.55;

          this.torsoCenterX += (targetCenterX - this.torsoCenterX) * 0.3;
          this.neckY += (targetNeckY - this.neckY) * 0.3;
          this.shoulderWidth += (targetShoulderWidth - this.shoulderWidth) * 0.3;
          this.torsoHeight += (targetTorsoHeight - this.torsoHeight) * 0.3;
        }
      } catch (e) {
        // Keep previous tracking values
      }
    }

    this.isDetecting = false;
  }

  private renderVirtualGarment(garment: Garment) {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Bounded coordinates
    const centerX = Math.max(width * 0.2, Math.min(width * 0.8, this.torsoCenterX));
    const neckY = Math.max(height * 0.2, Math.min(height * 0.65, this.neckY));
    const shoulderSpan = Math.max(220, Math.min(width * 0.85, this.shoulderWidth));
    const bottomY = Math.min(height, neckY + this.torsoHeight);

    const leftShoulderX = centerX - shoulderSpan * 0.5;
    const rightShoulderX = centerX + shoulderSpan * 0.5;
    const shoulderDropY = neckY + 45;

    this.ctx.save();

    // 1. Create realistic apparel clipping path over user's body
    this.ctx.beginPath();
    // Front collar curve
    this.ctx.moveTo(centerX - shoulderSpan * 0.16, neckY);
    this.ctx.quadraticCurveTo(centerX, neckY + 22, centerX + shoulderSpan * 0.16, neckY);
    // Right shoulder
    this.ctx.lineTo(rightShoulderX, shoulderDropY);
    // Right sleeve
    this.ctx.lineTo(rightShoulderX + 35, bottomY);
    // Bottom waistline
    this.ctx.lineTo(leftShoulderX - 35, bottomY);
    // Left sleeve
    this.ctx.lineTo(leftShoulderX, shoulderDropY);
    this.ctx.closePath();

    this.ctx.clip();

    // 2. Render realistic cloth material based on selected garment
    if (garment.id === 'blue-wave-sweater') {
      // Royal blue knit base
      this.ctx.fillStyle = '#1d4ed8';
      this.ctx.globalAlpha = 0.94;
      this.ctx.fillRect(0, 0, width, height);

      // Organic fluid white wave contours matching the video
      this.ctx.globalAlpha = 0.96;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 14;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      // Wave 1
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - shoulderSpan * 0.35, neckY + 65);
      this.ctx.bezierCurveTo(
        centerX - 40 + Math.sin(this.timeOffset) * 8,
        neckY + 130,
        centerX + 70,
        neckY + 70,
        centerX + shoulderSpan * 0.35,
        neckY + 150
      );
      this.ctx.stroke();

      // Wave 2
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

      // Wave 3 loop
      this.ctx.beginPath();
      this.ctx.arc(centerX + 45, neckY + 125, 32, 0, Math.PI * 1.55);
      this.ctx.stroke();

      // Ribbed Collar
      this.ctx.strokeStyle = '#1e40af';
      this.ctx.lineWidth = 6;
      this.ctx.stroke();

    } else if (garment.id === 'charcoal-hoodie') {
      // Dark washed charcoal fleece
      this.ctx.fillStyle = '#232529';
      this.ctx.globalAlpha = 0.95;
      this.ctx.fillRect(0, 0, width, height);

      // Kangaroo pocket
      this.ctx.strokeStyle = '#34383f';
      this.ctx.lineWidth = 3.5;
      this.ctx.strokeRect(centerX - 85, neckY + 160, 170, 110);

      // Hoodie V-neck collar detail
      this.ctx.fillStyle = '#1a1b1f';
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 40, neckY);
      this.ctx.lineTo(centerX, neckY + 30);
      this.ctx.lineTo(centerX + 40, neckY);
      this.ctx.closePath();
      this.ctx.fill();

      // White drawstring cords
      this.ctx.strokeStyle = '#f4f4f5';
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 18, neckY + 20);
      this.ctx.lineTo(centerX - 22 + Math.sin(this.timeOffset * 2) * 3, neckY + 105);
      this.ctx.moveTo(centerX + 18, neckY + 20);
      this.ctx.lineTo(centerX + 22 + Math.cos(this.timeOffset * 2) * 3, neckY + 105);
      this.ctx.stroke();

    } else if (garment.id === 'cream-mockneck') {
      // Cream / ecru merino knit
      this.ctx.fillStyle = '#f8f8f2';
      this.ctx.globalAlpha = 0.95;
      this.ctx.fillRect(0, 0, width, height);

      // Mockneck high collar
      this.ctx.fillStyle = '#eeeee6';
      this.ctx.fillRect(centerX - 50, neckY - 12, 100, 26);

      // Vertical knit rib lines
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      this.ctx.lineWidth = 2;
      for (let x = leftShoulderX; x < rightShoulderX; x += 14) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, neckY);
        this.ctx.lineTo(x, bottomY);
        this.ctx.stroke();
      }
    } else {
      // User uploaded or other garments
      this.ctx.fillStyle = garment.color || '#2563eb';
      this.ctx.globalAlpha = 0.92;
      this.ctx.fillRect(0, 0, width, height);

      // Graphic or label on chest
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.fillRect(centerX - 50, neckY + 80, 100, 50);
    }

    // Dynamic 3D lighting, shoulder shading, and folds
    const shadowGrad = this.ctx.createLinearGradient(0, neckY, 0, bottomY);
    shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    shadowGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.15)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    this.ctx.fillStyle = shadowGrad;
    this.ctx.fillRect(0, 0, width, height);

    // Side curvature shading
    const leftShadow = this.ctx.createLinearGradient(leftShoulderX, 0, leftShoulderX + 60, 0);
    leftShadow.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
    leftShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = leftShadow;
    this.ctx.fillRect(0, 0, width, height);

    const rightShadow = this.ctx.createLinearGradient(rightShoulderX, 0, rightShoulderX - 60, 0);
    rightShadow.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
    rightShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = rightShadow;
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
