import React, { useState, useEffect } from 'react';

export default function SpeakerModal({ speakerName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/speaker/${encodeURIComponent(speakerName)}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [speakerName]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        {loading ? (
          <div className="modal-loading">Caricamento...</div>
        ) : data?.error ? (
          <div className="modal-loading">Nessun dato trovato.</div>
        ) : (
          <>
            <div className="modal-header">
              <div className="modal-avatar">
                {speakerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="modal-name">{speakerName}</h2>
                <p className="modal-stats">
                  {data.totalSessions} {data.totalSessions === 1 ? 'sessione' : 'sessioni'}
                </p>
              </div>
            </div>

            <div className="modal-talks">
              <h3 className="modal-section-title">STORICO TALK</h3>
              {data.talks.map((talk, i) => (
                <div key={i} className="modal-talk">
                  <div className="modal-talk-header">
                    <span className="modal-talk-date">{formatDate(talk.sessionDate)}</span>
                    <span className="modal-talk-slot">Slot {talk.slotId}</span>
                  </div>
                  <p className="modal-talk-topic">{talk.topic}</p>
                  {talk.summary && (
                    <div className="modal-talk-summary">
                      <span className="modal-talk-summary-label">AI SUMMARY</span>
                      <p className="modal-talk-summary-text">{talk.summary}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
