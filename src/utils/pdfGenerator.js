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
 * Triggers standard browser print dialog for 100% native vector quality.
 */
export function triggerPrint() {
  window.print();
}
