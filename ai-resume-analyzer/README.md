# ResumeIQ - AI Resume Analyzer

A React-based resume analyzer that parses PDF, DOCX, and TXT resumes, compares them with a job description, calculates a relevance score, identifies matched and missing keywords, generates structured improvement feedback, and provides a contextual resume coaching chatbot.

## Features

- Resume upload with drag and drop
- PDF parsing with PDF.js
- DOCX parsing with Mammoth.js
- TXT support
- Manual resume text input
- Job description keyword extraction
- Keyword match percentage
- Resume structure scoring
- Overall resume score
- Matched and missing keyword lists
- Resume improvement feedback
- Context-aware resume chatbot
- Responsive React UI

## Tech Stack

- React
- JavaScript
- CSS
- Vite
- PDF.js (`pdfjs-dist`)
- Mammoth.js

## Run Locally

1. Open the project folder in VS Code.
2. Open the terminal in the project folder.
3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open the local URL shown in the terminal, normally:

```text
http://localhost:5173
```

## Build for Production

```bash
npm run build
```

The production files will be generated in the `dist` folder.

## Important Note About AI

This version uses a deterministic local analysis engine and a contextual rule-based coaching chatbot, so it works without exposing or requiring an external AI API key.

For production-grade LLM feedback, connect the React frontend to a secure backend endpoint and call your chosen AI provider from the server. Never place a secret API key directly inside frontend React code.

## Project Structure

```text
ai-resume-analyzer/
├── src/
│   ├── utils/
│   │   ├── fileParser.js
│   │   └── resumeUtils.js
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
└── README.md
```

## License

For learning and portfolio use.
