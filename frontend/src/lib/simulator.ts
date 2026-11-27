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

  // Face detector in Chrome
  private faceDetector: any = null;
  private isDetecting: boolean = false;
  private lastDetectTime: number = 0;

  // Small analysis canvas for performance
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

        // Run face and body tracking every ~70ms
        const now = performance.now();
        if (now - this.lastDetectTime > 70 && !this.isDetecting) {
          this.lastDetectTime = now;
          this.trackUserBody(video);
        }

        // 1. Draw live webcam frame
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

        // 2. Synthesize virtual clothing contoured to user body
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
          const targetNeckY = face.y + face.height * 0.96;
          const targetShoulderWidth = face.width * 3.2;
          const targetTorsoHeight = face.height * 3.8;

          this.torsoCenterX += (targetCenterX - this.torsoCenterX) * 0.4;
          this.neckY += (targetNeckY - this.neckY) * 0.4;
          this.shoulderWidth += (targetShoulderWidth - this.shoulderWidth) * 0.4;
          this.torsoHeight += (targetTorsoHeight - this.torsoHeight) * 0.4;
          detected = true;
        }
      } catch (err) {}
    }

    // Centroid skin/head fallback
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
          this.neckY += ((headY + 52) - this.neckY) * 0.35;
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
    const neckY = Math.max(height * 0.18, Math.min(height * 0.65, this.neckY));
    const shoulderSpan = Math.max(240, Math.min(width * 0.9, this.shoulderWidth));
    const bottomY = Math.min(height, neckY + this.torsoHeight);

    const leftShoulderX = centerX - shoulderSpan * 0.5;
    const rightShoulderX = centerX + shoulderSpan * 0.5;
    const shoulderDropY = neckY + 48;

    this.ctx.save();

    // 1. Natural upper-body garment clipping contour
    this.ctx.beginPath();
    // Neck curve
    this.ctx.moveTo(centerX - shoulderSpan * 0.16, neckY);
    this.ctx.quadraticCurveTo(centerX, neckY + 22, centerX + shoulderSpan * 0.16, neckY);
    // Right shoulder
    this.ctx.lineTo(rightShoulderX, shoulderDropY);
    // Right arm / sleeve
    this.ctx.lineTo(rightShoulderX + 40, bottomY);
    // Bottom waistline
    this.ctx.lineTo(leftShoulderX - 40, bottomY);
    // Left arm / sleeve
    this.ctx.lineTo(leftShoulderX, shoulderDropY);
    this.ctx.closePath();

    this.ctx.clip();

    // 2. High-fidelity tailored cloth synthesis for each item
    if (garment.id === 'blue-wave-sweater') {
      // Royal blue knit base
      this.ctx.fillStyle = '#1d4ed8';
      this.ctx.globalAlpha = 0.95;
      this.ctx.fillRect(0, 0, width, height);

      // Organic fluid white wave contours matching the video
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 14;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      // Wave 1 across chest
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

      // Wave 2 across lower torso
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
      this.ctx.arc(centerX + 45, neckY + 120, 34, 0, Math.PI * 1.55);
      this.ctx.stroke();

      // Ribbed collar line
      this.ctx.strokeStyle = '#1e40af';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - shoulderSpan * 0.16, neckY);
      this.ctx.quadraticCurveTo(centerX, neckY + 22, centerX + shoulderSpan * 0.16, neckY);
      this.ctx.stroke();

    } else if (garment.id === 'charcoal-hoodie') {
      // Dark washed charcoal fleece
      this.ctx.fillStyle = '#222428';
      this.ctx.globalAlpha = 0.96;
      this.ctx.fillRect(0, 0, width, height);

      // Kangaroo pocket
      this.ctx.strokeStyle = '#383b42';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(centerX - 85, neckY + 155, 170, 105);

      // Hood V-neck opening
      this.ctx.fillStyle = '#17181c';
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 35, neckY);
      this.ctx.lineTo(centerX, neckY + 28);
      this.ctx.lineTo(centerX + 35, neckY);
      this.ctx.closePath();
      this.ctx.fill();

      // Drawstrings with subtle swing animation
      this.ctx.strokeStyle = '#e4e4e7';
      this.ctx.lineWidth = 3.5;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 18, neckY + 18);
      this.ctx.lineTo(centerX - 22 + Math.sin(this.timeOffset * 2) * 4, neckY + 110);
      this.ctx.moveTo(centerX + 18, neckY + 18);
      this.ctx.lineTo(centerX + 22 + Math.cos(this.timeOffset * 2) * 4, neckY + 110);
      this.ctx.stroke();

    } else if (garment.id === 'cream-mockneck') {
      // Cream off-white merino knit
      this.ctx.fillStyle = '#f7f7f0';
      this.ctx.globalAlpha = 0.96;
      this.ctx.fillRect(0, 0, width, height);

      // Mockneck high ribbed collar
      this.ctx.fillStyle = '#eaeae0';
      this.ctx.fillRect(centerX - 52, neckY - 14, 104, 28);

      // Vertical knit rib lines
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      this.ctx.lineWidth = 2;
      for (let x = leftShoulderX; x < rightShoulderX; x += 14) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, neckY + 14);
        this.ctx.lineTo(x, bottomY);
        this.ctx.stroke();
      }

    } else if (garment.id === 'sage-knit-cardigan') {
      // Muted Sage green mohair cardigan
      this.ctx.fillStyle = '#84a98c';
      this.ctx.globalAlpha = 0.95;
      this.ctx.fillRect(0, 0, width, height);

      // Deep V-neck opening
      this.ctx.fillStyle = '#6b8f74';
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - 40, neckY);
      this.ctx.lineTo(centerX, neckY + 80);
      this.ctx.lineTo(centerX + 40, neckY);
      this.ctx.closePath();
      this.ctx.fill();

      // Vertical button placket
      this.ctx.fillStyle = '#52796f';
      this.ctx.fillRect(centerX - 8, neckY + 80, 16, bottomY - (neckY + 80));

      // Horn buttons
      this.ctx.fillStyle = '#354f52';
      for (let by = neckY + 105; by < bottomY - 20; by += 45) {
        this.ctx.beginPath();
        this.ctx.arc(centerX, by, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }

    } else if (garment.id === 'graphic-tee-noir') {
      // Minimalist black crewneck tee
      this.ctx.fillStyle = '#18181b';
      this.ctx.globalAlpha = 0.96;
      this.ctx.fillRect(0, 0, width, height);

      // Ribbed crew collar
      this.ctx.strokeStyle = '#27272a';
      this.ctx.lineWidth = 5;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - shoulderSpan * 0.16, neckY);
      this.ctx.quadraticCurveTo(centerX, neckY + 22, centerX + shoulderSpan * 0.16, neckY);
      this.ctx.stroke();

      // Clean centered graphic print
      this.ctx.fillStyle = '#f4f4f5';
      this.ctx.font = 'bold 13px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.letterSpacing = '3px';
      this.ctx.fillText('ORIGINAL STUDIO', centerX, neckY + 110);
      this.ctx.textAlign = 'start';

    } else if (garment.id === 'vintage-racing-jacket') {
      // Black leather racer jacket with cream stripes
      this.ctx.fillStyle = '#09090b';
      this.ctx.globalAlpha = 0.97;
      this.ctx.fillRect(0, 0, width, height);

      // Cream racing stripes across shoulders and sleeves
      this.ctx.fillStyle = '#f4f4f5';
      this.ctx.fillRect(leftShoulderX, shoulderDropY - 12, shoulderSpan, 18);

      // Silver metal zipper line down center
      this.ctx.strokeStyle = '#d4d4d8';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, neckY + 16);
      this.ctx.lineTo(centerX, bottomY);
      this.ctx.stroke();

    } else {
      // User-uploaded custom item
      this.ctx.fillStyle = garment.color || '#2563eb';
      this.ctx.globalAlpha = 0.93;
      this.ctx.fillRect(0, 0, width, height);

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      this.ctx.fillRect(centerX - 50, neckY + 80, 100, 40);
    }

    // Dynamic 3D lighting, shoulder shading, and folds
    const shadowGrad = this.ctx.createLinearGradient(0, neckY, 0, bottomY);
    shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    shadowGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    this.ctx.fillStyle = shadowGrad;
    this.ctx.fillRect(0, 0, width, height);

    // Side sleeve curvature shading
    const leftShadow = this.ctx.createLinearGradient(leftShoulderX, 0, leftShoulderX + 50, 0);
    leftShadow.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
    leftShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = leftShadow;
    this.ctx.fillRect(0, 0, width, height);

    const rightShadow = this.ctx.createLinearGradient(rightShoulderX, 0, rightShoulderX - 50, 0);
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
