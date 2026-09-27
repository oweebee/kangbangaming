import React, { useState, useEffect } from 'react';
import { authHeaders } from '../utils.js';

const API = '/api';

const STATUS_LABEL = {
  open:        { label: 'Ouvert',      color: '#ef4444' },
  in_progress: { label: 'En cours',    color: '#f59e0b' },
  resolved:    { label: 'Résolu',      color: '#22c55e' },
  wont_fix:    { label: 'Won\'t fix',  color: '#6b7280' },
};
const CAT_OPTS = ['bug', 'suggestion', 'question', 'autre'];

export default function BugReportModal({ token, userRole, onClose }) {
  const [view, setView]         = useState('list');   // 'list' | 'new' | 'detail'
  const [bugs, setBugs]         = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // form new
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [cat, setCat]           = useState('bug');

  // admin reply
  const [reply, setReply]       = useState('');
  const [replyStatus, setReplyStatus] = useState('');

  useEffect(() => { fetchBugs(); }, []);

  async function fetchBugs() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/bugs`, { headers: authHeaders(token) });
      if (r.ok) setBugs(await r.json());
    } finally { setLoading(false); }
  }

  async function submitBug(e) {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) { setError('Titre et description requis.'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/bugs`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, category: cat }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      const bug = await r.json();
      setBugs(prev => [bug, ...prev]);
      setTitle(''); setDesc(''); setCat('bug');
      setSelected(bug); setView('detail');
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function submitReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/bugs/${selected.id}/reply`, {
        method: 'POST',
        headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply, status: replyStatus || undefined }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      const updated = await r.json();
      setSelected(updated);
      setBugs(prev => prev.map(b => b.id === updated.id ? updated : b));
      setReply(''); setReplyStatus('');
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  /* ─── Styles ────────────────────────────────────────── */
  const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:9000,
    display:'flex', alignItems:'center', justifyContent:'center', padding:16 };
  const modal = { background:'#1a1a2e', border:'1px solid #3d3d5c', borderRadius:12,
    width:'100%', maxWidth:680, maxHeight:'90vh', display:'flex', flexDirection:'column',
    boxShadow:'0 20px 60px rgba(0,0,0,.8)' };
  const header = { display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'16px 20px', borderBottom:'1px solid #2d2d4a' };
  const body = { flex:1, overflowY:'auto', padding:20 };
  const btn = (color='#6366f1') => ({
    background:color, color:'#fff', border:'none', borderRadius:8,
    padding:'8px 16px', cursor:'pointer', fontWeight:600, fontSize:13 });
  const input = { width:'100%', background:'#0f0f1a', border:'1px solid #3d3d5c',
    borderRadius:8, padding:'10px 12px', color:'#e2e8f0', fontSize:13,
    outline:'none', boxSizing:'border-box' };
  const tag = (s) => ({ ...STATUS_LABEL[s], padding:'2px 8px', borderRadius:20,
    fontSize:11, fontWeight:700, background: STATUS_LABEL[s]?.color + '22',
    color: STATUS_LABEL[s]?.color || '#aaa', border:`1px solid ${STATUS_LABEL[s]?.color || '#555'}` });

  /* ─── Views ─────────────────────────────────────────── */
  function ViewList() {
    return (
      <>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <button onClick={() => setView('new')} style={btn()}>＋ Nouveau rapport</button>
          <button onClick={fetchBugs} style={btn('#374151')}>↻ Actualiser</button>
        </div>
        {loading && <p style={{color:'#aaa',textAlign:'center'}}>Chargement…</p>}
        {!loading && bugs.length === 0 && <p style={{color:'#6b7280',textAlign:'center'}}>Aucun bug report pour l'instant.</p>}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {bugs.map(b => (
            <div key={b.id} onClick={() => { setSelected(b); setView('detail'); }}
              style={{ background:'#0f0f1a', border:'1px solid #2d2d4a', borderRadius:10,
                padding:'12px 16px', cursor:'pointer', display:'flex', justifyContent:'space-between',
                alignItems:'flex-start', transition:'border-color .15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='#6366f1'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='#2d2d4a'}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,color:'#e2e8f0',marginBottom:4,fontSize:14,
                  whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.title}</div>
                <div style={{fontSize:11,color:'#6b7280'}}>
                  par <b style={{color:'#a5b4fc'}}>{b.authorUsername}</b>
                  {' · '}{new Date(b.createdAt).toLocaleDateString('fr-FR')}
                  {b.replies?.length > 0 && <span style={{color:'#6366f1'}}> · {b.replies.length} réponse{b.replies.length>1?'s':''}</span>}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0,marginLeft:12}}>
                <span style={tag(b.status)}>{STATUS_LABEL[b.status]?.label || b.status}</span>
                <span style={{fontSize:10,color:'#4b5563',background:'#1f2937',padding:'1px 6px',
                  borderRadius:10,border:'1px solid #374151'}}>{b.category}</span>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  function ViewNew() {
    return (
      <form onSubmit={submitBug}>
        <button type="button" onClick={()=>setView('list')}
          style={{...btn('#374151'),marginBottom:16}}>← Retour</button>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:'#a5b4fc',fontWeight:600,display:'block',marginBottom:6}}>Catégorie</label>
          <select value={cat} onChange={e=>setCat(e.target.value)} style={input}>
            {CAT_OPTS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:'#a5b4fc',fontWeight:600,display:'block',marginBottom:6}}>Titre *</label>
          <input style={input} value={title} onChange={e=>setTitle(e.target.value)}
            placeholder="En une phrase, quel est le problème ?" maxLength={200} />
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:'#a5b4fc',fontWeight:600,display:'block',marginBottom:6}}>Description *</label>
          <textarea style={{...input,minHeight:120,resize:'vertical'}} value={desc}
            onChange={e=>setDesc(e.target.value)}
            placeholder="Décris le bug : étapes pour reproduire, comportement attendu, comportement observé…" maxLength={2000}/>
        </div>
        {error && <p style={{color:'#f87171',fontSize:12,marginBottom:10}}>{error}</p>}
        <button type="submit" disabled={loading} style={btn()}>
          {loading ? 'Envoi…' : '📤 Envoyer le rapport'}
        </button>
      </form>
    );
  }

  function ViewDetail() {
    if (!selected) return null;
    const s = STATUS_LABEL[selected.status];
    return (
      <>
        <button onClick={()=>setView('list')} style={{...btn('#374151'),marginBottom:16}}>← Retour</button>
        <div style={{background:'#0f0f1a',border:'1px solid #2d2d4a',borderRadius:10,padding:16,marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <h3 style={{margin:0,color:'#e2e8f0',fontSize:15}}>{selected.title}</h3>
            <span style={tag(selected.status)}>{s?.label}</span>
          </div>
          <p style={{color:'#9ca3af',fontSize:11,margin:'0 0 10px'}}>
            <b style={{color:'#a5b4fc'}}>{selected.authorUsername}</b>
            {' · '}{new Date(selected.createdAt).toLocaleDateString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
            {' · '}<span style={{color:'#4b5563'}}>{selected.category}</span>
          </p>
          <p style={{color:'#cbd5e1',fontSize:13,margin:0,whiteSpace:'pre-wrap'}}>{selected.description}</p>
        </div>

        {/* Réponses */}
        {selected.replies?.length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:'#6b7280',fontWeight:600,marginBottom:8,
              textTransform:'uppercase',letterSpacing:.5}}>Réponses</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {selected.replies.map(r=>(
                <div key={r.id} style={{background: r.isAI ? '#1e1b4b' : '#0f1f0f',
                  border:`1px solid ${r.isAI ? '#4f46e5' : '#166534'}`,
                  borderRadius:8,padding:'10px 14px'}}>
                  <div style={{fontSize:11,color:'#6b7280',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                    {r.isAI && <span style={{background:'#4f46e5',color:'#e0e7ff',
                      padding:'1px 6px',borderRadius:10,fontSize:10,fontWeight:700}}>🤖 IA</span>}
                    {!r.isAI && r.isAdmin && <span style={{background:'#166534',color:'#bbf7d0',
                      padding:'1px 6px',borderRadius:10,fontSize:10,fontWeight:700}}>👑 Admin</span>}
                    <b style={{color:'#a5b4fc'}}>{r.authorUsername}</b>
                    {' · '}{new Date(r.createdAt).toLocaleDateString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                  </div>
                  <p style={{margin:0,color:'#cbd5e1',fontSize:13,whiteSpace:'pre-wrap'}}>{r.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulaire de réponse admin */}
        {userRole === 'admin' && (
          <form onSubmit={submitReply} style={{background:'#0f0f1a',border:'1px solid #2d2d4a',
            borderRadius:10,padding:14}}>
            <div style={{fontSize:12,color:'#a5b4fc',fontWeight:600,marginBottom:10}}>
              👑 Répondre (admin)
            </div>
            <textarea style={{...input,minHeight:80,resize:'vertical',marginBottom:10}}
              value={reply} onChange={e=>setReply(e.target.value)}
              placeholder="Votre réponse…" />
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <select value={replyStatus} onChange={e=>setReplyStatus(e.target.value)}
                style={{...input,width:'auto',padding:'7px 10px'}}>
                <option value="">Statut inchangé</option>
                <option value="in_progress">→ En cours</option>
                <option value="resolved">→ Résolu</option>
                <option value="wont_fix">→ Won't fix</option>
                <option value="open">→ Réouvrir</option>
              </select>
              <button type="submit" disabled={loading} style={btn()}>
                {loading ? 'Envoi…' : '📨 Répondre'}
              </button>
            </div>
            {error && <p style={{color:'#f87171',fontSize:12,marginTop:8}}>{error}</p>}
          </form>
        )}
      </>
    );
  }

  return (
    <div style={overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={modal}>
        <div style={header}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:22}}>🐛</span>
            <div>
              <h2 style={{margin:0,fontSize:16,color:'#e2e8f0'}}>Bug Reports</h2>
              <p style={{margin:0,fontSize:11,color:'#6b7280'}}>Signale un problème ou une suggestion</p>
            </div>
          </div>
          <button onClick={onClose}
            style={{background:'none',border:'none',color:'#6b7280',cursor:'pointer',
              fontSize:20,lineHeight:1,padding:4}}>✕</button>
        </div>
        <div style={body}>
          {view==='list'   && <ViewList />}
          {view==='new'    && <ViewNew />}
          {view==='detail' && <ViewDetail />}
        </div>
      </div>
    </div>
  );
}
