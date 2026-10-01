import React from 'react';

/**
 * Classic Executive ATS Template
 * Formal serif styling, centered header, clean typography without divider lines.
 */
export default function ClassicAtsTemplate({ resume, isEditing, onUpdate }) {
  if (!resume) return null;

  const { personalInfo = {}, summary = '', skills = [], experience = [], education = [], projects = [] } = resume;

  const handleTextChange = (path, value) => {
    if (!onUpdate) return;
    const updated = JSON.parse(JSON.stringify(resume));
    const keys = path.split('.');
    let curr = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      curr = curr[keys[i]];
    }
    curr[keys[keys.length - 1]] = value;
    onUpdate(updated);
  };

  const cleanText = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\[cite:\s*\d+\]/gi, '')
      .trim();
  };

  return (
    <div
      id="resume-document"
      className="resume-paper bg-white text-gray-900 font-serif p-8 sm:p-12 max-w-[850px] mx-auto shadow-2xl rounded-sm leading-relaxed"
      style={{ minHeight: '1050px', color: '#111827' }}
    >
      {/* Header - Centered Classic Style */}
      <header className="text-center pb-2 mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-gray-900">
          {personalInfo.fullName || 'Candidate Name'}
        </h1>
        {personalInfo.headline && (
          <p className="text-sm font-sans font-medium text-gray-700 mt-1 italic">
            {personalInfo.headline}
          </p>
        )}
        <div className="flex flex-wrap justify-center items-center gap-x-3 text-xs sm:text-sm text-gray-700 mt-2 font-sans">
          {personalInfo.email && (
            <a href={`mailto:${personalInfo.email}`} className="text-blue-600 hover:underline italic">
              {personalInfo.email}
            </a>
          )}
          {personalInfo.phone && <span className="italic">| {personalInfo.phone}</span>}
          {personalInfo.location && <span>| {personalInfo.location}</span>}
          {(() => {
            const seen = new Set();
            const links = [];
            const addLink = (rawUrl, isGit = false) => {
              if (!rawUrl || typeof rawUrl !== 'string') return;
              const clean = rawUrl.trim();
              const norm = clean.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '').toLowerCase();
              if (isGit && !norm.includes('github') && seen.has(norm)) return;
              if (!seen.has(norm)) {
                seen.add(norm);
                const href = clean.startsWith('http') ? clean : `https://${clean}`;
                links.push(
                  <span key={norm}>
                    |{' '}
                    <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {clean}
                    </a>
                  </span>
                );
              }
            };
            addLink(personalInfo.portfolio);
            addLink(personalInfo.linkedin);
            addLink(personalInfo.github, true);
            return links;
          })()}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-5">
          <h2 className="text-sm font-bold font-sans tracking-wide text-gray-900 uppercase mb-2">
            Executive Summary
          </h2>
          <p className="text-sm text-gray-800 text-justify leading-relaxed">{cleanText(summary)}</p>
        </section>
      )}

      {/* Skills - Layout matching Image 2 */}
      {skills && skills.length > 0 && (
        <section className="mb-5">
          <div className="space-y-2.5 text-sm font-sans text-gray-800">
            {skills.map((group, idx) => (
              <div key={idx} className="skill-group avoid-break flex flex-col">
                {idx === 0 && (
                  <h2 className="text-sm font-bold font-sans tracking-wide text-gray-900 uppercase mb-2">
                    Core Competencies
                  </h2>
                )}
                <span className="font-bold text-gray-900">
                  {group.category ? cleanText(group.category).replace(/:\s*$/, '') : 'Skills'}
                </span>
                <span className="text-gray-800 mt-0.5 leading-relaxed">
                  {Array.isArray(group.items) ? group.items.map(cleanText).join(', ') : cleanText(group.items)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-5">
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="experience-item avoid-break">
                {idx === 0 && (
                  <h2 className="text-sm font-bold font-sans tracking-wide text-gray-900 uppercase mb-2.5">
                    Professional Experience
                  </h2>
                )}
                <div className="experience-header flex flex-col sm:flex-row sm:justify-between sm:items-baseline text-sm">
                  <span className="font-bold text-gray-900">{cleanText(exp.role)}</span>
                  <span className="text-xs text-gray-700 font-sans">{exp.period}</span>
                </div>
                <div className="text-sm text-gray-700 mt-0.5">
                  <span className="italic">{cleanText(exp.company)}</span>
                  {exp.location && <span className="text-xs text-gray-500 font-sans"> • {cleanText(exp.location)}</span>}
                </div>
                {Array.isArray(exp.bullets) && (
                  <ul className="mt-1 list-disc list-outside ml-4 space-y-1 text-sm text-gray-800">
                    {exp.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="avoid-break leading-snug">{cleanText(b)}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-5">
          <div className="space-y-3">
            {projects.map((proj, pIdx) => (
              <div key={pIdx} className="project-item avoid-break">
                {pIdx === 0 && (
                  <h2 className="text-sm font-bold font-sans tracking-wide text-gray-900 uppercase mb-2">
                    Selected Projects
                  </h2>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                  <span className="font-bold text-gray-900">{cleanText(proj.name)}</span>
                </div>
                {proj.technologies && (
                  <div className="font-normal italic text-xs font-sans text-gray-600 mt-0.5">
                    {cleanText(proj.technologies)}
                  </div>
                )}
                {Array.isArray(proj.bullets) && (
                  <ul className="mt-1 list-disc list-outside ml-4 space-y-1 text-sm text-gray-800">
                    {proj.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="avoid-break leading-snug">{cleanText(b)}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section>
          <div className="space-y-3">
            {education.map((edu, idx) => (
              <div key={idx} className="education-item avoid-break">
                {idx === 0 && (
                  <h2 className="text-sm font-bold font-sans tracking-wide text-gray-900 uppercase mb-2">
                    Education
                  </h2>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline text-sm">
                  <div className="font-bold text-gray-900">{cleanText(edu.degree)}</div>
                  <span className="text-xs text-gray-700 font-sans">{edu.period}</span>
                </div>
                {edu.school && (
                  <div className="text-sm text-gray-700 mt-0.5">
                    {cleanText(edu.school)}
                  </div>
                )}
                {edu.details && (
                  <p className="text-xs text-gray-600 mt-1 font-sans leading-relaxed">
                    {cleanText(edu.details)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
