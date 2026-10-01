import React, { useState } from 'react';
import { Download, Copy, Check, Printer, Edit3, Sparkles } from 'lucide-react';
import { downloadElementAsPdf, triggerPrint } from '../utils/pdfGenerator';

export default function CoverLetterPreview({
  coverLetterData,
  onUpdateCoverLetter,
  candidateName,
  companyName,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!coverLetterData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-500 border-2 border-dashed border-slate-300 rounded-xl bg-white shadow-xs">
        <Sparkles className="w-12 h-12 text-blue-500 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800">No Cover Letter Generated Yet</h3>
        <p className="text-sm max-w-md mt-1 text-slate-500">
          Generate an ATS application to see your targeted cover letter matched to this company.
        </p>
      </div>
    );
  }

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const {
    recipient = 'Hiring Team',
    company = companyName || 'Company',
    date = todayFormatted,
    greeting = 'Dear Hiring Team,',
    bodyParagraphs = [],
    signOff = 'Sincerely,',
    senderName = candidateName || 'Candidate',
  } = coverLetterData;

  // Always ensure date is today's current date unless explicitly edited
  const activeDate = (!date || date.includes('e.g.') || date.toLowerCase().includes('current date'))
    ? todayFormatted
    : date;

  const handleParagraphChange = (idx, value) => {
    if (!onUpdateCoverLetter) return;
    const updated = { ...coverLetterData, date: activeDate };
    const paragraphs = [...(updated.bodyParagraphs || [])];
    paragraphs[idx] = value;
    updated.bodyParagraphs = paragraphs;
    onUpdateCoverLetter(updated);
  };

  const handleDateChange = (newDate) => {
    if (!onUpdateCoverLetter) return;
    onUpdateCoverLetter({ ...coverLetterData, date: newDate });
  };

  const getFullText = () => {
    return `${activeDate}\n\n${recipient}\n${company}\n\n${greeting}\n\n${(bodyParagraphs || []).join('\n\n')}\n\n${signOff}\n${senderName}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFullText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const el = document.getElementById('cover-letter-document');
      const filename = `${senderName.replace(/\s+/g, '_')}_Cover_Letter_${company.replace(/\s+/g, '_')}.pdf`;
      await downloadElementAsPdf(el, filename);
    } catch (err) {
      alert('Failed to export PDF: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="text-xs font-bold text-slate-800">
          Cover Letter for <span className="text-blue-600">{company}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
              isEditing ? 'bg-amber-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Done Editing</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>Edit Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            onClick={triggerPrint}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Letter Canvas */}
      <div className="flex-1 overflow-auto rounded-xl bg-slate-200/60 border border-slate-300/80 p-4 sm:p-6 shadow-inner">
        <div
          id="cover-letter-document"
          className="resume-paper bg-white text-gray-900 font-sans p-8 sm:p-12 max-w-[850px] mx-auto shadow-2xl rounded-sm leading-relaxed"
          style={{ minHeight: '1050px', color: '#111827' }}
        >
          {/* Header */}
          <div className="border-b border-gray-300 pb-4 mb-8">
            <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900">{senderName}</h1>
            <p className="text-xs text-gray-500 mt-1">Application for {company}</p>
          </div>

          <div className="text-sm text-gray-700 mb-6 space-y-1">
            {isEditing ? (
              <input
                type="text"
                value={activeDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="text-sm text-gray-800 border border-blue-300 rounded px-2 py-0.5 focus:outline-none w-48 font-medium"
              />
            ) : (
              <p>{activeDate}</p>
            )}
            <p className="font-semibold text-gray-900 mt-4">{recipient}</p>
            <p>{company}</p>
          </div>

          <div className="text-sm font-semibold text-gray-900 mb-4">{greeting}</div>

          <div className="space-y-4 text-sm text-gray-800 leading-relaxed text-justify">
            {bodyParagraphs.map((para, idx) => (
              <div key={idx} className="avoid-break">
                {isEditing ? (
                  <textarea
                    rows={4}
                    className="w-full text-sm text-gray-800 border border-blue-300 rounded p-2 focus:outline-none"
                    value={para}
                    onChange={(e) => handleParagraphChange(idx, e.target.value)}
                  />
                ) : (
                  <p className="avoid-break">{para}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-sm text-gray-900 space-y-3 avoid-break">
            <p>{signOff}</p>
            <p className="font-bold">{senderName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
