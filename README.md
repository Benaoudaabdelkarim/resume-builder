# 🎯 ATS Resume & Cover Letter Studio

An open-source, AI-powered application that tailors your resume and cover letter to any job description in seconds—engineered specifically to score **90%+ on Applicant Tracking Systems (ATS)**.

🌐 **Live Demo:** [https://ats.abdelkarim.dev](https://ats.abdelkarim.dev)  
⭐ **Open Source on GitHub**

---

## 💡 What is this project? (For Non-Technical Users)

When you apply for a job online, your resume rarely goes directly to a human hiring manager. Instead, it gets scanned by an **Applicant Tracking System (ATS)**—automated software used by over 98% of Fortune 500 companies and recruitment agencies to filter and rank candidates.

If your resume doesn't contain the exact keywords, or if its formatting confuses the scanner (like columns, tables, fancy icons, or graphics), the computer automatically discards your application before any recruiter ever reads it.

### What ATS Resume Studio Does:
1. **You keep your career facts in one place** (your master profile).
2. **You paste the job link or description** of the job you want to apply for.
3. **The AI analyzes the job post** and cross-references your real background, picking the most relevant achievements, quantifying your impact, and weaving in the exact keywords ATS robots look for.
4. **It outputs a tailored, clean resume and a personalized cover letter** formatted in clean single-column templates that ATS software can easily parse.
5. **You can export clean, vector-searchable PDFs, Word (.docx) documents, or Markdown**, or print directly with standard letter formatting.

---

## ✨ Key Features

- **🎯 Top 1% ATS Optimization:** Single-column layout, standard headings (Summary, Experience, Skills, Education, Projects), no unparseable tables or graphics.
- **⚡ Instant Job Scraping:** Paste any public job listing URL (LinkedIn, Indeed, Greenhouse, Lever, etc.) to fetch and extract the description automatically via Jina AI Reader.
- **💼 Automatic Salary Extraction:** Automatically detects and displays minimum rate, maximum rate, and pay period (hourly, monthly, yearly) from the job description.
- **📝 Interactive Live In-Place Editing:** Tweak any bullet point, summary line, or skill directly inside the live preview before exporting.
- **🎨 3 ATS-Friendly Templates:**
  - **Modern ATS (Recommended):** Clean, crisp typography, generous whitespace, bullet-aligned readability.
  - **Classic Executive ATS:** Timeless serif typography, centered header, high-density executive format.
  - **Minimalist Tech ATS:** Modern developer-focused design with monospace skill tags.
- **📄 One-Click Cover Letter Generator:** Automatically drafts a matching 3–4 paragraph customized cover letter with the current date, tailored company value proposition, and relevant achievements.
- **💾 Complete Application Bundles:** Saves each job application in a dedicated folder with:
  - `resume.pdf` & `resume.docx` & `resume.md`
  - `cover_letter.pdf` & `cover_letter.txt`
  - `job_post.txt` & `metadata.json`
- **📊 Saved Applications Dashboard:** View all your past applications in an interactive table with company name, job title, extracted salary, date applied, and instant file downloads.
- **🖨️ Native Vector Print:** Prints directly to PDF via an isolated iframe to ensure text remains 100% searchable and copyable without browser UI chrome.
- **🤖 Resilient AI Engine:** Powered by Google Gemini (`gemini-3.5-flash-lite`, `gemini-3.8-flash`, `gemini-2.5-flash`) with automatic exponential backoff and fallback if API demand spikes occur.

---

## 🛠️ How It's Made (Tech Stack & Architecture)

ATS Resume Studio was built as a modern, lightweight, full-stack JavaScript application designed for speed, privacy, and ease of deployment.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client (React)                        │
│  Vite + Tailwind CSS + Lucide Icons + Radix UI Primitives   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST
┌──────────────────────────────▼──────────────────────────────┐
│                    Server (Node.js / Express)               │
│                                                             │
│  ├─ Gemini AI API (Content Generation & Keyword Tailoring)  │
│  ├─ Jina AI Reader (Markdown Job Description Scraper)       │
│  ├─ Salary Extraction Engine (Regex & Token Normalizer)    │
│  ├─ Storage System (Local File Bundles & JSON Metadata)     │
│  └─ Production Static Asset Serving (Single Port)          │
└─────────────────────────────────────────────────────────────┘
```

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS with custom ATS typography and paper styling
- **UI Components:** Radix UI primitives (`AlertDialog`, `Select`, `Dialog`) + Lucide React icons
- **Document Generation:** `docx` (Word documents), `html2pdf.js` & native iframe vector printing

### Backend & AI
- **Runtime:** Node.js (ES Modules) + Express.js
- **AI Engine:** Google Gemini Generative AI SDK (`@google/generative-ai`)
- **Web Extraction:** Jina AI Reader (`https://r.jina.ai/`) for clean markdown extraction of public job postings
- **Salary Engine:** Custom regex and token analysis extracting hourly, monthly, or annual compensation brackets

---

## 🚀 Getting Started (Self-Hosting & Local Development)

### Prerequisites
- Node.js (v18 or higher recommended)
- A free Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the repository
```bash
git clone https://github.com/Abdelkarim-benaouda/Resume-Builder.git
cd Resume-Builder
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
```
*(You can also set or update your Gemini API key directly from the app interface)*

### 4. Run in Development Mode
```bash
npm run dev
```
- Open [http://localhost:5173](http://localhost:5173) in your browser.
- The server will run concurrently on port `3001` and Vite frontend on `5173`.

### 5. Build for Production
```bash
npm run build
npm start
```
The server will start on port `3001` and serve both the API and the compiled React frontend from `dist/`.

---

## 🌐 Deploying to an Ubuntu Server (CloudPanel / PM2)

To deploy to an Ubuntu server running **CloudPanel** (or any Node.js reverse proxy):

1. **Create a Node.js Site** in CloudPanel (e.g., `ats.yourdomain.com`) pointing to port `3001`.
2. **Upload or clone the repository** into your site's directory (e.g., `/home/username/htdocs/ats.yourdomain.com`).
3. **Build the production bundle:**
   ```bash
   npm install
   npm run build
   ```
4. **Start the application with PM2:**
   ```bash
   npm install -g pm2
   PORT=3001 NODE_ENV=production pm2 start server/index.js --name "resume-builder"
   pm2 save
   pm2 startup
   ```

---

## 👨‍💻 Creator & Author

Crafted by **Abdelkarim Benaouda**  
Senior Full-Stack Software Engineer & AI Architect

- 🌐 **Portfolio & Website:** [https://abdelkarim.dev](https://abdelkarim.dev)
- 💼 **LinkedIn:** [Abdelkarim Benaouda](https://www.linkedin.com/in/abdelkarim-benaouda-980951180)
- 📧 **Email:** [karimbenaouda85@gmail.com](mailto:karimbenaouda85@gmail.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute it for personal or commercial projects.
