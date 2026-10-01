import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Briefcase,
  StickyNote,
  Link2,
  Globe,
  Loader2,
} from 'lucide-react';
import { fetchJobUrl } from '../utils/api';

export default function JobInputPanel({
  companyName,
  setCompanyName,
  roleTitle,
  setRoleTitle,
  jobPost,
  setJobPost,
  jobUrl,
  setJobUrl,
  notes,
  setNotes,
  modelName,
  setModelName,
  onGenerate,
  isGenerating,
  onSaveBundle,
  isSaving,
  hasGeneratedData,
  lastSavedFolder,
}) {
  const [error, setError] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlMessage, setUrlMessage] = useState(null);

  const handleFetchUrl = async () => {
    if (!jobUrl || !jobUrl.trim().startsWith('http')) {
      setError('Please enter a valid link starting with http:// or https://');
      return;
    }
    setError('');
    setIsFetchingUrl(true);
    setUrlMessage(null);

    // Try extracting role and location hints from URL parameters (e.g., Indeed ?q=laravel&l=Toronto)
    try {
      const parsedUrl = new URL(jobUrl.trim());
      const queryRole = parsedUrl.searchParams.get('q');
      const queryLoc = parsedUrl.searchParams.get('l');
      const jobKey = parsedUrl.searchParams.get('vjk') || parsedUrl.searchParams.get('jk');

      if (queryRole && !roleTitle) {
        const formattedRole = queryRole
          .split(/[\s+]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        setRoleTitle(formattedRole.includes('Developer') || formattedRole.includes('Engineer') ? formattedRole : `${formattedRole} Developer`);
      }
      if (queryLoc && !notes) {
        setNotes(`Target Location: ${decodeURIComponent(queryLoc)}`);
      }
      if (jobKey && parsedUrl.hostname.includes('indeed.')) {
        setJobUrl(`https://${parsedUrl.hostname}/viewjob?jk=${jobKey}`);
      }
    } catch {}

    try {
      const data = await fetchJobUrl(jobUrl.trim());
      if (data.text && data.text.length > 50) {
        setJobPost(data.text);
        setUrlMessage({ type: 'success', text: `Extracted ${data.text.length} characters from link!` });
        if (data.title && !roleTitle) {
          setRoleTitle(data.title.split('|')[0].split('-')[0].trim());
        }
        if (data.company && !companyName) {
          setCompanyName(data.company);
        }
        if (data.location && !notes) {
          setNotes(`Location: ${data.location}`);
        }
      } else {
        throw new Error('Page returned very little or no job text.');
      }
    } catch (err) {
      setUrlMessage({
        type: 'warning',
        text: err.message || 'Could not extract job text from link. Please paste the job description below.',
      });
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleGenerateClick = () => {
    if (!jobPost.trim()) {
      setError('Please paste the job description or bullet list first.');
      return;
    }
    setError('');
    onGenerate();
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Job & Target Details
          </h2>
        </div>
        <select
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          className="bg-slate-50 text-slate-800 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
          <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
          <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite</option>
          <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
          <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Job URL / Link Input */}
      <div>
        <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
          <span className="flex items-center space-x-1.5">
            <Link2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Job Post Link (Saved in bundle)</span>
          </span>
          <span className="text-[11px] text-slate-400 font-normal">Optional</span>
        </label>
        <div className="flex space-x-2">
          <input
            type="url"
            placeholder="https://company.com/careers/job-id..."
            value={jobUrl || ''}
            onChange={(e) => setJobUrl(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            type="button"
            onClick={handleFetchUrl}
            disabled={isFetchingUrl || !jobUrl?.trim()}
            className="flex items-center space-x-1 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-40 transition"
            title="Attempt to extract job description text directly from URL"
          >
            {isFetchingUrl ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>{isFetchingUrl ? 'Fetching...' : 'Fetch'}</span>
          </button>
        </div>
        {urlMessage && (
          <p
            className={`text-[11px] mt-1.5 font-medium ${
              urlMessage.type === 'success' ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {urlMessage.text}
          </p>
        )}
      </div>

      {/* Company & Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Target Company</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Google, Stripe, Startup"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>Target Role</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Senior Software Engineer"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Job Post Content */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
          <span>Job Description / Requirements List *</span>
          <span className="text-[11px] text-slate-400 font-normal">{jobPost.length} chars</span>
        </label>
        <textarea
          placeholder="Paste full job posting or bullet list here..."
          value={jobPost}
          onChange={(e) => setJobPost(e.target.value)}
          className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 resize-none font-mono"
        />
      </div>

      {/* Notes / Custom Instructions */}
      <div>
        <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1">
          <StickyNote className="w-3.5 h-3.5 text-amber-500" />
          <span>Extra Notes / Custom Instructions</span>
        </label>
        <textarea
          rows={3}
          placeholder="e.g., Emphasize AWS and Kubernetes; Highlight leadership experience; Keep summary under 3 sentences..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleGenerateClick}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-md shadow-blue-500/20 transition disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Analyzing & Tailoring...' : 'Generate ATS Application'}</span>
        </button>

        {hasGeneratedData && (
          <button
            onClick={onSaveBundle}
            disabled={isSaving}
            className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            title="Save job post, notes, resume, cover letter & PDFs into local folder"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving...' : 'Save Bundle'}</span>
          </button>
        )}
      </div>

      {lastSavedFolder && (
        <div className="flex items-start space-x-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
          <div className="truncate">
            <span className="font-semibold">Saved bundle locally to:</span>
            <p className="font-mono text-[11px] text-emerald-700 truncate">
              ./applications/{lastSavedFolder}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
