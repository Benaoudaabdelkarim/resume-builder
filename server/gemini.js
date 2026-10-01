import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Validates that an API key is working by querying available models for this key.
 */
export async function testGeminiKey(apiKey) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`
    );
    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error?.message || `HTTP ${res.status}: ${res.statusText}`;
      return { success: false, error: errMsg };
    }

    const availableModels = (data.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name.replace(/^models\//, ''));

    if (availableModels.length === 0) {
      return {
        success: false,
        error: 'No models supporting content generation found for this API key.',
      };
    }

    const preferred = [
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-pro',
      'gemini-pro-latest',
      'gemini-2.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
    ];

    const bestModel = preferred.find((p) => availableModels.includes(p)) || availableModels[0];

    return {
      success: true,
      message: `Gemini Key verified! (Active model: ${bestModel})`,
      bestModel,
      availableModels,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generates an ATS-optimized tailored resume and matching cover letter based on base profile and job post.
 */
export async function generateAtsApplication({
  apiKey,
  modelName = 'gemini-2.5-flash',
  profileMd,
  jobPost,
  companyName = '',
  roleTitle = '',
  notes = '',
}) {
  if (!apiKey) {
    throw new Error('Gemini API Key is required');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const selectedModel = modelName || 'gemini-2.5-flash';

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const prompt = `
You are an expert Executive Resume Writer and Applicant Tracking System (ATS) optimization specialist.
Your mission is to tailor the candidate's existing background (from their base profile) to be a top 1% match for the provided Job Description, while strictly adhering to real facts from the profile (do not invent fake jobs or fake companies, but reframe and highlight relevant skills, achievements, and keywords).

### CANDIDATE BASE PROFILE (MARKDOWN):
${profileMd}

### TARGET JOB DESCRIPTION:
Target Company: ${companyName || 'Not specified'}
Target Role: ${roleTitle || 'Not specified'}
Job Post Content:
${jobPost}

### EXTRA USER NOTES / FOCUS AREAS:
${notes || 'None provided'}

---
### STRICT ATS & TAILORING RULES:
1. **Keyword Integration:** Scan the job post for hard skills, methodologies, tools, and domain keywords. Seamlessly embed matching terms into the professional summary, skills lists, and bullet points.
2. **Quantifiable Impact:** Ensure experience bullets begin with strong action verbs (e.g., "Architected", "Accelerated", "Delivered", "Spearheaded") and emphasize metrics, percentages, dollar amounts, or scale where present in the candidate profile.
3. **ATS Formatting Standard & Concise Summary:**
   - **CRITICAL:** The Professional Summary MUST be strictly MAXIMUM 3 LINES (at most 2-3 sentences, under 50 words total). Make it punchy, high-impact, and directly focused on the target role with zero fluff.
   - Single-column logic.
   - Clean, standard section names: Summary, Skills, Experience, Education, Projects.
   - Avoid tables, images, or unconventional glyphs.
   - NO RAW MARKDOWN IN BULLETS: Never use asterisks (**) or markdown formatting inside bullet points, summary sentences, or project names. All string values must be completely clean plain text without asterisks or citation brackets like [cite: 2].
4. **Cover Letter:**
   - Write a compelling 3-4 paragraph cover letter customized to the specific role and company.
   - Paragraph 1: Enthusiastic hook, target role, why this company specifically.
   - Paragraph 2-3: 2-3 concrete achievements from the profile that directly address requirements from the job description.
   - Paragraph 4: Confident closing, call to action for an interview.

