import ModalBackdrop from './ModalBackdrop.jsx';
import { GENRE_COLORS } from './SteamUI.jsx';

const TASK_TYPES = [
  { color: '#66c0f4', border: '#66c0f4', label: 'Par défaut / Steam' },
  { color: '#4cd882', border: '#3db86a', label: 'Terminé ✓' },
  { color: '#f87575', border: '#dc3c3c', label: 'Urgent ⚠' },
  { color: '#787878', border: '#787878', label: 'Archivé' },
];

const BOARD_COLORS = [
  { color: '#3db86a', label: 'Board public', desc: 'Accessible via lien sans compte. Visible dans la sidebar sous "Boards Publics".' },
  { color: '#f5a500', label: 'Board épinglé', desc: 'Board mis en avant dans ta sidebar. Drag & drop pour réorganiser.' },
  { color: 'var(--accent)', label: 'Board actif', desc: 'Le board actuellement ouvert. Bordure gauche orange dans la sidebar.' },
];

const THEME_VARS = [
  { name: '--bg',          sample: 'var(--bg)',          label: 'Fond principal' },
  { name: '--surface',     sample: 'var(--surface)',      label: 'Surface de base' },
  { name: '--surface1',    sample: 'var(--surface1)',     label: 'Surface élevée' },
  { name: '--surface2',    sample: 'var(--surface2)',     label: 'Surface plus élevée' },
  { name: '--surface3',    sample: 'var(--surface3)',     label: 'Surface haute' },
  { name: '--accent',      sample: 'var(--accent)',       label: 'Accent (orange)' },
  { name: '--text',        sample: 'var(--text)',         label: 'Texte principal' },
  { name: '--text-muted',  sample: 'var(--text-muted)',   label: 'Texte secondaire' },
  { name: '--border',      sample: 'var(--border)',       label: 'Bordures' },
];

const GENRE_LIST = Object.entries(GENRE_COLORS);

function Swatch({ color, size = 14 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: 3,
      background: color, border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0,
      verticalAlign: 'middle',
    }} />
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span>{icon}</span>}{title}
      </div>
      {children}
    </div>
  );
}

