import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  TabStopType,
  TabStopPosition,
  AlignmentType,
} from 'docx';

/**
 * Strip raw markdown asterisks and citations from text.
 */
const cleanText = (str) => {
  if (!str) return '';
  return str.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[cite:\s*\d+\]/gi, '').trim();
};

/**
 * Generates a docx Document object from structured ATS resume JSON.
 */
export function generateResumeDocx(resumeData) {
  const {
    personalInfo = {},
    summary = '',
    skills = [],
    experience = [],
    education = [],
    projects = [],
  } = resumeData || {};

  const children = [];

  // 1. Name & Contact Info Header
  if (personalInfo.fullName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cleanText(personalInfo.fullName),
            bold: true,
            size: 36, // 18pt
            font: 'Calibri',
            color: '111827',
          }),
        ],
        spacing: { before: 0, after: 40 },
      })
    );
  }

  if (personalInfo.headline) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cleanText(personalInfo.headline),
            bold: true,
            size: 22, // 11pt
            font: 'Calibri',
            color: '374151',
          }),
        ],
        spacing: { before: 0, after: 60 },
      })
    );
  }

  const contacts = [
    cleanText(personalInfo.email),
    cleanText(personalInfo.phone),
    cleanText(personalInfo.location),
    cleanText(personalInfo.portfolio),
    cleanText(personalInfo.linkedin),
    cleanText(personalInfo.github),
  ].filter(Boolean);

  if (contacts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contacts.join('  •  '),
            size: 20, // 10pt
            font: 'Calibri',
            color: '4B5563',
          }),
        ],
        spacing: { before: 0, after: 160 },
      })
    );
  }

  // Helper for section headings (no underline per ATS styling rules)
  const addSectionHeading = (title) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 24, // 12pt
            font: 'Calibri',
            color: '111827',
          }),
        ],
        spacing: { before: 200, after: 60 },
      })
    );
  };

  // 2. Professional Summary
  if (summary && summary.trim()) {
    addSectionHeading('Professional Summary');
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cleanText(summary),
            size: 21, // 10.5pt
            font: 'Calibri',
            color: '1F2937',
          }),
        ],
        alignment: AlignmentType.BOTH,
        spacing: { before: 0, after: 120 },
      })
    );
  }

  // 3. Technical Skills & Competencies
  if (skills && skills.length > 0) {
    addSectionHeading('Technical Skills & Competencies');
    skills.forEach((group) => {
      const cat = group.category ? cleanText(group.category).replace(/:\s*$/, '') : 'Skills';
      const items = Array.isArray(group.items)
        ? group.items.map(cleanText).join(', ')
        : cleanText(group.items);

      // Line 1: Bold category name
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cat,
              bold: true,
              size: 21, // 10.5pt
              font: 'Calibri',
              color: '111827',
            }),
          ],
          spacing: { before: 60, after: 20 },
        })
      );

      // Line 2: Items
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: items,
              size: 21, // 10.5pt
              font: 'Calibri',
              color: '1F2937',
            }),
          ],
          spacing: { before: 0, after: 80 },
        })
      );
    });
  }

  // 4. Professional Experience
  if (experience && experience.length > 0) {
    addSectionHeading('Professional Experience');
    experience.forEach((exp) => {
      // Role & Period
      const roleText = cleanText(exp.role) || 'Position';
      const periodText = cleanText(exp.period);

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: roleText,
              bold: true,
              size: 22, // 11pt
              font: 'Calibri',
              color: '111827',
            }),
            ...(periodText
              ? [
                  new TextRun({
                    text: `\t${periodText}`,
                    bold: false,
                    size: 20, // 10pt
                    font: 'Calibri',
                    color: '4B5563',
                  }),
                ]
              : []),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { before: 120, after: 20 },
        })
      );

      // Company & Location (below role)
      const companyParts = [cleanText(exp.company), cleanText(exp.location)].filter(Boolean);
      if (companyParts.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: companyParts.join(' • '),
                size: 21, // 10.5pt
                font: 'Calibri',
                color: '374151',
              }),
            ],
            spacing: { before: 0, after: 40 },
          })
        );
      }

      // Bullets
      if (Array.isArray(exp.bullets)) {
        exp.bullets.forEach((b) => {
          if (b && b.trim()) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: cleanText(b),
                    size: 21, // 10.5pt
                    font: 'Calibri',
                    color: '1F2937',
                  }),
                ],
                bullet: { level: 0 },
                spacing: { before: 20, after: 40 },
              })
            );
          }
        });
      }
    });
  }

  // 5. Key Projects
  if (projects && projects.length > 0) {
    addSectionHeading('Key Projects');
    projects.forEach((proj) => {
      const projName = cleanText(proj.name) || 'Project';
      const tech = cleanText(proj.technologies);

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: projName,
              bold: true,
              size: 22, // 11pt
              font: 'Calibri',
              color: '111827',
            }),
            ...(tech
              ? [
                  new TextRun({
                    text: ` — ${tech}`,
                    italics: true,
                    size: 20,
                    font: 'Calibri',
                    color: '4B5563',
                  }),
                ]
              : []),
          ],
          spacing: { before: 100, after: 20 },
        })
      );

      if (proj.link) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(proj.link),
                size: 20,
                font: 'Calibri',
                color: '2563EB', // blue
              }),
            ],
            spacing: { before: 0, after: 40 },
          })
        );
      }

      if (Array.isArray(proj.bullets)) {
        proj.bullets.forEach((b) => {
          if (b && b.trim()) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: cleanText(b),
                    size: 21,
                    font: 'Calibri',
                    color: '1F2937',
                  }),
                ],
                bullet: { level: 0 },
                spacing: { before: 20, after: 40 },
              })
            );
          }
        });
      }
    });
  }

  // 6. Education
  if (education && education.length > 0) {
    addSectionHeading('Education');
    education.forEach((edu) => {
      const degree = cleanText(edu.degree) || 'Degree';
      const period = cleanText(edu.period);

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: degree,
              bold: true,
              size: 22, // 11pt
              font: 'Calibri',
              color: '111827',
            }),
            ...(period
              ? [
                  new TextRun({
                    text: `\t${period}`,
                    bold: false,
                    size: 20,
                    font: 'Calibri',
                    color: '4B5563',
                  }),
                ]
              : []),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { before: 100, after: 20 },
        })
      );

      // School on line below degree
      const schoolParts = [cleanText(edu.school), cleanText(edu.location)].filter(Boolean);
      if (schoolParts.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: schoolParts.join(' • '),
                size: 21,
                font: 'Calibri',
                color: '374151',
              }),
            ],
            spacing: { before: 0, after: 20 },
          })
        );
      }

      if (edu.details) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(edu.details),
                size: 20,
                font: 'Calibri',
                color: '4B5563',
              }),
            ],
            spacing: { before: 0, after: 60 },
          })
        );
      }
    });
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });
}

/**
 * Downloads resume data directly as a Microsoft Word (.docx) file in the browser.
 */
export async function downloadResumeAsDocx(resumeData, companyName = '') {
  if (!resumeData) return;
  const doc = generateResumeDocx(resumeData);
  const blob = await Packer.toBlob(doc);

  const senderName = resumeData?.personalInfo?.fullName || 'Candidate';
  const comp = companyName || 'Company';
  const filename = `${senderName.replace(/\s+/g, '_')}_Resume_${comp.replace(/\s+/g, '_')}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates base64 string of the docx file (for saving to application bundle).
 */
export async function getResumeDocxBase64(resumeData) {
  if (!resumeData) return null;
  const doc = generateResumeDocx(resumeData);
  const blob = await Packer.toBlob(doc);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
