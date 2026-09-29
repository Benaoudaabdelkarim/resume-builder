import React, { useState, useEffect } from 'react';
import { X, Upload, Save, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { fetchProfile, saveProfile } from '../utils/api';

export default function ProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const [profileText, setProfileText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadProfileContent();
    }
  }, [isOpen]);

  const loadProfileContent = async () => {
    setLoading(true);
    try {
      const data = await fetchProfile();
      setProfileText(data.content || '');
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to load profile: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setProfileText(content);
        setStatus({ type: 'success', message: `Loaded file: ${file.name}` });
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await saveProfile(profileText);
      setStatus({ type: 'success', message: 'Profile saved to profile.md successfully!' });
      if (onProfileUpdated) onProfileUpdated(profileText);
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 1000);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Candidate Base Profile (profile.md)
              </h3>
              <p className="text-xs text-slate-500">
                Stored permanently in <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">./profile.md</code>. Gemini automatically uses this factual career information for all generations without re-uploading.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer transition font-semibold">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import .md File</span>
              <input
                type="file"
                accept=".md,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-slate-500 font-mono text-[11px]">
              {profileText.length} characters (Saved to disk)
            </span>
          </div>

          {status && (
            <div
              className={`flex items-center space-x-1.5 text-xs font-semibold ${
                status.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>{status.message}</span>
            </div>
          )}
        </div>

        {/* Editor Body */}
        <div className="flex-1 p-5 overflow-hidden flex flex-col">
          <textarea
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            disabled={loading}
            placeholder="# Your Name&#10;**Email:** ... | **Phone:** ...&#10;&#10;## Summary&#10;...&#10;&#10;## Experience&#10;..."
            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
          <span className="text-xs text-slate-500">
            Permanently saved to <code className="text-blue-700 font-mono">./profile.md</code>
          </span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save to profile.md'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
