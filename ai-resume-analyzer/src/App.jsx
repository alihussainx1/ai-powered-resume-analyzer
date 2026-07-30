import React, { useMemo, useRef, useState } from 'react';
import { analyzeResume, buildChatReply } from './utils/resumeUtils.js';
import { parseResumeFile } from './utils/fileParser.js';

const EMPTY_ANALYSIS = {
  score: 0,
  keywordScore: 0,
  matched: [],
  missing: [],
  strengths: [],
  improvements: []
};

function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('Upload a resume or paste resume text below.');
  const [analysis, setAnalysis] = useState(EMPTY_ANALYSIS);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! Analyze your resume first, then ask me how to improve it.' }
  ]);
  const fileInputRef = useRef(null);

  const canAnalyze = useMemo(() => resumeText.trim().length > 40, [resumeText]);

  async function handleFile(file) {
    if (!file) return;
    try {
      setStatus('Reading resume...');
      const text = await parseResumeFile(file);
      if (!text.trim()) throw new Error('No readable text was found in this file.');
      setResumeText(text);
      setFileName(file.name);
      setStatus('Resume loaded successfully. Add a job description for better matching.');
      setHasAnalyzed(false);
    } catch (error) {
      setStatus(error.message || 'Could not read the selected file.');
    }
  }

  function handleAnalyze() {
    if (!canAnalyze) {
      setStatus('Please upload or paste a resume with enough text to analyze.');
      return;
    }
    const result = analyzeResume(resumeText, jobDescription);
    setAnalysis(result);
    setHasAnalyzed(true);
    setStatus('Analysis complete.');
    setMessages([
      {
        role: 'assistant',
        text: `Analysis complete. Your score is ${result.score}/100. Ask me about your score, ATS keywords, experience, summary, skills, or projects.`
      }
    ]);
  }

  function sendMessage(event) {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    const userMessage = { role: 'user', text };
    const reply = hasAnalyzed
      ? buildChatReply(text, analysis)
      : 'Please analyze your resume first so I can give contextual suggestions.';

    setMessages((current) => [...current, userMessage, { role: 'assistant', text: reply }]);
    setChatInput('');
  }

  function handleDrop(event) {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top">Resume<span>IQ</span></a>
        <nav>
          <a href="#analyzer">Analyzer</a>
          <a href="#results">Results</a>
          <a href="#chatbot">AI Coach</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">AI-POWERED CAREER TOOL</div>
            <h1>Build a resume that matches the job.</h1>
            <p>
              Upload your resume, compare it with a job description, identify missing keywords,
              receive structured feedback, and get instant improvement suggestions.
            </p>
            <a className="primary-btn hero-btn" href="#analyzer">Analyze My Resume</a>
          </div>
          <div className="hero-card">
            <div className="mini-header"><span></span><span></span><span></span></div>
            <div className="score-ring">86</div>
            <h3>Resume Match Score</h3>
            <div className="mini-row"><span>Keyword Match</span><strong>82%</strong></div>
            <div className="mini-row"><span>Structure</span><strong>90%</strong></div>
            <div className="mini-row"><span>Readability</span><strong>Good</strong></div>
          </div>
        </section>

        <section className="section" id="analyzer">
          <div className="section-heading">
            <span>01</span>
            <div>
              <h2>Resume Analyzer</h2>
              <p>Upload a PDF, DOCX, or TXT resume. You can also paste the text manually.</p>
            </div>
          </div>

          <div className="workspace-grid">
            <div className="panel">
              <h3>Upload Resume</h3>
              <div
                className="drop-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon">↑</div>
                <strong>{fileName || 'Drop your resume here'}</strong>
                <span>or click to browse</span>
                <small>PDF, DOCX, TXT</small>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  hidden
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
              <label>Resume Text</label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Resume text will appear here, or paste it manually..."
                rows="10"
              />
            </div>

            <div className="panel">
              <h3>Target Job Description</h3>
              <p className="panel-note">Paste the job description to calculate keyword relevance.</p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                rows="18"
              />
              <button className="primary-btn full-width" onClick={handleAnalyze}>Analyze Resume</button>
              <div className="status">{status}</div>
            </div>
          </div>
        </section>

        <section className="section results-section" id="results">
          <div className="section-heading">
            <span>02</span>
            <div>
              <h2>Analysis Results</h2>
              <p>Your analysis updates after you click Analyze Resume.</p>
            </div>
          </div>

          <div className="metrics-grid">
            <MetricCard title="Overall Score" value={`${analysis.score}/100`} progress={analysis.score} />
            <MetricCard title="Keyword Match" value={`${analysis.keywordScore}%`} progress={analysis.keywordScore} />
            <MetricCard title="Matched Keywords" value={analysis.matched.length} progress={Math.min(100, analysis.matched.length * 10)} />
          </div>

          <div className="analysis-grid">
            <div className="panel">
              <h3>Matched Keywords</h3>
              <TagList items={analysis.matched} empty="Analyze a resume to see matched keywords." type="good" />
            </div>
            <div className="panel">
              <h3>Missing Keywords</h3>
              <TagList items={analysis.missing} empty="No missing keywords to show yet." type="warn" />
            </div>
            <div className="panel">
              <h3>Strengths</h3>
              <FeedbackList items={analysis.strengths} empty="Your resume strengths will appear here." positive />
            </div>
            <div className="panel">
              <h3>Recommended Improvements</h3>
              <FeedbackList items={analysis.improvements} empty="Improvement suggestions will appear here." />
            </div>
          </div>
        </section>

        <section className="section" id="chatbot">
          <div className="section-heading">
            <span>03</span>
            <div>
              <h2>Resume Improvement Coach</h2>
              <p>Ask contextual questions based on the current resume analysis.</p>
            </div>
          </div>

          <div className="chat-card">
            <div className="chat-header">
              <div className="bot-avatar">AI</div>
              <div><strong>ResumeIQ Coach</strong><span>Context-aware resume guidance</span></div>
            </div>
            <div className="chat-messages">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  {message.text}
                </div>
              ))}
            </div>
            <form className="chat-form" onSubmit={sendMessage}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask: How can I improve my experience section?"
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </section>
      </main>

      <footer>
        <strong>ResumeIQ</strong>
        <span>Built with React, JavaScript, CSS, PDF.js and Mammoth.js.</span>
      </footer>
    </div>
  );
}

function MetricCard({ title, value, progress }) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <div className="progress"><div style={{ width: `${progress}%` }}></div></div>
    </div>
  );
}

function TagList({ items, empty, type }) {
  if (!items.length) return <p className="empty-state">{empty}</p>;
  return <div className="tags">{items.map((item) => <span className={`tag ${type}`} key={item}>{item}</span>)}</div>;
}

function FeedbackList({ items, empty, positive = false }) {
  if (!items.length) return <p className="empty-state">{empty}</p>;
  return (
    <ul className="feedback-list">
      {items.map((item) => <li key={item}><span>{positive ? '✓' : '→'}</span>{item}</li>)}
    </ul>
  );
}

export default App;
