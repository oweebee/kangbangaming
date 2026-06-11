import { useState, useEffect } from 'react';
import LinkPreview from './LinkPreview.jsx';

// Renders text with URLs turned into clickable links + rich preview cards
function NoteText({ text, token }) {
  const parts = text.split(/(https?:\/\/\S+)/g);
  const urls = parts.filter(p => /^https?:\/\//.test(p));
  return (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part)
          ? <a key={i} href={part} target="_blank" rel="noreferrer noopener"
              onClick={e => e.stopPropagation()}
              style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
              {part}
            </a>
          : <span key={i}>{part}</span>
      )}
      {/* Preview cards — une par URL unique détectée */}
      {urls.map((u, i) => (
        <LinkPreview key={i} url={u} token={token} />
      ))}
    </span>
  );
}

function formatNoteDate(isoStr) {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

// Props:
//   notes   – array of {id, text, createdAt, editedAt}
//   onSave  – called with full updated notes array on any change
//   compact – compact styling (SearchModal)
export default function NotesSection({ notes: externalNotes = [], onSave, onDraftChange, compact = false, token }) {
  const [notes, setNotes]         = useState(externalNotes);
  const [newNote, setNewNote]     = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText]   = useState('');
  const [expanded, setExpanded]   = useState(false);

  useEffect(() => {
    setNotes(externalNotes);
    setExpanded(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalNotes.length, externalNotes.map(n => n.id).join(',')]);

  const push = (updated) => { setNotes(updated); onSave(updated); };

  const setNewNoteWithDraft = (val) => {
    setNewNote(val);
    onDraftChange?.(val);
  };

  const addNote = () => {
    const text = newNote.trim();
    if (!text) return;
    push([...notes, {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text, createdAt: new Date().toISOString(), editedAt: null,
    }]);
    setNewNoteWithDraft('');
  };

  const saveEdit = () => {
    const text = editText.trim();
    if (!text) { setEditingId(null); return; }
    push(notes.map(n => n.id === editingId ? { ...n, text, editedAt: new Date().toISOString() } : n));
    setEditingId(null);
  };

  // Display newest first — sort by createdAt descending (handles both old and new data)
  const sorted = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const visible    = expanded ? sorted : sorted.slice(0, 3);
  const hiddenCount = sorted.length - visible.length;

  const labelStyle = {
    display: 'block', fontSize: compact ? 14 : 12,
    fontWeight: 600, color: 'var(--text-muted)',
    marginBottom: compact ? 10 : 7,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 7, color: 'var(--text)',
    fontSize: compact ? 14 : 12,
    padding: compact ? '10px 12px' : '8px 10px',
    outline: 'none', resize: 'vertical', minHeight: compact ? 80 : 62,
    fontFamily: 'inherit', lineHeight: 1.5,
  };

  return (
    <div>
      <label style={labelStyle}>📝 Notes</label>

      {/* ── New note input — always at top ── */}
      <textarea
        value={newNote}
        onChange={e => setNewNoteWithDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNote(); }}
        placeholder={notes.length === 0 ? 'Ajouter une note… (Ctrl+Entrée pour valider)' : 'Nouvelle note…'}
        style={inputStyle}
      />
      <button
        onClick={addNote}
        disabled={!newNote.trim()}
        style={{
          marginTop: 6, marginBottom: notes.length > 0 ? 10 : 0,
          width: '100%',
          background: newNote.trim() ? 'rgba(192,87,10,0.12)' : 'var(--surface2)',
          border: newNote.trim() ? '1px solid var(--accent)' : '1px solid var(--border)',
          borderRadius: 7, padding: compact ? '8px' : '6px',
          color: newNote.trim() ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: compact ? 13 : 12, fontWeight: 600,
          cursor: newNote.trim() ? 'pointer' : 'not-allowed',
          opacity: newNote.trim() ? 1 : 0.5,
          transition: 'all .15s',
        }}
      >+ Ajouter la note</button>

      {/* ── Existing notes — newest first ── */}
      {notes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visible.map(note => (
            <div key={note.id} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 7, padding: '9px 11px',
              borderLeft: '3px solid var(--accent)',
            }}>
              {editingId === note.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <textarea autoFocus value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    style={{ ...inputStyle, minHeight: 52 }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={saveEdit}
                      style={{ flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '6px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >✓ Enregistrer</button>
                    <button onClick={() => setEditingId(null)}
                      style={{ background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
                    >Annuler</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: compact ? 13 : 12, color: 'var(--text)', marginBottom: 5 }}>
                    <NoteText text={note.text} token={token} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.7 }}>
                      {formatNoteDate(note.createdAt)}
                      {note.editedAt && <span style={{ marginLeft: 5, fontStyle: 'italic' }}>(modifié)</span>}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); setEditingId(note.id); setEditText(note.text); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5, padding: '2px 4px', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                      title="Modifier"
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {hiddenCount > 0 && (
            <button onClick={() => setExpanded(true)}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, cursor: 'pointer', padding: '3px 0', textAlign: 'left', fontWeight: 600 }}
            >↓ Voir les {hiddenCount} note{hiddenCount > 1 ? 's' : ''} plus ancienne{hiddenCount > 1 ? 's' : ''}</button>
          )}
          {expanded && notes.length > 3 && (
            <button onClick={() => setExpanded(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', padding: '2px 0', textAlign: 'left' }}
            >↑ Réduire</button>
          )}
        </div>
      )}
    </div>
  );
}
