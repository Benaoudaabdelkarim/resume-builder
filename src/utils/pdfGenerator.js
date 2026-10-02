import html2pdf from 'html2pdf.js';

/**
 * Standard configuration for ATS PDF generation.
 * Generates letter format with exact margins and vector-crisp text.
 */
const defaultOptions = {
  margin: [10, 10, 10, 10], // mm
  filename: 'resume.pdf',
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    letterRendering: true,
    scrollY: 0,
    scrollX: 0,
  },
  jsPDF: {
    unit: 'mm',
    format: 'letter',
    orientation: 'portrait',
  },
  pagebreak: {
    mode: ['css', 'legacy'],
    avoid: [
      '.avoid-break',
      '.skill-group',
      '.experience-item',
      '.education-item',
      '.project-item',
      'li',
      'p',
    ],
  },
};

/**
 * Downloads the PDF directly to the user's browser.
 */
export async function downloadElementAsPdf(element, filename = 'resume.pdf') {
  if (!element) return;
  const opt = { ...defaultOptions, filename };
  await html2pdf().set(opt).from(element).save();
}

/**
 * Generates base64 string of the PDF so it can be saved directly on the local filesystem.
 */
export async function getElementPdfBase64(element, filename = 'document.pdf') {
  if (!element) return null;
  const opt = { ...defaultOptions, filename };
  const pdfUri = await html2pdf().set(opt).from(element).output('datauristring');
  return pdfUri;
}

/**
 * Triggers standard browser print dialog for ONLY the document element,
 * producing 100% native vector quality with selectable, copyable text.
 */
export function triggerPrint(elementOrId, documentTitle = 'Document') {
  let element = null;
  if (typeof elementOrId === 'string') {
    element = document.getElementById(elementOrId);
  } else if (elementOrId instanceof HTMLElement) {
    element = elementOrId;
  } else {
    element = document.getElementById('resume-document') || document.getElementById('cover-letter-document');
  }

  if (!element) {
    window.print();
    return;
  }

  // Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.setAttribute('style', 'position:fixed;top:0;left:0;width:0;height:0;border:0;visibility:hidden;z-index:-9999;');
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;

  // Clone all styles and stylesheets from parent document
  let stylesHtml = '';
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    stylesHtml += node.outerHTML;
  });

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${documentTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        ${stylesHtml}
        <style>
          @page {
            size: letter portrait;
            margin: 0 !important;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #ffffff !important;
            color: #111827 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
          .isolated-print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 10mm 14mm !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          .avoid-break, .skill-group, .experience-item, .education-item, .project-item, li, p, h1, h2, h3, h4 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        <div class="isolated-print-wrapper ${element.className || ''}">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Give styles a brief moment to render, then open native print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print():', e);
      window.print();
    } finally {
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        } catch {}
      }, 2000);
    }
  }, 250);
}
