import { AppSettings } from './types';

export const DEFAULT_GENERATE_BASE_PROMPT = `You are an expert curriculum developer. 
Your task is to generate comprehensive, engaging, and structured course content based on the provided Chapter Title and Lesson Prompt.
Ensure the content is formatted in clean Markdown.
Use analogies, examples, and clear explanations.`;

export const DEFAULT_TIPS_BASE_PROMPT = `You are a helpful tutor. 
The user has highlighted a specific text snippet (Context) from a lesson.
Explain this concept simply and briefly.
If the context is incomplete, use the surrounding context to infer the meaning.
Keep the answer under 100 words unless complex.`;

export const DEFAULT_CHAT_BASE_PROMPT = `You are a friendly learning assistant. 
You are here to help the user with their continuous learning journey.
Maintain context of the conversation.
Answer questions, clarify doubts, and provide encouragement.`;

// Initialize API Key from environment if available, but allow it to be overridden by UI settings.
const DEFAULT_API_KEY = '123456';
const DEFAULT_API_BASE_URL = 'http://localhost:3052/v1';
const DEFAULT_MODEL_NAME = 'gemini-2.5-flash';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'Traditional Chinese',
  generationAI: {
    baseUrl: DEFAULT_API_BASE_URL,
    apiKey: DEFAULT_API_KEY,
    model: DEFAULT_MODEL_NAME,
    basePrompt: DEFAULT_GENERATE_BASE_PROMPT,
  },
  tipsAI: {
    baseUrl: DEFAULT_API_BASE_URL,
    apiKey: DEFAULT_API_KEY,
    model: DEFAULT_MODEL_NAME,
    basePrompt: DEFAULT_TIPS_BASE_PROMPT,
  },
  chatAI: {
    baseUrl: DEFAULT_API_BASE_URL,
    apiKey: DEFAULT_API_KEY,
    model: DEFAULT_MODEL_NAME,
    basePrompt: DEFAULT_CHAT_BASE_PROMPT,
  },
};
