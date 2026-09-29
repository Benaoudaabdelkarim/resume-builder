import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { saveApiKey } from '../utils/api';

export default function ApiKeyModal({ isOpen, onClose, onKeySaved }) {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }

  if (!isOpen) return null;

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
      setStatus({ type: 'success', message: res.message || 'Key verified and saved!' });
      onKeySaved();
      setTimeout(() => {
        onClose();
        setStatus(null);
        setKeyInput('');
      }, 1200);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to verify API key' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Gemini API Key Setup
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Your key is stored permanently in <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">.env</code> on your local disk. Once saved, it will automatically load every time you launch the studio.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:underline font-medium"
            >
              <span>Get a free Gemini API key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
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

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Verifying Key...' : 'Verify & Save to .env'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
