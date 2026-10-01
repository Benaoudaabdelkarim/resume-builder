import React from 'react';
import {
  X,
  User,
  LogOut,
  LogIn,
  FileText,
  FolderArchive,
  Key,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from './ui/drawer';

export default function NavigationDrawer({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onLogout,
  onOpenApplications,
  onOpenApiKey,
  onNavigateToBaseProfile,
  hasKey,
  hasProfile,
  historyCount = 0,
}) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction="right">
      <DrawerContent>
        {/* Drawer Header */}
        <DrawerHeader>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              ATS
            </div>
            <div>
              <DrawerTitle>Workspace Menu</DrawerTitle>
              <DrawerDescription>Account & Navigation</DrawerDescription>
            </div>
          </div>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col">
          {/* 1. User Account Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="text-slate-500 hover:text-rose-600"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 mr-1 text-rose-500" />
                  <span>Exit</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Guest User</p>
                  <p className="text-[11px] text-slate-500">Sign in to sync your profile</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  <span>Sign In</span>
                </Button>
              </div>
            )}
          </div>

          {/* 2. Navigation Actions */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Workspace Routes
            </span>

            {/* Route: Base Profile (Full Page) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToBaseProfile();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-400 transition text-left group shadow-2xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 block">
                    Base Career Profile
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Open full-page profile.md editor
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    hasProfile
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {hasProfile ? 'Configured' : 'Empty'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
              </div>
            </button>

            {/* Route: Saved Applications */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenApplications();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-400 transition text-left group shadow-2xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 block">
                    Applications History
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Saved resumes, cover letters & PDFs
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {historyCount > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                    {historyCount} saved
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">None</span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
              </div>
            </button>

            {/* Action Button: Add / Manage Gemini Key */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenApiKey();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-amber-400 transition text-left group shadow-2xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-amber-600 block">
                    Gemini API Key
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Browser localStorage setup
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    hasKey
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {hasKey ? 'Active' : 'Missing'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
              </div>
            </button>
          </div>

          {/* Privacy Note */}
          <div className="mt-auto p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>100% Local & Private</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Your profile, applications, and API keys are stored on your local machine with zero external tracking.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
