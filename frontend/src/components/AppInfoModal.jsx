import { useState } from 'react';
import ModalBackdrop from './ModalBackdrop.jsx';
import ModalCard from './ModalCard.jsx';
import { GENRE_COLORS } from './SteamUI.jsx';
import { useLang } from '../i18n.js';

const GENRE_LIST = Object.entries(GENRE_COLORS);

function Swatch({ color, size = 12 }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: 3, background: color, border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }} />;
}

function SteamNote() {
  return (
    <div style={{ background: 'rgba(102,192,244,0.07)', border: '1px solid rgba(102,192,244,0.25)', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 16 }}>
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#66c0f4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        L'app utilise par défaut une seule clé API Steam partagée par tous les comptes — pas une clé personnelle. Pour une expérience complète (bibliothèque, News, succès, wishlist, bannière "En jeu"), ton profil Steam doit donc être <span style={{ color: '#66c0f4', fontWeight: 700 }}>public</span> (au moins le réglage "Détails du jeu").{' '}
        <a href="https://help.steampowered.com/fr/faqs/view/588C-C67D-0251-C276" target="_blank" rel="noreferrer" style={{ color: '#66c0f4' }}>Comment rendre son profil public →</a>
        <div style={{ marginTop: 6 }}>
          Profil privé ? Renseigne plutôt <span style={{ color: '#66c0f4', fontWeight: 700 }}>ta propre clé API Steam</span> dans ton profil (onglet Profil) — elle débloque ces mêmes fonctions même sans profil public.{' '}
          <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noreferrer" style={{ color: '#66c0f4' }}>Générer ma clé →</a> (nécessite l'authentificateur mobile Steam Guard).
        </div>
      </div>
    </div>
  );
}

