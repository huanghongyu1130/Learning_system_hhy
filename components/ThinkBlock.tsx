import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import MarkdownView from './MarkdownView';

interface ThinkBlockProps {
    content: string;
    isComplete?: boolean;
}

const ThinkBlock: React.FC<ThinkBlockProps> = ({ content, isComplete = true }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-collapse when complete
    useEffect(() => {
        if (isComplete) {
            setIsCollapsed(true);
        }
    }, [isComplete]);

    // Auto-scroll to bottom while generating (not complete)
    useEffect(() => {
        if (!isComplete && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [content, isComplete]);

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
                    {/* Recursive MarkdownView for thought content */}
                    <div
                        ref={scrollRef}
                        className="prose dark:prose-invert prose-sm max-w-none opacity-90 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"
                    >
                        <MarkdownView content={content} className="!bg-transparent !p-0" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThinkBlock;
