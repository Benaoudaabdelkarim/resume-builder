import React from 'react';
import { Key, UserCheck, History, Sparkles, FolderArchive, Layers } from 'lucide-react';

export default function Header({
  hasKey,
  maskedKey,
  onOpenApiKeyModal,
  hasProfile,
  onOpenProfileModal,
  onOpenHistory,
  historyCount = 0,
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-white border-b border-slate-200 shadow-xs">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>ATS Resume Studio</span>
            <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Desktop Pro
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Tailor resumes & cover letters locally • 100% ATS Ready
          </p>
        </div>
      </div>

      {/* Actions / Status badges */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Gemini API Key */}
        <button
          onClick={onOpenApiKeyModal}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            hasKey
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 animate-pulse'
          }`}
          title="Gemini API Key is securely stored in .env on your computer"
        >
          <Key className="w-3.5 h-3.5 text-emerald-600" />
          <span>{hasKey ? `Gemini Key (.env Active)` : 'Connect Gemini Key'}</span>
        </button>

        {/* Profile Markdown */}
        <button
          onClick={onOpenProfileModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition"
          title="Master career profile is stored permanently in profile.md"
        >
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>{hasProfile ? 'Base Profile (profile.md Stored)' : 'Base Profile (MD)'}</span>
        </button>

        {/* Saved Applications History */}
        <button
          onClick={onOpenHistory}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
        >
          <FolderArchive className="w-3.5 h-3.5 text-indigo-600" />
          <span>Applications</span>
          {historyCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
              {historyCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
