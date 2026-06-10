import { useState, useRef, useEffect, useCallback } from 'react';

const API = '/api';

function highlight(text, q) {
  if (!text || !q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(100,200,255,0.22)', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

const BADGE = {
  board: { label: 'Board',  color: '#f5a500' },
  name:  { label: 'Tâche',  color: '#4cd882' },
  note:  { label: 'Note',   color: '#a78bfa' },
};

export default function GlobalSearch({ token, onGoToBoard, onOpenGame }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const debounceRef  = useRef(null);
  const containerRef = useRef(null);
  const inputRef     = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setResults(await res.json());
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [token]);

  const handleInput = (val) => {
    setQuery(val);
    setActiveIdx(-1);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    setOpen(true);
    debounceRef.current = setTimeout(() => doSearch(val), 220);
  };

  const handleSelect = (r) => {
    setQuery(''); setResults([]); setOpen(false);
    if (r.type === 'board') onGoToBoard(r.boardId);
    else onOpenGame(r.boardId, r.gameId);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(results[activeIdx]); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(''); setResults([]); }
  };

  // Close on outside click
  useEffect(() => {
    const fn = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--text-muted)"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: 8, pointerEvents: 'none', opacity: 0.55, flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder="Rechercher boards, tâches, notes…"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => query && results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            background: 'var(--surface2)', border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 8, padding: '6px 28px 6px 28px',
            color: 'var(--text)', fontSize: 12, outline: 'none',
            width: open ? 260 : 190,
            transition: 'width .18s, border-color .15s',
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute', right: 9,
            width: 10, height: 10,
            border: '2px solid var(--accent)', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'gspin .55s linear infinite',
          }} />
        )}
      </div>

      {/* Dropdown */}
      {open && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 380,
          background: 'var(--surface1)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 10px 40px rgba(0,0,0,.65)',
          zIndex: 2000, maxHeight: 460, overflowY: 'auto',
        }}>
          {!loading && results.length === 0 ? (
            <div style={{ padding: '18px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Aucun résultat pour «&nbsp;{query}&nbsp;»
            </div>
          ) : results.map((r, idx) => {
            const badge = BADGE[r.matchedIn] || { label: r.matchedIn, color: '#fff' };
            const isActive = idx === activeIdx;
            return (
              <div
                key={`${r.type}-${r.boardId}-${r.gameId || ''}-${idx}`}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  cursor: 'pointer',
                  background: isActive ? 'var(--surface2)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background .08s',
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 52, height: 30, borderRadius: 5, overflow: 'hidden', flexShrink: 0,
                  background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {r.gameImg ? (
                    <img src={r.gameImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : r.boardHeaderImg ? (
                    <img src={r.boardHeaderImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : r.boardIcon ? (
                    <img src={r.boardIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <span style={{ fontSize: 16 }}>🎮</span>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                    {r.type === 'board'
                      ? highlight(r.boardName, query)
                      : highlight(r.gameName, query)}
                  </div>
                  {r.type !== 'board' && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                      {r.matchedIn === 'note' && r.notePreview
                        ? <>📝 {highlight(r.notePreview, query)}</>
                        : `📋 ${r.boardName}`}
                    </div>
                  )}
                  {r.matchedIn === 'note' && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, lineHeight: 1.3 }}>📋 {r.boardName}</div>
                  )}
                </div>

                {/* Badge */}
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                  color: badge.color, border: `1px solid ${badge.color}`, opacity: 0.9,
                  letterSpacing: '0.03em',
                }}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes gspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
