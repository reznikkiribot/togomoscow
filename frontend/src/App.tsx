import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { trackScreen } from './analytics';
import { api } from './api';
import { IcHome, IcBookmark, IcBell, IcUser, IcTools } from './components/Icons';
const QuizModal = lazy(() => import('./components/QuizModal').then((m) => ({ default: m.QuizModal })));
const FirstRunValue = lazy(() => import('./components/FirstRunValue').then((m) => ({ default: m.FirstRunValue })));
const CategoryCelebration = lazy(() => import('./components/CategoryCelebration').then((m) => ({ default: m.CategoryCelebration })));
const ScanFab = lazy(() => import('./components/ScanFab').then((m) => ({ default: m.ScanFab })));
import { usePullToRefresh } from './pullToRefresh';
import { useTastingLocation } from './locationTrust';

function firstRunSeenKey() {
  const telegramId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
  return `firstRunValueSeen:v1:${telegramId ?? 'browser'}`;
}

export default function App() {
  // Passive only: if the user already consented, refresh the location used to
  // select the nearest branch. New permission prompts remain in the review flow.
  useTastingLocation();
  const loc = useLocation();
  useEffect(() => {
    const name = loc.pathname === '/' || /^\/tg-boot/.test(loc.pathname) ? 'Главная'
      : loc.pathname.startsWith('/favorites') ? 'Хочу попробовать'
      : loc.pathname.startsWith('/alerts') ? 'Уведомления'
      : loc.pathname.startsWith('/me') ? 'Мой путь дегустатора'
      : loc.pathname.startsWith('/business') ? 'Кабинет' : loc.pathname;
    trackScreen(name);
  }, [loc.pathname]);
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showFirstRun, setShowFirstRun] = useState(false);
  const [secondaryUiReady, setSecondaryUiReady] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const idle = (window as any).requestIdleCallback as ((cb: () => void, options?: { timeout: number }) => number) | undefined;
    const handle = idle ? idle(() => setSecondaryUiReady(true), { timeout: 1_000 }) : window.setTimeout(() => setSecondaryUiReady(true), 800);
    return () => {
      if (idle) (window as any).cancelIdleCallback?.(handle);
      else clearTimeout(handle);
    };
  }, []);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const sync = () => document.documentElement.style.setProperty('--app-nav-height', `${Math.ceil(nav.getBoundingClientRect().height)}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [isAdmin]);
  // unread badge on the bell — polled lightly + reset by the alerts screen
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let stop = false;
    const poll = () => api.notificationsUnread().then((r) => { if (!stop) setUnread(r.unread); }).catch(() => {});
    const firstPoll = window.setTimeout(poll, 1_500);
    const iv = setInterval(poll, 90_000);
    const onVis = () => { if (!document.hidden) poll(); };
    const onRead = () => setUnread(0);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('alerts-read', onRead);
    return () => { stop = true; clearTimeout(firstPoll); clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('alerts-read', onRead); };
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
    const deferredMe = window.setTimeout(loadMe, 1_200);
    // A zero-rating user first sees the product value and can rate immediately.
    // The older taste quiz remains available from the profile (`force_quiz`).
    const forced = localStorage.getItem('force_quiz') === '1';
    const deferredOnboarding = window.setTimeout(() => {
      Promise.all([api.onboarding(), api.myReviews()])
        .then(([onboarding, reviews]) => {
          const valueSeen = localStorage.getItem(firstRunSeenKey()) === '1';
          if (forced) setShowQuiz(true);
          else if (reviews.length === 0 && !valueSeen) setShowFirstRun(true);
          else setShowQuiz(reviews.length > 0 && !onboarding.onboarded);
        })
        .catch(() => setShowQuiz(forced));
    }, 1_200);
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
    const deferredFreshness = window.setTimeout(checkFresh, 2_500);
    return () => {
      stop = true;
      clearTimeout(deferredMe);
      clearTimeout(deferredOnboarding);
      clearTimeout(deferredFreshness);
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(iv);
    };
  }, []);

  // Pull-to-refresh belongs to the tab root only. The hook also vetoes a pull
  // while any nested modal/sheet or the TasteHero gesture is active.
  const isTabRoot = /^\/(?:favorites|alerts|me|business)?\/?$/.test(loc.pathname)
    || /^\/tg-boot-[^/]+\/?$/.test(loc.pathname);
  const { pull, refreshing, threshold } = usePullToRefresh(undefined, isTabRoot);
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
        <Suspense fallback={null}>
          <QuizModal
            onDone={() => {
              setShowQuiz(false);
              localStorage.removeItem('force_quiz');
              // reload so the home feed rebuilds around the chosen tastes
              window.location.reload();
            }}
          />
        </Suspense>
      )}
      {showFirstRun && (
        <Suspense fallback={null}>
          <FirstRunValue
            onDone={() => {
              try { localStorage.setItem(firstRunSeenKey(), '1'); } catch { /* private mode */ }
              api.setOnboarding({ categories: [] }).catch(() => {});
              setShowFirstRun(false);
            }}
            onScan={() => {
              try { localStorage.setItem(firstRunSeenKey(), '1'); } catch { /* private mode */ }
              api.setOnboarding({ categories: [] }).catch(() => {});
              setShowFirstRun(false);
              window.setTimeout(() => window.dispatchEvent(new Event('scan-open')), 0);
            }}
          />
        </Suspense>
      )}
      <Outlet />
      {secondaryUiReady && <Suspense fallback={null}><CategoryCelebration /></Suspense>}
      {/* the key feature: scan a dish/drink from any screen */}
      {secondaryUiReady && <Suspense fallback={null}><ScanFab /></Suspense>}
      <nav className="nav" ref={navRef} aria-label="Основная навигация">
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
          Мой путь
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
