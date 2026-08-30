import React, { useState } from 'react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import LoadingScreen from './components/LoadingScreen';
import CodebaseExplorer from './components/CodebaseExplorer';
import KnowledgeMap from './components/KnowledgeMap';
import AIMentorPanel from './components/AIMentorPanel';
import QuizPanel from './components/QuizPanel';
import SkillTracker from './components/SkillTracker';
import CodeViewerModal from './components/CodeViewerModal';
import { analyzeRepo } from './services/api';

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'quiz'
  const [selectedPath, setSelectedPath] = useState('');
  const [selectedConcept, setSelectedConcept] = useState('Overall Architecture');
  const [viewingCodePath, setViewingCodePath] = useState(null);
  const [error, setError] = useState('');
  
  // Session level mastery map
  const [masteryMap, setMasteryMap] = useState({});

  const handleAnalyze = async (url) => {
    setRepoUrl(url);
    setError('');
    setAnalyzing(true);
    try {
      const data = await analyzeRepo(url);
      setAnalyzedData(data);
      setMasteryMap(Object.fromEntries((data.coreConcepts || []).slice(0, 6).map(concept => [concept.title, 0])));
      if (data.fileTree && data.fileTree.length > 0) {
        const firstFile = data.fileTree.find(f => f.type === 'blob')?.path || '';
        setSelectedPath(firstFile);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to analyze this repository.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalyzedData(null);
    setRepoUrl('');
    setActiveTab('dashboard');
  };

  const handleUpdateMastery = (concept, newScore) => {
    setMasteryMap(prev => ({
      ...prev,
      [concept]: Math.min(100, Math.round((prev[concept] || 50) * 0.4 + newScore * 0.6))
    }));
  };

  const handleStartQuiz = (topic) => {
    setSelectedConcept(topic);
    setActiveTab('quiz');
  };

  if (analyzing) {
    return <LoadingScreen repoUrl={repoUrl} />;
  }

  if (!analyzedData) {
    return (
      <div className="min-h-screen bg-[#090d16]">
        <Header currentRepo={null} onReset={handleReset} />
        <LandingPage onAnalyze={handleAnalyze} error={error} />
      </div>
    );
  }

  return (
    <div className="workspace-shell">
      <Header
        currentRepo={analyzedData}
        onReset={handleReset}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <SkillTracker masteryMap={masteryMap} />

      {activeTab === 'dashboard' ? (
        <div className="workspace-layout">
          <CodebaseExplorer
            fileTree={analyzedData.fileTree}
            fileOverviews={analyzedData.fileOverviews}
            selectedPath={selectedPath}
            onSelectPath={setSelectedPath}
            onViewCode={setViewingCodePath}
            concepts={analyzedData.coreConcepts}
            onSelectConcept={(c) => {
              setSelectedConcept(c.title);
              if (c.relevantFiles && c.relevantFiles[0]) {
                setSelectedPath(c.relevantFiles[0]);
              }
            }}
          />

          <KnowledgeMap
            knowledgeData={analyzedData.knowledgeMap}
            onSelectConcept={(conceptId) => {
              const matched = analyzedData.coreConcepts.find(c => c.id === conceptId);
              if (matched) {
                setSelectedConcept(matched.title);
              }
            }}
            onSelectFile={(filePath) => setSelectedPath(filePath)}
          />

          <AIMentorPanel
            repoName={analyzedData.name}
            selectedTopic={selectedConcept}
            onStartQuiz={handleStartQuiz}
            repoAnalysis={analyzedData}
          />
        </div>
      ) : (
        <QuizPanel
          repoName={analyzedData.name}
          conceptTitle={selectedConcept}
          onUpdateMastery={handleUpdateMastery}
          repoAnalysis={analyzedData}
        />
      )}

      {viewingCodePath && (
        <CodeViewerModal
          filePath={viewingCodePath}
          owner={analyzedData.owner}
          repo={analyzedData.repo}
          branch={analyzedData.defaultBranch}
          onClose={() => setViewingCodePath(null)}
        />
      )}
    </div>
  );
}
