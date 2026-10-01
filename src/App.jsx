import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import JobInputPanel from './components/JobInputPanel';
import ResumePreview from './components/ResumePreview';
import CoverLetterPreview from './components/CoverLetterPreview';
import ApiKeyModal from './components/ApiKeyModal';
import HistoryDrawer from './components/HistoryDrawer';
import NavigationDrawer from './components/NavigationDrawer';
import ProfilePage from './components/ProfilePage';
import AuthModal from './components/AuthModal';
import { Button } from './components/ui/button';

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
import AppAlertDialog from './components/ui/app-alert-dialog';

export default function App() {
  // Navigation View state: 'builder' | 'profile'
  const [currentView, setCurrentView] = useState('builder');

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // App Alert Dialog state (replaces native alert())
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    type: 'error',
  });

  const showAlert = (title, description, type = 'error') => {
    setAlertDialog({
      isOpen: true,
      title,
      description,
      type,
    });
  };

  // App system status
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  // Drawers & Modals state
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Inputs
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [rateType, setRateType] = useState('');
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
        await refreshStatus();
        await refreshHistory();
      }
    } catch {
      await refreshStatus();
      await refreshHistory();
    }
  };

  const refreshStatus = async () => {
    try {
      const status = await fetchStatus();
      setHasProfile(status.hasProfile);
    } catch (err) {
      console.error('Failed to check status:', err);
    }
  };

  const refreshHistory = async () => {
    try {
      const data = await fetchApplications();
      setHistoryCount(data.total ?? data.applications?.length ?? 0);
    } catch (err) {
      console.error('Failed to load history count:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    refreshStatus();
    refreshHistory();
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    refreshStatus();
    refreshHistory();
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLastSavedFolder(null);
    try {
      const response = await generateApplication({
        jobPost,
        companyName,
        roleTitle,
        notes,
        modelName,
      });

      const result = response.data || response;
      if (!result || !result.resume) {
        throw new Error('The AI model did not return a structured resume. Please try again.');
      }

      setResumeData(result.resume);
      setCoverLetterData(result.coverLetter);
      setRawMarkdown(result.resumeMarkdown || resumeJsonToMarkdown(result.resume));
      setMatchScore(result.atsMatchScoreEstimate || result.atsScore || 95);
      setMatchedKeywords(result.topKeywordsMatched || result.matchedKeywords || []);
      setActiveTab('resume');
    } catch (error) {
      console.error('Generation failed:', error);
      showAlert('Generation Error', error.message || 'Error generating application.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveBundle = async () => {
    if (!resumeData && !coverLetterData) {
      showAlert('Notice', 'No generated resume or cover letter to save.', 'warning');
      return;
    }

    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      let resumePdfBase64 = null;
      let coverLetterPdfBase64 = null;
      let resumeDocxBase64 = null;

      const resumeEl = document.getElementById('resume-document');
      if (resumeEl) {
        resumePdfBase64 = await getElementPdfBase64(resumeEl);
      }

      const coverEl = document.getElementById('cover-letter-document');
      if (coverEl) {
        coverLetterPdfBase64 = await getElementPdfBase64(coverEl);
      }

      if (resumeData) {
        try {
          resumeDocxBase64 = await getResumeDocxBase64(resumeData);
        } catch (docxErr) {
          console.warn('Word document generation failed during save bundle:', docxErr);
        }
      }

      const res = await saveBundle({
        companyName: companyName || resumeData?.personalInfo?.fullName || 'Company',
        roleTitle: roleTitle || 'Target_Role',
        minRate: minRate || null,
        maxRate: maxRate || null,
        rateType: rateType || null,
        jobPost,
        jobUrl,
        notes,
        resumeData,
        coverLetterData,
        resumeMarkdown: rawMarkdown || resumeJsonToMarkdown(resumeData),
        resumePdfBase64,
        coverLetterPdfBase64,
        resumeDocxBase64,
      });

      if (res.success) {
        setLastSavedFolder(res.folderName);
        refreshHistory();
      }
    } catch (error) {
      console.error('Failed to save bundle:', error);
      showAlert('Save Bundle Error', 'Error saving bundle: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadApplication = (bundleData) => {
    if (bundleData.companyName) setCompanyName(bundleData.companyName);
    if (bundleData.roleTitle) setRoleTitle(bundleData.roleTitle);
    if (bundleData.jobPost) setJobPost(bundleData.jobPost);
    if (bundleData.jobUrl) setJobUrl(bundleData.jobUrl);
    if (bundleData.notes) setNotes(bundleData.notes);

    const loadedMinRate = bundleData.minRate != null ? String(bundleData.minRate) : (bundleData.metadata?.minRate != null ? String(bundleData.metadata.minRate) : '');
    const loadedMaxRate = bundleData.maxRate != null ? String(bundleData.maxRate) : (bundleData.metadata?.maxRate != null ? String(bundleData.metadata.maxRate) : '');
    const loadedRateType = bundleData.rateType || bundleData.metadata?.rateType || '';

    setMinRate(loadedMinRate);
    setMaxRate(loadedMaxRate);
    setRateType(loadedRateType);

    if (bundleData.resumeData) {
      setResumeData(bundleData.resumeData);
      setRawMarkdown(resumeJsonToMarkdown(bundleData.resumeData));
    }
    if (bundleData.coverLetterData) {
      setCoverLetterData(bundleData.coverLetterData);
    }
    setLastSavedFolder(bundleData.folderName);
    setActiveTab('resume');
    setCurrentView('builder');
  };

  // Full-page Base Profile View
  if (currentView === 'profile') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <ProfilePage
          onBack={() => {
            setCurrentView('builder');
            refreshStatus();
          }}
          onProfileUpdated={() => {
            refreshStatus();
          }}
          user={currentUser}
        />

        {/* Global Drawers & Modals accessible from everywhere */}
        <NavigationDrawer
          isOpen={isNavDrawerOpen}
          onClose={() => setIsNavDrawerOpen(false)}
          user={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onOpenApplications={() => {
            setIsNavDrawerOpen(false);
            setIsHistoryOpen(true);
          }}
          onOpenApiKey={() => {
            setIsNavDrawerOpen(false);
            setIsApiKeyModalOpen(true);
          }}
          onNavigateToBaseProfile={() => {
            setIsNavDrawerOpen(false);
            setCurrentView('profile');
          }}
          hasKey={hasKey}
          hasProfile={hasProfile}
          historyCount={historyCount}
        />

        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onKeySaved={refreshKeyStatus}
        />

        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onLoadApplication={handleLoadApplication}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        <AppAlertDialog
          isOpen={alertDialog.isOpen}
          onClose={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}
          title={alertDialog.title}
          description={alertDialog.description}
          type={alertDialog.type}
        />
      </div>
    );
  }

  // Default Builder Layout
  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Top Header with Drawer Trigger on the right */}
      <Header
        user={currentUser}
        onOpenNavDrawer={() => setIsNavDrawerOpen(true)}
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
            minRate={minRate}
            setMinRate={setMinRate}
            maxRate={maxRate}
            setMaxRate={setMaxRate}
            rateType={rateType}
            setRateType={setRateType}
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
              <Button
                variant={activeTab === 'resume' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('resume')}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ATS Resume</span>
              </Button>

              <Button
                variant={activeTab === 'cover' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('cover')}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Cover Letter</span>
              </Button>
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

      {/* Workspace Menu Navigation Drawer (From right to left) */}
      <NavigationDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenApplications={() => {
          setIsNavDrawerOpen(false);
          setIsHistoryOpen(true);
        }}
        onOpenApiKey={() => {
          setIsNavDrawerOpen(false);
          setIsApiKeyModalOpen(true);
        }}
        onNavigateToBaseProfile={() => {
          setIsNavDrawerOpen(false);
          setCurrentView('profile');
        }}
        hasKey={hasKey}
        hasProfile={hasProfile}
        historyCount={historyCount}
      />

      {/* Gemini API Key Drawer (From right to left) */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={refreshKeyStatus}
      />

      {/* Applications Drawer (From right to left) */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onLoadApplication={handleLoadApplication}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* App Alert Dialog */}
      <AppAlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}
        title={alertDialog.title}
        description={alertDialog.description}
        type={alertDialog.type}
      />
    </div>
  );
}
