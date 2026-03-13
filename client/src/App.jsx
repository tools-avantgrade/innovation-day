import React from 'react';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import SlotCard from './components/SlotCard';
import { useSession } from './hooks/useSession';

export default function App() {
  const { session, loading, error, bookSlot, cancelSlot, resetSlots } = useSession();

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <Header nextSession={null} />
          <div className="loading">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="container">
          <Header nextSession={null} />
          <div className="error-message">
            Errore di connessione. Riprova tra qualche secondo.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <Header nextSession={session?.nextSession} />
        <ProgressBar bookedCount={session?.bookedCount || 0} />

        <div className="slots-grid">
          {session?.slots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              onBook={bookSlot}
              onCancel={cancelSlot}
            />
          ))}
        </div>

        <footer className="footer">
          <button className="btn btn-admin" onClick={resetSlots}>
            RESET PER NUOVA SESSIONE
          </button>
          <p className="footer-text">
            AvantGrade.com · Thank God It's Innovation
          </p>
        </footer>
      </div>
    </div>
  );
}
