import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

// Top-of-home motivator. Replaces the old «🎯 Обучение рекомендаций» card, whose
// pitch was altruistic («оценивайте, чтобы обучить рекомендации») and whose
// category was picked with Math.random() on every render.
//
// The goal now speaks about the USER's own standing — звание, уровень, влияние,
// первенство — and is chosen server-side by a ranked, rotating, fatigue-aware
// selector. It stays STABLE for the whole session: the session id is minted once
// per mini-app launch, so re-renders never swap the goal under the user.

export type PersonalGoalData = {
  id: string;
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  current: number;
  target: number;
  percent: number;
  actionUrl: string;
};

const SESSION_KEY = 'goalSession';

/** One id per mini-app launch: sessionStorage survives re-renders and in-app
 *  navigation but is cleared when Telegram tears the webview down. */
function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return 'nostorage';
  }
}

export function PersonalGoal() {
  const [goal, setGoal] = useState<PersonalGoalData | null>(null);
  const [hidden, setHidden] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let stop = false;
    api
      .personalGoal(sessionId())
      .then((g) => { if (!stop && g) setGoal(g); })
      .catch(() => {});
    return () => { stop = true; };
  }, []);

  if (!goal || hidden) return null;

  const open = () => {
    api.goalReact(goal.id, 'clicked').catch(() => {});
    const url = goal.actionUrl || '/';
    if (url.startsWith('/')) navigate(url);
  };

  return (
    <div className="goal-card" onClick={open} role="button" tabIndex={0}>
      <button
        className="goal-dismiss"
        aria-label="Скрыть цель"
        onClick={(e) => {
          e.stopPropagation();
          api.goalReact(goal.id, 'dismissed').catch(() => {});
          setHidden(true);
        }}
      >
        ×
      </button>
      <div className="goal-head">
        <span className="goal-icon">{goal.icon}</span>
        <span className="goal-title">{goal.title}</span>
      </div>
      <p className="goal-sub">{goal.subtitle}</p>
      {goal.target > 0 && (
        <div className="goal-progress">
          <div className="goal-bar">
            <span className="goal-bar-fill" style={{ width: `${goal.percent}%` }} />
          </div>
          <span className="goal-count">
            {goal.current}/{goal.target}
          </span>
        </div>
      )}
    </div>
  );
}
