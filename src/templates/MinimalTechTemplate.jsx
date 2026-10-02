import React from 'react';

/**
 * Minimalist Tech ATS Template
 * Clean modern sans-serif with monospace accents for developer & tech roles.
 */
export default function MinimalTechTemplate({ resume, isEditing, onUpdate }) {
  if (!resume) return null;

  const { personalInfo = {}, summary = '', skills = [], experience = [], education = [], projects = [] } = resume;

  const handleSkillCategoryChange = (idx, value) => {
    if (!onUpdate) return;
    const updated = JSON.parse(JSON.stringify(resume));
    if (!Array.isArray(updated.skills)) updated.skills = [];
    if (updated.skills[idx]) {
      updated.skills[idx].category = value;
      onUpdate(updated);
    }
  };

  const handleSkillItemsChange = (idx, value) => {
    if (!onUpdate) return;
    const updated = JSON.parse(JSON.stringify(resume));
    if (!Array.isArray(updated.skills)) updated.skills = [];
    if (updated.skills[idx]) {
      updated.skills[idx].items = value;
      onUpdate(updated);
    }
  };

  const handleSkillItemsBlur = (idx) => {
    if (!onUpdate) return;
    const updated = JSON.parse(JSON.stringify(resume));
    const raw = updated.skills?.[idx]?.items;
    if (typeof raw === 'string') {
      updated.skills[idx].items = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      onUpdate(updated);
    }
  };

  const handleAddSkillCategory = () => {
    if (!onUpdate) return;
    const updated = JSON.parse(JSON.stringify(resume));
    if (!Array.isArray(updated.skills)) updated.skills = [];
    updated.skills.push({
      category: 'New Category',
      items: ['Skill 1', 'Skill 2'],
    });
    onUpdate(updated);
  };

  const handleRemoveSkillCategory = (idx) => {
    if (!onUpdate) return;
    const updated = JSON.parse(JSON.stringify(resume));
    if (Array.isArray(updated.skills)) {
      updated.skills.splice(idx, 1);
      onUpdate(updated);
    }
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
                  <a key={norm} href={href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {clean}
                  </a>
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
        <section className="mb-6">
          <h2 className="text-sm font-bold tracking-normal text-slate-900 mb-1.5">
            Professional Summary
          </h2>
          <p className="text-sm text-slate-800 leading-relaxed">{cleanText(summary)}</p>
        </section>
      )}

      {/* Core Competencies & Skills */}
      {((skills && skills.length > 0) || isEditing) && (
        <section className="mb-6">
          <h2 className="text-sm font-bold tracking-normal text-slate-900 mb-2">
            Technical Skills & Competencies
          </h2>
          <div className="space-y-3 text-sm">
            {skills.map((group, idx) => (
              <div key={idx} className="skill-group avoid-break flex flex-col">
                {isEditing ? (
                  <div className="p-2.5 border border-indigo-200 rounded-md bg-indigo-50/20 mb-1 space-y-1.5 font-sans">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        className="w-full text-xs font-bold text-slate-900 border-b border-dashed border-indigo-400 focus:outline-none bg-transparent px-1 py-0.5"
                        placeholder="Category Name (e.g. Languages & Frameworks)"
                        value={group.category || ''}
                        onChange={(e) => handleSkillCategoryChange(idx, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillCategory(idx)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-0.5 rounded transition-colors font-medium shrink-0"
                        title="Delete category"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      className="w-full text-xs text-slate-800 border border-indigo-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                      placeholder="Skills separated by commas (e.g. Python, Docker, Kubernetes)"
                      value={Array.isArray(group.items) ? group.items.join(', ') : (group.items || '')}
                      onChange={(e) => handleSkillItemsChange(idx, e.target.value)}
                      onBlur={() => handleSkillItemsBlur(idx)}
                    />
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-slate-900">
                      {group.category ? cleanText(group.category).replace(/:\s*$/, '') : 'Skills'}
                    </span>
                    <span className="text-slate-800 mt-0.5 leading-relaxed">
                      {Array.isArray(group.items) ? group.items.map(cleanText).join(', ') : cleanText(group.items)}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={handleAddSkillCategory}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 border border-dashed border-indigo-300 hover:border-indigo-500 rounded px-2.5 py-1 transition-colors bg-indigo-50/40"
            >
              + Add Skill Category
            </button>
          )}
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
