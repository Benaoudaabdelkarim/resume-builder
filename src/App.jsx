import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import JobInputPanel from './components/JobInputPanel';
import ResumePreview from './components/ResumePreview';
import CoverLetterPreview from './components/CoverLetterPreview';
import ApiKeyModal from './components/ApiKeyModal';
import ProfileModal from './components/ProfileModal';
import HistoryDrawer from './components/HistoryDrawer';
import AuthModal from './components/AuthModal';

import {
  fetchStatus,
  generateApplication,
  saveBundle,
  fetchApplications,
  checkClippedJob,
  fetchCurrentUser,
  logout,
  getStoredApiKey,
} from './utils/api';
import { getElementPdfBase64 } from './utils/pdfGenerator';
import { resumeJsonToMarkdown } from './utils/markdownFormatter';
import { getResumeDocxBase64 } from './utils/docxGenerator';
import { FileText, Mail, Sparkles } from 'lucide-react';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // App system status
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  // Modals state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Inputs
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [jobPost, setJobPost] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [modelName, setModelName] = useState('gemini-2.5-flash');

  // Outputs & Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedFolder, setLastSavedFolder] = useState(null);

  const [activeTab, setActiveTab] = useState('resume'); // 'resume' | 'cover'
  const [templateId, setTemplateId] = useState('modern'); // 'modern' | 'classic' | 'minimal'

  const [resumeData, setResumeData] = useState(null);
  const [coverLetterData, setCoverLetterData] = useState(null);
  const [rawMarkdown, setRawMarkdown] = useState('');
  const [matchScore, setMatchScore] = useState(null);
  const [matchedKeywords, setMatchedKeywords] = useState([]);

  // Check initial user, system status, and listen for clipped jobs
  useEffect(() => {
    refreshKeyStatus();
    initAuthAndStatus();

    const clipInterval = setInterval(async () => {
      try {
        const res = await checkClippedJob();
        if (res?.clip?.text) {
          setJobPost(res.clip.text);
          if (res.clip.url) setJobUrl(res.clip.url);
          if (res.clip.company && !companyName) setCompanyName(res.clip.company);
          if (res.clip.title && !roleTitle) {
            setRoleTitle(res.clip.title.split('|')[0].split('-')[0].trim());
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(clipInterval);
  }, []);

  const refreshKeyStatus = () => {
    const key = getStoredApiKey();
    setHasKey(Boolean(key));
    setMaskedKey(key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null);
  };

  const initAuthAndStatus = async () => {
    try {
      const user = await fetchCurrentUser();
      if (user) {
        setCurrentUser(user);
        await refreshStatus();
        await refreshHistory();
      } else {
        // Prompt login if no user session is found
        setIsAuthModalOpen(true);
      }
    } catch {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    refreshStatus();
    refreshHistory();
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setHistoryCount(0);
    setHasProfile(false);
    setIsAuthModalOpen(true);
  };

  const refreshStatus = async () => {
    try {
      const status = await fetchStatus();
      setHasProfile(status.hasProfile);
      refreshKeyStatus();
    } catch (err) {
      console.error('Failed to get status:', err);
    }
  };

  const refreshHistory = async () => {
    try {
      const data = await fetchApplications();
      setHistoryCount(data.applications?.length || 0);
    } catch (err) {
      console.error('Failed to get applications history:', err);
    }
  };

  // Generate ATS Application using Gemini
  const handleGenerate = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!hasProfile) {
      setIsProfileModalOpen(true);
      return;
    }

    if (!hasKey) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setLastSavedFolder(null);

    try {
      const res = await generateApplication({
        modelName,
        jobPost,
        companyName,
        roleTitle,
        notes,
      });

      const { data } = res;
      if (data.coverLetter) {
        data.coverLetter.date = new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
      setResumeData(data.resume);
      setCoverLetterData(data.coverLetter);
      setMatchScore(data.atsMatchScoreEstimate || 95);
      setMatchedKeywords(data.topKeywordsMatched || []);
      if (data.resumeMarkdown) {
        setRawMarkdown(data.resumeMarkdown);
      }

      if (data.matchedCompany && !companyName) {
        setCompanyName(data.matchedCompany);
      }
      if (data.matchedRole && !roleTitle) {
        setRoleTitle(data.matchedRole);
      }
    } catch (err) {
      console.error('Generation error:', err);
      alert('Error generating application: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the complete bundle locally
  const handleSaveBundle = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!resumeData && !coverLetterData) return;

    setIsSaving(true);
    try {
      // Generate PDF base64 representations if possible
      let resumePdfBase64 = null;
      let coverLetterPdfBase64 = null;

      const resumeEl = document.getElementById('resume-document');
      if (resumeEl) {
        try {
          resumePdfBase64 = await getElementPdfBase64(resumeEl, 'resume.pdf');
        } catch (e) {
          console.warn('Could not generate resume PDF buffer:', e);
        }
      }

      const coverEl = document.getElementById('cover-letter-document');
      if (coverEl) {
        try {
          coverLetterPdfBase64 = await getElementPdfBase64(coverEl, 'cover_letter.pdf');
        } catch (e) {
          console.warn('Could not generate cover letter PDF buffer:', e);
        }
      }

      let resumeDocxBase64 = null;
      if (resumeData) {
        try {
          resumeDocxBase64 = await getResumeDocxBase64(resumeData);
        } catch (e) {
          console.warn('Could not generate resume DOCX buffer:', e);
        }
      }

      const savePayload = {
        companyName: companyName || 'Company',
        roleTitle: roleTitle || 'Role',
        jobPost,
        jobUrl,
        notes,
        resumeData,
        resumeMarkdown: rawMarkdown || resumeJsonToMarkdown(resumeData),
        coverLetterData,
        templateId,
        resumePdfBase64,
        resumeDocxBase64,
        coverLetterPdfBase64,
      };

      const result = await saveBundle(savePayload);
      setLastSavedFolder(result.folderName);
      refreshHistory();
    } catch (err) {
      console.error('Failed to save bundle:', err);
      alert('Failed to save bundle: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Load a previously saved application
  const handleLoadApplication = (appData) => {
    setCompanyName(appData.metadata?.companyName || '');
    setRoleTitle(appData.metadata?.roleTitle || '');
    setJobPost(appData.jobPost || '');
    setJobUrl(appData.jobUrl || appData.metadata?.jobUrl || '');
    setNotes(appData.notes || '');
    if (appData.resumeData) setResumeData(appData.resumeData);
    if (appData.coverLetterData) setCoverLetterData(appData.coverLetterData);
    if (appData.resumeMarkdown) setRawMarkdown(appData.resumeMarkdown);
    if (appData.metadata?.templateId) setTemplateId(appData.metadata.templateId);
    setLastSavedFolder(appData.folderName);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      {/* App Header */}
      <Header
        user={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        hasKey={hasKey}
        maskedKey={maskedKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasProfile={hasProfile}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={historyCount}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4">
        {/* Left Side: Inputs */}
        <div className="w-full md:w-[420px] lg:w-[460px] h-full flex flex-col flex-shrink-0">
          <JobInputPanel
            companyName={companyName}
            setCompanyName={setCompanyName}
            roleTitle={roleTitle}
            setRoleTitle={setRoleTitle}
            jobPost={jobPost}
            setJobPost={setJobPost}
            jobUrl={jobUrl}
            setJobUrl={setJobUrl}
            notes={notes}
            setNotes={setNotes}
            modelName={modelName}
            setModelName={setModelName}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onSaveBundle={handleSaveBundle}
            isSaving={isSaving}
            hasGeneratedData={Boolean(resumeData || coverLetterData)}
            lastSavedFolder={lastSavedFolder}
          />
        </div>

        {/* Right Side: Tabbed Previews & Customizer */}
        <div className="flex-1 h-full flex flex-col overflow-hidden bg-white border border-slate-200 shadow-xs rounded-xl p-4">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('resume')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition ${
                  activeTab === 'resume'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ATS Resume</span>
              </button>

              <button
                onClick={() => setActiveTab('cover')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition ${
                  activeTab === 'cover'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Cover Letter</span>
              </button>
            </div>

            {resumeData && (
              <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Preview Ready</span>
              </div>
            )}
          </div>

          {/* Active Tab View */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'resume' ? (
              <ResumePreview
                resumeData={resumeData}
                onUpdateResume={setResumeData}
                templateId={templateId}
                setTemplateId={setTemplateId}
                rawMarkdown={rawMarkdown}
                onUpdateMarkdown={setRawMarkdown}
                onSaveBundle={handleSaveBundle}
                isSaving={isSaving}
                matchScore={matchScore}
                keywords={matchedKeywords}
                companyName={companyName}
              />
            ) : (
              <CoverLetterPreview
                coverLetterData={coverLetterData}
                onUpdateCoverLetter={setCoverLetterData}
                candidateName={resumeData?.personalInfo?.fullName}
                companyName={companyName}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={refreshKeyStatus}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdated={refreshStatus}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoadApplication={handleLoadApplication}
      />
    </div>
  );
}
