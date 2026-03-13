import React from 'react';

export default function Header({ nextSession }) {
  return (
    <header className="header">
      <div className="header-brand">AVANTGRADE.COM</div>
      <h1 className="header-title">
        Thank God It's <span className="header-title-accent">Innovation</span>
      </h1>
      <p className="header-subtitle">
        Ogni venerdì · 16:00 · 30 min · 3 speaker
      </p>
      {nextSession && (
        <div className="header-session-box">
          <span className="header-session-label">PROSSIMA SESSIONE</span>
          <span className="header-session-date">{nextSession}</span>
        </div>
      )}
    </header>
  );
}