export default function AppInfoModal({ onClose }) {
  return (
    <ModalBackdrop onClose={onClose} zIndex={1100}>
      <div style={{
        background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 14,
        width: 580, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 40px rgba(0,0,0,.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>À propos de KangBanGaming</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>

          {/* Boards */}
          <Section title="Code couleur des boards" icon="📋">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BOARD_COLORS.map(({ color, label, desc }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ width: 4, minHeight: 36, borderRadius: 2, background: color, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: color, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Cartes */}
          <Section title="Code couleur des cartes" icon="🃏">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TASK_TYPES.map(({ border, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', border: `1px solid var(--border)`, borderLeft: `3px solid ${border}`, borderRadius: 8, padding: '7px 12px' }}>
                  <Swatch color={border} />
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>{label}</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                Les cartes héritent automatiquement de la couleur du genre principal du jeu (voir ci-dessous).
              </div>
            </div>
          </Section>

          {/* Genres Steam */}
          <Section title="Couleurs par genre Steam" icon="🎮">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GENRE_LIST.map(([genre, color]) => (
                <div key={genre} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: `${color}15`, border: `1px solid ${color}50`,
                  borderRadius: 6, padding: '3px 8px',
                }}>
                  <Swatch color={color} size={10} />
                  <span style={{ fontSize: 11, color, fontWeight: 600 }}>{genre}</span>
                </div>
              ))}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(102,192,244,0.1)', border: '1px solid rgba(102,192,244,0.3)',
                borderRadius: 6, padding: '3px 8px',
              }}>
                <Swatch color="#66c0f4" size={10} />
                <span style={{ fontSize: 11, color: '#66c0f4', fontWeight: 600 }}>Autres / Inconnu</span>
              </div>
            </div>
          </Section>

          {/* Avis Steam */}
          <Section title="Couleurs des avis Steam" icon="⭐">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { color: '#4cd882', label: 'Positif', range: '≥ 80%' },
                { color: '#f5c518', label: 'Mitigé', range: '50–79%' },
                { color: '#f87575', label: 'Négatif', range: '< 50%' },
              ].map(({ color, label, range }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${color}12`, border: `1px solid ${color}35`, borderRadius: 6, padding: '5px 10px' }}>
                  <Swatch color={color} />
                  <div>
                    <div style={{ fontSize: 12, color, fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{range}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Thème CSS */}
          <Section title="Variables de thème (CSS)" icon="🎨">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {THEME_VARS.map(({ name, sample, label }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: sample, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Légende icônes */}
          <Section title="Icônes et indicateurs" icon="🔍">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: '🌐', label: 'Board public', desc: 'Accessible sans connexion via lien de partage' },
                { icon: '🔒', label: 'Board privé', desc: 'Visible uniquement par toi' },
                { icon: '📌', label: 'Épinglé', desc: 'Board prioritaire affiché en haut de ta sidebar' },
                { icon: '🎮', label: 'En jeu', desc: 'Bannière en bas d\'écran : membres jouant au jeu du board actif' },
                { icon: '⭐', label: 'Favori public', desc: 'Board public d\'un autre user que tu as mis en favori' },
                { icon: '🕹️', label: 'Task board', desc: 'Board de tâches génériques (pas lié à un jeu Steam)' },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 16, flexShrink: 0, width: 22, textAlign: 'center' }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 1 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Centre d'aide */}
          <Section title="Centre d'aide — fonctionnalités" icon="📖">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                {
                  title: 'Créer un board',
                  desc: 'Clique sur le bouton + dans la sidebar. Choisis un jeu Steam (recherche par nom) ou crée un board de tâches génériques. Tu peux définir un emoji, un nom personnalisé, et activer le mode public.',
                },
                {
                  title: 'Ajouter une carte',
                  desc: 'Dans un board ouvert, clique sur "+ Ajouter" en bas de n\'importe quelle colonne. Pour un board Steam, recherche un jeu par nom. Pour un board tâches, remplis le formulaire.',
                },
                {
                  title: 'Déplacer une carte',
                  desc: 'Glisse-dépose une carte d\'une colonne à une autre. Sur mobile, utilise le menu de la carte pour changer de colonne.',
                },
                {
                  title: 'Colonnes personnalisables',
                  desc: 'Clique sur le nom d\'une colonne pour la renommer. Glisse l\'icône ⠿ pour réordonner les colonnes. Le bouton 🗑 supprime une colonne vide. Le bouton + en haut à droite du board ajoute une nouvelle colonne.',
                },
                {
                  title: 'Boards publics et partage',
                  desc: 'Active le mode public dans les paramètres du board (icône 🌐). Un lien de partage apparaît — n\'importe qui peut le consulter sans compte. Les boards publics d\'autres utilisateurs apparaissent dans ta sidebar si tu les ajoutes en favori.',
                },
                {
                  title: 'Boards épinglés',
                  desc: 'Clique sur 📌 à côté d\'un board pour l\'épingler en haut de ta sidebar. Glisse-dépose les boards épinglés pour les réorganiser.',
                },
                {
                  title: 'Panneau infos jeu',
                  desc: 'Clique sur une carte jeu pour ouvrir le panneau latéral avec les infos Steam : description, genres, avis, prix, succès. Le panneau est redimensionnable et peut être ancré à gauche ou à droite.',
                },
                {
                  title: 'Cartes urgentes et terminées',
                  desc: 'Sur une carte, le bouton ⚠ marque la carte comme urgente (bordure rouge). Le bouton ✓ la marque comme terminée (bordure verte). Ces états sont visibles par tous sur les boards publics.',
                },
                {
                  title: 'Assignation',
                  desc: 'Sur les boards collaboratifs, tu peux assigner des membres à chaque carte via l\'icône 👤. Les avatars des assignés s\'affichent sur la carte.',
                },
                {
                  title: 'Bannière "En jeu"',
                  desc: 'Quand tu ouvres un board lié à un jeu Steam, une bannière apparaît en bas si des membres de la communauté jouent actuellement à ce jeu. Nécessite un profil Steam public.',
                },
                {
                  title: 'Recherche globale',
                  desc: 'Clique sur l\'icône 🔍 en haut de la sidebar pour rechercher parmi tous tes jeux et toutes tes cartes sur tous tes boards.',
                },
                {
                  title: 'Panneau "Populaires & Recommandés"',
                  desc: 'Dans le panneau de droite, un carrousel affiche les jeux mis en avant sur Steam avec leur note, genres et description. Il défile automatiquement toutes les 5 secondes.',
                },
                {
                  title: 'Panneau "Sorties à venir"',
                  desc: 'Liste les prochaines sorties Steam avec date, note Metacritic et informations de base. Actualisation manuelle via le bouton ↺.',
                },
                {
                  title: 'Mode compact',
                  desc: 'Réduis la hauteur des cartes avec le bouton de mode compact dans la barre d\'outils du board. Utile quand tu as beaucoup de jeux.',
                },
                {
                  title: 'Profil et compte Steam',
                  desc: 'Accède à ton profil via le bouton "Profil" en bas de sidebar. Tu peux voir tes stats Steam, modifier ton pseudo, et consulter ta bibliothèque. Nécessite un profil Steam public pour les données détaillées.',
                },
              ].map(({ title, desc }) => (
                <div key={title} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Kanban expliqué */}
          <Section title="C'est quoi le Kanban ?" icon="❓">
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text)', lineHeight: 1.7 }}>
                Le <strong style={{ color: 'var(--accent)' }}>Kanban</strong> est une méthode de gestion visuelle inventée chez Toyota dans les années 50. L'idée est simple : organiser des tâches (ou ici des jeux) en <strong>colonnes</strong> qui représentent des étapes.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { col: 'À faire', color: '#66c0f4', desc: 'Les jeux dans ta backlog — tu veux y jouer mais tu n\'as pas encore commencé.' },
                  { col: 'En cours', color: '#f5a500', desc: 'Ce sur quoi tu travailles activement en ce moment.' },
                  { col: 'Terminé', color: '#4cd882', desc: 'Fini ! Tu peux archiver ou garder pour référence.' },
                ].map(({ col, color, desc }) => (
                  <div key={col} style={{ flex: '1 1 140px', background: `${color}10`, border: `1px solid ${color}40`, borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{col}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Tu <strong>glisses-déposes</strong> les cartes d'une colonne à l'autre au fur et à mesure de ta progression. Les colonnes sont entièrement personnalisables — tu peux les renommer, en ajouter, en supprimer selon ton workflow.
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Dans KangBanGaming, chaque carte représente un <strong>jeu Steam</strong> (ou une tâche personnalisée). Un board = un projet ou une catégorie — par exemple un board par genre, par plateforme ou par saison.
              </p>
            </div>
          </Section>

          {/* Profil Steam public */}
          <div style={{ background: 'rgba(102,192,244,0.08)', border: '1px solid rgba(102,192,244,0.3)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18, fill: '#66c0f4', flexShrink: 0, marginTop: 1 }}>
              <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/>
            </svg>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#66c0f4', marginBottom: 4 }}>Profil Steam public recommandé</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Pour une expérience complète, ton profil Steam doit être <strong style={{ color: 'var(--text)' }}>public</strong>. Sans ça, les fonctionnalités suivantes ne peuvent pas fonctionner : succès, wishlist, et détection "En jeu" dans la bannière.<br />
                <a href="https://steamcommunity.com/my/edit/settings" target="_blank" rel="noreferrer" style={{ color: '#66c0f4', marginTop: 4, display: 'inline-block' }}>
                  Modifier la confidentialité Steam →
                </a>
              </div>
            </div>
          </div>

          {/* Version */}
          <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
            KangBanGaming — Steam-powered Kanban
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}
