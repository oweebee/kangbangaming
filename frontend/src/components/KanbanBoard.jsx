import GameCard from './GameCard.jsx';

export default function KanbanBoard({ columns, byColumn, dragging, setDragging, moveGame, onCardClick }) {

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (dragging && dragging.column !== columnId) {
      moveGame(dragging.appid, columnId);
    }
    setDragging(null);
  };

  const handleDragEnter = (e) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.background = '';
  };

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      gap: '12px',
      padding: '16px',
      overflowX: 'auto',
      overflowY: 'hidden',
    }}>
      {columns.map(col => {
        const games = byColumn[col.id] || [];
        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, col.id)}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            style={{
              flex: '1 1 0',
              minWidth: 220,
              maxWidth: 320,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              transition: 'background 0.15s',
            }}
          >
            {/* Column header */}
            <div style={{
              padding: '12px 14px',
              borderBottom: '2px solid ' + col.color,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 16 }}>{col.emoji}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{col.label}</span>
              <span style={{
                marginLeft: 'auto',
                background: 'var(--surface2)',
                borderRadius: 99,
                padding: '2px 8px',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}>{games.length}</span>
            </div>

            {/* Cards */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {games.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  padding: '24px 8px',
                  border: '1px dashed var(--border)',
                  borderRadius: 8,
                }}>
                  Glisse des jeux ici
                </div>
              )}
              {games.map(game => (
                <GameCard
                  key={game.appid}
                  game={game}
                  onDragStart={() => setDragging(game)}
                  onDragEnd={() => setDragging(null)}
                  onClick={() => onCardClick(game)}
                  isDragging={dragging?.appid === game.appid}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
