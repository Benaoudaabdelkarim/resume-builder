import React from 'react';
import { Key, UserCheck, FolderArchive, Layers, User, LogOut, LogIn } from 'lucide-react';

export default function Header({
  user,
  onOpenAuthModal,
  onLogout,
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
      <div className="flex items-center flex-wrap gap-2 sm:gap-3">
        {/* Gemini API Key */}
        <button
          onClick={onOpenApiKeyModal}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
            hasKey
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 animate-pulse'
          }`}
          title="Gemini API Key is securely stored in your browser's localStorage"
        >
          <Key className="w-3.5 h-3.5 text-emerald-600" />
          <span>{hasKey ? 'Gemini Key (LocalStorage Active)' : 'Connect Gemini Key'}</span>
        </button>

        {/* Profile Markdown */}
        <button
          onClick={onOpenProfileModal}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
            hasProfile
              ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
          }`}
          title="Career profile is stored in profile.md for your account"
        >
          <UserCheck className={`w-3.5 h-3.5 ${hasProfile ? 'text-blue-600' : 'text-amber-600'}`} />
          <span>{hasProfile ? 'Base Profile (Ready)' : 'Add Base Profile (.md)'}</span>
        </button>

        {/* Saved Applications History */}
        <button
          onClick={onOpenHistory}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
        >
          <FolderArchive className="w-3.5 h-3.5 text-indigo-600" />
          <span>Applications</span>
          {historyCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
              {historyCount}
            </span>
          )}
        </button>

        {/* User Account / Auth Section */}
        {user ? (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="font-semibold text-slate-800 max-w-[120px] truncate" title={user.email}>
                {user.name}
              </span>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </header>
  );
}
