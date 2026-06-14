import { useState } from 'react';

/**
 * Backdrop commun pour toutes les modales.
 * Props:
 *   onClose  – appelé quand on clique sur le fond
 *   zIndex   – z-index du backdrop (défaut : 100)
 *   children – contenu de la modale
 */
export default function ModalBackdrop({ onClose, zIndex = 100, children }) {
  const [phase, setPhase] = useState('in'); // 'in' | 'out'

  const handleClose = () => {
    setPhase('out');
    setTimeout(onClose, 180);
  };

  return (
    <>
      <div
        onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex, padding: 20,
          backdropFilter: 'blur(4px)',
          animation: phase === 'in' ? 'backdrop-in .18s ease' : 'backdrop-out .18s ease forwards',
        }}
      >
        {/* Wrapper d'animation — ne perturbe pas le flex centering */}
        <div style={{
            transformOrigin: 'center center',
            animation: phase === 'in'
              ? 'modal-zoom-in .22s cubic-bezier(0.34,1.56,0.64,1)'
              : 'modal-zoom-out .18s ease forwards',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
