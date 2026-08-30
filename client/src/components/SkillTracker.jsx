import React from 'react';
import { Award, Brain, TrendingUp } from 'lucide-react';

export default function SkillTracker({ masteryMap }) {
  const skills = Object.keys(masteryMap).map(title => ({ id: title, title }));

  return (
    <div className="insight-bar">
      <div className="insight-bar__header">
        <div className="panel-header__title" style={{ color: '#475569' }}>
          <Brain size={15} />
          <span>Your understanding</span>
        </div>
        <span className="panel-subtitle">Session progress</span>
      </div>

      <div className="insight-grid">
        {skills.map((skill) => {
          const score = masteryMap[skill.id] !== undefined ? masteryMap[skill.id] : skill.defaultScore;

          return (
            <div key={skill.id} className="insight-card">
              <div className="insight-card__top">
                <span className="insight-card__label">{skill.title}</span>
                <span className="insight-card__score">{score}%</span>
              </div>
              <div className="insight-card__bar">
                <div
                  className="insight-card__fill"
                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
