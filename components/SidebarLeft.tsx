import React from 'react';
import {
  BookOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  Settings,
} from 'lucide-react';
import { Category } from '../types';

interface SidebarLeftProps {
  categories: Category[];
  activeChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onToggleCategory: (id: string) => void;
  onOpenSettings: () => void;
  onAddCategory: () => void;
  onAddChaptersToCategory: (categoryId: string) => void;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({
  categories,
  activeChapterId,
  onSelectChapter,
  onToggleCategory,
  onOpenSettings,
  onAddCategory,
  onAddChaptersToCategory,
}) => {
  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-850 flex flex-col border-r border-gray-200 dark:border-gray-800 transition-colors duration-200 h-screen sticky top-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
          <BookOpen size={20} />
          <span>Curriculum</span>
        </div>
        <button
          onClick={onAddCategory}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
          title="Add Category"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {categories.length === 0 && (
          <div className="text-sm text-gray-400 text-center mt-10 p-4">
            No content. Click + to add a Subject Category.
          </div>
        )}
        {categories.map((category) => (
          <div key={category.id} className="mb-2">
            {/* Category Header */}
            <div className="flex items-center justify-between group px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
              <button
                onClick={() => onToggleCategory(category.id)}
                className="flex items-center gap-2 flex-1 text-left text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                {category.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Folder size={14} className="text-gray-400" />
                <span className="truncate">{category.title}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChaptersToCategory(category.id);
                }}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                title="Add Chapters"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Chapters List */}
            {category.isOpen && (
              <div className="ml-4 pl-2 border-l border-gray-200 dark:border-gray-700 mt-1 space-y-0.5">
                {category.chapters.length === 0 && (
                  <div className="px-2 py-1 text-xs text-gray-400 italic">No chapters</div>
                )}
                {category.chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => onSelectChapter(chapter.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2
                      ${
                        activeChapterId === chapter.id
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    <FileText
                      size={14}
                      className={activeChapterId === chapter.id ? 'text-blue-500' : 'text-gray-400'}
                    />
                    <span className="truncate">{chapter.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors w-full px-2 py-1 rounded"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default SidebarLeft;
