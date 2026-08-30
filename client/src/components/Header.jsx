import React from 'react';
import { Terminal, Cpu, GitBranch, ArrowLeft, BookOpen } from 'lucide-react';

export default function Header({ currentRepo, onReset, activeTab, setActiveTab }) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <div onClick={onReset} className="brand" role="button" tabIndex={0}>
          <div className="brand__icon">
            <Cpu size={18} />
          </div>
          <div>
            <div className="brand__name-wrap">
              <span className="brand__name">DevMentor</span>
              <span className="brand__badge">AI Tutor</span>
            </div>
          </div>
        </div>

        {currentRepo && (
          <div className="project-pill">
            <GitBranch size={13} />
            <span>{currentRepo.name}</span>
          </div>
        )}
      </div>

      {currentRepo && (
        <div className="topbar__right">
          <div className="tab-switcher">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={activeTab === 'dashboard' ? 'active' : ''}
            >
              <Terminal size={14} />
              Workspace
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={activeTab === 'quiz' ? 'active' : ''}
            >
              <BookOpen size={14} />
              Quiz
            </button>
          </div>

          <button onClick={onReset} className="secondary-btn">
            <ArrowLeft size={14} />
            Change Repo
          </button>
        </div>
      )}
    </header>
  );
}
