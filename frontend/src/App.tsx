import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { trackScreen } from './analytics';
import { api } from './api';
import { IcHome, IcBookmark, IcBell, IcUser, IcTools } from './components/Icons';
import { QuizModal } from './components/QuizModal';
import { CategoryCelebration } from './components/CategoryCelebration';
import { ScanFab } from './components/ScanFab';
import { usePullToRefresh } from './pullToRefresh';

export default function App() {
  const loc = useLocation();
  useEffect(() => {
    const name = loc.pathname === '/' || /^\/tg-boot/.test(loc.pathname) ? 'Главная'
      : loc.pathname.startsWith('/favorites') ? 'Хочу попробовать'
      : loc.pathname.startsWith('/alerts') ? 'Уведомления'
      : loc.pathname.startsWith('/me') ? 'Профиль'
      : loc.pathname.startsWith('/business') ? 'Кабинет' : loc.pathname;
    trackScreen(name);
  }, [loc.pathname]);
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  // unread badge on the bell — polled lightly + reset by the alerts screen
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let stop = false;
    const poll = () => api.notificationsUnread().then((r) => { if (!stop) setUnread(r.unread); }).catch(() => {});
    poll();
    const iv = setInterval(poll, 90_000);
    const onVis = () => { if (!document.hidden) poll(); };
    const onRead = () => setUnread(0);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('alerts-read', onRead);
    return () => { stop = true; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('alerts-read', onRead); };
  }, []);

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

  // iOS-style pull-to-refresh on every tab: hard pull at the top reloads
  const { pull, refreshing, threshold } = usePullToRefresh();
  const ptrReady = pull >= threshold || refreshing;

  return (
    <div className="app">
      <div
        className="ptr-indicator"
        style={{ transform: `translateY(${Math.min(pull, threshold + 20) - 40}px)`, opacity: pull > 6 || refreshing ? 1 : 0 }}
      >
        <span className={'ptr-spinner' + (refreshing ? ' spin' : '')} style={{ transform: refreshing ? undefined : `rotate(${pull * 3}deg)` }}>
          {ptrReady ? '↻' : '↓'}
        </span>
      </div>
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
          <span className="ico"><IcHome /></span>
          Главная
        </NavLink>
        <NavLink to="/favorites" className={cls}>
          <span className="ico"><IcBookmark /></span>
          Хочу попробовать
        </NavLink>
        <NavLink to="/alerts" className={cls}>
          <span className="ico bell-wrap">
            <IcBell />
            {unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>}
          </span>
          Уведомления
        </NavLink>
        <NavLink to="/me" className={cls}>
          <span className="ico"><IcUser /></span>
          Профиль
        </NavLink>
        {isAdmin && (
          <NavLink to="/business" className={cls}>
            <span className="ico"><IcTools /></span>
            Кабинет
          </NavLink>
        )}
      </nav>
    </div>
  );
}
