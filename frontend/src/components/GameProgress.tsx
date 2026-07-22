import { useEffect, useState } from 'react';
import { api } from '../api';
import type { GameState } from '../types';

// Gamification hub for the profile: level, feature unlocks (locks with progress —
// "ещё немного, и откроется"), earned achievements. Congratulates ONCE on anything
// newly earned (the backend returns justEarned exactly one time).
export function useGameState() {
  const [game, setGame] = useState<GameState | null>(null);
  useEffect(() => {
    api.gameState().then(setGame).catch(() => {});
  }, []);
  return game;
}

export function GameCelebration({ game }: { game: GameState | null }) {
  const [show, setShow] = useState<string | null>(null);
  useEffect(() => {
    if (!game?.justEarned?.length) return;
    const key = game.justEarned[0];
    const unlock = game.unlocks.find((u) => `unlock:${u.key}` === key);
    const ach = game.achievements.find((a) => `ach:${a.key}` === key);
    const label = unlock
      ? `${unlock.icon} Открыто: ${unlock.title}!`
      : ach
        ? `${ach.icon} Достижение: ${ach.title}!`
        : null;
    if (!label) return;
    setShow(label);
    const t = setTimeout(() => setShow(null), 3500);
    return () => clearTimeout(t);
  }, [game]);
  if (!show) return null;
  return <div className="game-toast">{show}</div>;
}

export function GameProgress({ game }: { game: GameState }) {
  const lvl = game.level;
  const q = game.counters.quality ?? 0;
  const lvlPct = lvl.nextAt ? Math.min(100, Math.round((q / lvl.nextAt) * 100)) : 100;
  const earned = game.achievements.filter((a) => a.earned);

  return (
    <>
      <div className="me-section">
        <h2 className="me-h">Мой путь дегустатора</h2>
        <div className="game-level">
          <span className="game-level-ico">{lvl.icon}</span>
          <div style={{ flex: 1 }}>
            <div className="game-level-title">{lvl.title}</div>
            {lvl.nextAt != null && (
              <>
                <div className="acc-track" style={{ marginTop: 4 }}>
                  <div className="acc-fill" style={{ width: `${lvlPct}%` }} />
                </div>
                <div className="game-level-sub">
                  {q}/{lvl.nextAt} качественных дегустаций до уровня «{lvl.nextTitle}»
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="me-section">
        <h2 className="me-h">Открытия</h2>
        {game.unlocks.map((u) => (
          <div key={u.key} className={'game-unlock' + (u.unlocked ? ' open' : '')}>
            <span className="game-unlock-ico">{u.unlocked ? u.icon : '🔒'}</span>
            <div style={{ flex: 1 }}>
              <div className="game-unlock-title">{u.title}</div>
              {u.unlocked ? (
                <div className="game-unlock-sub open">Открыто ✓</div>
              ) : (
                <>
                  <div className="acc-track" style={{ marginTop: 4 }}>
                    <div className="acc-fill" style={{ width: `${Math.min(100, (u.have / u.need) * 100)}%` }} />
                  </div>
                  <div className="game-unlock-sub">
                    {Math.min(u.have, u.need)}/{u.need} — откроется: {u.teaser}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {earned.length > 0 && (
        <div className="me-section">
          <h2 className="me-h">Достижения</h2>
          <div className="game-achievements">
            {earned.map((a) => (
              <div key={a.key} className="game-ach">
                <span className="game-ach-ico">{a.icon}</span>
                <span className="game-ach-title">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
