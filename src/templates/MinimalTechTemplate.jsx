import React from 'react';

/**
 * Minimalist Tech ATS Template
 * Clean modern sans-serif with monospace accents for developer & tech roles.
 */
export default function MinimalTechTemplate({ resume, isEditing, onUpdate }) {
  if (!resume) return null;

  const { personalInfo = {}, summary = '', skills = [], experience = [], education = [], projects = [] } = resume;

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
      className="resume-paper bg-white text-slate-900 font-sans p-8 sm:p-12 max-w-[850px] mx-auto shadow-2xl rounded-sm leading-relaxed"
      style={{ minHeight: '1050px', color: '#0f172a' }}
    >
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {personalInfo.fullName || 'Candidate Name'}
        </h1>
        {personalInfo.headline && (
          <p className="text-sm font-semibold text-indigo-700 tracking-wide mt-0.5">
            {personalInfo.headline}
          </p>
        )}
        <div className="flex flex-col space-y-0.5 text-xs text-slate-600 mt-2 font-mono">
          {personalInfo.email && (
            <a href={`mailto:${personalInfo.email}`} className="text-blue-600 hover:underline italic">
              {personalInfo.email}
            </a>
          )}
          {personalInfo.phone && <span className="italic text-slate-700">{personalInfo.phone}</span>}
          {personalInfo.location && <span className="text-slate-700">{personalInfo.location}</span>}
          {personalInfo.portfolio && (
            <a href={personalInfo.portfolio.startsWith('http') ? personalInfo.portfolio : `https://${personalInfo.portfolio}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
              {personalInfo.portfolio}
            </a>
          )}
          {personalInfo.github && (
            <a href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
              {personalInfo.github}
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-6">
          <h2 className="text-sm font-bold tracking-normal text-slate-900 mb-1.5">
            Professional Summary
          </h2>
          <p className="text-sm text-slate-800 leading-relaxed">{cleanText(summary)}</p>
        </section>
      )}

      {/* Skills - Layout matching Image 2 */}
      {skills && skills.length > 0 && (
        <section className="mb-6">
          <div className="space-y-3 text-sm">
            {skills.map((group, idx) => (
              <div key={idx} className="skill-group avoid-break flex flex-col">
                {idx === 0 && (
                  <h2 className="text-sm font-bold tracking-normal text-slate-900 mb-2">
                    Technical Skills & Competencies
                  </h2>
                )}
                <span className="font-bold text-slate-900">
                  {group.category ? cleanText(group.category).replace(/:\s*$/, '') : 'Skills'}
                </span>
                <span className="text-slate-800 mt-0.5 leading-relaxed">
                  {Array.isArray(group.items) ? group.items.map(cleanText).join(', ') : cleanText(group.items)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-6">
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="experience-item avoid-break">
                {idx === 0 && (
                  <h2 className="text-sm font-bold tracking-normal text-slate-900 mb-2.5">
                    Professional Experience
                  </h2>
                )}
                <div className="experience-header flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                  <div className="text-sm font-bold text-slate-900">
                    {cleanText(exp.role)}
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    {exp.period}
                  </div>
                </div>
                {exp.company && (
                  <div className="text-sm text-slate-600 mt-0.5">
                    {cleanText(exp.company)} {exp.location && <span className="text-xs text-slate-400 font-mono">• {cleanText(exp.location)}</span>}
                  </div>
                )}
                {Array.isArray(exp.bullets) && (
                  <ul className="mt-1.5 list-disc list-outside ml-4 space-y-1 text-sm text-slate-800">
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
        <section className="mb-6">
          <div className="space-y-3">
            {projects.map((proj, pIdx) => (
              <div key={pIdx} className="project-item avoid-break">
                {pIdx === 0 && (
                  <h2 className="text-sm font-bold tracking-normal text-slate-900 mb-2.5">
                    Projects
                  </h2>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
                  <span className="font-bold text-slate-900">
                    {cleanText(proj.name)}
                  </span>
                  {proj.link && <span className="text-xs font-mono text-indigo-600">{proj.link}</span>}
                </div>
                {proj.technologies && (
                  <div className="text-xs font-mono text-indigo-700 font-normal mt-0.5">
                    {cleanText(proj.technologies)}
                  </div>
                )}
                {Array.isArray(proj.bullets) && (
                  <ul className="mt-1.5 list-disc list-outside ml-4 space-y-1 text-sm text-slate-800">
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
          <div className="space-y-3 text-sm">
            {education.map((edu, idx) => (
              <div key={idx} className="education-item avoid-break">
                {idx === 0 && (
                  <h2 className="text-sm font-bold tracking-normal text-slate-900 mb-2">
                    Education
                  </h2>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                  <div className="font-bold text-slate-900">{cleanText(edu.degree)}</div>
                  <span className="text-xs font-mono text-slate-500">{edu.period}</span>
                </div>
                {edu.school && (
                  <div className="text-slate-600 mt-0.5">
                    {cleanText(edu.school)}
                  </div>
                )}
                {edu.details && (
                  <p className="text-xs text-slate-500 mt-1 font-mono leading-relaxed">
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
