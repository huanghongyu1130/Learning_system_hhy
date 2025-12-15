import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, X, MessageSquare, Send, Paperclip } from 'lucide-react';
import MarkdownView from './MarkdownView';
import { ChatMessage, SelectionState } from '../types';

interface SidebarRightProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string, images?: string[]) => void;
  isTyping: boolean;
  quickTipState: SelectionState;
  onCloseTip: () => void;
}

const SidebarRight: React.FC<SidebarRightProps> = ({
  chatHistory,
  onSendMessage,
  isTyping,
  quickTipState,
  onCloseTip,
}) => {
  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && pendingImages.length === 0) return;
    onSendMessage(input, pendingImages.length > 0 ? pendingImages : undefined);
    setInput('');
    setPendingImages([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPendingImages((prev) => [...prev, base64String]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            setPendingImages((prev) => [...prev, base64String]);
          };
          reader.readAsDataURL(blob);
          e.preventDefault(); // Prevent pasting the image filename as text
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-screen sticky top-0">
      {/* Quick Tip Section (Top 20%) */}
      <div className="h-[20%] flex flex-col border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-yellow-500" />
            <span>Quick Tip</span>
          </div>
          {quickTipState.isVisible && (
            <button
              onClick={onCloseTip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 text-sm">
          {!quickTipState.isVisible ? (
            <div className="text-gray-400 italic text-center mt-4">
              Select text in the curriculum to get an AI explanation here.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 border-l-2 border-gray-300 pl-2 line-clamp-3 italic">
                &quot;{quickTipState.expandedText}&quot;
              </div>
              {quickTipState.isLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="text-gray-800 dark:text-gray-200 prose-sm">
                  <MarkdownView content={quickTipState.response || ''} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Assistant Section (Remaining ~80%) */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <MessageSquare size={20} />
          <span>Chat Assistant</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {chatHistory.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-10">
              Ask me anything about your learning journey!
            </div>
          )}
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm
                ${msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                  }`}
              >
                {msg.images && msg.images.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {msg.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="User uploaded"
                        className="max-w-full rounded-lg border border-gray-300 dark:border-gray-700 max-h-60 object-contain mx-auto"
                      />
                    ))}
                  </div>
                )}
                <MarkdownView content={msg.text} />
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-500 animate-pulse">
                AI is thinking...
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="relative">
            {/* Image Preview Area */}
            {pendingImages.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                {pendingImages.map((img, idx) => (
                  <div key={idx} className="relative shrink-0">
                    <img src={img} alt="preview" className="h-16 w-16 object-cover rounded-md border border-gray-300 dark:border-gray-600" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                placeholder="Type a message... (Ctrl+V to paste image)"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white"
              />

              {/* File Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                title="Upload Image"
              >
                <Paperclip size={18} />
              </button>

              <button
                type="submit"
                disabled={(!input.trim() && pendingImages.length === 0) || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 disabled:opacity-50 p-1"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SidebarRight;
