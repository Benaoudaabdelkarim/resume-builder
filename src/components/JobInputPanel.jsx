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
  DollarSign,
} from 'lucide-react';
import { fetchJobUrl } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export default function JobInputPanel({
  companyName,
  setCompanyName,
  roleTitle,
  setRoleTitle,
  minRate,
  setMinRate,
  maxRate,
  setMaxRate,
  rateType,
  setRateType,
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
        if (data.minRate !== undefined && data.minRate !== null && setMinRate) {
          setMinRate(String(data.minRate));
        }
        if (data.maxRate !== undefined && data.maxRate !== null && setMaxRate) {
          setMaxRate(String(data.maxRate));
        }
        if (data.rateType && setRateType) {
          setRateType(data.rateType);
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
    <Card className="flex flex-col h-full overflow-hidden shadow-xs border-slate-200">
      {/* shadcn CardHeader with Select dropdown */}
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-4 sm:p-5 space-y-0">
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2>JOB & TARGET DETAILS</h2>
        </CardTitle>

        <Select value={modelName} onValueChange={setModelName}>
          <SelectTrigger className="w-auto">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
            <SelectItem value="gemini-3.8-flash">Gemini 3.8 Flash</SelectItem>
            <SelectItem value="gemini-3.6-flash">Gemini 3.6 Flash</SelectItem>
            <SelectItem value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite</SelectItem>
            <SelectItem value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</SelectItem>
            <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
            <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      {/* shadcn CardContent */}
      <CardContent className="flex-1 flex flex-col p-4 sm:p-5 space-y-4 overflow-y-auto">
        {error && (
          <div className="flex items-center space-x-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Job URL / Link Input */}
        <div>
          <Label className="flex items-center justify-between mb-1.5">
            <span className="flex items-center space-x-1.5">
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Job Post Link (Saved in bundle)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Optional</span>
          </Label>
          <div className="flex space-x-2">
            <Input
              type="url"
              placeholder="https://company.com/careers/job-id..."
              value={jobUrl || ''}
              onChange={(e) => setJobUrl(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleFetchUrl}
              disabled={isFetchingUrl || !jobUrl?.trim()}
              title="Attempt to extract job description text directly from URL"
            >
              {isFetchingUrl ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>{isFetchingUrl ? 'Fetching...' : 'Fetch'}</span>
            </Button>
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
            <Label className="flex items-center space-x-1.5 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Company</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g. Google, Stripe, Startup"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div>
            <Label className="flex items-center space-x-1.5 mb-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Role</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g. Senior Software Engineer"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />
          </div>
        </div>

        {/* Compensation / Rates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <Label className="flex items-center space-x-1 mb-1.5 text-xs">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>Min Rate</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g. 120,000 or 75"
              value={minRate || ''}
              onChange={(e) => setMinRate && setMinRate(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div>
            <Label className="flex items-center space-x-1 mb-1.5 text-xs">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>Max Rate</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g. 160,000 or 95"
              value={maxRate || ''}
              onChange={(e) => setMaxRate && setMaxRate(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div>
            <Label className="flex items-center space-x-1 mb-1.5 text-xs">
              <span>Rate Type</span>
            </Label>
            <Select
              value={rateType || 'none'}
              onValueChange={(val) => setRateType && setRateType(val === 'none' ? '' : val)}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not Specified</SelectItem>
                <SelectItem value="hourly">Hourly ($/hr)</SelectItem>
                <SelectItem value="monthly">Monthly ($/mo)</SelectItem>
                <SelectItem value="yearly">Yearly ($/yr)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Job Post Content */}
        <div className="flex-1 flex flex-col min-h-[220px]">
          <Label className="mb-1.5 flex items-center justify-between">
            <span>Job Description / Requirements List *</span>
            <span className="text-[11px] text-slate-400 font-normal">{jobPost.length} chars</span>
          </Label>
          <Textarea
            placeholder="Paste full job posting or bullet list here..."
            value={jobPost}
            onChange={(e) => setJobPost(e.target.value)}
            className="flex-1 min-h-[180px] resize-y"
          />
        </div>

        {/* Notes / Custom Instructions */}
        <div>
          <Label className="flex items-center space-x-1.5 mb-1.5">
            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
            <span>Extra Notes / Custom Instructions</span>
          </Label>
          <Textarea
            rows={3}
            placeholder="e.g., Emphasize AWS and Kubernetes; Highlight leadership experience; Keep summary under 3 sentences..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[90px] resize-y"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <Button
            variant="primary"
            onClick={handleGenerateClick}
            disabled={isGenerating}
            className="flex-1"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Analyzing & Tailoring...' : 'Generate ATS Application'}</span>
          </Button>

          {hasGeneratedData && (
            <Button
              variant="success"
              onClick={onSaveBundle}
              disabled={isSaving}
              title="Save job post, notes, resume, cover letter & PDFs into local folder"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Saving...' : 'Save Bundle'}</span>
            </Button>
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
      </CardContent>
    </Card>
  );
}
