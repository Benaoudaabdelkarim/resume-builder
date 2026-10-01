import React from 'react';
import { Layers, User, Menu } from 'lucide-react';
import { Button } from './ui/button';

export default function Header({
  user,
  onOpenNavDrawer,
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-white border-b border-slate-200 shadow-xs">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1>ATS Resume Studio</h1>
          <p className="text-xs text-slate-500">
            Tailor resumes & cover letters locally • 100% ATS Ready
          </p>
        </div>
      </div>

      {/* Right side: Workspace Menu Drawer Trigger */}
      <div className="flex items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenNavDrawer}
          className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border-slate-300 px-3 py-1.5"
          title="Open Workspace Menu Drawer"
        >
          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
          </div>
          <span className="font-semibold text-slate-800 text-xs max-w-[120px] sm:max-w-[160px] truncate">
            {user?.name || 'Workspace Menu'}
          </span>
          <Menu className="w-4 h-4 text-slate-500" />
        </Button>
      </div>
    </header>
  );
}
