import React, { useState, useEffect } from 'react';
import { X, Upload, Save, CheckCircle2, FileText, AlertCircle, Sparkles, Copy, Check } from 'lucide-react';
import { fetchProfile, saveProfile } from '../utils/api';

const AI_PROMPT_TEMPLATE = `Please generate a super detailed master resume and career profile in Markdown format (.md) detailing all my skills, technical proficiencies, work experience with key metrics and achievements, projects, education, and credentials.`;

export default function ProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const [profileText, setProfileText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfileContent();
    }
  }, [isOpen]);

  const loadProfileContent = async () => {
    setLoading(true);
    setStatus(null);
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
        setStatus({ type: 'success', message: `Imported file: ${file.name}` });
      }
    };
    reader.readAsText(file);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!profileText.trim()) {
      setStatus({ type: 'error', message: 'Profile cannot be empty. Please paste your career details.' });
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      await saveProfile(profileText);
      setStatus({ type: 'success', message: 'Profile saved successfully!' });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Master Career Profile (profile.md)
              </h3>
              <p className="text-xs text-slate-500">
                Private to your account. Gemini uses this factual background to tailor every resume.
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

        {/* AI Guide / Helper Box */}
        <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border-b border-blue-100 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center space-x-1.5 font-bold text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>How to create your super detailed profile:</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Ask the AI you use that knows you best (ChatGPT, Claude, Gemini, etc.):
              </p>
              <div className="bg-white/90 p-2.5 rounded-lg border border-blue-200 font-mono text-[11px] text-blue-950 flex items-center justify-between gap-2 shadow-2xs">
                <span className="truncate">{AI_PROMPT_TEMPLATE}</span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold transition cursor-pointer flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer transition font-semibold shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import .md File</span>
              <input
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-slate-500 font-mono text-[11px]">
              {profileText.length} characters
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
        <div className="flex-1 p-5 overflow-hidden flex flex-col bg-slate-50/30">
          <textarea
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            disabled={loading}
            placeholder={`# Full Name\nEmail: ... | Phone: ... | Location: ... | LinkedIn / GitHub\n\n## Professional Summary\nDetailed summary of your career...\n\n## Technical Skills\n- Languages: ...\n- Frameworks & Tools: ...\n\n## Work Experience\n### Role Title — Company Name\n*Period | Location*\n* Bullet point detailing achievement, metrics, tools...\n\n## Education & Certifications\n...`}
            className="flex-1 w-full bg-white border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed shadow-inner"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white">
          <span className="text-xs text-slate-500">
            {profileText.trim().length > 0 ? (
              <span className="text-emerald-600 font-medium">✓ Ready to save</span>
            ) : (
              <span className="text-amber-600 font-medium">⚠️ No profile saved yet. Add your markdown above.</span>
            )}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !profileText.trim()}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile (.md)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
