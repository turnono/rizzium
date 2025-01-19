import * as functions from 'firebase-functions';

export const generateSoraVideo = functions.https.onCall(async (data) => {
  try {
    const { prompt } = data;
    console.log('Generating video for prompt:', prompt);

    // Mock implementation until Sora API is available
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const mockUrl = `https://storage.googleapis.com/rizz-social.appspot.com/mock-videos/video-${Date.now()}.mp4`;

    console.log('Generated mock video URL:', mockUrl);
    return { url: mockUrl };
  } catch (error) {
    console.error('Error generating video:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate video');
  }
});
