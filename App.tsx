import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BookOpen, Moon, Sun, Plus, Play, Eye, LogOut, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import MarkdownView from './components/MarkdownView';
import AuthScreen from './components/AuthScreen';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import SettingsModal from './components/SettingsModal';
import CategoryModal from './components/CategoryModal';
import AddChaptersModal from './components/AddChaptersModal';

import {
  generateCourseContentStream,
  generateLessonPrompt,
  generateTip,
  sendChatMessageStream,
} from './services/aiService';
import {
  loginUser,
  registerUser,
  loadActiveSession,
  persistUserData,
  clearActiveSession,
  listSavedProfiles,
} from './services/userStorage';
import { DEFAULT_SETTINGS } from './constants';
import {
  AppSettings,
  Chapter,
  Category,
  ChatMessage,
  SelectionState,
  UserData,
  UserProfile,
} from './types';

const cloneDefaultSettings = (): AppSettings => JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

const EMPTY_SELECTION_STATE: SelectionState = {
  text: '',
  expandedText: '',
  x: 0,
  y: 0,
  isVisible: false,
  isLoading: false,
  response: null,
  showFloatingButton: false,
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(cloneDefaultSettings());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<UserProfile[]>([]);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // State refactored to use Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [showLessonPrompt, setShowLessonPrompt] = useState(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [addChaptersModalState, setAddChaptersModalState] = useState<{
    isOpen: boolean;
    categoryId: string | null;
  }>({
    isOpen: false,
    categoryId: null,
  });

  // Selection Popover
  const [selectionState, setSelectionState] = useState<SelectionState>(EMPTY_SELECTION_STATE);

  const hydrateFromUserData = useCallback((data: UserData) => {
    setCurrentUser(data.profile);
    setSettings(data.settings || cloneDefaultSettings());
    setCategories(data.categories || []);
    setChatHistory(data.chatHistory || []);
    setIsDarkMode(data.isDarkMode ?? false);
    setActiveChapterId(data.activeChapterId ?? null);
    setSelectionState(EMPTY_SELECTION_STATE);
  }, []);

  useEffect(() => {
    setSavedProfiles(listSavedProfiles());
    try {
      const session = loadActiveSession();
      if (session) {
        hydrateFromUserData(session.data);
      }
    } finally {
      setAuthChecked(true);
    }
  }, [hydrateFromUserData]);

  useEffect(() => {
    if (!currentUser) return;
    const data: UserData = {
      profile: currentUser,
      settings,
      categories,
      chatHistory,
      isDarkMode,
      activeChapterId,
      lastUpdated: Date.now(),
    };
    persistUserData(currentUser.id, data);
  }, [settings, categories, chatHistory, isDarkMode, activeChapterId, currentUser]);

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Derived state: active chapter
  const activeChapter = useMemo(() => {
    for (const cat of categories) {
      const found = cat.chapters.find((c) => c.id === activeChapterId);
      if (found) return found;
    }
    return null;
  }, [categories, activeChapterId]);

  // Sync chat history when active chapter changes
  useEffect(() => {
    if (activeChapter) {
      setChatHistory(activeChapter.chatHistory || []);
    } else {
      setChatHistory([]);
    }
  }, [activeChapter, activeChapterId]);

  // --- Handlers ---

  const handleAuthSubmit = async ({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }) => {
    setAuthError(null);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setAuthError('請輸入 email 與密碼。');
      return;
    }

    setIsAuthSubmitting(true);
    try {
      const result =
        authMode === 'login'
          ? loginUser(trimmedEmail, trimmedPassword)
          : registerUser(trimmedEmail, trimmedPassword, name || trimmedEmail.split('@')[0], {
            settings: cloneDefaultSettings(),
            categories: [],
            chatHistory: [],
            isDarkMode: false,
            activeChapterId: null,
          });

      hydrateFromUserData(result.data);
      setAuthMode('login');
      setSavedProfiles(listSavedProfiles());
    } catch (error) {
      setAuthError((error as Error).message || '操作失敗，請稍後再試。');
    } finally {
      setIsAuthSubmitting(false);
      setAuthChecked(true);
    }
  };

  const handleLogout = () => {
    clearActiveSession();
    setCurrentUser(null);
    setSettings(cloneDefaultSettings());
    setCategories([]);
    setChatHistory([]);
    setIsChatTyping(false);
    setActiveChapterId(null);
    setShowLessonPrompt(false);
    setIsSettingsOpen(false);
    setIsCategoryModalOpen(false);
    setAddChaptersModalState({ isOpen: false, categoryId: null });
    setSelectionState(EMPTY_SELECTION_STATE);
    setSavedProfiles(listSavedProfiles());
    setAuthMode('login');
  };

  const handleAddCategory = (title: string) => {
    const newCategory: Category = {
      id: uuidv4(),
      title,
      chapters: [],
      isOpen: true,
    };
    setCategories((prev) => [...prev, newCategory]);
  };

  const handleAddChapters = async (text: string) => {
    const { categoryId } = addChaptersModalState;
    if (!categoryId) return;

    const lines = text.split('\n').filter((line) => line.trim() !== '');
    const newChapters: Chapter[] = lines.map((line) => ({
      id: uuidv4(),
      title: line.trim(),
      lessonPrompt: '',
      content: null,
      isGeneratingPrompt: true,
      isGeneratingContent: false,
      chatHistory: [],
    }));

    // Add chapters to category immediately
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          return { ...cat, chapters: [...cat.chapters, ...newChapters] };
        }
        return cat;
      }),
    );

    // Generate prompts in background
    for (const chapter of newChapters) {
      generateLessonPrompt(chapter.title, settings.generationAI, settings.language).then(
        (prompt) => {
          setCategories((prev) =>
            prev.map((cat) => {
              if (cat.id === categoryId) {
                return {
                  ...cat,
                  chapters: cat.chapters.map((c) =>
                    c.id === chapter.id
                      ? { ...c, lessonPrompt: prompt, isGeneratingPrompt: false }
                      : c,
                  ),
                };
              }
              return cat;
            }),
          );
        },
      );
    }
  };

  const handleToggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, isOpen: !cat.isOpen } : cat)),
    );
  };

  const handleDeleteCategory = (id: string) => {
    // If active chapter is in this category, clear it
    const categoryToDelete = categories.find((c) => c.id === id);
    if (categoryToDelete && activeChapterId) {
      const hasActiveChapter = categoryToDelete.chapters.some((c) => c.id === activeChapterId);
      if (hasActiveChapter) {
        setActiveChapterId(null);
        setChatHistory([]);
      }
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDeleteChapter = (categoryId: string, chapterId: string) => {
    if (activeChapterId === chapterId) {
      setActiveChapterId(null);
      setChatHistory([]);
    }

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            chapters: cat.chapters.filter((c) => c.id !== chapterId),
          };
        }
        return cat;
      }),
    );
  };

  const handleGenerateContent = async () => {
    if (!activeChapter) return;

    // Initialize empty content and set generating state
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        chapters: cat.chapters.map((c) =>
          c.id === activeChapter.id ? { ...c, isGeneratingContent: true, content: '' } : c,
        ),
      })),
    );

    await generateCourseContentStream(
      activeChapter.title,
      activeChapter.lessonPrompt,
      settings.generationAI,
      settings.language,
      (chunk) => {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            chapters: cat.chapters.map((c) =>
              c.id === activeChapter.id ? { ...c, content: chunk } : c,
            ),
          })),
        );
      }
    );

    // Clear generating state
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        chapters: cat.chapters.map((c) =>
          c.id === activeChapter.id ? { ...c, isGeneratingContent: false } : c,
        ),
      })),
    );
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChapterId) return;

    const newUserMsg: ChatMessage = { id: uuidv4(), role: 'user', text, timestamp: Date.now() };

    // Create placeholder for AI message
    const newAiMsgId = uuidv4();
    const newAiMsgPlaceholder: ChatMessage = {
      id: newAiMsgId,
      role: 'model',
      text: '', // Start empty
      timestamp: Date.now(),
    };

    // Update local UI immediately with User message AND empty AI message
    setChatHistory((prev) => [...prev, newUserMsg, newAiMsgPlaceholder]);
    setIsChatTyping(true);

    // Sync to category state (User message)
    setCategories(prev => prev.map(cat => ({
      ...cat,
      chapters: cat.chapters.map(c =>
        c.id === activeChapterId
          ? { ...c, chatHistory: [...(c.chatHistory || []), newUserMsg, newAiMsgPlaceholder] }
          : c
      )
    })));

    // Get context from active chapter
    const currentChapter = categories
      .flatMap(c => c.chapters)
      .find(c => c.id === activeChapterId);

    // Use the history BEFORE the new user message for context building appropriately
    // But honestly, sending the current history including the new user message is fine, 
    // but the `sendChatMessageStream` expects history array. 
    // We should pass the updated history excluding the empty AI response we just added.
    const historyForAi = [...chatHistory, newUserMsg].map((m) => ({ role: m.role, text: m.text }));

    const contextContent = currentChapter?.content || null;

    await sendChatMessageStream(
      historyForAi,
      text,
      settings.chatAI,
      settings.language,
      (chunk) => {
        // Update both local chatHistory and Category state
        setChatHistory((prev) =>
          prev.map(msg => msg.id === newAiMsgId ? { ...msg, text: chunk } : msg)
        );

        setCategories((prev) => prev.map((cat) => ({
          ...cat,
          chapters: cat.chapters.map((c) =>
            c.id === activeChapterId
              ? {
                ...c,
                chatHistory: (c.chatHistory || []).map((msg) =>
                  msg.id === newAiMsgId ? { ...msg, text: chunk } : msg,
                ),
              }
              : c,
          ),
        })));
      },
      contextContent
    );

    setIsChatTyping(false);
  };

  // Text Selection Logic
  const handleSelection = useCallback(
    async () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionState((prev) => ({ ...prev, showFloatingButton: false }));
        return;
      }

      let node = selection.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;

      const text = selection.toString().trim();
      if (text.length === 0) return;

      let expandedText = text;
      try {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;

        if (container.nodeType === Node.TEXT_NODE && container.textContent) {
          const fullContent = container.textContent;
          const start = range.startOffset;
          const end = range.endOffset;

          const before = fullContent.substring(0, start);
          const after = fullContent.substring(end);

          const punctuationRegex = /[.!?。！？\n]/;

          let startIdx = -1;
          for (let i = before.length - 1; i >= 0; i--) {
            if (punctuationRegex.test(before[i])) {
              startIdx = i;
              break;
            }
          }

          const endMatch = after.match(punctuationRegex);
          const endIdx = endMatch ? endMatch.index : -1;

          const cleanStart = startIdx === -1 ? 0 : startIdx + 1;
          const cleanEnd = endIdx === -1 ? fullContent.length : end + endIdx + 1;

          expandedText = fullContent.substring(cleanStart, cleanEnd).trim();
          if (expandedText.length < text.length) expandedText = text;
        }
      } catch (err) {
        console.debug('Expansion failed, using default text', err);
        expandedText = text;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectionState({
        text,
        expandedText,
        x: rect.left + rect.width / 2,
        y: rect.bottom + window.scrollY + 10, // Add offset and scrollY
        isVisible: false,
        isLoading: false,
        response: null,
        showFloatingButton: true,
      });
    },
    [],
  );

  const handleTriggerQuickTip = async () => {
    setSelectionState((prev) => ({
      ...prev,
      showFloatingButton: false,
      isVisible: true,
      isLoading: true,
    }));

    const tip = await generateTip(
      selectionState.expandedText,
      settings.tipsAI,
      settings.language,
    );
    setSelectionState((prev) => ({
      ...prev,
      isLoading: false,
      response: tip,
    }));
  };

  const activeCategoryTitle = useMemo(() => {
    return categories.find((c) => c.id === addChaptersModalState.categoryId)?.title;
  }, [categories, addChaptersModalState.categoryId]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>正在載入您的帳號資料...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        mode={authMode}
        onToggleMode={() => {
          setAuthMode(authMode === 'login' ? 'register' : 'login');
          setAuthError(null);
        }}
        onSubmit={handleAuthSubmit}
        error={authError}
        isSubmitting={isAuthSubmitting}
        savedProfiles={savedProfiles}
      />
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <SidebarLeft
        categories={categories}
        activeChapterId={activeChapterId}
        onSelectChapter={setActiveChapterId}
        onToggleCategory={handleToggleCategory}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddCategory={() => setIsCategoryModalOpen(true)}
        onAddChaptersToCategory={(id) => setAddChaptersModalState({ isOpen: true, categoryId: id })}
        onDeleteCategory={handleDeleteCategory}
        onDeleteChapter={handleDeleteChapter}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-gray-900 z-10">
          <h1 className="font-semibold text-gray-800 dark:text-gray-200 truncate flex items-center gap-2">
            {activeChapter ? (
              <>
                <span className="text-gray-400 font-normal text-sm">
                  {
                    categories.find((c) => c.chapters.some((ch) => ch.id === activeChapter.id))
                      ?.title
                  }{' '}
                  /
                </span>
                <span>{activeChapter.title}</span>
              </>
            ) : (
              'Welcome'
            )}
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold uppercase">
                {(currentUser.name || currentUser.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="font-semibold truncate max-w-[160px]">
                  {currentUser.name || currentUser.email}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                  {currentUser.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              title={isDarkMode ? '切換為亮色模式' : '切換為暗色模式'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
              title="登出"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-8 relative"
          onMouseUp={handleSelection}
        >
          <div className="max-w-3xl mx-auto pb-20">
            {!activeChapter && (
              <div className="flex flex-col items-center justify-center mt-20 text-center">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4 text-blue-600 dark:text-blue-400">
                  <BookOpen size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  Start Your Learning Journey
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
                  Create a category on the sidebar, then add chapters to generate your curriculum.
                </p>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus size={20} />
                  Create Category
                </button>
              </div>
            )}

            {activeChapter && (
              <div ref={contentRef}>
                {/* Control Panel */}
                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => setShowLessonPrompt(!showLessonPrompt)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <Eye size={16} />
                    {showLessonPrompt ? 'Hide Lesson Prompt' : 'View Lesson Prompt'}
                  </button>
                  <button
                    onClick={handleGenerateContent}
                    disabled={activeChapter.isGeneratingContent || activeChapter.isGeneratingPrompt}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {activeChapter.isGeneratingContent ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Play size={16} />
                    )}
                    Generate Content
                  </button>
                </div>

                {/* Lesson Prompt Drawer */}
                {showLessonPrompt && (
                  <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg animate-in slide-in-from-top-4">
                    <h3 className="text-xs font-bold text-yellow-800 dark:text-yellow-500 uppercase tracking-wide mb-2">
                      Lesson Prompt
                    </h3>
                    {activeChapter.isGeneratingPrompt ? (
                      <div className="text-sm text-yellow-700 dark:text-yellow-400 animate-pulse">
                        Generating prompt instructions...
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm text-yellow-900 dark:text-yellow-200 font-mono">
                        {activeChapter.lessonPrompt}
                      </pre>
                    )}
                  </div>
                )}

                {/* Main Content Area */}
                {activeChapter.content ? (
                  <MarkdownView content={activeChapter.content} />
                ) : (
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
                    <p className="text-gray-400">
                      Content not generated yet. Use the buttons above to start.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <SidebarRight
        chatHistory={chatHistory}
        onSendMessage={handleSendMessage}
        isTyping={isChatTyping}
        quickTipState={selectionState}
        onCloseTip={() => setSelectionState((prev) => ({ ...prev, isVisible: false }))}
      />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleAddCategory}
      />

      <AddChaptersModal
        isOpen={addChaptersModalState.isOpen}
        onClose={() => setAddChaptersModalState({ ...addChaptersModalState, isOpen: false })}
        onSubmit={handleAddChapters}
        categoryTitle={activeCategoryTitle}
      />

      {/* Floating Action Button for Quick Tip */}
      {selectionState.showFloatingButton && (
        <button
          style={{
            position: 'absolute',
            left: selectionState.x,
            top: selectionState.y,
            transform: 'translateX(-50%)',
            zIndex: 50,
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleTriggerQuickTip();
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all animate-in zoom-in duration-200"
        >
          <Sparkles size={16} />
          <span className="text-sm font-medium">Quick Explain</span>
        </button>
      )}
    </div>
  );
}
