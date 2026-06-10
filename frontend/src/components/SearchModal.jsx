import { useState, useCallback, useRef } from 'react';

export default function SearchModal({ api, boardGames, onAdd, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('library'); // 'library' | 'store'
  const [added, setAdded] = useState(new Set(boardGames.map(g => g.appid)));
  const debounce = useRef(null);

  const search = useCallback(async (q, src) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${api}/search/${src}?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q, source), 350);
  };

  const handleSource = (src) => {
    setSource(src);
    if (query.trim()) search(query, src);
  };

  const handleAdd = (game) => {
    onAdd(game);
    setAdded(prev => new Set([...prev, game.appid]));
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        width: '100%', maxWidth: 520,
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Ajouter un jeu</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Source tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '8px 16px 0', gap: 4 }}>
          {[['library', '📚 Ma bibliothèque'], ['store', '🛒 Steam Store']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => handleSource(id)}
              style={{
                background: 'none', border: 'none',
                borderBottom: source === id ? '2px solid var(--accent)' : '2px solid transparent',
                padding: '5px 10px', marginBottom: -1,
                color: source === id ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: source === id ? 600 : 400,
                fontSize: 12, cursor: 'pointer',
              }}
            >{label}</button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ padding: '10px 16px' }}>
          <input
            autoFocus
            type="search"
            placeholder={source === 'library' ? 'Chercher dans tes jeux...' : 'Chercher sur le store Steam...'}
            value={query}
            onChange={handleInput}
            style={{
              width: '100%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 7, padding: '8px 12px',
              color: 'var(--text)', fontSize: 13, outline: 'none',
            }}
          />
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Recherche...</div>}
          {!loading && query && results.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Aucun résultat</div>
          )}
          {!loading && !query && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, fontSize: 12 }}>
              {source === 'library' ? 'Tape le nom d\'un jeu de ta bibliothèque' : 'Tape le nom d\'un jeu du store Steam'}
            </div>
          )}
          {results.map(game => {
            const isAdded = added.has(game.appid);
            return (
              <div key={game.appid} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: '1px solid var(--border)',
              }}>
                <img
                  src={game.header_img}
                  alt={game.name}
                  style={{ width: 80, height: 37, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {game.playtime_hours > 0 ? `⏱ ${game.playtime_hours}h` : 'Jamais joué'}
                    {game.price && <span style={{ marginLeft: 8 }}>{game.price}</span>}
                  </div>
                </div>
                <button
                  onClick={() => !isAdded && handleAdd(game)}
                  disabled={isAdded}
                  style={{
                    background: isAdded ? 'var(--surface2)' : 'var(--accent)',
                    border: 'none', borderRadius: 6,
                    padding: '5px 12px',
                    color: isAdded ? 'var(--text-muted)' : '#000',
                    fontWeight: 600, fontSize: 11,
                    cursor: isAdded ? 'default' : 'pointer',
                    flexShrink: 0,
                  }}
                >{isAdded ? '✓ Ajouté' : '+ Ajouter'}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
