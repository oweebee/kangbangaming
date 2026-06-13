/**
 * Backdrop commun pour toutes les modales.
 * Props:
 *   onClose  – appelé quand on clique sur le fond
 *   zIndex   – z-index du backdrop (défaut : 100)
 *   children – contenu de la modale
 */
export default function ModalBackdrop({ onClose, zIndex = 100, children }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex, padding: 20,
        backdropFilter: 'blur(4px)',
      }}
    >
      {children}
    </div>
  );
}
