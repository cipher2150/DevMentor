import React, { useState } from 'react';
import { Github, ArrowRight, Sparkles, Code2, Network, Brain, ShieldCheck } from 'lucide-react';

export default function LandingPage({ onAnalyze, error }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    setIsSubmitting(true);
    onAnalyze(repoUrl.trim());
  };

  const handlePresetSelect = (presetUrl) => {
    setRepoUrl(presetUrl);
    setIsSubmitting(true);
    onAnalyze(presetUrl);
  };

  const steps = [
    { icon: Code2, title: 'Analyze', text: 'Inspect the repo structure and core files.' },
    { icon: Network, title: 'Map', text: 'Understand architecture and system connections.' },
    { icon: Brain, title: 'Practice', text: 'Learn through guided quiz and explanation flow.' },
    { icon: ShieldCheck, title: 'Master', text: 'Build confidence with clear code-based feedback.' }
  ];

  return (
    <div className="landing-shell">
      <main className="hero-panel">
        <div className="eyebrow">
          <Sparkles size={14} />
          Smart repo walkthrough for developers
        </div>

        <h1>
          Learn your codebase with a
          <span> simple AI mentor.</span>
        </h1>

        <p className="hero-copy">
          Paste a GitHub repo and get a clean breakdown of the architecture, key concepts,
          and code understanding flow without the clutter.
        </p>

        <form onSubmit={handleSubmit} className="repo-form">
          <div className="input-wrap">
            <Github size={18} />
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              required
            />
          </div>
          <button type="submit" disabled={isSubmitting}>
            Analyze
            <ArrowRight size={16} />
          </button>
        </form>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="preset-row">
          <span>Try demo:</span>
          <button type="button" onClick={() => handlePresetSelect('https://github.com/devmentor-demo/PaintSync')}>
            PaintSync
          </button>
        </div>

        <div className="feature-grid">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon">
                <Icon size={18} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
