import { useState, useCallback, useRef } from 'react';

const CARD_EMOJIS = [
  '🎮','🕹️','🏆','🥇','⭐','💎','🔥','❄️','⚡','🎯',
  '📦','🚀','💀','👾','🛡️','⚔️','🗡️','🧩','🎲','🃏',
  '✅','⏳','🔒','🎵','🎬','📺','🖥️','🧠','💡','🌟',
  '🐉','🦁','🐺','🤖','👑','🎭','🏰','🌋','🌊','🌙',
];

function LibraryBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: '#1b2838', color: '#c7d5e0',
      fontSize: 10, fontWeight: 600,
      padding: '2px 7px', borderRadius: 4, flexShrink: 0,
    }}>
      <svg width="9" height="9" viewBox="0 0 256 256" fill="#c7d5e0"><circle cx="128" cy="128" r="128"/></svg>
      Bibliothèque
    </span>
  );
}

export default function SearchModal({ api, token, boardGames, onAdd, onRemove, onClose, customOnly }) {
  const [tab, setTab] = useState(customOnly ? 'custom' : 'steam'); // 'steam' | 'custom'

  // Steam search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(new Set(boardGames.map(g => g.appid)));
  const debounce = useRef(null);

  // Custom card state
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🎮');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${api}/steam/search?q=${encodeURIComponent(q)}`, { headers: authHeaders });
      setResults(await res.json());
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [api, token]);

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

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const appid = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    onAdd({ appid, name: customName.trim(), type: 'custom', emoji: customEmoji, header_img: null, icon_img: null });
    onClose();
  };

  const tabStyle = (active) => ({
    flex: 1, padding: '9px 0', background: 'none',
    border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    color: active ? 'var(--text)' : 'var(--text-muted)',
    fontWeight: active ? 700 : 400, fontSize: 13, cursor: 'pointer',
    transition: 'all .15s',
  });

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
        {/* Header */}
        <div style={{ padding: '14px 16px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Ajouter une carte</span>
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex' }}>
            {!customOnly && (
              <button style={tabStyle(tab === 'steam')} onClick={() => setTab('steam')}>
                <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 12, height: 12, fill: 'currentColor', marginRight: 5, verticalAlign: 'middle' }}>
                  <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/>
                </svg>
                Jeu Steam
              </button>
            )}
            <button style={tabStyle(tab === 'custom')} onClick={() => setTab('custom')}>
              ✦ Carte personnalisée
            </button>
          </div>
        </div>

        {/* Steam tab */}
        {tab === 'steam' && (
          <>
            <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
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
                  <div key={game.appid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                    <img
                      src={game.header_img} alt={game.name}
                      style={{ width: 92, height: 43, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</span>
                        {game.in_library && <LibraryBadge />}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {game.in_library && game.playtime_hours > 0 ? `⏱ ${game.playtime_hours}h jouées` : game.in_library ? 'Jamais joué' : ''}
                      </div>
                    </div>
                    {isAdded ? (
                      <button onClick={() => handleRemove(game)}
                        style={{ background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                        ✓ Retirer
                      </button>
                    ) : (
                      <button onClick={() => handleAdd(game)}
                        style={{ background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                        + Ajouter
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Custom card tab */}
        {tab === 'custom' && (
          <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Crée une carte libre : projet perso, objectif, note de jeu…</p>

            {/* Preview */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
                width: 160, overflow: 'hidden',
              }}>
                <div style={{ width: '100%', height: 88, background: 'var(--steam)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>
                  {customEmoji}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: customName ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {customName || 'Nom de la carte…'}
                  </div>
                </div>
              </div>
            </div>

            {/* Emoji picker */}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Icône</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setShowEmojiPicker(p => !p)}
                  style={{
                    width: 44, height: 44, fontSize: 24, background: 'var(--surface2)',
                    border: '2px solid var(--accent)', borderRadius: 8, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >{customEmoji}</button>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clique pour changer</span>
              </div>
              {showEmojiPicker && (
                <div style={{
                  marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4,
                  background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 8,
                }}>
                  {CARD_EMOJIS.map(e => (
                    <button key={e} onClick={() => { setCustomEmoji(e); setShowEmojiPicker(false); }}
                      style={{
                        width: 32, height: 32, fontSize: 18, background: customEmoji === e ? 'var(--accent-dim)' : 'none',
                        border: customEmoji === e ? '1px solid var(--accent)' : '1px solid transparent',
                        borderRadius: 5, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{e}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Nom de la carte</label>
              <input
                autoFocus={tab === 'custom'}
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                placeholder="Ex: Terminer la campagne principale…"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleAddCustom}
              disabled={!customName.trim()}
              style={{
                padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 8,
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: customName.trim() ? 'pointer' : 'not-allowed',
                opacity: customName.trim() ? 1 : 0.5,
              }}
            >+ Créer la carte</button>
          </div>
        )}
      </div>
    </div>
  );
}
