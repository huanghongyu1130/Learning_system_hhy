import { AIConfig } from '../types';

// Helper to parse SSE text response if the server ignores stream: false
const parseSSEText = (text: string): string => {
  const lines = text.split('\n');
  let result = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('data: ')) {
      const dataStr = trimmed.substring(6).trim();
      if (dataStr === '[DONE]') continue;
      try {
        const json = JSON.parse(dataStr);
        // Handle both chat completion chunks (delta) and potential full messages
        const content =
          json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content || '';
        result += content;
      } catch {
        // Ignore parse errors for individual lines
      }
    }
  }
  return result;
};

// Helper function to handle OpenAI-compatible requests
const makeOpenAIRequest = async (
  config: AIConfig,
  messages: { role: string; content: string }[],
  temperature: number = 0.7,
): Promise<string> => {
  // Determine Base URL. Default to OpenAI if empty, or use provided local/proxy URL.
  // We assume the user provides the base path (e.g., "https://api.openai.com/v1" or "http://localhost:11434/v1")
  // We trim trailing slashes and append "/chat/completions"
  let baseUrl = config.baseUrl;
  if (!baseUrl) {
    baseUrl = 'https://api.openai.com/v1';
  }
  // Remove trailing slash if present
  baseUrl = baseUrl.replace(/\/$/, '');

  const endpoint = `${baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add API Key if it exists (OpenAI requires it, Local AI often ignores it but accepts it)
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const payload = {
    model: config.model,
    messages: messages,
    temperature: temperature,
    stream: false, // Explicitly request no stream
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    if (!response.ok) {
      try {
        const errorData = JSON.parse(text);
        throw new Error(
          `API Error ${response.status}: ${errorData?.error?.message || response.statusText}`,
        );
      } catch {
        throw new Error(`API Error ${response.status}: ${text || response.statusText}`);
      }
    }

    // Try parsing as standard JSON first
    try {
      const data = JSON.parse(text);
      // Check if it's actually a valid completion response
      if (data.choices && Array.isArray(data.choices)) {
        return data.choices[0]?.message?.content || '';
      }
      // If parsing succeeded but structure is weird, fallback to checking text
      throw new Error('Invalid JSON structure');
    } catch {
      // If JSON parse fails, check if it's an SSE stream (which caused the "Unexpected token 'd'" error)
      if (text.includes('data: ')) {
        const sseContent = parseSSEText(text);
        if (sseContent) return sseContent;
      }

      console.error('Failed to parse response:', text);
      throw new Error('Failed to parse API response. Please check your model configuration.');
    }
  } catch (error) {
    console.error('OpenAI Request Failed:', error);
    throw error;
  }
};

export const testConnection = async (
  config: AIConfig,
): Promise<{ success: boolean; message: string }> => {
  try {
    const responseText = await makeOpenAIRequest(
      config,
      [{ role: 'user', content: "Hello, answer with just 'OK'." }],
      0.5,
    );

    if (responseText) {
      return { success: true, message: 'Connection successful! Response: ' + responseText };
    } else {
      return { success: false, message: 'Connected, but received empty response.' };
    }
  } catch (error) {
    return { success: false, message: (error as Error).message || 'Connection failed' };
  }
};

export const generateLessonPrompt = async (
  chapterTitle: string,
  config: AIConfig,
  language: string,
): Promise<string> => {
  const systemPrompt = `You are an expert curriculum developer.`;
  const userPrompt = `
    Based on the chapter title: "${chapterTitle}", generate a detailed "Lesson Prompt" that describes what should be covered in this chapter. 
    The output should be a set of instructions for another AI to write the content.
    Do not write the content itself, just the prompt instructions.
    Keep it concise but comprehensive.

    IMPORTANT: The generated prompt instructions must be written in ${language}.
  `;

  try {
    return await makeOpenAIRequest(config, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  } catch {
    return 'Error generating lesson prompt. Please check your Base URL, API Key and Model settings.';
  }
};

export const generateCourseContent = async (
  chapterTitle: string,
  lessonPrompt: string,
  config: AIConfig,
  language: string,
): Promise<string> => {
  const userPrompt = `
    Current Chapter: ${chapterTitle}
    
    Specific Instructions (Lesson Prompt):
    ${lessonPrompt}

    IMPORTANT: The content must be written in ${language}.
  `;

  try {
    return await makeOpenAIRequest(config, [
      { role: 'system', content: config.basePrompt }, // Use the configured base prompt as System message
      { role: 'user', content: userPrompt },
    ]);
  } catch (error) {
    return `Error generating content: ${(error as Error).message}`;
  }
};

export const generateTip = async (
  selectedText: string,
  config: AIConfig,
  language: string,
): Promise<string> => {
  const userPrompt = `
    User Selected Text: "${selectedText}"

    IMPORTANT: The explanation must be written in ${language}.
  `;

  try {
    return await makeOpenAIRequest(config, [
      { role: 'system', content: config.basePrompt },
      { role: 'user', content: userPrompt },
    ]);
  } catch {
    return 'Could not generate tip. Check settings.';
  }
};

export const sendChatMessage = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  config: AIConfig,
  language: string,
): Promise<string> => {
  const systemInstruction = `${config.basePrompt}\n\nIMPORTANT: You must always respond in ${language}.`;

  // Convert internal history format to OpenAI format
  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.map((h) => ({
      role: h.role === 'model' ? 'assistant' : 'user', // Map 'model' to 'assistant'
      content: h.text,
    })),
    { role: 'user', content: newMessage },
  ];

  try {
    return await makeOpenAIRequest(config, messages);
  } catch (error) {
    console.error('Chat error:', error);
    return 'Sorry, I encountered an error processing your message.';
  }
};
