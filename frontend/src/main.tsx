import React, { lazy, Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App';
import Home from './screens/Home';
const Favorites = lazy(() => import('./screens/Favorites'));
const Alerts = lazy(() => import('./screens/Alerts'));
const MyRatings = lazy(() => import('./screens/MyRatings'));
const Business = lazy(() => import('./screens/Business'));
import { initTelegram, haptic, initData } from './telegram';
import { api } from './api';
import { initAnalytics } from './analytics';

reportClient('module-start', 'main.tsx loaded');
initTelegram();
initAnalytics();

function reportClient(kind: string, detail: unknown) {
  try {
    fetch('/api/health/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        detail: String(detail).slice(0, 500),
        url: location.href,
        hasInitData: !!(window.Telegram?.WebApp?.initData || initData),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    reportClient('react-crash', (error as Error)?.stack || (error as Error)?.message || error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="boot-fallback">
        <div className="boot-fallback-box">
          <b>Не удалось загрузить приложение</b>
          <button onClick={() => window.location.reload()}>Обновить</button>
        </div>
      </div>
    );
  }
}

// TEMP: report client crashes to the server so we can see mobile-only errors that
// happen before any API call fires. Fire-and-forget, never throws.
{
  window.addEventListener('error', (e) => reportClient('error', e.message + ' @ ' + (e.filename || '') + ':' + e.lineno));
  window.addEventListener('unhandledrejection', (e) => reportClient('promise', (e.reason && (e.reason.stack || e.reason.message)) || e.reason));
}

// app-open session tracking (start on open, end on close) for admin analytics
let sessionId: string | null = null;
api
  .sessionStart()
  .then((s) => {
    sessionId = s.id;
  })
  .catch(() => {});
const endSession = () => {
  if (!sessionId) return;
  // keepalive so the request survives the page being closed
  fetch('/api/session/end', {
    method: 'POST',
    headers: { Authorization: `tma ${initData}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: sessionId }),
    keepalive: true,
  }).catch(() => {});
  sessionId = null;
};
window.addEventListener('pagehide', endSession);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') endSession();
});

// light haptic feedback on any interactive tap
document.addEventListener(
  'click',
  (e) => {
    const t = e.target as HTMLElement | null;
    if (t?.closest?.('button, a, .chip, .cat-tile, .vcard, .post, .mini, .rate-star, .heart')) {
      haptic('light');
    }
  },
  { capture: true },
);

const appChildren = [
  { index: true, element: <Home /> },
  { path: 'favorites', element: <Suspense fallback={null}><Favorites /></Suspense> },
  { path: 'alerts', element: <Suspense fallback={null}><Alerts /></Suspense> },
  { path: 'me', element: <Suspense fallback={null}><MyRatings /></Suspense> },
  { path: 'business', element: <Suspense fallback={null}><Business /></Suspense> },
];

const router = createBrowserRouter([
  { path: '/', element: <App />, children: appChildren },
  // ANY boot path, present and future — hardcoding versions here is what kept
  // every new release 404ing inside Telegram
  { path: '/tg-boot-:v', element: <App />, children: appChildren },
  { path: '*', element: <Navigate to="/" replace /> },
]);

function BootedRouter() {
  useEffect(() => {
    (window as any).__APP_BOOTED = true;
    reportClient('app-mounted', 'react mounted');
  }, []);
  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BootedRouter />
    </AppErrorBoundary>
  </React.StrictMode>,
);