---
### OUTPUT JSON SCHEMA:
Return ONLY valid JSON matching this schema:
{
  "matchedRole": "Exact or targeted job title",
  "matchedCompany": "Company name",
  "atsMatchScoreEstimate": 94,
  "topKeywordsMatched": ["keyword1", "keyword2", "keyword3"],
  "tailoringHighlights": [
    "Brief explanation of how this was optimized for the job post"
  ],
  "resume": {
    "personalInfo": {
      "fullName": "Candidate Full Name",
      "headline": "Targeted Professional Headline (e.g. Senior Full Stack Engineer)",
      "email": "email",
      "phone": "phone",
      "location": "City, State/Country",
      "linkedin": "linkedin url or username",
      "github": "github url or username",
      "portfolio": "portfolio or website url"
    },
    "summary": "Punchy, high-impact professional summary strictly MAXIMUM 3 LINES (under 50 words) loaded with job-relevant keywords.",
    "skills": [
      {
        "category": "e.g., Programming Languages",
        "items": ["JavaScript", "TypeScript", "Python"]
      },
      {
        "category": "e.g., Frameworks & Libraries",
        "items": ["React", "Node.js", "Express"]
      },
      {
        "category": "e.g., Cloud & DevOps",
        "items": ["AWS", "Docker", "CI/CD"]
      }
    ],
    "experience": [
      {
        "role": "Title",
        "company": "Company Name",
        "location": "Location",
        "period": "Start Date – End Date",
        "bullets": [
          "Action verb + task + quantified result/impact tailored to the job keywords.",
          "Another high-impact bullet point."
        ]
      }
    ],
    "education": [
      {
        "degree": "Degree Title",
        "school": "University or Institution",
        "location": "City, State (optional)",
        "period": "Graduation Year or Date range",
        "details": "Honors, GPA (if high), or relevant coursework"
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "technologies": "React, Node.js, AWS",
        "link": "optional url",
        "bullets": [
          "Key achievement or technical detail regarding this project."
        ]
      }
    ]
  },
  "coverLetter": {
    "recipient": "Hiring Team or Hiring Manager",
    "company": "Company Name",
    "date": "${todayFormatted}",
    "greeting": "Dear Hiring Team,",
    "bodyParagraphs": [
      "Opening paragraph...",
      "Core value proposition paragraph...",
      "Specific relevant achievements paragraph...",
      "Closing paragraph..."
    ],
    "signOff": "Sincerely,",
    "senderName": "Candidate Full Name"
  }
}
`;

  // Helper to attempt generation with retries and fallback models upon demand spikes
  const candidateModels = [selectedModel];
  if (!candidateModels.includes('gemini-3.5-flash-lite')) candidateModels.push('gemini-3.5-flash-lite');
  if (!candidateModels.includes('gemini-3.8-flash')) candidateModels.push('gemini-3.8-flash');
  if (!candidateModels.includes('gemini-2.5-flash')) candidateModels.push('gemini-2.5-flash');

  let lastError = null;
  let responseText = '';
  let activeModelUsed = selectedModel;

  for (const currentModel of candidateModels) {
    let succeeded = false;
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: currentModel,
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text && text.trim().length > 0) {
          responseText = text;
          activeModelUsed = currentModel;
          succeeded = true;
          break;
        }
      } catch (err) {
        lastError = err;
        const msg = (err.message || '').toLowerCase();
        const isSpikeDemand =
          msg.includes('503') ||
          msg.includes('overloaded') ||
          msg.includes('high demand') ||
          msg.includes('resource exhausted') ||
          msg.includes('rate limit') ||
          msg.includes('429');

        if (isSpikeDemand && attempt < 2) {
          // Exponential backoff: 1.5s, 3s
          const delay = Math.pow(2, attempt) * 1500 + Math.random() * 500;
          console.warn(`[Gemini] ${currentModel} encountered temporary demand spike (${err.message}). Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/2)...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        if (isSpikeDemand) {
          console.warn(`[Gemini] ${currentModel} capacity reached. Trying alternative model...`);
          break; // break inner loop to try next model in candidateModels
        }

        throw err;
      }
    }

    if (succeeded) break;
  }

  if (!responseText) {
    const errorDetail = lastError?.message || 'No response returned from Gemini';
    if (errorDetail.toLowerCase().includes('503') || errorDetail.toLowerCase().includes('demand') || errorDetail.toLowerCase().includes('overloaded')) {
      throw new Error(`Google Gemini is currently experiencing a global traffic demand spike (503). We attempted automatic retries and fallback models. Please wait 10-15 seconds and try again, or select Gemini 3.5 Flash Lite.`);
    }
    throw new Error(`Failed to generate application: ${errorDetail}`);
  }

  let parsed = null;
  try {
    parsed = JSON.parse(responseText);
  } catch (err) {
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch {}
    }
    if (!parsed) {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }
  }

  if (!parsed || !parsed.resume) {
    throw new Error('AI returned an incomplete response. Please click Generate ATS Application again.');
  }

  // Always guarantee the cover letter date is today's current date
  if (parsed && parsed.coverLetter) {
    parsed.coverLetter.date = todayFormatted;
  }

  parsed.modelUsed = activeModelUsed;
  return sanitizeData(parsed);
}

/**
 * Strips raw markdown asterisks and citation tags from generated data.
 */
function sanitizeData(obj) {
  if (typeof obj === 'string') {
    return obj
      .replace(/\*\*([^*]+)\*\*/g, '$1') // remove **bold**
      .replace(/\[cite:\s*\d+\]/gi, '')   // remove [cite: 2]
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeData);
  }
  if (obj && typeof obj === 'object' && obj !== null) {
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = sanitizeData(v);
    }
    return res;
  }
  return obj;
}

