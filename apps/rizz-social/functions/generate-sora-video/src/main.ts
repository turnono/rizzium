import * as functions from 'firebase-functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateSoraVideo = functions.https.onCall(async (data) => {
  try {
    const { prompt } = data;
    console.log('Generating video for prompt:', prompt);

    const response = await openai.images.generate({
      model: 'sora-1.0',
      prompt,
      n: 1,
      response_format: 'url',
      size: '1024x1024',
      quality: 'hd',
      duration: '10s',
    });

    const videoUrl = response.data[0].url;
    console.log('Generated video URL:', videoUrl);
    return { url: videoUrl };
  } catch (error) {
    console.error('Error generating video:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate video');
  }
});
