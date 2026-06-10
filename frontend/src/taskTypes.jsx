// ── Task Type definitions ─────────────────────────────────────────────────────
// Each type has: id, label, emoji, colors, an SVG Icon component,
// and a dark imgBg for the card image area.

function FarmingIcon() {
  return (
    <svg width="90" height="68" viewBox="0 0 90 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hay bale */}
      <rect x="46" y="28" width="38" height="28" rx="8" fill="#c49a18" stroke="#7a5c00" strokeWidth="2.5"/>
      <line x1="46" y1="42" x2="84" y2="42" stroke="#7a5c00" strokeWidth="2"/>
      <line x1="65" y1="28" x2="65" y2="56" stroke="#7a5c00" strokeWidth="2"/>
      {/* Hay strands */}
      <line x1="54" y1="28" x2="51" y2="20" stroke="#d4aa20" strokeWidth="2" strokeLinecap="round"/>
      <line x1="65" y1="28" x2="65" y2="19" stroke="#d4aa20" strokeWidth="2" strokeLinecap="round"/>
      <line x1="75" y1="28" x2="78" y2="20" stroke="#d4aa20" strokeWidth="2" strokeLinecap="round"/>
      {/* Pitchfork handle */}
      <rect x="14" y="26" width="6" height="36" rx="3" fill="#8B5E2A" stroke="#5a3a10" strokeWidth="2"/>
      {/* Pitchfork bar */}
      <rect x="8" y="20" width="20" height="7" rx="3" fill="#d4aa20" stroke="#7a5c00" strokeWidth="2"/>
      {/* Tines */}
      <rect x="8" y="7" width="5" height="16" rx="2.5" fill="#d4aa20" stroke="#7a5c00" strokeWidth="2"/>
      <rect x="15" y="5" width="5" height="18" rx="2.5" fill="#d4aa20" stroke="#7a5c00" strokeWidth="2"/>
      <rect x="22" y="7" width="5" height="16" rx="2.5" fill="#d4aa20" stroke="#7a5c00" strokeWidth="2"/>
      {/* Sun */}
      <circle cx="78" cy="12" r="6" fill="#f0c030" stroke="#7a5c00" strokeWidth="1.8"/>
      <line x1="78" y1="3" x2="78" y2="1" stroke="#f0c030" strokeWidth="2" strokeLinecap="round"/>
      <line x1="85" y1="5.5" x2="87" y2="3.5" stroke="#f0c030" strokeWidth="2" strokeLinecap="round"/>
      <line x1="88" y1="12" x2="91" y2="12" stroke="#f0c030" strokeWidth="2" strokeLinecap="round"/>
      <line x1="85" y1="18.5" x2="87" y2="20.5" stroke="#f0c030" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function MissionIcon() {
  return (
    <svg width="90" height="68" viewBox="0 0 90 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield */}
      <path d="M45 6 L74 17 L74 42 Q74 60 45 68 Q16 60 16 42 L16 17 Z" fill="#1a6bb5" stroke="#0a3a6a" strokeWidth="2.5"/>
      {/* Highlight */}
      <path d="M24 22 L45 13 L45 44 Q32 50 24 44 Z" fill="rgba(100,170,255,0.14)"/>
      {/* Star */}
      <polygon points="45,23 48.5,33 59,33 51,39 54,49 45,43 36,49 39,39 31,33 41.5,33"
        fill="#f5d030" stroke="#8a6000" strokeWidth="1.5"/>
    </svg>
  );
}

function ConstructionIcon() {
  return (
    <svg width="90" height="68" viewBox="0 0 90 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom row */}
      <rect x="8" y="50" width="28" height="14" rx="3" fill="#a06030" stroke="#5a3010" strokeWidth="2.2"/>
      <rect x="40" y="50" width="28" height="14" rx="3" fill="#a06030" stroke="#5a3010" strokeWidth="2.2"/>
      <rect x="72" y="50" width="12" height="14" rx="3" fill="#a06030" stroke="#5a3010" strokeWidth="2.2"/>
      {/* Middle row */}
      <rect x="8" y="35" width="14" height="14" rx="3" fill="#b07040" stroke="#5a3010" strokeWidth="2.2"/>
      <rect x="26" y="35" width="28" height="14" rx="3" fill="#b07040" stroke="#5a3010" strokeWidth="2.2"/>
      <rect x="58" y="35" width="26" height="14" rx="3" fill="#b07040" stroke="#5a3010" strokeWidth="2.2"/>
      {/* Top row */}
      <rect x="8" y="20" width="28" height="14" rx="3" fill="#c08050" stroke="#5a3010" strokeWidth="2.2"/>
      <rect x="40" y="20" width="28" height="14" rx="3" fill="#c08050" stroke="#5a3010" strokeWidth="2.2"/>
      <rect x="72" y="20" width="12" height="14" rx="3" fill="#c08050" stroke="#5a3010" strokeWidth="2.2"/>
      {/* Trowel */}
      <line x1="76" y1="19" x2="84" y2="8" stroke="#8B5E2A" strokeWidth="3" strokeLinecap="round"/>
      <path d="M82 4 Q88 6 88 12 Q84 14 80 10 Z" fill="#c49a18" stroke="#7a5c00" strokeWidth="1.5"/>
    </svg>
  );
}

function DailyQuestIcon() {
  return (
    <svg width="90" height="68" viewBox="0 0 90 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Calendar body */}
      <rect x="14" y="16" width="60" height="50" rx="7" fill="#d07818" stroke="#7a4000" strokeWidth="2.5"/>
      {/* Top bar */}
      <rect x="14" y="16" width="60" height="18" rx="7" fill="#a85a10" stroke="#7a4000" strokeWidth="2.5"/>
      <rect x="14" y="26" width="60" height="8" fill="#a85a10"/>
      {/* Rings */}
      <rect x="27" y="9" width="7" height="14" rx="3.5" fill="#7a4000" stroke="#5a2800" strokeWidth="1.5"/>
      <rect x="54" y="9" width="7" height="14" rx="3.5" fill="#7a4000" stroke="#5a2800" strokeWidth="1.5"/>
      {/* Circular arrow */}
      <path d="M32 48 A13 13 0 1 1 52 58" fill="none" stroke="rgba(255,210,100,0.95)" strokeWidth="3.5" strokeLinecap="round"/>
      {/* Arrow head */}
      <polygon points="52,53 60,57 54,64" fill="rgba(255,210,100,0.95)"/>
    </svg>
  );
}

function EventIcon() {
  return (
    <svg width="90" height="68" viewBox="0 0 90 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Calendar body */}
      <rect x="14" y="16" width="60" height="50" rx="7" fill="#5a5a8a" stroke="#3a3a6a" strokeWidth="2.5"/>
      {/* Top bar */}
      <rect x="14" y="16" width="60" height="18" rx="7" fill="#48487a" stroke="#3a3a6a" strokeWidth="2.5"/>
      <rect x="14" y="26" width="60" height="8" fill="#48487a"/>
      {/* Rings */}
      <rect x="27" y="9" width="7" height="14" rx="3.5" fill="#3a3a6a" stroke="#2a2a5a" strokeWidth="1.5"/>
      <rect x="54" y="9" width="7" height="14" rx="3.5" fill="#3a3a6a" stroke="#2a2a5a" strokeWidth="1.5"/>
      {/* Day dots */}
      <circle cx="27" cy="42" r="3.5" fill="rgba(200,200,240,0.35)"/>
      <circle cx="40" cy="42" r="3.5" fill="rgba(200,200,240,0.35)"/>
      <circle cx="53" cy="42" r="3.5" fill="rgba(200,200,240,0.35)"/>
      <circle cx="66" cy="42" r="3.5" fill="rgba(200,200,240,0.35)"/>
      <circle cx="27" cy="55" r="3.5" fill="rgba(200,200,240,0.35)"/>
      <circle cx="40" cy="55" r="3.5" fill="rgba(200,200,240,0.35)"/>
      {/* Red X marked date */}
      <rect x="56" y="48" width="18" height="16" rx="4" fill="rgba(200,20,20,0.18)" stroke="#cc2020" strokeWidth="2"/>
      <line x1="60" y1="52" x2="70" y2="60" stroke="#ff4545" strokeWidth="2.8" strokeLinecap="round"/>
      <line x1="70" y1="52" x2="60" y2="60" stroke="#ff4545" strokeWidth="2.8" strokeLinecap="round"/>
    </svg>
  );
}

function DungeonIcon() {
  return (
    <svg width="95" height="68" viewBox="0 0 95 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wing */}
      <path d="M28 36 L6 22 L14 38 L4 52 L28 46 Z" fill="#8a1010" stroke="#5a0a0a" strokeWidth="2" strokeLinejoin="round"/>
      <line x1="28" y1="36" x2="10" y2="26" stroke="rgba(180,50,50,0.4)" strokeWidth="1.2"/>
      <line x1="28" y1="42" x2="7" y2="40" stroke="rgba(180,50,50,0.4)" strokeWidth="1.2"/>
      {/* Body */}
      <ellipse cx="46" cy="48" rx="20" ry="16" fill="#b52020" stroke="#6a0808" strokeWidth="2.5"/>
      {/* Head */}
      <ellipse cx="60" cy="28" rx="16" ry="13" fill="#c02828" stroke="#6a0808" strokeWidth="2.5"/>
      {/* Horns */}
      <path d="M50 16 L46 5 L56 14" fill="#8a1010" stroke="#5a0a0a" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M65 14 L68 4 L73 14" fill="#8a1010" stroke="#5a0a0a" strokeWidth="2" strokeLinejoin="round"/>
      {/* Eye */}
      <circle cx="65" cy="26" r="5.5" fill="#f5d030" stroke="#5a0a0a" strokeWidth="1.5"/>
      <ellipse cx="66" cy="26" rx="2.5" ry="3.5" fill="#1a0808"/>
      {/* Scales */}
      <path d="M38 45 Q42 41 46 45" fill="none" stroke="rgba(200,80,80,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M46 53 Q50 49 54 53" fill="none" stroke="rgba(200,80,80,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Fire */}
      <path d="M73 30 Q80 25 87 29 Q84 34 90 38 Q83 37 87 45 Q79 39 82 50 Q73 41 77 53 Q68 44 72 36 Q67 38 73 30 Z"
        fill="#f5a020" stroke="#c04010" strokeWidth="1.5"/>
      <path d="M75 33 Q81 29 83 35 Q80 39 83 44 Q77 39 79 47 Q74 41 75 33 Z" fill="#f8e040"/>
    </svg>
  );
}

function ItemIcon() {
  return (
    <svg width="90" height="68" viewBox="0 0 90 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Strap */}
      <path d="M30 24 Q45 14 60 24" fill="none" stroke="#1a6a30" strokeWidth="3.5" strokeLinecap="round"/>
      {/* Bag body */}
      <rect x="18" y="22" width="54" height="42" rx="11" fill="#2a8a3a" stroke="#1a5025" strokeWidth="2.5"/>
      {/* Flap */}
      <path d="M18 36 L18 28 Q18 22 24 22 L66 22 Q72 22 72 28 L72 36 Q72 44 66 44 L24 44 Q18 44 18 36 Z"
        fill="#228030" stroke="#1a5025" strokeWidth="2.5"/>
      {/* Flap shine */}
      <path d="M26 25 Q45 20 64 25" fill="none" stroke="rgba(120,240,140,0.18)" strokeWidth="2"/>
      {/* Buckle */}
      <rect x="34" y="37" width="22" height="11" rx="4" fill="#1a5025" stroke="#0a3015" strokeWidth="2"/>
      <rect x="39" y="40" width="12" height="5" rx="2.5" fill="rgba(100,230,130,0.25)"/>
      {/* Pockets */}
      <rect x="22" y="52" width="20" height="9" rx="3" fill="rgba(0,0,0,0.2)" stroke="rgba(100,220,120,0.3)" strokeWidth="1.5"/>
      <rect x="48" y="52" width="20" height="9" rx="3" fill="rgba(0,0,0,0.2)" stroke="rgba(100,220,120,0.3)" strokeWidth="1.5"/>
    </svg>
  );
}

// ── Type registry ─────────────────────────────────────────────────────────────

export const TASK_TYPES = [
  {
    id: 'farming', label: 'Farming', emoji: '🌾', Icon: FarmingIcon,
    bg: 'rgba(160,120,20,0.16)', border: 'rgba(200,160,40,0.55)',
    badgeBg: 'rgba(120,85,8,0.88)', badgeText: '#f5d97a', textColor: '#e8d080',
    imgBg: 'linear-gradient(135deg, #1a1500 0%, #2a2000 60%, #1a1800 100%)',
  },
  {
    id: 'mission', label: 'Mission', emoji: '🛡️', Icon: MissionIcon,
    bg: 'rgba(20,80,160,0.16)', border: 'rgba(60,130,220,0.55)',
    badgeBg: 'rgba(8,40,100,0.88)', badgeText: '#80b8f0', textColor: '#80b8f0',
    imgBg: 'linear-gradient(135deg, #0a0a1a 0%, #0e1a2e 60%, #0a0f1e 100%)',
  },
  {
    id: 'construction', label: 'Construction', emoji: '🧱', Icon: ConstructionIcon,
    bg: 'rgba(120,70,20,0.16)', border: 'rgba(170,110,50,0.55)',
    badgeBg: 'rgba(80,45,10,0.88)', badgeText: '#d4a870', textColor: '#d4a870',
    imgBg: 'linear-gradient(135deg, #1a1000 0%, #261800 60%, #1a1200 100%)',
  },
  {
    id: 'daily', label: 'Quotidien', emoji: '🔁', Icon: DailyQuestIcon,
    bg: 'rgba(180,100,10,0.16)', border: 'rgba(230,150,40,0.55)',
    badgeBg: 'rgba(130,75,8,0.88)', badgeText: '#f5c060', textColor: '#f5c060',
    imgBg: 'linear-gradient(135deg, #1a0d00 0%, #241500 60%, #1a1000 100%)',
  },
  {
    id: 'event', label: 'Événement', emoji: '📅', Icon: EventIcon,
    bg: 'rgba(90,90,130,0.16)', border: 'rgba(160,160,210,0.55)',
    badgeBg: 'rgba(50,50,90,0.88)', badgeText: '#c0c0e0', textColor: '#c0c0e0',
    imgBg: 'linear-gradient(135deg, #0a0a14 0%, #121220 60%, #0c0c18 100%)',
  },
  {
    id: 'dungeon', label: 'Donjon', emoji: '🐉', Icon: DungeonIcon,
    bg: 'rgba(160,15,15,0.16)', border: 'rgba(220,50,50,0.55)',
    badgeBg: 'rgba(100,8,8,0.88)', badgeText: '#f08080', textColor: '#f08080',
    imgBg: 'linear-gradient(135deg, #1a0000 0%, #2a0808 60%, #1a0400 100%)',
  },
  {
    id: 'item', label: 'Item', emoji: '🎒', Icon: ItemIcon,
    bg: 'rgba(25,110,45,0.16)', border: 'rgba(60,180,90,0.55)',
    badgeBg: 'rgba(12,70,25,0.88)', badgeText: '#80e898', textColor: '#80e898',
    imgBg: 'linear-gradient(135deg, #001a08 0%, #002010 60%, #001408 100%)',
  },
];

export function getTaskType(id) {
  return TASK_TYPES.find(t => t.id === id) || null;
}
