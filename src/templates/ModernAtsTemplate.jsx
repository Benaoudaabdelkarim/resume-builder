import React from 'react';

/**
 * Modern Professional ATS Template
 * Designed for maximum ATS readability, clean typography, and modern aesthetics.
 */
export default function ModernAtsTemplate({ resume, isEditing, onUpdate }) {
  if (!resume) return null;

  const { personalInfo = {}, summary = '', skills = [], experience = [], education = [], projects = [] } = resume;

  // Helper for in-place text edits
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

  const handleBulletChange = (section, itemIdx, bulletIdx, value) => {
    if (!onUpdate) return;
    const updated = JSON.parse(JSON.stringify(resume));
    updated[section][itemIdx].bullets[bulletIdx] = value;
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
      className="resume-paper bg-white text-gray-900 font-sans p-8 sm:p-12 max-w-[850px] mx-auto shadow-2xl rounded-sm leading-relaxed"
      style={{ minHeight: '1050px', color: '#111827' }}
    >
      {/* Header / Contact Info */}
      <header className="pb-3 mb-5">
        {isEditing ? (
          <input
            type="text"
            className="w-full text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 border-b border-dashed border-blue-400 focus:outline-none"
            value={personalInfo.fullName || ''}
            onChange={(e) => handleTextChange('personalInfo.fullName', e.target.value)}
          />
        ) : (
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {personalInfo.fullName || 'Candidate Name'}
          </h1>
        )}

        {personalInfo.headline && (
          <div className="mt-0.5">
            {isEditing ? (
              <input
                type="text"
                className="w-full text-base font-normal text-gray-700 border-b border-dashed border-blue-300 focus:outline-none"
                value={personalInfo.headline}
                onChange={(e) => handleTextChange('personalInfo.headline', e.target.value)}
              />
            ) : (
              <p className="text-base font-normal text-gray-700">{personalInfo.headline}</p>
            )}
          </div>
        )}

        <div className="flex flex-col space-y-0.5 text-xs sm:text-sm text-gray-600 mt-2 font-normal">
          {personalInfo.email && (
            <a href={`mailto:${personalInfo.email}`} className="text-blue-600 hover:underline italic">
              {personalInfo.email}
            </a>
          )}
          {personalInfo.phone && (
            <span className="italic text-gray-700">{personalInfo.phone}</span>
          )}
          {personalInfo.location && (
            <span className="text-gray-700">{personalInfo.location}</span>
          )}
          {personalInfo.portfolio && (
            <a
              href={personalInfo.portfolio.startsWith('http') ? personalInfo.portfolio : `https://${personalInfo.portfolio}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              {personalInfo.portfolio.startsWith('http') ? personalInfo.portfolio : `https://${personalInfo.portfolio}`}
            </a>
          )}
          {personalInfo.linkedin && (
            <a
              href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              {personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`}
            </a>
          )}
          {personalInfo.github && (
            <a
              href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              {personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`}
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 mb-2">
            Professional Summary
          </h2>
          {isEditing ? (
            <textarea
              className="w-full text-sm text-gray-800 border border-blue-300 rounded p-2 focus:outline-none"
              rows={3}
              value={summary}
              onChange={(e) => handleTextChange('summary', e.target.value)}
            />
          ) : (
            <p className="text-sm text-gray-800 text-justify leading-relaxed">{cleanText(summary)}</p>
          )}
        </section>
      )}

      {/* Core Competencies & Skills - Layout matching Image 2 */}
      {skills && skills.length > 0 && (
        <section className="mb-6">
          <div className="space-y-3 text-sm">
            {skills.map((skillGroup, idx) => (
              <div key={idx} className="skill-group avoid-break flex flex-col">
                {idx === 0 && (
                  <h2 className="text-base font-bold text-gray-900 mb-2.5">
                    Technical Skills & Competencies
                  </h2>
                )}
                <span className="font-bold text-gray-900">
                  {skillGroup.category ? cleanText(skillGroup.category).replace(/:\s*$/, '') : 'Skills'}
                </span>
                <span className="text-gray-800 mt-0.5 leading-relaxed">
                  {Array.isArray(skillGroup.items) ? skillGroup.items.map(cleanText).join(', ') : cleanText(skillGroup.items)}
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
            {experience.map((exp, expIdx) => (
              <div key={expIdx} className="experience-item avoid-break">
                {expIdx === 0 && (
                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    Professional Experience
                  </h2>
                )}
                <div className="experience-header flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-sm">
                  <div className="font-bold text-gray-900">
                    {cleanText(exp.role)}
                  </div>
                  <div className="text-xs font-medium text-gray-600">
                    {exp.period}
                  </div>
                </div>
                {exp.company && (
                  <div className="text-sm text-gray-700 mt-0.5">
                    {cleanText(exp.company)}
                    {exp.location && (
                      <span className="text-xs text-gray-500 font-normal"> • {cleanText(exp.location)}</span>
                    )}
                  </div>
                )}

                {Array.isArray(exp.bullets) && (
                  <ul className="mt-1.5 list-disc list-outside ml-4 space-y-1 text-sm text-gray-800">
                    {exp.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="avoid-break leading-snug">
                        {isEditing ? (
                          <textarea
                            className="w-full text-sm text-gray-800 border border-blue-200 rounded p-1"
                            rows={2}
                            value={bullet}
                            onChange={(e) => handleBulletChange('experience', expIdx, bIdx, e.target.value)}
                          />
                        ) : (
                          cleanText(bullet)
                        )}
                      </li>
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
                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    Key Projects
                  </h2>
                )}
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-sm">
                  <span className="font-bold text-gray-900">
                    {cleanText(proj.name)}
                  </span>
                  {proj.link && (
                    <a
                      href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {proj.link}
                    </a>
                  )}
                </div>
                {proj.technologies && (
                  <div className="text-xs font-normal text-gray-600 mt-0.5 italic">
                    {cleanText(proj.technologies)}
                  </div>
                )}
                {Array.isArray(proj.bullets) && (
                  <ul className="mt-1.5 list-disc list-outside ml-4 space-y-1 text-sm text-gray-800">
                    {proj.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="avoid-break leading-snug">{cleanText(bullet)}</li>
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
            {education.map((edu, eIdx) => (
              <div key={eIdx} className="education-item avoid-break">
                {eIdx === 0 && (
                  <h2 className="text-base font-bold text-gray-900 mb-2.5">
                    Education
                  </h2>
                )}
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-sm">
                  <div className="font-bold text-gray-900">
                    {cleanText(edu.degree)}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    {edu.period} {edu.location && `• ${edu.location}`}
                  </div>
                </div>
                {edu.school && (
                  <div className="text-sm text-gray-700 mt-0.5">
                    {cleanText(edu.school)}
                  </div>
                )}
                {edu.details && (
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
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
