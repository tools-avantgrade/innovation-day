import React, { useState, useEffect } from 'react';

export default function TranscriptUpload() {
  const [sessionDate, setSessionDate] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);

  // Fetch available session dates from history
  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => {
        const dates = [...new Set((data.history || []).map((h) => h.session_date))];
        setSessions(dates);
        if (dates.length > 0) setSessionDate(dates[0]);
      })
      .catch(() => {});
  }, []);

  const handleUpload = async () => {
    if (!sessionDate) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('transcript', file);
        formData.append('sessionDate', sessionDate);
        res = await fetch('/api/transcript/upload', { method: 'POST', body: formData });
      } else if (text.trim()) {
        res = await fetch('/api/transcript/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionDate, text: text.trim() }),
        });
      } else {
        setError('Inserisci il testo o carica un file.');
        setUploading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setText('');
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (sessions.length === 0) return null;

  return (
    <div className="transcript-section">
      <div className="transcript-header">
        <span className="transcript-icon">&#9998;</span>
        <h2 className="transcript-title">CARICA TRASCRIZIONE</h2>
      </div>
      <p className="transcript-desc">
        Carica la trascrizione della sessione e l'AI genererà un riassunto per ogni speaker.
      </p>

      <div className="transcript-form">
        <label className="transcript-label">SESSIONE</label>
        <select
          className="input-field"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
        >
          {sessions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <label className="transcript-label">TESTO TRASCRIZIONE</label>
        <textarea
          className="input-field input-textarea transcript-textarea"
          placeholder="Incolla qui la trascrizione della sessione..."
          value={text}
          onChange={(e) => { setText(e.target.value); setFile(null); }}
          rows={6}
        />

        <div className="transcript-or">oppure</div>

        <label className="transcript-file-label">
          <input
            type="file"
            accept=".txt,.md,.doc,.docx"
            className="transcript-file-input"
            onChange={(e) => {
              setFile(e.target.files[0] || null);
              if (e.target.files[0]) setText('');
            }}
          />
          <span className="btn btn-secondary transcript-file-btn">
            {file ? file.name : 'SCEGLI FILE'}
          </span>
        </label>

        {error && <p className="form-error">{error}</p>}

        <button
          className="btn btn-upload"
          onClick={handleUpload}
          disabled={uploading || (!text.trim() && !file)}
        >
          {uploading ? 'ANALISI IN CORSO...' : 'CARICA E ANALIZZA'}
        </button>

        {result && (
          <div className="transcript-result">
            <p className="transcript-result-msg">{result.message}</p>
            {result.summaries && result.summaries.length > 0 && (
              <div className="transcript-summaries">
                {result.summaries.map((s, i) => (
                  <div key={i} className="transcript-summary-item">
                    <span className="transcript-summary-speaker">{s.speaker}</span>
                    <p className="transcript-summary-text">{s.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
