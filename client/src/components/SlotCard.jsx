import React, { useState } from 'react';

const SLOT_ACCENTS = {
  1: '#FF6B35',
  2: '#00C9A7',
  3: '#845EF7',
};

const SLOT_LABELS = {
  1: 'SLOT 1',
  2: 'SLOT 2',
  3: 'SLOT 3',
};

export default function SlotCard({ slot, onBook, onCancel }) {
  const [isBooking, setIsBooking] = useState(false);
  const [speaker, setSpeaker] = useState('');
  const [topic, setTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const accent = SLOT_ACCENTS[slot.id];
  const canSubmit = speaker.trim() && topic.trim() && !submitting;

  const handleBook = async () => {
    setSubmitting(true);
    setError(null);
    const result = await onBook(slot.id, speaker.trim(), topic.trim());
    if (result.success) {
      setIsBooking(false);
      setSpeaker('');
      setTopic('');
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    await onCancel(slot.id);
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div
      className={`slot-card ${slot.isBooked ? 'slot-card-booked' : ''}`}
      style={{
        '--accent': accent,
        '--accent-20': `${accent}33`,
        '--accent-10': `${accent}1a`,
      }}
    >
      {slot.isBooked && <div className="slot-card-top-border" />}

      <div className="slot-card-header">
        <div className="slot-card-meta">
          <span className="slot-card-label">{SLOT_LABELS[slot.id]}</span>
          <span className="slot-card-time">
            {slot.timeStart} - {slot.timeEnd}
          </span>
        </div>
        <span className={`slot-card-status ${slot.isBooked ? 'status-booked' : 'status-open'}`}>
          {slot.isBooked ? 'BOOKED' : 'OPEN'}
        </span>
      </div>

      {slot.isBooked ? (
        <div className="slot-card-booked-content">
          <div className="slot-card-speaker">
            <div className="slot-card-avatar" style={{ background: accent }}>
              {getInitial(slot.speaker)}
            </div>
            <div className="slot-card-speaker-info">
              <span className="slot-card-speaker-name">{slot.speaker}</span>
            </div>
          </div>
          <div className="slot-card-topic">
            <span className="slot-card-topic-label">TOPIC</span>
            <p className="slot-card-topic-text">{slot.topic}</p>
          </div>
          <button className="btn btn-cancel" onClick={handleCancel}>
            CANCELLA
          </button>
        </div>
      ) : isBooking ? (
        <div className="slot-card-form">
          <input
            type="text"
            placeholder="Il tuo nome"
            value={speaker}
            onChange={(e) => setSpeaker(e.target.value)}
            className="input-field"
            autoFocus
          />
          <textarea
            placeholder="Di cosa parlerai? (breve descrizione)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="input-field input-textarea"
            rows={3}
          />
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button
              className="btn btn-book"
              onClick={handleBook}
              disabled={!canSubmit}
            >
              {submitting ? 'PRENOTANDO...' : 'PRENOTA'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setIsBooking(false);
                setSpeaker('');
                setTopic('');
                setError(null);
              }}
            >
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn btn-take-slot"
          onClick={() => setIsBooking(true)}
        >
          + PRENDI QUESTO SLOT
        </button>
      )}
    </div>
  );
}
