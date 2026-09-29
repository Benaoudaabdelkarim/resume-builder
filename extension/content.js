// Content script running inside Indeed and LinkedIn
(function () {
  console.log('[ATS Studio Clipper] Active on page');

  // Prevent multiple injections
  if (document.getElementById('ats-studio-clipper-btn')) return;

  function extractJobDetails() {
    let title = '';
    let company = '';
    let text = '';
    const url = window.location.href;

    // Detect Indeed
    if (window.location.hostname.includes('indeed.com')) {
      const titleEl =
        document.querySelector('h1.jobsearch-JobInfoHeader-title') ||
        document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]') ||
        document.querySelector('h1');
      title = titleEl ? titleEl.innerText.trim() : '';

      const compEl =
        document.querySelector('[data-testid="inlineHeader-companyName"]') ||
        document.querySelector('[data-company-name="true"]') ||
        document.querySelector('.jobsearch-CompanyInfoContainer');
      company = compEl ? compEl.innerText.trim() : '';

      const descEl =
        document.querySelector('#jobDescriptionText') ||
        document.querySelector('[data-testid="jobDescriptionText"]') ||
        document.querySelector('.jobsearch-JobComponent-description');
      text = descEl ? descEl.innerText.trim() : '';
    }

    // Detect LinkedIn
    if (window.location.hostname.includes('linkedin.com')) {
      const titleEl =
        document.querySelector('.job-details-jobs-unified-top-card__job-title') ||
        document.querySelector('.jobs-unified-top-card__job-title') ||
        document.querySelector('h1');
      title = titleEl ? titleEl.innerText.trim() : '';

      const compEl =
        document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
        document.querySelector('.jobs-unified-top-card__company-name');
      company = compEl ? compEl.innerText.trim() : '';

      const descEl =
        document.querySelector('#job-details') ||
        document.querySelector('.jobs-description-content__text') ||
        document.querySelector('.jobs-box__html-content');
      text = descEl ? descEl.innerText.trim() : '';
    }

    // Fallback if generic site or selection
    if (!text) {
      const sel = window.getSelection().toString();
      text = sel || document.body.innerText.slice(0, 15000);
    }
    if (!title) {
      title = document.title;
    }

    return { url, title, company, text };
  }

  async function sendToStudio() {
    const job = extractJobDetails();
    if (!job.text || job.text.length < 30) {
      showToast('⚠️ No job description found on this page. Please select the job text first.', true);
      return;
    }

    const btn = document.getElementById('ats-studio-clipper-btn');
    if (btn) {
      btn.innerText = '⏳ Sending to ATS Studio...';
      btn.style.opacity = '0.7';
    }

    try {
      const response = await fetch('http://localhost:3001/api/clip-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast('✨ Job sent to ATS Studio! Check your Studio tab.', false);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err) {
      console.error('[ATS Studio Clipper Error]', err);
      showToast('❌ Could not connect to ATS Studio. Make sure "npm run dev" is running!', true);
    } finally {
      if (btn) {
        btn.innerHTML = '🚀 Send to ATS Studio';
        btn.style.opacity = '1';
      }
    }
  }

  function showToast(message, isError) {
    const existing = document.getElementById('ats-studio-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ats-studio-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 75px;
      right: 24px;
      background: ${isError ? '#ef4444' : '#059669'};
      color: #ffffff;
      padding: 12px 18px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      z-index: 9999999;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    `;
    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function injectFloatingButton() {
    if (document.getElementById('ats-studio-clipper-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'ats-studio-clipper-btn';
    btn.innerHTML = '🚀 Send to ATS Studio';
    btn.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #2563eb;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 9999px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 700;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
      cursor: pointer;
      z-index: 9999998;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    `;

    btn.onmouseover = () => {
      btn.style.background = '#1d4ed8';
      btn.style.transform = 'translateY(-2px)';
    };
    btn.onmouseout = () => {
      btn.style.background = '#2563eb';
      btn.style.transform = 'translateY(0)';
    };

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      sendToStudio();
    };

    document.body.appendChild(btn);
  }

  // Inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFloatingButton);
  } else {
    injectFloatingButton();
  }

  // Observe page changes (Indeed and LinkedIn are SPAs)
  const observer = new MutationObserver(() => {
    if (!document.getElementById('ats-studio-clipper-btn')) {
      injectFloatingButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
