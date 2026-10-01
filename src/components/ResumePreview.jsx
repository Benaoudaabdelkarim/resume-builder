import React, { useState, useRef } from 'react';
import { Download, Printer, Edit3, Check, Eye, Code, Sparkles, Copy, FileText } from 'lucide-react';
import ModernAtsTemplate from '../templates/ModernAtsTemplate';
import ClassicAtsTemplate from '../templates/ClassicAtsTemplate';
import MinimalTechTemplate from '../templates/MinimalTechTemplate';
import { downloadElementAsPdf, triggerPrint } from '../utils/pdfGenerator';
import { resumeJsonToMarkdown } from '../utils/markdownFormatter';
import { downloadResumeAsDocx } from '../utils/docxGenerator';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import AppAlertDialog from './ui/app-alert-dialog';

export default function ResumePreview({
  resumeData,
  onUpdateResume,
  templateId,
  setTemplateId,
  rawMarkdown,
  onUpdateMarkdown,
  onSaveBundle,
  isSaving,
  matchScore,
  keywords = [],
  companyName = '',
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'markdown'
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, title: '', message: '' });
  const printAreaRef = useRef(null);

  const displayedMarkdown = rawMarkdown || resumeJsonToMarkdown(resumeData);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(displayedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([displayedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sender = (resumeData?.personalInfo?.fullName || 'Candidate').replace(/\s+/g, '_');
    const comp = (companyName || 'Company').replace(/\s+/g, '_');
    a.download = `${sender}_Resume_${comp}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMarkdownChange = (val) => {
    if (onUpdateMarkdown) {
      onUpdateMarkdown(val);
    }
  };

  if (!resumeData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-500 border-2 border-dashed border-slate-300 rounded-xl bg-white shadow-xs">
        <Sparkles className="w-12 h-12 text-blue-500 mb-3 animate-pulse" />
        <h3>No Resume Generated Yet</h3>
        <p className="text-sm max-w-md mt-1 text-slate-500">
          Paste a job description on the left and click <strong className="text-blue-600">Generate ATS Application</strong> to see your tailored resume preview here.
        </p>
      </div>
    );
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const docElement = document.getElementById('resume-document');
      const senderName = resumeData.personalInfo?.fullName || 'Candidate';
      const comp = companyName || 'Company';
      const filename = `${senderName.replace(/\s+/g, '_')}_Resume_${comp.replace(/\s+/g, '_')}.pdf`;
      await downloadElementAsPdf(docElement, filename);
    } catch (err) {
      console.error('Download failed:', err);
      setErrorDialog({
        isOpen: true,
        title: 'PDF Export Failed',
        message: err.message || 'Could not generate PDF document.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsDownloadingDocx(true);
    try {
      await downloadResumeAsDocx(resumeData, companyName);
    } catch (err) {
      console.error('Word download failed:', err);
      setErrorDialog({
        isOpen: true,
        title: 'Word Export Failed',
        message: err.message || 'Could not generate Word document.',
      });
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        {/* Template Picker */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Template:</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-auto"
          >
            <option value="modern">Modern ATS (Recommended)</option>
            <option value="classic">Classic Executive ATS</option>
            <option value="minimal">MinimalTech ATS</option>
          </select>
        </div>

        {/* View mode toggle & edit toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setViewMode(viewMode === 'visual' ? 'markdown' : 'visual')}
            title="Toggle between rendered ATS preview and raw Markdown"
          >
            {viewMode === 'visual' ? (
              <>
                <Code className="w-3.5 h-3.5 text-indigo-600" />
                <span>View Markdown</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>View ATS Preview</span>
              </>
            )}
          </Button>

          <Button
            variant={isEditing ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Done Editing</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>Customize / Edit</span>
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => triggerPrint('resume-document', `${resumeData?.personalInfo?.fullName || 'Resume'} - ATS`)}
            title="Print or Save as Vector PDF with browser dialog"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download ATS Resume in PDF format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Exporting...' : 'Export PDF'}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadDocx}
            disabled={isDownloadingDocx}
            title="Download ATS Resume in Microsoft Word (.docx) format"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isDownloadingDocx ? 'Generating Word...' : 'Word (.docx)'}</span>
          </Button>
        </div>
      </div>

      {/* ATS Keywords & Highlights Bar */}
      {(matchScore || (keywords && keywords.length > 0)) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-blue-50/80 border border-blue-200 rounded-xl text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-blue-900">Estimated ATS Match:</span>
            <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              {matchScore || 95}%
            </span>
          </div>
          {keywords && keywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-600">Target Keywords:</span>
              {keywords.slice(0, 7).map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-300 text-[11px] font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Preview Canvas */}
      <div className="flex-1 overflow-auto rounded-xl bg-slate-200/60 border border-slate-300/80 p-4 sm:p-6 shadow-inner">
        {viewMode === 'visual' ? (
          <div ref={printAreaRef}>
            {templateId === 'classic' && (
              <ClassicAtsTemplate resume={resumeData} isEditing={isEditing} onUpdate={onUpdateResume} />
            )}
            {templateId === 'minimal' && (
              <MinimalTechTemplate resume={resumeData} isEditing={isEditing} onUpdate={onUpdateResume} />
            )}
            {templateId === 'modern' && (
              <ModernAtsTemplate resume={resumeData} isEditing={isEditing} onUpdate={onUpdateResume} />
            )}
          </div>
        ) : (
          <div className="max-w-[850px] mx-auto bg-white border border-slate-300 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ATS Markdown Source
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyMarkdown}
                  title="Copy raw markdown to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadMarkdown}
                  title="Download as .md file"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download .md</span>
                </Button>
              </div>
            </div>

            {isEditing ? (
              <Textarea
                value={displayedMarkdown}
                onChange={(e) => handleMarkdownChange(e.target.value)}
                className="w-full h-[650px] font-mono resize-y"
                placeholder="Resume markdown..."
              />
            ) : (
              <pre className="font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                {displayedMarkdown}
              </pre>
            )}
          </div>
        )}
      </div>

      <AppAlertDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog((prev) => ({ ...prev, isOpen: false }))}
        title={errorDialog.title}
        description={errorDialog.message}
        type="error"
      />
    </div>
  );
}
