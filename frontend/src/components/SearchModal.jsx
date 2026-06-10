import { useState, useCallback, useRef } from 'react';

function LibraryBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: '#1b2838', color: '#c7d5e0',
      fontSize: 10, fontWeight: 600,
      padding: '2px 7px', borderRadius: 4, flexShrink: 0,
    }}>
      <svg width="9" height="9" viewBox="0 0 256 256" fill="#c7d5e0"><circle cx="128" cy="128" r="128"/></svg>
      Dans ta bibliothèque
    </span>
  );
}

export default function SearchModal({ api, boardGames, onAdd, onRemove, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(new Set(boardGames.map(g => g.appid)));
  const debounce = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${api}/search/store?q=${encodeURIComponent(q)}`);
      setResults(await res.json());
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [api]);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q), 350);
  };

  const handleAdd = (game) => {
    onAdd(game);
    setAdded(prev => new Set([...prev, game.appid]));
    onClose();
  };

  const handleRemove = (game) => {
    if (onRemove) onRemove(game.appid);
    setAdded(prev => { const s = new Set(prev); s.delete(game.appid); return s; });
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20, backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, width: '100%', maxWidth: 540,
        maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Ajouter un jeu</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '12px 16px 8px' }}>
          <input
            autoFocus type="search"
            placeholder="Rechercher un jeu Steam..."
            value={query} onChange={handleInput}
            style={{
              width: '100%', background: 'var(--surface2)',
              border: '1px solid var(--border)', borderRadius: 7,
              padding: '9px 14px', color: 'var(--text)', fontSize: 13, outline: 'none',
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Recherche...</div>}
          {!loading && query && results.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Aucun résultat</div>
          )}
          {!loading && !query && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32, fontSize: 12, lineHeight: 1.8 }}>
              Tape le nom d'un jeu.<br/>
              Les jeux dans ta bibliothèque Steam sont identifiés.
            </div>
          )}
          {results.map(game => {
            const isAdded = added.has(game.appid);
            return (
              <div
                key={game.appid}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 0', borderBottom: '1px solid var(--border)',
                }}
              >
                <img
                  src={game.header_img} alt={game.name}
                  style={{ width: 92, height: 43, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {game.name}
                    </span>
                    {game.owned && <LibraryBadge />}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {game.owned
                      ? game.playtime_hours > 0 ? `⏱ ${game.playtime_hours}h jouées` : 'Jamais joué'
                      : game.price || 'Gratuit'
                    }
                  </div>
                </div>

                {isAdded ? (
                  <button
                    onClick={() => handleRemove(game)}
                    title="Retirer du board"
                    style={{
                      background: 'var(--surface3)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '5px 10px', color: 'var(--text-muted)',
                      fontSize: 11, cursor: 'pointer', flexShrink: 0,
                    }}
                  >✓ Retirer</button>
                ) : (
                  <button
                    onClick={() => handleAdd(game)}
                    title="Ajouter au board"
                    style={{
                      background: 'var(--accent)', border: 'none',
                      borderRadius: 6, padding: '5px 10px', color: '#fff',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                    }}
                  >+ Ajouter</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
