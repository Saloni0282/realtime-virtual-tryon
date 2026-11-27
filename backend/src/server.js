import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DECART_API_KEY = process.env.DECART_API_KEY || '';

// Enable CORS for frontend requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Health & configuration check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Virtual Try-On Backend Service',
    decartConfigured: Boolean(DECART_API_KEY && DECART_API_KEY !== 'your_decart_api_key_here'),
    timestamp: new Date().toISOString()
  });
});

// Ephemeral client token generation endpoint for Decart WebRTC session
app.post('/api/token', async (req, res) => {
  try {
    if (!DECART_API_KEY || DECART_API_KEY === 'your_decart_api_key_here') {
      return res.status(400).json({
        error: 'DECART_API_KEY_NOT_CONFIGURED',
        message: 'Decart API key is not configured in backend/.env. The app will utilize the interactive local simulator mode.',
        decartConfigured: false
      });
    }

    // Call Decart API to generate a short-lived client token
    const response = await fetch('https://api.decart.ai/v1/client-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DECART_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        duration_minutes: 15
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Decart API token error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'DECART_TOKEN_REQUEST_FAILED',
        message: 'Failed to mint client token from Decart API.',
        details: errorText
      });
    }

    const data = await response.json();
    return res.json({
      token: data.token,
      expiresInMinutes: 15
    });
  } catch (err) {
    console.error('Error generating token:', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Virtual Try-On Backend running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Decart API Configured: ${Boolean(DECART_API_KEY && DECART_API_KEY !== 'your_decart_api_key_here')}`);
  console.log(`===============================================`);
});
