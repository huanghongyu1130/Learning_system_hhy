import React, { useState } from 'react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Category</h2>
        </div>
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category Name
          </label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && title.trim()) {
                onSubmit(title);
                onClose();
                setTitle('');
              }
            }}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Mathematics, Programming"
          />
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400">
            Cancel
          </button>
          <button
            onClick={() => {
              onSubmit(title);
              onClose();
              setTitle('');
            }}
            disabled={!title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