// ── Onglet 1 : Couleurs ────────────────────────────────────────────────────────
function TabColors() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Boards */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Boards</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { color: '#3db86a', label: 'Public', desc: 'Accessible via lien sans compte' },
            { color: '#f5a500', label: 'Épinglé', desc: 'Mis en avant dans ta sidebar' },
            { color: 'var(--accent)', label: 'Actif', desc: 'Board actuellement ouvert' },
          ].map(({ color, label, desc }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}`, borderRadius: 7, padding: '7px 12px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 12, color }}>{label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cartes */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Cartes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { color: '#66c0f4', label: 'Par défaut', desc: 'Couleur du genre Steam du jeu' },
            { color: '#3db86a', label: 'Terminé ✓', desc: 'Carte marquée comme finie' },
            { color: '#dc3c3c', label: 'Urgent ⚠', desc: 'Carte prioritaire' },
            { color: '#787878', label: 'Archivé', desc: 'Carte masquée de la vue principale' },
          ].map(({ color, label, desc }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}`, borderRadius: 7, padding: '7px 12px' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 12, color }}>{label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Genres Steam */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Genres Steam</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {GENRE_LIST.map(([genre, color]) => (
            <div key={genre} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${color}15`, border: `1px solid ${color}50`, borderRadius: 5, padding: '3px 8px' }}>
              <Swatch color={color} size={9} />
              <span style={{ fontSize: 11, color, fontWeight: 600 }}>{genre}</span>
            </div>
          ))}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(102,192,244,0.1)', border: '1px solid rgba(102,192,244,0.3)', borderRadius: 5, padding: '3px 8px' }}>
            <Swatch color="#66c0f4" size={9} />
            <span style={{ fontSize: 11, color: '#66c0f4', fontWeight: 600 }}>Autres</span>
          </div>
        </div>
      </div>

      {/* Avis */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Avis Steam</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { color: '#4cd882', label: 'Positif', range: '≥ 80%' },
            { color: '#f5c518', label: 'Mitigé',  range: '50–79%' },
            { color: '#f87575', label: 'Négatif', range: '< 50%' },
          ].map(({ color, label, range }) => (
            <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: `${color}12`, border: `1px solid ${color}35`, borderRadius: 7, padding: '7px 10px' }}>
              <Swatch color={color} size={11} />
              <div>
                <div style={{ fontSize: 12, color, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{range}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Onglet 2 : Fonctionnalités ─────────────────────────────────────────────────
function TabFeatures() {
  const features = [
    { icon: '📋', title: 'Créer un board', desc: 'Clic sur + dans la sidebar. Choisis un jeu Steam ou crée un board de tâches. Tu peux définir un emoji, un nom, et activer le mode public.' },
    { icon: '➕', title: 'Ajouter une carte', desc: 'Clique sur "+ Ajouter" en bas d\'une colonne. Pour Steam, recherche par nom. Pour les tâches, remplis le formulaire.' },
    { icon: '↔️', title: 'Déplacer une carte', desc: 'Glisse-dépose d\'une colonne à l\'autre. Sur mobile, utilise le menu de la carte.' },
    { icon: '✏️', title: 'Colonnes personnalisables', desc: 'Clique sur le nom pour renommer. Glisse ⠿ pour réordonner. Le bouton + en haut du board ajoute une colonne.' },
    { icon: '🌐', title: 'Partage public', desc: 'Active le mode public dans les paramètres du board. Un lien apparaît — accessible sans compte. Les boards publics d\'autres users sont consultables et ajoutables en favori.' },
    { icon: '📌', title: 'Boards épinglés', desc: 'Clique sur 📌 pour épingler un board en haut de ta sidebar. Glisse pour réorganiser.' },
    { icon: '🎮', title: 'Panneau infos jeu', desc: 'Clique sur une carte pour ouvrir le panneau latéral : description, genres, avis, prix, succès. Redimensionnable, ancrable à gauche ou droite.' },
    { icon: '⚠️', title: 'Urgent & Terminé', desc: 'Sur une carte, ⚠ = urgent (rouge), ✓ = terminé (vert). Visible de tous sur les boards publics.' },
    { icon: '👤', title: 'Assignation', desc: 'Assigne des membres à une carte via l\'icône 👤. Les avatars s\'affichent sur la carte.' },
    { icon: '📊', title: 'Tâches personnalisées', desc: 'Les cartes non-Steam ont un type, une assignation, une échéance et une progression (%). Passage automatique en "Terminé" à 100%.' },
    { icon: '📝', title: 'Notes sur les cartes', desc: 'Ajoute des notes sur n\'importe quelle carte (Steam ou tâche). Les liens collés affichent un aperçu automatique, comme sur Discord.' },
    { icon: '🎵', title: 'Bannière "En jeu"', desc: 'Quand un board est lié à un jeu, une bannière apparaît si des membres jouent en ce moment. Nécessite un profil Steam public.' },
    { icon: '🔍', title: 'Recherche globale', desc: 'Icône 🔍 en haut de sidebar — cherche parmi tous tes jeux et toutes tes cartes.' },
    { icon: '⭐', title: 'Populaires & Recommandés', desc: 'Carrousel des jeux mis en avant sur Steam avec note, genres et description. Défilement toutes les 5 secondes.' },
    { icon: '📅', title: 'Sorties à venir', desc: 'Prochaines sorties Steam avec date et note Metacritic. Actualisation via ↺.' },
    { icon: '📰', title: 'News de [pseudo]', desc: 'Colonne redimensionnable sur l\'accueil (ou onglet dédié sur mobile), titrée avec ton pseudo Steam. Cartes avec couleur selon le genre du jeu et tag "Bibliothèque" ou "Wishlist" selon la provenance, regroupant au même niveau de priorité les annonces de ta bibliothèque Steam et de ta wishlist, triées de la plus récente à la plus ancienne. 20 actualités chargées au départ, le reste au fil du scroll. Actualisation via ↺.' },
    { icon: '📊', title: 'Onglet Stats du profil', desc: 'Onglet dédié entre "Profil" et "Corbeille" : boards, boards publics, jeux Steam, cartes perso, colonnes, ancienneté du compte, jeux terminés (+ taux de complétion), jeux avec échéance, notes écrites, boards publics suivis, board le plus actif.' },
    { icon: '🗑️', title: 'Corbeille', desc: 'Les cartes archivées supprimées et les notes effacées sont conservées 30 jours dans la corbeille. Restauration en un clic depuis l\'onglet "Corbeille" de ton profil. Les admins ont une vue globale de toutes les suppressions.' },
    { icon: '🌐', title: 'Boards publics collaboratifs', desc: 'Tout utilisateur connecté peut ajouter colonnes et cartes sur un board public — pas seulement le propriétaire. Idéal pour les boards communautaires.' },
    { icon: '★', title: 'Wishlist Steam dans les échéances', desc: 'Les jeux de ta wishlist Steam avec une date de sortie connue apparaissent automatiquement dans le panneau Échéances (badge ★ WISHLIST). Clic → page Steam Store. Masquables individuellement. Profil Steam public requis.' },
    { icon: '📋', title: 'Onglet Wishlist dans le profil', desc: 'Retrouve tous tes jeux en wishlist Steam dans un onglet dédié de ton profil.' },
    { icon: '🔑', title: 'Clé API Steam personnelle', desc: 'Profil privé ? Dans ton profil (onglet Profil), renseigne ta propre clé API Steam (steamcommunity.com/dev/apikey, nécessite l\'authentificateur mobile Steam Guard) pour débloquer bibliothèque, succès, wishlist et news même sans profil public. Jamais réaffichée en clair une fois enregistrée — juste un indicateur "configurée".' },
    { icon: '🔒', title: 'Message si module Steam bloqué', desc: 'Si la bibliothèque, les succès, la wishlist ou les échéances Steam ne peuvent rien afficher (profil privé + pas de clé perso), un court message explique pourquoi et propose deux liens : rendre ton profil public, ou générer ta clé API perso.' },
    { icon: '🔎', title: 'Zoom de l\'interface', desc: 'Dans ton profil (onglet Profil), un curseur par paliers de 5% (80 → 100%) réduit l\'échelle globale de l\'app — comme dans Teams ou Discord — pour afficher plus de contenu sur les écrans basse résolution. Réglage sauvegardé par compte.' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {features.map(({ icon, title, desc }) => (
        <div key={title} style={{ display: 'flex', gap: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px' }}>
          <span style={{ fontSize: 15, flexShrink: 0, width: 22, textAlign: 'center', marginTop: 1 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        </div>
      ))}
      <SteamNote />
    </div>
  );
}

// ── Onglet 3 : Kanban ─────────────────────────────────────────────────────────
function TabKanban() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.8 }}>
        Le <strong style={{ color: 'var(--accent)' }}>Kanban</strong> est une méthode de gestion visuelle inventée chez Toyota dans les années 50. L'idée : organiser des tâches en <strong>colonnes</strong> représentant des étapes d'avancement.
      </p>

      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { col: 'À faire',  color: '#66c0f4', desc: 'Ta backlog — jeux que tu veux faire mais n\'as pas commencés.' },
          { col: 'En cours', color: '#f5a500', desc: 'Ce sur quoi tu travailles activement.' },
          { col: 'Terminé',  color: '#4cd882', desc: 'Fini ! À archiver ou garder pour référence.' },
        ].map(({ col, color, desc }) => (
          <div key={col} style={{ flex: 1, background: `${color}10`, border: `1px solid ${color}40`, borderRadius: 9, padding: '10px 11px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 5 }}>{col}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        Tu <strong style={{ color: 'var(--text)' }}>glisses-déposes</strong> les cartes d'une colonne à l'autre au fil de ta progression. Les colonnes sont entièrement personnalisables.
      </p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        Dans KangBanGaming, il existe deux types de boards :
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid #66c0f4', borderRadius: 8, padding: '9px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#66c0f4', marginBottom: 3 }}>🎮 Board Steam</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>Chaque carte = un jeu Steam. Tu organises ta bibliothèque par genre, plateforme, saison de jeu, etc. Infos Steam en temps réel : avis, succès, wishlist, bannière "En jeu".</div>
        </div>
        <div style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid #f5a500', borderRadius: 8, padding: '9px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f5a500', marginBottom: 3 }}>🕹️ Board perso</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>Chaque carte = une tâche libre. Titre, description, assignation. Pratique pour organiser un projet gaming, un tournoi, un event communautaire…</div>
        </div>
      </div>

      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Icônes & indicateurs</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
          {[
            ['🌐', 'Board public'],
            ['🔒', 'Board privé'],
            ['📌', 'Épinglé'],
            ['🎮', 'Bannière En jeu'],
            ['⭐', 'Favori public'],
            ['🕹️', 'Board de tâches'],
          ].map(([icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ fontSize: 14 }}>{icon}</span>{label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function AppInfoModal({ onClose }) {
  const { t } = useLang();
  const [tab, setTab] = useState('colors');
  const TABS = [
    { id: 'colors',   label: t('info.tab_colors') },
    { id: 'features', label: t('info.tab_features') },
    { id: 'kanban',   label: t('info.tab_kanban') },
  ];

  return (
    <ModalBackdrop onClose={onClose} zIndex={1100}>
      <ModalCard style={{
        width: 580, height: '78vh', minHeight: 500, maxHeight: 920,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{t('info.title')}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px', marginTop: 12, flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'none', border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              padding: '8px 12px', color: tab === t.id ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: tab === t.id ? 700 : 400, fontSize: 12, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {tab === 'colors'   && <TabColors />}
          {tab === 'features' && <TabFeatures />}
          {tab === 'kanban'   && <TabKanban />}
        </div>
      </ModalCard>
    </ModalBackdrop>
  );
}
