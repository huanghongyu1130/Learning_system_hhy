import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import MarkdownView from './MarkdownView';

interface ThinkBlockProps {
    content: string;
}

const ThinkBlock: React.FC<ThinkBlockProps> = ({ content }) => {
    const [isCollapsed, setIsCollapsed] = useState(false); // Default to open, or user preference

    if (!content) return null;

    return (
        <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-300 ease-in-out">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
            >
                {isCollapsed ? (
                    <ChevronRight size={16} className="text-gray-500 transition-transform duration-300" />
                ) : (
                    <ChevronDown size={16} className="text-gray-500 transition-transform duration-300" />
                )}
                <Brain size={16} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thinking Process
                </span>
            </button>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
                    }`}
            >
                <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 italic border-t border-gray-200 dark:border-gray-700">
                    {/* Recursive MarkdownView for thought content if needed, or just plain text/simple markdown */}
                    <div className="prose dark:prose-invert prose-sm max-w-none opacity-90">
                        {/* We use a simple whitespace-pre-wrap here or re-use MarkdownView but purely for text structure */}
                        <MarkdownView content={content} className="!bg-transparent !p-0" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThinkBlock;
