import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { api } from './api';
import { QuizModal } from './components/QuizModal';
import { CategoryCelebration } from './components/CategoryCelebration';
import { ScanFab } from './components/ScanFab';

export default function App() {
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    let stop = false;
    let meTries = 0;
    const loadMe = () => {
      api
        .me()
        .then((u) => {
          if (!stop) setIsAdmin(u?.role === 'ADMIN');
        })
        .catch(() => {
          meTries += 1;
          if (!stop && meTries < 8) setTimeout(loadMe, Math.min(700 + meTries * 450, 2600));
        });
    };
    loadMe();
    // first-run taste quiz (once per user, remembered by Telegram account)
    const forced = localStorage.getItem('force_quiz') === '1';
    api
      .onboarding()
      .then((o) => setShowQuiz(!o.onboarded || forced))
      .catch(() => setShowQuiz(forced));
    // SELF-UPDATE: Telegram keeps mini-app sessions alive for hours, so users
    // kept seeing builds from the morning. Whenever the app regains focus we
    // compare our bundle name with the server's — a mismatch reloads the app
    // (never mid-modal, so no typed review is ever lost).
    let lastCheck = 0;
    const myBundle = (document.querySelector('script[src*="/assets/index-"]') as HTMLScriptElement | null)?.src.match(/index-[w-]+.js/)?.[0];
    const checkFresh = () => {
      if (!myBundle || Date.now() - lastCheck < 30_000) return;
      lastCheck = Date.now();
      fetch('/api/health/bundle')
        .then((r) => r.json())
        .then(({ js }) => {
          if (js && js !== myBundle && !document.querySelector('.modal-backdrop, .quiz')) {
            window.location.reload();
          }
        })
        .catch(() => {});
    };
    const onVis = () => { if (!document.hidden) checkFresh(); };
    document.addEventListener('visibilitychange', onVis);
    const iv = setInterval(checkFresh, 300_000);
    checkFresh();
    return () => {
      stop = true;
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(iv);
    };
  }, []);

  return (
    <div className="app">
      {showQuiz && (
        <QuizModal
          onDone={() => {
            setShowQuiz(false);
            localStorage.removeItem('force_quiz');
            // reload so the home feed rebuilds around the chosen tastes
            window.location.reload();
          }}
        />
      )}
      <Outlet />
      <CategoryCelebration />
      {/* the key feature: scan a dish/drink from any screen */}
      <ScanFab />
      <nav className="nav">
        <NavLink
          to="/"
          end
          className={cls}
          onClick={() => window.dispatchEvent(new CustomEvent('home-reset'))}
        >
          <span className="ico">🏠</span>
          Главная
        </NavLink>
        <NavLink to="/favorites" className={cls}>
          <span className="ico">🔖</span>
          Хочу попробовать
        </NavLink>
        <NavLink to="/me" className={cls}>
          <span className="ico">👤</span>
          Профиль
        </NavLink>
        {isAdmin && (
          <NavLink to="/business" className={cls}>
            <span className="ico">🛠</span>
            Кабинет
          </NavLink>
        )}
      </nav>
    </div>
  );
}
