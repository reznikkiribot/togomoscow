import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './index.css';
import App from './App';
import Home from './screens/Home';
import Favorites from './screens/Favorites';
import MyRatings from './screens/MyRatings';
import Business from './screens/Business';
import { initTelegram, haptic, initData } from './telegram';
import { api } from './api';

reportClient('module-start', 'main.tsx loaded');
initTelegram();

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

// block page pinch-zoom & double-tap zoom everywhere (Leaflet keeps its own
// zoom — it uses touch events, not these native gesture events).
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}
let lastTouch = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    // kill double-tap zoom on empty areas ONLY — never on interactive elements, or we
    // cancel their tap (this was swallowing the `tel:` call link + needing double taps).
    const interactive = (e.target as HTMLElement)?.closest?.(
      '.leaflet-container, a, button, input, textarea, select, label, [role="button"], .chip, .cat-tile, .rate-star, .heart',
    );
    if (now - lastTouch < 300 && !interactive) {
      e.preventDefault();
    }
    lastTouch = now;
  },
  { passive: false },
);

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
  { path: 'favorites', element: <Favorites /> },
  { path: 'me', element: <MyRatings /> },
  { path: 'business', element: <Business /> },
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
