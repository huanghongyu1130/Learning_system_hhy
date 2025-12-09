import React, { useState } from 'react';

interface AddChaptersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  categoryTitle?: string;
}

const AddChaptersModal: React.FC<AddChaptersModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categoryTitle,
}) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Chapters to &quot;{categoryTitle}&quot;
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter your chapters (one per line). AI will generate lesson prompts for each.
          </p>
        </div>
        <div className="p-4">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-48 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            placeholder="Introduction&#10;Chapter 1: Basics&#10;Chapter 2: Advanced Topics"
          />
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">
            Cancel
          </button>
          <button
            onClick={() => {
              onSubmit(text);
              onClose();
              setText('');
            }}
            disabled={!text.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Generate Chapters
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddChaptersModal;
