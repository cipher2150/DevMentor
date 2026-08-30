import React, { useState, useEffect } from 'react';
import { HelpCircle, Send, CheckCircle2, AlertTriangle, Sparkles, Loader2, RotateCcw, ArrowRight, Award } from 'lucide-react';
import { fetchQuestion, evaluateAnswer } from '../services/api';

export default function QuizPanel({ repoName, conceptTitle, onUpdateMastery, repoAnalysis }) {
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [questionData, setQuestionData] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const loadNewQuestion = async (topic) => {
    setLoadingQuestion(true);
    setEvaluation(null);
    setUserAnswer('');
    try {
      const qData = await fetchQuestion({
        repoName,
        topic: topic || conceptTitle || 'Overall Architecture',
        repoAnalysis
      });
      setQuestionData(qData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestion(false);
    }
  };

  useEffect(() => {
    loadNewQuestion(conceptTitle);
  }, [conceptTitle]);

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || evaluating) return;

    setEvaluating(true);
    try {
      const result = await evaluateAnswer({
        repoName,
        question: questionData?.question || 'How is the project organized, and where does this concept fit?',
        answer: userAnswer.trim(),
        concept: questionData?.concept || conceptTitle || 'Overall Architecture',
        repoAnalysis
      });

      setEvaluation(result);
      if (result.score && onUpdateMastery) {
        onUpdateMastery(questionData?.concept || conceptTitle || 'Overall Architecture', result.score * 10);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleFollowUpChallenge = () => {
    if (evaluation?.followUpQuestion) {
      setQuestionData({
        question: evaluation.followUpQuestion,
        concept: evaluation.knowledgeGap || 'Advanced Concurrency',
        difficulty: 'Hard'
      });
      setEvaluation(null);
      setUserAnswer('');
    } else {
      loadNewQuestion(conceptTitle);
    }
  };

  return (
    <div className="quiz-shell">
      <div className="quiz-header">
        <div>
          <span className="quiz-kicker">Practice mode</span>
          <h2>{questionData?.concept || conceptTitle || 'Overall Architecture'}</h2>
        </div>

        <button onClick={() => loadNewQuestion(conceptTitle)} disabled={loadingQuestion} className="ghost-button">
          <RotateCcw size={14} />
          New question
        </button>
      </div>

      {loadingQuestion ? (
        <div className="quiz-card quiz-card--loading">
          <Loader2 className="spinner" />
          <p>Generating a repo-grounded question…</p>
        </div>
      ) : (
        <div className="quiz-card">
          <div className="question-box">
            <div className="mini-icon mini-icon--primary">
              <HelpCircle size={15} />
            </div>
            <div>
              <span className="difficulty-badge">{questionData?.difficulty || 'Intermediate'} challenge</span>
              <p>{questionData?.question || 'How is the project organized, and where should a new contributor start?'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmitAnswer} className="answer-form">
            <textarea
              rows={5}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Explain your answer based on the code structure, state flow, and repository behavior..."
              required
            />

            <div className="answer-form__footer">
              <span>Use file names, logic flow, or state transitions in your explanation.</span>
              <button type="submit" disabled={evaluating || !userAnswer.trim()} className="primary-action">
                {evaluating ? (
                  <>
                    <Loader2 className="spinner" />
                    Evaluating…
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Submit answer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {evaluation && (
        <div className="quiz-card quiz-card--result">
          <div className="result-header">
            <div className="score-badge">{evaluation.score}</div>
            <div>
              <h3>Understanding score</h3>
              <p>{evaluation.score} / 10</p>
            </div>
            <span className="success-pill"><Award size={14} /> AI evaluated</span>
          </div>

          {evaluation.correctPoints && evaluation.correctPoints.length > 0 && (
            <div className="result-section result-section--good">
              <span className="result-label">What you got right</span>
              <div className="result-list">
                {evaluation.correctPoints.map((point, idx) => (
                  <div key={idx} className="result-item">
                    <CheckCircle2 size={14} />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {evaluation.missingPoints && evaluation.missingPoints.length > 0 && (
            <div className="result-section result-section--warn">
              <span className="result-label">What to improve</span>
              <div className="result-list">
                {evaluation.missingPoints.map((point, idx) => (
                  <div key={idx} className="result-item">
                    <AlertTriangle size={14} />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {evaluation.explanation && (
            <div className="result-section result-section--plain">
              <span className="result-label">AI explanation</span>
              <p>{evaluation.explanation}</p>
            </div>
          )}

          <div className="result-footer">
            <div>
              <span className="result-label">Knowledge gap</span>
              <strong>{evaluation.knowledgeGap || 'Repository architecture and flow'}</strong>
            </div>
            <button onClick={handleFollowUpChallenge} className="primary-action">
              <ArrowRight size={14} />
              Follow-up challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
