/**
 * SteamEncart — bande horizontale d'infos Steam (joueurs en ligne, avis,
 * Metacritic, prix, genres, studio, date de sortie).
 * Utilisé dans les deux branches header (board personnel & board public).
 */
import { useLang } from '../i18n.js';

export default function SteamEncart({ gameInfo }) {
  const { t } = useLang();
  if (!gameInfo) return null;

  const score = gameInfo.reviewScore ?? 0;
  const reviewColor = score >= 8 ? '#4cd882' : score >= 5 ? '#f5c518' : '#f87575';
  const reviewBg    = score >= 8 ? 'rgba(60,200,100,.1)' : score >= 5 ? 'rgba(245,197,24,.1)' : 'rgba(248,117,117,.1)';
  const reviewEmoji = score >= 8 ? '👍' : score >= 5 ? '😐' : '👎';

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      fontSize: 12, flexShrink: 0,
    }}>
      {/* Joueurs en ligne */}
      {gameInfo.playerCount !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3db86a', boxShadow: '0 0 6px #3db86a88', display: 'inline-block', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{gameInfo.playerCount.toLocaleString('fr-FR')}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>{t('ginfo.in_game')}</div>
          </div>
        </div>
      )}

      {/* Avis */}
      {gameInfo.reviewScoreDesc && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: reviewBg, borderRight: (gameInfo.metacritic !== null || gameInfo.price) ? '1px solid rgba(255,255,255,0.08)' : undefined, cursor: 'pointer' }}
          onClick={() => window.open(`https://store.steampowered.com/app/${gameInfo.appid}/#app_reviews_hash`, '_blank')}
          title={t('ginfo.see_reviews')}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>{reviewEmoji}</span>
          <div>
            <div style={{ fontWeight: 700, color: reviewColor, lineHeight: 1.2 }}>{gameInfo.reviewScoreDesc}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>
              {gameInfo.positivePercent !== null ? t('ginfo.positive_pct', { percent: gameInfo.positivePercent }) : ''}
              {gameInfo.totalReviews ? ` · ${gameInfo.totalReviews.toLocaleString('fr-FR')}` : ''}
            </div>
          </div>
        </div>
      )}

      {/* Metacritic */}
      {gameInfo.metacritic !== null && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRight: gameInfo.price ? '1px solid rgba(255,255,255,0.08)' : undefined, cursor: gameInfo.metacriticUrl ? 'pointer' : 'default' }}
          onClick={() => gameInfo.metacriticUrl && window.open(gameInfo.metacriticUrl, '_blank')}
          title={gameInfo.metacriticUrl ? t('ginfo.see_metacritic') : undefined}
        >
          <div style={{ width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#000', background: gameInfo.metacritic >= 75 ? '#6c3' : gameInfo.metacritic >= 50 ? '#fc3' : '#f00', flexShrink: 0 }}>
            {gameInfo.metacritic}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', lineHeight: 1.3 }}>Meta<br/>critic</div>
        </div>
      )}

      {/* Prix */}
      {gameInfo.price && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' }}>
          {gameInfo.discount > 0 && (
            <span style={{ background: '#4c6b22', color: '#a4d007', fontWeight: 900, fontSize: 10, padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>
              -{gameInfo.discount}%
            </span>
          )}
          <div>
            {gameInfo.discount > 0 && gameInfo.priceInitial && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through', lineHeight: 1 }}>{gameInfo.priceInitial}</div>
            )}
            <div style={{ fontWeight: 700, color: gameInfo.discount > 0 ? '#a4d007' : '#fff', lineHeight: 1.2 }}>{gameInfo.price}</div>
          </div>
        </div>
      )}

      {/* Colonne droite : badges + studio/date */}
      {(gameInfo.genres?.length || gameInfo.multiplayerLabel || gameInfo.earlyAccess || gameInfo.comingSoon || gameInfo.developer || gameInfo.releaseDate) && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, padding: '5px 11px', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
            {gameInfo.earlyAccess && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(220,50,50,0.18)', color: '#ff5555', border: '2px solid rgba(220,50,50,0.85)', whiteSpace: 'nowrap' }}>{t('ginfo.early_access')}</span>
            )}
            {gameInfo.comingSoon && !gameInfo.earlyAccess && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(245,197,24,0.12)', color: '#f5c518', border: '2px solid rgba(245,197,24,0.75)', whiteSpace: 'nowrap' }}>{t('ginfo.coming_soon')}</span>
            )}
            {gameInfo.multiplayerLabel && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(71,167,245,0.15)', color: '#47a7f5', border: '2px solid rgba(71,167,245,0.75)', whiteSpace: 'nowrap' }}>👥 {gameInfo.multiplayerLabel}</span>
            )}
            {(gameInfo.genres || []).map(g => (
              <span key={g} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '2px solid rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>{g}</span>
            ))}
          </div>
          {(gameInfo.developer || gameInfo.releaseDate) && (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {gameInfo.developer && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>🛠 {gameInfo.developer}</span>}
              {gameInfo.developer && gameInfo.releaseDate && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>·</span>}
              {gameInfo.releaseDate && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', whiteSpace: 'nowrap' }}>📅 {gameInfo.releaseDate}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
