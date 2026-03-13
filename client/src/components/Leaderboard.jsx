import React, { useState, useEffect } from 'react';
import SpeakerModal from './SpeakerModal';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((data) => setLeaderboard(data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (leaderboard.length === 0) return null;

  const maxSessions = leaderboard[0]?.sessions || 1;

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <span className="leaderboard-icon">&#9733;</span>
        <h2 className="leaderboard-title">HALL OF FAME</h2>
      </div>

      <div className="leaderboard-list">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.speaker}
            className="leaderboard-row"
            onClick={() => setSelectedSpeaker(entry.speaker)}
          >
            <div className="leaderboard-rank">
              {index < 3 ? (
                <span className={`leaderboard-medal medal-${index + 1}`}>
                  {index === 0 ? '1' : index === 1 ? '2' : '3'}
                </span>
              ) : (
                <span className="leaderboard-number">{index + 1}</span>
              )}
            </div>
            <div className="leaderboard-info">
              <span className="leaderboard-name">{entry.speaker}</span>
              <div className="leaderboard-bar-container">
                <div
                  className="leaderboard-bar-fill"
                  style={{ width: `${(entry.sessions / maxSessions) * 100}%` }}
                />
              </div>
            </div>
            <div className="leaderboard-count">
              <span className="leaderboard-count-number">{entry.sessions}</span>
              <span className="leaderboard-count-label">
                {entry.sessions === 1 ? 'talk' : 'talks'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedSpeaker && (
        <SpeakerModal
          speakerName={selectedSpeaker}
          onClose={() => setSelectedSpeaker(null)}
        />
      )}
    </div>
  );
}
