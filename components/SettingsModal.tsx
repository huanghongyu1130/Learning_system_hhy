import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { AppSettings } from '../types';
import { testConnection } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'generation' | 'tips' | 'chat'>('general');
  const [testStatus, setTestStatus] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  // Reset test status when tab changes
  useEffect(() => {
    setTestStatus({ status: 'idle', message: '' });
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async (key: 'generationAI' | 'tipsAI' | 'chatAI') => {
    setTestStatus({ status: 'testing', message: 'Connecting...' });
    const result = await testConnection(localSettings[key]);
    if (result.success) {
      setTestStatus({ status: 'success', message: result.message });
    } else {
      setTestStatus({ status: 'error', message: result.message });
    }
  };

  const renderConfigSection = (key: 'generationAI' | 'tipsAI' | 'chatAI', label: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{label}</h3>

      {/* Base URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Base URL (Optional)
        </label>
        <input
          type="text"
          value={localSettings[key].baseUrl}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              [key]: { ...localSettings[key], baseUrl: e.target.value },
            })
          }
          placeholder="e.g. https://generativelanguage.googleapis.com"
          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          API Key
        </label>
        <input
          type="password"
          value={localSettings[key].apiKey}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              [key]: { ...localSettings[key], apiKey: e.target.value },
            })
          }
          placeholder="Enter API Key"
          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Model Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Model Name
        </label>
        <input
          type="text"
          value={localSettings[key].model}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              [key]: { ...localSettings[key], model: e.target.value },
            })
          }
          placeholder="e.g. gumini-2.5-flash"
          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Base Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Base Prompt
        </label>
        <textarea
          value={localSettings[key].basePrompt}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              [key]: { ...localSettings[key], basePrompt: e.target.value },
            })
          }
          rows={6}
          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
      </div>

      {/* Test Button & Status */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => handleTestConnection(key)}
          disabled={testStatus.status === 'testing'}
          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          {testStatus.status === 'testing' ? 'Connecting...' : 'Test Connection'}
        </button>
        {testStatus.status === 'success' && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle size={16} />
            <span className="truncate max-w-[250px]">{testStatus.message}</span>
          </div>
        )}
        {testStatus.status === 'error' && (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} />
            <span className="truncate max-w-[250px]">{testStatus.message}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {(['general', 'generation', 'tips', 'chat'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
            >
              {tab === 'general' ? 'General' : tab.charAt(0).toUpperCase() + tab.slice(1) + ' AI'}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                General Settings
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Output Language
                </label>
                <input
                  type="text"
                  value={localSettings.language}
                  onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value })}
                  placeholder="e.g. Traditional Chinese, English, Japanese"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This language setting will be appended to all AI prompts to ensure responses are
                  in your preferred language.
                </p>
              </div>
            </div>
          )}
          {activeTab === 'generation' &&
            renderConfigSection('generationAI', 'Content Generation AI')}
          {activeTab === 'tips' && renderConfigSection('tipsAI', 'Tips/Q&A AI')}
          {activeTab === 'chat' && renderConfigSection('chatAI', 'Chat Assistant AI')}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(localSettings);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
