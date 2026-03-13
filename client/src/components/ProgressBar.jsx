import React from 'react';

export default function ProgressBar({ bookedCount }) {
  const total = 3;
  const percentage = (bookedCount / total) * 100;
  const isComplete = bookedCount === total;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <span className="progress-label">
          SLOT PRENOTATI: {bookedCount}/{total}
        </span>
        {isComplete && (
          <span className="progress-complete">LINEUP COMPLETA</span>
        )}
      </div>
      <div className="progress-bar">
        <div
          className={`progress-fill ${isComplete ? 'progress-fill-complete' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
