import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { saveApiKey, getStoredApiKey, removeStoredApiKey } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from './ui/drawer';

export default function ApiKeyDrawer({ isOpen, onClose, onKeySaved }) {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey();
      setKeyInput(stored);
      setStatus(null);
    }
  }, [isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) {
      setStatus({ type: 'error', message: 'Please enter a valid Gemini API Key.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await saveApiKey(keyInput.trim());
      setStatus({ type: 'success', message: res.message || 'Key verified and stored in localStorage!' });
      if (onKeySaved) onKeySaved();
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 900);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to verify API key' });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    removeStoredApiKey();
    setKeyInput('');
    setStatus({ type: 'success', message: 'API Key removed from browser localStorage.' });
    if (onKeySaved) onKeySaved();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent
        className={`transition-all duration-300 ${
          isExpanded ? 'max-w-2xl sm:max-w-3xl' : 'max-w-md'
        }`}
      >
        <DrawerHeader className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <DrawerTitle>Gemini API Key Setup</DrawerTitle>
          </div>

          <div className="flex items-center space-x-1">
            {/* Extend / Collapse Drawer Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 text-slate-500 hover:text-slate-800"
              title={isExpanded ? 'Collapse width' : 'Expand width'}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>

            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5 flex flex-col">
          <DrawerDescription>
            Your Gemini key is stored securely in your browser's <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">localStorage</code>. It stays strictly on your machine and is never shared or stored on external servers.
          </DrawerDescription>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Gemini API Key
            </label>
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:underline font-medium"
            >
              <span>Get a free Gemini API key</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {getStoredApiKey() && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center space-x-1 text-rose-600 hover:underline font-medium cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Key</span>
              </button>
            )}
          </div>

          {status && (
            <div
              className={`flex items-start space-x-2 text-xs p-3 rounded-lg border ${
                status.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <div className="mt-auto pt-6 flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
            >
              {loading ? 'Verifying Key...' : 'Verify & Save'}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
