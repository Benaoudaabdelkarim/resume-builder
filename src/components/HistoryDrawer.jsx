import React, { useState, useEffect } from 'react';
import { X, FolderArchive, FileText, ArrowRight, Download, Calendar, Building2, Briefcase, Link2 } from 'lucide-react';
import { fetchApplications, fetchApplicationDetails } from '../utils/api';

export default function HistoryDrawer({ isOpen, onClose, onLoadApplication }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen]);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await fetchApplications();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (folderName) => {
    setSelectedFolder(folderName);
    try {
      const appData = await fetchApplicationDetails(folderName);
      if (onLoadApplication) {
        onLoadApplication(appData);
        onClose();
      }
    } catch (err) {
      alert('Could not load application bundle: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FolderArchive className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Saved Applications
              </h3>
              <p className="text-xs text-slate-500">
                Stored permanently in <code className="text-indigo-700 bg-indigo-50 px-1 rounded font-mono">./applications/</code>
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

        {/* List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
              Loading local applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
              No saved applications yet. Generate a resume and click <strong>Save Bundle</strong> to store it here!
            </div>
          ) : (
            applications.map((app, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(app.folderName)}
                className="group p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs rounded-xl cursor-pointer transition flex flex-col space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{app.companyName || 'Company'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5 font-medium">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>{app.roleTitle || 'Target Role'}</span>
                    </p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 group-hover:bg-blue-600 text-slate-500 group-hover:text-white transition shadow-xs">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[10px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : app.folderName}
                    </span>
                  </span>
                  <div className="flex items-center space-x-2">
                    {app.jobUrl && (
                      <span className="text-blue-600 font-semibold flex items-center space-x-0.5" title={app.jobUrl}>
                        <Link2 className="w-3 h-3" />
                        <span>Link</span>
                      </span>
                    )}
                    {app.hasResumePdf && (
                      <span className="text-emerald-700 font-mono font-medium">resume.pdf</span>
                    )}
                    {app.hasResumeDocx && (
                      <span className="text-indigo-700 font-mono font-medium">resume.docx</span>
                    )}
                    {app.hasCoverLetterPdf && (
                      <span className="text-blue-700 font-mono font-medium">cover.pdf</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-600 font-medium">
          <span>{applications.length} applications saved locally</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
