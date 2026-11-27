# Real-Time Live Video Virtual Try-On (Anywear Clone)

This repository contains the complete implementation of the **Anywear** real-time live video Virtual Try-On (VTON) web platform, inspired by Decart AI's demonstration.

Unlike traditional fitting rooms that rely on uploading static photos and waiting for still images, this application allows users to preview clothing directly on their **live camera feed in real time (25–30 FPS)** with realistic cloth movement, fabric drape, and folds.

---

## 🌟 Key Features

1. **Live Camera Virtual Fitting Room (`Try-On / Anywear`):**
   * Real-time video stream overlay with sub-second latency.
   * Dynamic garment switching: seamlessly swap between hoodies, knit sweaters, jackets, and custom clothes without disconnecting the video stream.
2. **"Step Back" Calibration Silhouette Guide:**
   * Automatically guides the user to step back and center their shoulders and head before and during try-on.
3. **Dual-Engine Architecture:**
   * **Decart AI Live Engine (`@decartai/sdk`):** Connects to the `lucy-vton-latest` WebRTC model when a `DECART_API_KEY` is provided.
   * **Built-in Local Vision Simulator:** Runs in-browser body tracking and dynamic cloth rendering so the system is fully functional right away even without an external API key!
4. **E-Commerce Storefront:**
   * High-resolution product catalog with "+ Try-On" action pills matching the video.
   * Garments from the video included:
     * *Wavy Contour Knit Sweater* (Royal blue with white fluid waves)
     * *Essential Washed Hoodie* (Dark charcoal washed fleece)
     * *Ribbed Mock-Neck Pullover* (Cream off-white knit)
5. **Custom Clothing Upload:**
   * Upload photos of any clothing item, configure colors and descriptions, and try them on live.
6. **"Install on my store" Embed Modal:**
   * Ready-to-use widget embed snippet for Shopify, WooCommerce, and custom web stores.
7. **Snapshot Tool:**
   * Capture and download high-resolution photos of your virtual try-on looks with a single click.

---

## 🏗️ Tech Stack

* **Frontend:** Vite, React 18, TypeScript, Tailwind CSS, Lucide Icons, MediaPipe
* **Backend:** Node.js, Express, CORS, Dotenv
* **Transport:** WebRTC (Peer-to-Peer low-latency video streaming)
* **AI Model:** Decart AI `lucy-vton-latest` (Cloud) + Canvas Vision Simulator (Local)

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```
Or install in each folder individually:
```bash
# In /backend
cd backend
npm install

# In /frontend
cd ../frontend
npm install

# In root
cd ..
npm install
```

### 2. Configure Environment (Optional)
If you have a Decart AI API key:
1. Open `backend/.env`
2. Add your key:
```env
DECART_API_KEY=your_actual_decart_api_key_here
```
*(If no key is configured, the application automatically uses the interactive Local Vision Simulator, so everything works out of the box!)*

### 3. Run the Development Servers
Start both the Express backend and the Vite frontend simultaneously with a single command:
```bash
npm run dev
```

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend:** [http://localhost:3001](http://localhost:3001)
* **Health Check:** [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 📁 Project Structure

```
├── package.json              # Root scripts orchestrating frontend & backend
├── README.md                 # Complete documentation
├── backend/
│   ├── .env                  # Backend secrets & configuration
│   ├── package.json
│   └── src/
│       └── server.js         # Express server with /api/token & /api/health
└── frontend/
    ├── package.json
    ├── vite.config.ts        # Vite config with API proxy to port 3001
    ├── tailwind.config.js
    └── src/
        ├── App.tsx           # Storefront layout and try-on state
        ├── types.ts          # Garment and stream type definitions
        ├── data/
        │   └── garments.ts   # Catalog data with demo garments from video
        ├── lib/
        │   ├── decartClient.ts # WebRTC connection manager
        │   ├── mediaPipe.ts  # Alignment tracker ("Step back" guide)
        │   └── simulator.ts  # Local real-time cloth rendering engine
        └── components/
            ├── Header.tsx    # Navigation and store install button
            ├── ProductCard.tsx # Garment card with "+ Try-On" button
            ├── ProductGrid.tsx # Catalog grid with category filter
            ├── TryOnWindow.tsx # Live video try-on floating widget
            ├── SilhouetteGuide.tsx # "Step back" visual silhouette
            ├── CustomUploadModal.tsx # Upload any clothing photo
            └── EmbedModal.tsx # Embed code snippet for Shopify/Woo
```
