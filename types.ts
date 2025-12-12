export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  basePrompt: string;
}

export interface AppSettings {
  language: string;
  generationAI: AIConfig;
  tipsAI: AIConfig;
  chatAI: AIConfig;
}

export interface Chapter {
  id: string;
  title: string;
  lessonPrompt: string; // The specific prompt for this chapter
  content: string | null; // The generated course content
  isGeneratingPrompt: boolean;
  isGeneratingContent: boolean;
  chatHistory: ChatMessage[]; // Isolated chat history for this chapter
}

export interface Category {
  id: string;
  title: string;
  chapters: Chapter[];
  isOpen: boolean; // UI state for accordion
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface SelectionState {
  text: string;
  expandedText: string;
  x: number;
  y: number;
  isVisible: boolean;
  isLoading: boolean;
  response: string | null;
  showFloatingButton: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export interface UserData {
  profile: UserProfile;
  settings: AppSettings;
  categories: Category[];
  chatHistory: ChatMessage[];
  isDarkMode: boolean;
  activeChapterId: string | null;
  lastUpdated: number;
}

export interface StoredUserRecord {
  profile: UserProfile;
  password: string;
  data: UserData;
}

export interface DatabaseSnapshot {
  activeUserId?: string;
  users: Record<string, StoredUserRecord>;
}
