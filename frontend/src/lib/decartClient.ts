import { createDecartClient, models } from '@decartai/sdk';

export interface DecartSessionConfig {
  garmentPrompt: string;
  onRemoteStream: (stream: MediaStream) => void;
  onError: (error: Error | string) => void;
  onDisconnect?: (reason?: string) => void;
  onStateChange?: (state: string) => void;
}

export class DecartTryOnService {
  private client: any = null;
  private session: any = null;
  private localStream: MediaStream | null = null;

  async initSession(localStream: MediaStream, config: DecartSessionConfig) {
    this.localStream = localStream;

    // 1. Fetch ephemeral client token from backend
    const tokenResponse = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch ephemeral Decart token from server.');
    }

    const { token } = await tokenResponse.json();
    if (!token) {
      throw new Error('Received empty token from authentication service.');
    }

    // 2. Instantiate Decart client with the ephemeral token
    this.client = createDecartClient({ apiKey: token });

    // 3. Select Realtime VTON Model
    const model = models.realtime('lucy-vton-latest');

    // 4. Connect WebRTC media session
    this.session = await this.client.realtime.connect(this.localStream, {
      model,
      onRemoteStream: (remoteStream: MediaStream) => {
        config.onRemoteStream(remoteStream);
      },
      initialState: {
        prompt: {
          text: config.garmentPrompt
        }
      }
    });

    if (this.session && typeof this.session.on === 'function') {
      this.session.on('error', (err: any) => {
        console.error('Decart WebRTC Error:', err);
        config.onError(err?.message || 'Decart streaming error');
      });

      this.session.on('sessionEnded', (event: any) => {
        console.warn('Decart WebRTC Session Ended:', event);
        if (config.onDisconnect) config.onDisconnect('Session ended');
      });
    }

    return this.session;
  }

  async updateGarmentPrompt(newPrompt: string) {
    if (!this.session) {
      console.warn('Cannot update garment prompt: no active Decart session.');
      return;
    }

    try {
      if (typeof this.session.setPrompt === 'function') {
        await this.session.setPrompt(newPrompt);
      } else if (typeof this.session.set === 'function') {
        await this.session.set({ prompt: { text: newPrompt } });
      }
    } catch (err) {
      console.error('Failed to update garment prompt in session:', err);
    }
  }

  disconnect() {
    if (this.session) {
      try {
        if (typeof this.session.disconnect === 'function') {
          this.session.disconnect();
        }
      } catch (err) {
        console.error('Error disconnecting Decart session:', err);
      }
      this.session = null;
    }
    this.client = null;
  }
}
