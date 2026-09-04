import { GoogleGenerativeAI } from '@google/generative-ai';

export async function transcribeTamilAudio({ audioBase64, mimeType }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Tamil transcription service is not configured');
  if (!audioBase64) throw new Error('Audio is required');

  const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent([
    {
      inlineData: {
        data: audioBase64,
        mimeType: mimeType || 'audio/webm',
      },
    },
    {
      text: 'Transcribe this spoken Tamil audio exactly. Return only the Tamil transcript, with no explanation, labels, or punctuation added.',
    },
  ]);

  return result.response.text().trim();
}
