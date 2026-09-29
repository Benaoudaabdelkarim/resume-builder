document.getElementById('clipBtn').addEventListener('click', async () => {
  const btn = document.getElementById('clipBtn');
  const result = document.getElementById('result');

  btn.disabled = true;
  btn.innerText = 'Extracting job...';
  result.className = 'result';
  result.style.display = 'none';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active browser tab found');

    const injection = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        let title = '';
        let company = '';
        let text = '';
        const url = window.location.href;

        // Indeed selectors
        const indeedTitle = document.querySelector('h1.jobsearch-JobInfoHeader-title, [data-testid="jobsearch-JobInfoHeader-title"], h1');
        const indeedComp = document.querySelector('[data-testid="inlineHeader-companyName"], [data-company-name="true"], .jobsearch-CompanyInfoContainer');
        const indeedDesc = document.querySelector('#jobDescriptionText, [data-testid="jobDescriptionText"], .jobsearch-JobComponent-description');

        // LinkedIn selectors
        const liTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title');
        const liComp = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name');
        const liDesc = document.querySelector('#job-details, .jobs-description-content__text');

        if (indeedDesc) {
          title = indeedTitle ? indeedTitle.innerText.trim() : document.title;
          company = indeedComp ? indeedComp.innerText.trim() : '';
          text = indeedDesc.innerText.trim();
        } else if (liDesc) {
          title = liTitle ? liTitle.innerText.trim() : document.title;
          company = liComp ? liComp.innerText.trim() : '';
          text = liDesc.innerText.trim();
        } else {
          // General page fallback
          const sel = window.getSelection().toString();
          title = document.querySelector('h1')?.innerText.trim() || document.title;
          text = sel || document.body.innerText.slice(0, 15000);
        }

        return { url, title, company, text };
      },
    });

    const job = injection?.[0]?.result;
    if (!job || !job.text || job.text.length < 20) {
      throw new Error('No job description found on this page. Highlight the text and try again.');
    }

    btn.innerText = 'Sending to ATS Studio...';

    const response = await fetch('http://localhost:3001/api/clip-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      result.innerText = '✨ Sent to ATS Studio! Switch tabs to see your filled job details.';
      result.className = 'result success';
    } else {
      throw new Error(data.error || 'Server rejected clip');
    }
  } catch (err) {
    result.innerText = `Error: ${err.message}`;
    result.className = 'result error';
  } finally {
    btn.disabled = false;
    btn.innerText = '🚀 Send Active Tab to Studio';
  }
});
