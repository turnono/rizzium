import { onCall } from 'firebase-functions/v2/https';

export const generateSoraVideo = onCall(
  {
    memory: '256MiB',
    timeoutSeconds: 60,
    minInstances: 0,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const { prompt } = request.data;
      console.log('Generating video for prompt:', prompt);

      // Mock implementation until Sora API is available
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mockUrl = `https://storage.googleapis.com/rizz-social.appspot.com/mock-videos/video-${Date.now()}.mp4`;

      console.log('Generated mock video URL:', mockUrl);
      return { url: mockUrl };
    } catch (error) {
      console.error('Error generating video:', error);
      throw new Error('Failed to generate video');
    }
  }
);
