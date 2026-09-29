# ATS Resume & Cover Letter Studio (Desktop)

A local, desktop-focused application to generate tailored, 100% ATS-compliant resumes and customized cover letters based on job descriptions using Google Gemini AI.

## Key Features

1. **100% ATS-Friendly Templates:**
   - **Modern ATS (Default & Recommended):** Clean single-column layout, crisp typography, standard section headers, no parsable errors.
   - **Classic Executive ATS:** Timeless serif typography, centered headings, high-density format.
   - **Minimalist Tech ATS:** Modern developer-focused design with monospace skill and project tags.
2. **Side-by-Side Live Preview:** See your resume and cover letter render in real-time as you tweak or generate.
3. **In-Place Customization:** Edit any bullet point, summary sentence, or skill category directly inside the live preview before saving or downloading.
4. **Complete Local Storage (Bundles):** Each generation automatically saves everything to `./applications/YYYY-MM-DD_[Company]_[Role]/`:
   - `job_post.txt` — Full job description pasted.
   - `notes.txt` — Custom focus notes.
   - `resume.md` — ATS Markdown version.
   - `resume.json` — Structured resume data.
   - `resume.pdf` — High-resolution ATS PDF.
   - `cover_letter.txt` — Matching cover letter text.
   - `cover_letter.pdf` — Formatted cover letter PDF.
   - `metadata.json` — Application timestamp and details.
5. **Applications History Browser:** Easily re-open and review any past job application bundle with one click.
6. **Master Profile (`profile.md`):** Keep your master career facts in `profile.md`. You can edit it or import an existing `.md` file anytime.
7. **Gemini AI Integration:** Select between Gemini 1.5 Flash, Gemini 1.5 Pro, or Gemini 2.0 Flash.

---

## Quick Start

### Option 1: Double Click (Windows)
Double-click `start.bat` in this folder. It will install packages on first run and automatically open the application in your browser.

### Option 2: Terminal
```bash
# 1. Install dependencies
npm install

# 2. Run the studio
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## How to Use

1. Click **Connect Gemini Key** in the top bar and enter your free Gemini API Key (saved safely to your local `.env`).
2. Click **Base Profile (MD)** to confirm or update your career information. A comprehensive sample is already included.
3. Paste a **Job Description**, set the **Company** and **Role**, and optionally add **Extra Notes** (e.g. "Focus on AWS and microservices").
4. Click **Generate ATS Application**.
5. Switch templates, edit bullets directly in the preview, and click **Export PDF** or **Save Bundle**!
