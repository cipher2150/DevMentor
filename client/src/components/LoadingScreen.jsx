import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, Cpu } from 'lucide-react';

const ANALYSIS_STEPS = [
  'Repository connected',
  'Project structure analyzed',
  'Dependencies identified',
  'Important files detected',
  'Architecture mapped',
  'Learning concepts extracted'
];

export default function LoadingScreen({ repoUrl }) {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          setCompletedSteps((done) => [...done, prev]);
          return prev + 1;
        } else {
          setCompletedSteps((done) => Array.from(new Set([...done, prev])));
          clearInterval(interval);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-6 text-center bg-[#090d16]">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl glow-indigo relative overflow-hidden">
        {/* Top Glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 animate-pulse-subtle" />

        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-6">
          <Cpu className="w-6 h-6 animate-pulse" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Analyzing your codebase...</h2>
        <p className="text-xs text-slate-400 font-mono mb-8 truncate px-2">
          {repoUrl}
        </p>

        {/* Steps List */}
        <div className="space-y-3 text-left mb-8 font-mono text-xs">
          {ANALYSIS_STEPS.map((step, idx) => {
            const isDone = completedSteps.includes(idx);
            const isCurrent = idx === currentStepIndex && !isDone;

            return (
              <div
                key={step}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                  isDone
                    ? 'bg-slate-950/60 text-slate-200 border border-emerald-500/20'
                    : isCurrent
                    ? 'bg-indigo-950/40 text-indigo-200 border border-indigo-500/30'
                    : 'text-slate-600 opacity-40'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className="font-medium">{step}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 text-indigo-300 text-xs font-medium pt-2 border-t border-slate-800/80">
          <Sparkles className="w-4 h-4 text-sky-400 animate-spin" />
          <span>Building your personalized learning path...</span>
        </div>
      </div>
    </div>
  );
}
