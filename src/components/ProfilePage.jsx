import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Upload,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Edit3,
} from 'lucide-react';
import { marked } from 'marked';
import { fetchProfile, saveProfile } from '../utils/api';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

const AI_PROMPT_TEMPLATE = `Please generate a super detailed master resume and career profile in Markdown format (.md) detailing all my skills, technical proficiencies, work experience with key metrics and achievements, projects, education, and credentials.`;

export default function ProfilePage({ onBack, onProfileUpdated, user }) {
  const [profileText, setProfileText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'

  useEffect(() => {
    loadProfileContent();
  }, []);

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
      setStatus({ type: 'success', message: 'Master profile saved successfully!' });
      if (onProfileUpdated) onProfileUpdated(profileText);
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Preview rendered HTML
  const getRenderedHtml = () => {
    try {
      return marked.parse(profileText || '');
    } catch {
      return '<p>Error rendering preview</p>';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Studio</span>
          </Button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">
                Master Career Profile <code className="text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">profile.md</code>
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {user ? `Private to ${user.name}` : 'Your factual source of truth for ATS tailoring'}
              </p>
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <label className="btn-secondary btn-sm cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import .md</span>
            <input
              type="file"
              accept=".md,.markdown,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || !profileText.trim()}
          >
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </Button>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-4 flex flex-col">
        {/* Status notification */}
        {status && (
          <div
            className={`flex items-center space-x-2 p-3.5 rounded-xl border text-xs font-medium animate-in fade-in ${
              status.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {/* AI Prompt Guide Box */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/80 rounded-2xl text-xs space-y-3 shadow-2xs">
          <div className="flex items-center space-x-2 font-bold text-blue-900 text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Need help drafting your detailed profile?</span>
          </div>
          <p className="text-slate-600 leading-relaxed max-w-3xl">
            Ask the AI you use that knows your background best (ChatGPT, Claude, Gemini, etc.) with this prompt to generate your comprehensive markdown:
          </p>
          <div className="bg-white p-3 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <p className="font-mono text-[11px] text-blue-950 flex-1 leading-relaxed">
              {AI_PROMPT_TEMPLATE}
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCopyPrompt}
              className="flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prompt</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Editor Container */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[600px]">
          {/* Editor Sub-header / Tab selector */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex space-x-1 bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
              <Button
                variant={activeTab === 'edit' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('edit')}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Markdown Editor</span>
              </Button>
              <Button
                variant={activeTab === 'preview' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('preview')}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Rendered Preview</span>
              </Button>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono">
              <span>{profileText.length} characters</span>
              <span>•</span>
              <span>{profileText.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>

          {/* Body Area */}
          <div className="flex-1 p-5 overflow-auto flex flex-col">
            {activeTab === 'edit' ? (
              <Textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                disabled={loading}
                placeholder={`# Full Name\nEmail: alex@example.com | Phone: (555) 123-4567 | Location: Toronto, ON | LinkedIn / GitHub\n\n## Professional Summary\nStaff Frontend Engineer with 8+ years experience building large-scale React and Next.js applications...\n\n## Technical Skills\n- Languages: TypeScript, JavaScript, Python, SQL\n- Frameworks: React, Next.js, Vue, Tailwind CSS\n- Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD pipelines\n\n## Professional Experience\n### Senior Frontend Engineer — Tech Corp\n*2021 – Present | San Francisco, CA*\n- Architected core dashboard rendering 100k+ data points with 60fps performance.\n- Reduced bundle size by 35% through dynamic imports and code splitting.\n\n## Education & Certifications\n- B.S. in Computer Science — University of Technology (2018)`}
                className="flex-1 w-full font-mono text-xs leading-relaxed p-4 border-0 focus:ring-0 resize-none min-h-[550px]"
              />
            ) : (
              <div
                className="prose prose-slate max-w-none text-xs sm:text-sm p-4 leading-relaxed overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: getRenderedHtml() }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
