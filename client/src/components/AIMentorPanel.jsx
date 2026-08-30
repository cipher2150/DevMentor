import React, { useEffect, useState } from 'react';
import { Cpu, Sparkles, HelpCircle, BookOpen, Loader2, FileCode, CheckCircle2, MessageSquare } from 'lucide-react';
import { explainTopic, getConfig } from '../services/api';

export default function AIMentorPanel({ repoName, selectedTopic, onStartQuiz, repoAnalysis }) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [providerStatus, setProviderStatus] = useState(null);
  const [error, setError] = useState('');
  const [activeTopicTitle, setActiveTopicTitle] = useState('Overall Architecture');

  const topics = [
    { title: 'Explain this architecture', query: 'Overall Architecture' },
    ...(repoAnalysis?.coreConcepts || []).slice(0, 5).map(concept => ({ title: `Explain ${concept.title}`, query: concept.title }))
  ];

  useEffect(() => {
    getConfig().then(setProviderStatus).catch(() => setProviderStatus({ provider: 'unavailable' }));
  }, []);

  const handleSelectTopic = async (queryTitle) => {
    setActiveTopicTitle(queryTitle);
    setLoading(true);
    setError('');
    try {
      const res = await explainTopic({
        repoName,
        topic: queryTitle,
        repoAnalysis
      });
      setExplanation(res.explanation);
    } catch (err) {
      console.error(err);
      setError(err.message || 'The AI provider could not answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-shell mentor-panel">
      <div className="panel-header">
        <div className="panel-header__title">
          <div className="mini-icon mini-icon--primary">
            <Cpu size={14} />
          </div>
          <span>AI mentor</span>
        </div>
        <span className={`panel-badge ${providerStatus?.provider === 'latentstack' ? 'panel-badge--success' : 'panel-badge--warning'}`}>
          {providerStatus?.provider === 'latentstack' ? 'LatentStack connected' : providerStatus?.provider === 'fallback' ? 'AI not configured' : 'Checking AI…'}
        </span>
      </div>

      <div className="panel-body">
        <div className="option-card">
          <span className="section-label">What do you want to understand?</span>

          <div className="option-stack">
            {topics.map((t) => (
              <button
                key={t.query}
                onClick={() => handleSelectTopic(t.query)}
                className={`option-button ${activeTopicTitle === t.query ? 'option-button--active' : ''}`}
              >
                <span>{t.title}</span>
                <Sparkles size={13} />
              </button>
            ))}
          </div>

          <button onClick={() => onStartQuiz(activeTopicTitle)} className="primary-action">
            <HelpCircle size={15} />
            Ask a question
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <Loader2 className="spinner" />
            <p>Analyzing the repository logic…</p>
          </div>
        ) : explanation ? (
          <div className="explanation-card">
            <div className="explanation-card__body">
              {renderMarkdown(explanation)}
            </div>

            <div className="card-footer">
              <span>Ready to practice?</span>
              <button onClick={() => onStartQuiz(activeTopicTitle)} className="secondary-action">
                <BookOpen size={14} />
                Test understanding
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="empty-state form-error" role="alert"><p>{error}</p></div>
        ) : (
          <div className="empty-state">
            <p>Select a topic or click a node to generate an AI explanation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function renderMarkdown(content) {
  if (!content) return null;
  const lines = content.split('\n');

  return lines.map((line, idx) => {
    if (line.startsWith('### ')) {
      return <h3 key={idx} className="text-sm font-bold text-white mt-3 mb-1.5">{line.replace('### ', '')}</h3>;
    }
    if (line.startsWith('#### ')) {
      return <h4 key={idx} className="text-xs font-bold text-indigo-300 mt-2 mb-1">{line.replace('#### ', '')}</h4>;
    }
    if (line.startsWith('* ') || line.startsWith('- ')) {
      return (
        <div key={idx} className="flex items-start gap-1.5 my-1 text-slate-300 pl-1">
          <span className="text-indigo-400 font-bold">•</span>
          <span>{parseFormattedText(line.substring(2))}</span>
        </div>
      );
    }
    if (line.trim() === '') {
      return <div key={idx} className="h-1.5" />;
    }
    return <p key={idx} className="my-1 text-slate-300 leading-relaxed">{parseFormattedText(line)}</p>;
  });
}

function parseFormattedText(text) {
  // Simple bold renderer
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300 font-mono text-[11px]">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
