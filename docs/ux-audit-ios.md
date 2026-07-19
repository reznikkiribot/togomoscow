Проведу аудит по фактической реализации без правок. Сначала соберу карту экранов, навигации, жестов и CSS, затем отдельно проверю формы, состояния, Telegram API и доступность; для iOS-бенчмарка сверюсь с актуальными первичными рекомендациями Apple.
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg --files frontend/src; Get-ChildItem frontend -Force | Select-Object Name,Length,LastWriteTime; if (Test-Path frontend/package.json) { Get-Content frontend/package.json }; if (Test-Path frontend/vite.config.ts) { Get-Content frontend/vite.config.ts }' in D:\Приложения\Yelp
 succeeded in 972ms:
frontend/src\vite-env.d.ts
frontend/src\types.ts
frontend/src\telegram.ts
frontend/src\tasting.ts
frontend/src\swipeDismiss.ts
frontend/src\swipeBack.ts
frontend/src\storyImage.ts
frontend/src\screens\MyRatings.tsx
frontend/src\screens\MapScreen.tsx
frontend/src\screens\Home.tsx
frontend/src\screens\Favorites.tsx
frontend/src\screens\Business.tsx
frontend/src\screens\Alerts.tsx
frontend/src\reviewStory.ts
frontend/src\recent.ts
frontend/src\pullToRefresh.ts
frontend/src\plural.ts
frontend/src\modalEsc.ts
frontend/src\main.tsx
frontend/src\index.css
frontend/src\img.ts
frontend/src\api.ts
frontend/src\analytics.ts
frontend/src\geocode.ts
frontend/src\cuisine.ts
frontend/src\App.tsx
frontend/src\categoryGate.ts
frontend/src\hooks\useFavorites.ts
frontend/src\components\VenuePicker.tsx
frontend/src\components\VenuePhoto.tsx
frontend/src\components\TrainingScale.tsx
frontend/src\components\TasteResult.tsx
frontend/src\components\TasteHero.tsx
frontend/src\components\SupportModal.tsx
frontend/src\components\Stars.tsx
frontend/src\components\StarInput.tsx
frontend/src\components\SmartImg.tsx
frontend/src\components\SimilarItems.tsx
frontend/src\components\ScanFab.tsx
frontend/src\components\ReviewForm.tsx
frontend/src\components\ReviewCard.tsx
frontend/src\components\ReviewAttrs.tsx
frontend/src\components\QuizModal.tsx
frontend/src\components\QuickRate.tsx
frontend/src\components\PhotoPostModal.tsx
frontend/src\components\People.tsx
frontend/src\components\NotInterested.tsx
frontend/src\components\MapView.tsx
frontend/src\components\MapBrowse.tsx
frontend/src\components\ListRow.tsx
frontend/src\components\ListingDetail.tsx
frontend/src\components\ListingCard.tsx
frontend/src\components\Icons.tsx
frontend/src\components\GroupModal.tsx
frontend/src\components\GameProgress.tsx
frontend/src\components\Filters.tsx
frontend/src\components\FeedRecCard.tsx
frontend/src\components\FeedPost.tsx
frontend/src\components\CorrectionModal.tsx
frontend/src\components\CommentsModal.tsx
frontend/src\components\CategoryCelebration.tsx
frontend/src\components\AddBusiness.tsx

Name              Length LastWriteTime      
----              ------ -------------      
dist                     19.07.2026 12:16:42
node_modules             08.07.2026 12:53:34
public                   06.07.2026 20:06:37
src                      19.07.2026 12:16:06
index.html        5408   08.07.2026 11:31:27
package-lock.json 62526  08.07.2026 12:53:34
package.json      830    07.07.2026 23:58:20
railway.json      334    07.07.2026 23:58:21
server.mjs        3148   08.07.2026 12:03:53
tsconfig.json     468    19.06.2026 16:14:17
vercel.json       1011   07.07.2026 23:25:24
vite.config.mjs   1038   06.07.2026 19:41:50
vite.config.ts    1347   12.07.2026 1:57:53 
{
  "name": "togomoscow-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite --config vite.config.mjs",
    "build": "vite build --config vite.config.mjs",
    "start": "node server.mjs",
    "preview": "vite preview --config vite.config.mjs",
    "serve": "vite build --config vite.config.mjs && vite preview --config vite.config.mjs"
  },
  "dependencies": {
    "leaflet": "^1.9.4",
    "leaflet.markercluster": "^1.5.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.18.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.21",
    "@types/leaflet.markercluster": "^1.5.6",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.0",
    "vite": "^5.4.11"
  }
}
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the frontend and backend are served under one origin (the tunnel URL)
// so Telegram only needs a single HTTPS address. Calls to /api are proxied to
// the local NestJS server.
const proxy = {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
};

const cacheHeaders = () => ({
  name: 'preview-cache-headers',
  configurePreviewServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      const url = req.url || '';
      if (url === '/' || url.startsWith('/?') || url.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, max-age=0');
      } else if (url.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (url === '/telegram-web-app.js') {
        res.setHeader('Cache-Control', 'no-cache, max-age=0');
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), cacheHeaders()],
  // dev server (HMR)
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy,
  },
  // production preview вЂ” served to real users (hashed assets = cache-proof)
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy,
  },
});



  → Собрать карту UI-архитектуры, навигации, жестов и Telegram-интеграции
  • Проверить экраны, формы, состояния, CSS и доступность с точными строками
  • Сверить ключевые критерии с актуальными первичными Apple/Telegram источниками
  • Сформировать приоритизированный отчёт и TOP-15 без изменений кода
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$files = rg --files frontend/src | Where-Object { $_ -match '"'\\.(tsx|ts|css)"'$'"' }; foreach ("'$f in $files) { $n=(Get-Content $f).Count; "${n}`t${f}" } | Sort-Object {[int](($_ -split "`t")[0])} -Descending' in D:\Приложения\Yelp
2026-07-19T17:53:22.210811Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.6 seconds
Output:
строка:2 знак:149
+ ...  ($f in $files) { $n=(Get-Content $f).Count; "${n}`t${f}" } | Sort-Ob ...
+                                                                 ~
Пустой элемент канала не допускается.
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : EmptyPipeElement
 

 exited 1 in 561ms:
строка:2 знак:149
+ ...  ($f in $files) { $n=(Get-Content $f).Count; "${n}`t${f}" } | Sort-Ob ...
+                                                                 ~
Пустой элемент канала не допускается.
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : EmptyPipeElement
 

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$files = rg --files frontend/src | Where-Object { $_ -match '"'\\.(tsx|ts|css)"'$'"' }; "'$rows = foreach ($f in $files) { $n=(Get-Content $f).Count; [PSCustomObject]@{Lines=$n;File=$f} }; $rows | Sort-Object Lines -Descending | Format-Table -AutoSize' in D:\Приложения\Yelp
 succeeded in 2782ms:

Lines File                                           
----- ----                                           
 5742 frontend/src\index.css                         
 1608 frontend/src\components\ListingDetail.tsx      
 1021 frontend/src\screens\Home.tsx                  
  890 frontend/src\screens\Business.tsx              
  536 frontend/src\screens\MyRatings.tsx             
  504 frontend/src\api.ts                            
  411 frontend/src\components\ReviewForm.tsx         
  402 frontend/src\types.ts                          
  351 frontend/src\components\ScanFab.tsx            
  342 frontend/src\components\MapBrowse.tsx          
  333 frontend/src\components\People.tsx             
  313 frontend/src\tasting.ts                        
  252 frontend/src\components\PhotoPostModal.tsx     
  250 frontend/src\components\Filters.tsx            
  243 frontend/src\components\CommentsModal.tsx      
  196 frontend/src\components\TasteHero.tsx          
  191 frontend/src\components\ListRow.tsx            
  172 frontend/src\components\VenuePicker.tsx        
  172 frontend/src\components\AddBusiness.tsx        
  169 frontend/src\components\FeedPost.tsx           
  157 frontend/src\main.tsx                          
  157 frontend/src\components\QuizModal.tsx          
  154 frontend/src\components\ListingCard.tsx        
  153 frontend/src\storyImage.ts                     
  150 frontend/src\App.tsx                           
  145 frontend/src\components\ReviewCard.tsx         
  139 frontend/src\components\SmartImg.tsx           
  136 frontend/src\telegram.ts                       
  134 frontend/src\components\TasteResult.tsx        
  128 frontend/src\swipeDismiss.ts                   
  118 frontend/src\swipeBack.ts                      
  112 frontend/src\components\MapView.tsx            
  104 frontend/src\components\GameProgress.tsx       
  103 frontend/src\components\GroupModal.tsx         
  101 frontend/src\screens\Alerts.tsx                
  100 frontend/src\cuisine.ts                        
   98 frontend/src\analytics.ts                      
   91 frontend/src\modalEsc.ts                       
   82 frontend/src\categoryGate.ts                   
   79 frontend/src\components\VenuePhoto.tsx         
   77 frontend/src\components\FeedRecCard.tsx        
   76 frontend/src\screens\Favorites.tsx             
   75 frontend/src\components\CorrectionModal.tsx    
   67 frontend/src\pullToRefresh.ts                  
   65 frontend/src\components\TrainingScale.tsx      
   59 frontend/src\components\SupportModal.tsx       
   51 frontend/src\components\QuickRate.tsx          
   45 frontend/src\reviewStory.ts                    
   45 frontend/src\components\ReviewAttrs.tsx        
   42 frontend/src\components\SimilarItems.tsx       
   41 frontend/src\components\StarInput.tsx          
   39 frontend/src\components\NotInterested.tsx      
   39 frontend/src\plural.ts                         
   37 frontend/src\geocode.ts                        
   35 frontend/src\hooks\useFavorites.ts             
   34 frontend/src\recent.ts                         
   32 frontend/src\components\CategoryCelebration.tsx
   28 frontend/src\vite-env.d.ts                     
   27 frontend/src\img.ts                            
   25 frontend/src\screens\MapScreen.tsx             
   24 frontend/src\components\Icons.tsx              
   17 frontend/src\components\Stars.tsx              



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "." frontend/src/App.tsx frontend/src/main.tsx frontend/src/telegram.ts frontend/src/swipeBack.ts frontend/src/swipeDismiss.ts frontend/src/pullToRefresh.ts frontend/src/modalEsc.ts frontend/src/analytics.ts' in D:\Приложения\Yelp
 succeeded in 274ms:
frontend/src/App.tsx:1:import { useEffect, useState } from 'react';
frontend/src/App.tsx:2:import { NavLink, Outlet, useLocation } from 'react-router-dom';
frontend/src/App.tsx:3:import { trackScreen } from './analytics';
frontend/src/App.tsx:4:import { api } from './api';
frontend/src/App.tsx:5:import { IcHome, IcBookmark, IcBell, IcUser, IcTools } from './components/Icons';
frontend/src/App.tsx:6:import { QuizModal } from './components/QuizModal';
frontend/src/App.tsx:7:import { CategoryCelebration } from './components/CategoryCelebration';
frontend/src/App.tsx:8:import { ScanFab } from './components/ScanFab';
frontend/src/App.tsx:9:import { usePullToRefresh } from './pullToRefresh';
frontend/src/App.tsx:10:
frontend/src/App.tsx:11:export default function App() {
frontend/src/App.tsx:12:  const loc = useLocation();
frontend/src/App.tsx:13:  useEffect(() => {
frontend/src/App.tsx:14:    const name = loc.pathname === '/' || /^\/tg-boot/.test(loc.pathname) ? 'Главная'
frontend/src/App.tsx:15:      : loc.pathname.startsWith('/favorites') ? 'Хочу попробовать'
frontend/src/App.tsx:16:      : loc.pathname.startsWith('/alerts') ? 'Уведомления'
frontend/src/App.tsx:17:      : loc.pathname.startsWith('/me') ? 'Профиль'
frontend/src/App.tsx:18:      : loc.pathname.startsWith('/business') ? 'Кабинет' : loc.pathname;
frontend/src/App.tsx:19:    trackScreen(name);
frontend/src/App.tsx:20:  }, [loc.pathname]);
frontend/src/App.tsx:21:  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');
frontend/src/App.tsx:22:  const [isAdmin, setIsAdmin] = useState(false);
frontend/src/App.tsx:23:  const [showQuiz, setShowQuiz] = useState(false);
frontend/src/App.tsx:24:  // unread badge on the bell — polled lightly + reset by the alerts screen
frontend/src/App.tsx:25:  const [unread, setUnread] = useState(0);
frontend/src/App.tsx:26:  useEffect(() => {
frontend/src/App.tsx:27:    let stop = false;
frontend/src/App.tsx:28:    const poll = () => api.notificationsUnread().then((r) => { if (!stop) setUnread(r.unread); }).catch(() => {});
frontend/src/App.tsx:29:    poll();
frontend/src/App.tsx:30:    const iv = setInterval(poll, 90_000);
frontend/src/App.tsx:31:    const onVis = () => { if (!document.hidden) poll(); };
frontend/src/App.tsx:32:    const onRead = () => setUnread(0);
frontend/src/App.tsx:33:    document.addEventListener('visibilitychange', onVis);
frontend/src/App.tsx:34:    window.addEventListener('alerts-read', onRead);
frontend/src/App.tsx:35:    return () => { stop = true; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('alerts-read', onRead); };
frontend/src/App.tsx:36:  }, []);
frontend/src/App.tsx:37:
frontend/src/App.tsx:38:  useEffect(() => {
frontend/src/App.tsx:39:    let stop = false;
frontend/src/App.tsx:40:    let meTries = 0;
frontend/src/App.tsx:41:    const loadMe = () => {
frontend/src/App.tsx:42:      api
frontend/src/App.tsx:43:        .me()
frontend/src/App.tsx:44:        .then((u) => {
frontend/src/App.tsx:45:          if (!stop) setIsAdmin(u?.role === 'ADMIN');
frontend/src/App.tsx:46:        })
frontend/src/App.tsx:47:        .catch(() => {
frontend/src/App.tsx:48:          meTries += 1;
frontend/src/App.tsx:49:          if (!stop && meTries < 8) setTimeout(loadMe, Math.min(700 + meTries * 450, 2600));
frontend/src/App.tsx:50:        });
frontend/src/App.tsx:51:    };
frontend/src/App.tsx:52:    loadMe();
frontend/src/App.tsx:53:    // first-run taste quiz (once per user, remembered by Telegram account)
frontend/src/App.tsx:54:    const forced = localStorage.getItem('force_quiz') === '1';
frontend/src/App.tsx:55:    api
frontend/src/App.tsx:56:      .onboarding()
frontend/src/App.tsx:57:      .then((o) => setShowQuiz(!o.onboarded || forced))
frontend/src/App.tsx:58:      .catch(() => setShowQuiz(forced));
frontend/src/App.tsx:59:    // SELF-UPDATE: Telegram keeps mini-app sessions alive for hours, so users
frontend/src/App.tsx:60:    // kept seeing builds from the morning. Whenever the app regains focus we
frontend/src/App.tsx:61:    // compare our bundle name with the server's — a mismatch reloads the app
frontend/src/App.tsx:62:    // (never mid-modal, so no typed review is ever lost).
frontend/src/App.tsx:63:    let lastCheck = 0;
frontend/src/App.tsx:64:    const myBundle = (document.querySelector('script[src*="/assets/index-"]') as HTMLScriptElement | null)?.src.match(/index-[w-]+.js/)?.[0];
frontend/src/App.tsx:65:    const checkFresh = () => {
frontend/src/App.tsx:66:      if (!myBundle || Date.now() - lastCheck < 30_000) return;
frontend/src/App.tsx:67:      lastCheck = Date.now();
frontend/src/App.tsx:68:      fetch('/api/health/bundle')
frontend/src/App.tsx:69:        .then((r) => r.json())
frontend/src/App.tsx:70:        .then(({ js }) => {
frontend/src/App.tsx:71:          if (js && js !== myBundle && !document.querySelector('.modal-backdrop, .quiz')) {
frontend/src/App.tsx:72:            window.location.reload();
frontend/src/App.tsx:73:          }
frontend/src/App.tsx:74:        })
frontend/src/App.tsx:75:        .catch(() => {});
frontend/src/App.tsx:76:    };
frontend/src/App.tsx:77:    const onVis = () => { if (!document.hidden) checkFresh(); };
frontend/src/App.tsx:78:    document.addEventListener('visibilitychange', onVis);
frontend/src/App.tsx:79:    const iv = setInterval(checkFresh, 300_000);
frontend/src/App.tsx:80:    checkFresh();
frontend/src/App.tsx:81:    return () => {
frontend/src/App.tsx:82:      stop = true;
frontend/src/App.tsx:83:      document.removeEventListener('visibilitychange', onVis);
frontend/src/App.tsx:84:      clearInterval(iv);
frontend/src/App.tsx:85:    };
frontend/src/App.tsx:86:  }, []);
frontend/src/App.tsx:87:
frontend/src/App.tsx:88:  // iOS-style pull-to-refresh on every tab: hard pull at the top reloads
frontend/src/App.tsx:89:  const { pull, refreshing, threshold } = usePullToRefresh();
frontend/src/App.tsx:90:  const ptrReady = pull >= threshold || refreshing;
frontend/src/App.tsx:91:
frontend/src/App.tsx:92:  return (
frontend/src/App.tsx:93:    <div className="app">
frontend/src/App.tsx:94:      <div
frontend/src/App.tsx:95:        className="ptr-indicator"
frontend/src/App.tsx:96:        style={{ transform: `translateY(${Math.min(pull, threshold + 20) - 40}px)`, opacity: pull > 6 || refreshing ? 1 : 0 }}
frontend/src/App.tsx:97:      >
frontend/src/App.tsx:98:        <span className={'ptr-spinner' + (refreshing ? ' spin' : '')} style={{ transform: refreshing ? undefined : `rotate(${pull * 3}deg)` }}>
frontend/src/App.tsx:99:          {ptrReady ? '↻' : '↓'}
frontend/src/App.tsx:100:        </span>
frontend/src/App.tsx:101:      </div>
frontend/src/App.tsx:102:      {showQuiz && (
frontend/src/App.tsx:103:        <QuizModal
frontend/src/App.tsx:104:          onDone={() => {
frontend/src/App.tsx:105:            setShowQuiz(false);
frontend/src/App.tsx:106:            localStorage.removeItem('force_quiz');
frontend/src/App.tsx:107:            // reload so the home feed rebuilds around the chosen tastes
frontend/src/App.tsx:108:            window.location.reload();
frontend/src/App.tsx:109:          }}
frontend/src/App.tsx:110:        />
frontend/src/App.tsx:111:      )}
frontend/src/App.tsx:112:      <Outlet />
frontend/src/App.tsx:113:      <CategoryCelebration />
frontend/src/App.tsx:114:      {/* the key feature: scan a dish/drink from any screen */}
frontend/src/App.tsx:115:      <ScanFab />
frontend/src/App.tsx:116:      <nav className="nav">
frontend/src/App.tsx:117:        <NavLink
frontend/src/App.tsx:118:          to="/"
frontend/src/App.tsx:119:          end
frontend/src/App.tsx:120:          className={cls}
frontend/src/App.tsx:121:          onClick={() => window.dispatchEvent(new CustomEvent('home-reset'))}
frontend/src/App.tsx:122:        >
frontend/src/App.tsx:123:          <span className="ico"><IcHome /></span>
frontend/src/App.tsx:124:          Главная
frontend/src/App.tsx:125:        </NavLink>
frontend/src/App.tsx:126:        <NavLink to="/favorites" className={cls}>
frontend/src/App.tsx:127:          <span className="ico"><IcBookmark /></span>
frontend/src/App.tsx:128:          Хочу попробовать
frontend/src/App.tsx:129:        </NavLink>
frontend/src/App.tsx:130:        <NavLink to="/alerts" className={cls}>
frontend/src/App.tsx:131:          <span className="ico bell-wrap">
frontend/src/App.tsx:132:            <IcBell />
frontend/src/App.tsx:133:            {unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>}
frontend/src/App.tsx:134:          </span>
frontend/src/App.tsx:135:          Уведомления
frontend/src/App.tsx:136:        </NavLink>
frontend/src/App.tsx:137:        <NavLink to="/me" className={cls}>
frontend/src/App.tsx:138:          <span className="ico"><IcUser /></span>
frontend/src/App.tsx:139:          Профиль
frontend/src/App.tsx:140:        </NavLink>
frontend/src/App.tsx:141:        {isAdmin && (
frontend/src/App.tsx:142:          <NavLink to="/business" className={cls}>
frontend/src/App.tsx:143:            <span className="ico"><IcTools /></span>
frontend/src/App.tsx:144:            Кабинет
frontend/src/App.tsx:145:          </NavLink>
frontend/src/App.tsx:146:        )}
frontend/src/App.tsx:147:      </nav>
frontend/src/App.tsx:148:    </div>
frontend/src/App.tsx:149:  );
frontend/src/App.tsx:150:}
frontend/src/modalEsc.ts:1:import { useEffect, useRef } from 'react';
frontend/src/modalEsc.ts:3:// Global modal stack so pressing Esc / Back closes only the TOPMOST modal/screen.
frontend/src/modalEsc.ts:4:const stack: Array<() => void> = [];
frontend/src/modalEsc.ts:5:let bound = false;
frontend/src/modalEsc.ts:7:/** True while any modal/overlay is open — screens use this to defer their own Esc. */
frontend/src/modalEsc.ts:8:export function hasOpenModal() {
frontend/src/modalEsc.ts:9:  return stack.length > 0;
frontend/src/modalEsc.ts:10:}
frontend/src/modalEsc.ts:12:// On Telegram DESKTOP a single Esc can fire BOTH the keydown and the native
frontend/src/modalEsc.ts:13:// BackButton, popping two layers at once (e.g. filter sheet AND the map browse →
frontend/src/modalEsc.ts:14:// bounced all the way to home). Debounce so one press = one step back.
frontend/src/modalEsc.ts:15:let lastPop = 0;
frontend/src/modalEsc.ts:16:function popTop() {
frontend/src/modalEsc.ts:17:  const now = Date.now();
frontend/src/modalEsc.ts:18:  if (now - lastPop < 350) return;
frontend/src/modalEsc.ts:19:  lastPop = now;
frontend/src/modalEsc.ts:20:  if (stack.length) stack[stack.length - 1]();
frontend/src/modalEsc.ts:21:}
frontend/src/modalEsc.ts:23:function onKey(e: KeyboardEvent) {
frontend/src/modalEsc.ts:24:  if (e.key === 'Escape' && stack.length) {
frontend/src/modalEsc.ts:25:    e.preventDefault();
frontend/src/modalEsc.ts:26:    popTop();
frontend/src/modalEsc.ts:27:  }
frontend/src/modalEsc.ts:28:}
frontend/src/modalEsc.ts:30:// Telegram's native BackButton — the reliable "back" on desktop & mobile, where
frontend/src/modalEsc.ts:31:// the host app may swallow the Esc key before the webview ever sees it.
frontend/src/modalEsc.ts:32:function tgBack(): any {
frontend/src/modalEsc.ts:33:  return (window as any).Telegram?.WebApp?.BackButton ?? null;
frontend/src/modalEsc.ts:34:}
frontend/src/modalEsc.ts:35:function syncBackButton() {
frontend/src/modalEsc.ts:36:  const bb = tgBack();
frontend/src/modalEsc.ts:37:  if (!bb) return;
frontend/src/modalEsc.ts:38:  if (stack.length) bb.show();
frontend/src/modalEsc.ts:39:  else bb.hide();
frontend/src/modalEsc.ts:40:}
frontend/src/modalEsc.ts:42:// lock the page behind any open modal so scrolling the card never drags the
frontend/src/modalEsc.ts:43:// background (scroll-chaining / touch leaking to the home screen).
frontend/src/modalEsc.ts:44:// position:fixed + top compensation — plain overflow:hidden/height:100% RESETS the
frontend/src/modalEsc.ts:45:// scroll position, so closing a card used to jump the page back to the top.
frontend/src/modalEsc.ts:46:let lockedScrollY = 0;
frontend/src/modalEsc.ts:47:function syncBodyLock() {
frontend/src/modalEsc.ts:48:  if (typeof document === 'undefined') return;
frontend/src/modalEsc.ts:49:  const body = document.body;
frontend/src/modalEsc.ts:50:  const wantLock = stack.length > 0;
frontend/src/modalEsc.ts:51:  const isLocked = body.classList.contains('modal-open');
frontend/src/modalEsc.ts:52:  if (wantLock && !isLocked) {
frontend/src/modalEsc.ts:53:    lockedScrollY = window.scrollY;
frontend/src/modalEsc.ts:54:    body.classList.add('modal-open');
frontend/src/modalEsc.ts:55:    body.style.position = 'fixed';
frontend/src/modalEsc.ts:56:    body.style.top = `-${lockedScrollY}px`;
frontend/src/modalEsc.ts:57:    body.style.left = '0';
frontend/src/modalEsc.ts:58:    body.style.right = '0';
frontend/src/modalEsc.ts:59:  } else if (!wantLock && isLocked) {
frontend/src/modalEsc.ts:60:    body.classList.remove('modal-open');
frontend/src/modalEsc.ts:61:    body.style.position = '';
frontend/src/modalEsc.ts:62:    body.style.top = '';
frontend/src/modalEsc.ts:63:    body.style.left = '';
frontend/src/modalEsc.ts:64:    body.style.right = '';
frontend/src/modalEsc.ts:65:    window.scrollTo(0, lockedScrollY); // restore EXACTLY where the card was opened
frontend/src/modalEsc.ts:66:  }
frontend/src/modalEsc.ts:67:}
frontend/src/modalEsc.ts:69:/** Closes this modal/screen on Esc / Back (only when it's the top of the stack). */
frontend/src/modalEsc.ts:70:export function useEscClose(onClose: () => void) {
frontend/src/modalEsc.ts:71:  const ref = useRef(onClose);
frontend/src/modalEsc.ts:72:  ref.current = onClose;
frontend/src/modalEsc.ts:73:  useEffect(() => {
frontend/src/modalEsc.ts:74:    if (!bound) {
frontend/src/modalEsc.ts:75:      // capture phase + window: catch Esc before anything else swallows it
frontend/src/modalEsc.ts:76:      window.addEventListener('keydown', onKey, true);
frontend/src/modalEsc.ts:77:      tgBack()?.onClick(popTop);
frontend/src/modalEsc.ts:78:      bound = true;
frontend/src/modalEsc.ts:79:    }
frontend/src/modalEsc.ts:80:    const fn = () => ref.current();
frontend/src/modalEsc.ts:81:    stack.push(fn);
frontend/src/modalEsc.ts:82:    syncBackButton();
frontend/src/modalEsc.ts:83:    syncBodyLock();
frontend/src/modalEsc.ts:84:    return () => {
frontend/src/modalEsc.ts:85:      const i = stack.indexOf(fn);
frontend/src/modalEsc.ts:86:      if (i >= 0) stack.splice(i, 1);
frontend/src/modalEsc.ts:87:      syncBackButton();
frontend/src/modalEsc.ts:88:      syncBodyLock();
frontend/src/modalEsc.ts:89:    };
frontend/src/modalEsc.ts:90:  }, []);
frontend/src/modalEsc.ts:91:}
frontend/src/analytics.ts:1:// Lightweight behavior analytics: tracks which screen the user is on, how long
frontend/src/analytics.ts:2:// they stay, how far they scroll, and where the session ends — sent to the
frontend/src/analytics.ts:3:// backend on exit so we can surface UX-improvement insights in the cabinet.
frontend/src/analytics.ts:4:type ScreenStat = { name: string; ms: number; maxScroll: number };
frontend/src/analytics.ts:6:let current: { name: string; enteredAt: number; maxScroll: number } | null = null;
frontend/src/analytics.ts:7:const screens: ScreenStat[] = [];
frontend/src/analytics.ts:8:const sessionStart = Date.now();
frontend/src/analytics.ts:9:let sent = false;
frontend/src/analytics.ts:11:// EVERY tap the user makes (compact descriptor), so behavior can be analysed later
frontend/src/analytics.ts:12:type Tap = { t: number; screen: string; el: string };
frontend/src/analytics.ts:13:let taps: Tap[] = [];
frontend/src/analytics.ts:15:// a short human-readable descriptor of the tapped element
frontend/src/analytics.ts:16:function describe(el: Element | null): string {
frontend/src/analytics.ts:17:  if (!el) return '?';
frontend/src/analytics.ts:18:  const target = (el.closest('button, a, [role="button"], .card, .vcard, .post, .cat-tile, .mini, .chip, .qr-star, .rec-star, .heart, .ni-dots, input, .nav a, .search-sugg-item, .scan-fab, .fav-btn') as Element) || el;
frontend/src/analytics.ts:19:  const tag = target.tagName.toLowerCase();
frontend/src/analytics.ts:20:  const cls = (target.className && typeof target.className === 'string') ? '.' + target.className.trim().split(/\s+/)[0] : '';
frontend/src/analytics.ts:21:  let label = (target.getAttribute?.('aria-label') || target.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
frontend/src/analytics.ts:22:  if (!label && target.getAttribute?.('placeholder')) label = 'input:' + target.getAttribute('placeholder')!.slice(0, 24);
frontend/src/analytics.ts:23:  return `${tag}${cls}${label ? ` «${label}»` : ''}`;
frontend/src/analytics.ts:24:}
frontend/src/analytics.ts:26:function sendTaps(force = false) {
frontend/src/analytics.ts:27:  if (!taps.length && !force) return;
frontend/src/analytics.ts:28:  const batch = taps;
frontend/src/analytics.ts:29:  taps = [];
frontend/src/analytics.ts:30:  if (!batch.length) return;
frontend/src/analytics.ts:31:  try {
frontend/src/analytics.ts:32:    const body = JSON.stringify({ kind: 'taps', screen: current?.name ?? null, taps: batch });
frontend/src/analytics.ts:33:    if (navigator.sendBeacon) navigator.sendBeacon('/api/health/behavior', new Blob([body], { type: 'application/json' }));
frontend/src/analytics.ts:34:    else fetch('/api/health/behavior', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
frontend/src/analytics.ts:35:  } catch { /* ignore */ }
frontend/src/analytics.ts:36:}
frontend/src/analytics.ts:38:function flushCurrent() {
frontend/src/analytics.ts:39:  if (!current) return;
frontend/src/analytics.ts:40:  const ms = Date.now() - current.enteredAt;
frontend/src/analytics.ts:41:  const existing = screens.find((s) => s.name === current!.name);
frontend/src/analytics.ts:42:  if (existing) { existing.ms += ms; existing.maxScroll = Math.max(existing.maxScroll, current.maxScroll); }
frontend/src/analytics.ts:43:  else screens.push({ name: current.name, ms, maxScroll: current.maxScroll });
frontend/src/analytics.ts:44:}
frontend/src/analytics.ts:46:// call when the visible screen changes (route or major modal)
frontend/src/analytics.ts:47:export function trackScreen(name: string) {
frontend/src/analytics.ts:48:  const scrollFrac = () => {
frontend/src/analytics.ts:49:    const h = document.documentElement;
frontend/src/analytics.ts:50:    const max = h.scrollHeight - h.clientHeight;
frontend/src/analytics.ts:51:    return max > 0 ? Math.min(1, h.scrollTop / max) : 0;
frontend/src/analytics.ts:52:  };
frontend/src/analytics.ts:53:  if (current) { current.maxScroll = Math.max(current.maxScroll, scrollFrac()); flushCurrent(); }
frontend/src/analytics.ts:54:  current = { name, enteredAt: Date.now(), maxScroll: 0 };
frontend/src/analytics.ts:55:}
frontend/src/analytics.ts:57:function trackScroll() {
frontend/src/analytics.ts:58:  if (!current) return;
frontend/src/analytics.ts:59:  const h = document.documentElement;
frontend/src/analytics.ts:60:  const max = h.scrollHeight - h.clientHeight;
frontend/src/analytics.ts:61:  if (max > 0) current.maxScroll = Math.max(current.maxScroll, Math.min(1, h.scrollTop / max));
frontend/src/analytics.ts:62:}
frontend/src/analytics.ts:64:function sendSummary() {
frontend/src/analytics.ts:65:  if (sent) return;
frontend/src/analytics.ts:66:  sent = true;
frontend/src/analytics.ts:67:  flushCurrent();
frontend/src/analytics.ts:68:  const payload = {
frontend/src/analytics.ts:69:    kind: 'session',
frontend/src/analytics.ts:70:    totalMs: Date.now() - sessionStart,
frontend/src/analytics.ts:71:    lastScreen: current?.name ?? screens[screens.length - 1]?.name ?? null,
frontend/src/analytics.ts:72:    screens: screens.map((s) => ({ name: s.name, ms: s.ms, maxScroll: +s.maxScroll.toFixed(2) })),
frontend/src/analytics.ts:73:  };
frontend/src/analytics.ts:74:  try {
frontend/src/analytics.ts:75:    const body = JSON.stringify(payload);
frontend/src/analytics.ts:76:    // sendBeacon survives the app closing; fetch keepalive is the fallback
frontend/src/analytics.ts:77:    if (navigator.sendBeacon) navigator.sendBeacon('/api/health/behavior', new Blob([body], { type: 'application/json' }));
frontend/src/analytics.ts:78:    else fetch('/api/health/behavior', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
frontend/src/analytics.ts:79:  } catch { /* ignore */ }
frontend/src/analytics.ts:80:}
frontend/src/analytics.ts:82:export function initAnalytics() {
frontend/src/analytics.ts:83:  window.addEventListener('scroll', trackScroll, { passive: true });
frontend/src/analytics.ts:84:  // record EVERY tap (capture phase → fires even if the handler stops propagation)
frontend/src/analytics.ts:85:  document.addEventListener(
frontend/src/analytics.ts:86:    'pointerdown',
frontend/src/analytics.ts:87:    (e) => {
frontend/src/analytics.ts:88:      taps.push({ t: Date.now() - sessionStart, screen: current?.name ?? '?', el: describe(e.target as Element) });
frontend/src/analytics.ts:89:      if (taps.length >= 25) sendTaps(); // flush in batches so nothing is lost
frontend/src/analytics.ts:90:    },
frontend/src/analytics.ts:91:    { capture: true, passive: true },
frontend/src/analytics.ts:92:  );
frontend/src/analytics.ts:93:  // periodic flush so taps survive even if the app is killed without pagehide
frontend/src/analytics.ts:94:  setInterval(() => sendTaps(), 15000);
frontend/src/analytics.ts:95:  // Telegram/iOS: the app closing fires pagehide / visibility-hidden most reliably
frontend/src/analytics.ts:96:  window.addEventListener('pagehide', () => { sendTaps(true); sendSummary(); });
frontend/src/analytics.ts:97:  document.addEventListener('visibilitychange', () => { if (document.hidden) { sendTaps(true); sendSummary(); } });
frontend/src/analytics.ts:98:}
frontend/src/pullToRefresh.ts:1:import { useEffect, useRef, useState } from 'react';
frontend/src/pullToRefresh.ts:2:import { haptic } from './telegram';
frontend/src/pullToRefresh.ts:4:// iOS-style pull-to-refresh: when the page is scrolled to the very top and the
frontend/src/pullToRefresh.ts:5:// user drags DOWN past a threshold, reload. Rubber-band follow + a spinner that
frontend/src/pullToRefresh.ts:6:// grows with the pull; releasing past the threshold triggers onRefresh (or a
frontend/src/pullToRefresh.ts:7:// full page reload by default). Ignores horizontal swipes (that's swipe-back).
frontend/src/pullToRefresh.ts:8:export function usePullToRefresh(onRefresh?: () => void | Promise<void>) {
frontend/src/pullToRefresh.ts:9:  const [pull, setPull] = useState(0); // px, damped
frontend/src/pullToRefresh.ts:10:  const [refreshing, setRefreshing] = useState(false);
frontend/src/pullToRefresh.ts:11:  const startY = useRef(0);
frontend/src/pullToRefresh.ts:12:  const startX = useRef(0);
frontend/src/pullToRefresh.ts:13:  const active = useRef(false);
frontend/src/pullToRefresh.ts:14:  const THRESHOLD = 72;
frontend/src/pullToRefresh.ts:16:  useEffect(() => {
frontend/src/pullToRefresh.ts:17:    const scroller = document.scrollingElement || document.documentElement;
frontend/src/pullToRefresh.ts:18:    const onStart = (e: TouchEvent) => {
frontend/src/pullToRefresh.ts:19:      if (refreshing) return;
frontend/src/pullToRefresh.ts:20:      // only arm at the very top and when nothing is scrolled under the finger
frontend/src/pullToRefresh.ts:21:      if ((scroller.scrollTop || 0) > 0) { active.current = false; return; }
frontend/src/pullToRefresh.ts:22:      startY.current = e.touches[0].clientY;
frontend/src/pullToRefresh.ts:23:      startX.current = e.touches[0].clientX;
frontend/src/pullToRefresh.ts:24:      active.current = true;
frontend/src/pullToRefresh.ts:25:    };
frontend/src/pullToRefresh.ts:26:    const onMove = (e: TouchEvent) => {
frontend/src/pullToRefresh.ts:27:      if (!active.current || refreshing) return;
frontend/src/pullToRefresh.ts:28:      const dy = e.touches[0].clientY - startY.current;
frontend/src/pullToRefresh.ts:29:      const dx = e.touches[0].clientX - startX.current;
frontend/src/pullToRefresh.ts:30:      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { active.current = false; setPull(0); return; }
frontend/src/pullToRefresh.ts:31:      if ((scroller.scrollTop || 0) > 0) { active.current = false; setPull(0); return; }
frontend/src/pullToRefresh.ts:32:      // rubber-band: the further you pull, the more resistance
frontend/src/pullToRefresh.ts:33:      const damped = Math.min(140, dy * 0.5);
frontend/src/pullToRefresh.ts:34:      setPull(damped);
frontend/src/pullToRefresh.ts:35:    };
frontend/src/pullToRefresh.ts:36:    const onEnd = async () => {
frontend/src/pullToRefresh.ts:37:      if (!active.current) return;
frontend/src/pullToRefresh.ts:38:      active.current = false;
frontend/src/pullToRefresh.ts:39:      if (pull >= THRESHOLD && !refreshing) {
frontend/src/pullToRefresh.ts:40:        haptic('medium');
frontend/src/pullToRefresh.ts:41:        setRefreshing(true);
frontend/src/pullToRefresh.ts:42:        setPull(THRESHOLD);
frontend/src/pullToRefresh.ts:43:        try {
frontend/src/pullToRefresh.ts:44:          if (onRefresh) await onRefresh();
frontend/src/pullToRefresh.ts:45:          else window.location.reload();
frontend/src/pullToRefresh.ts:46:        } finally {
frontend/src/pullToRefresh.ts:47:          // if onRefresh resolved without a reload, retract the spinner
frontend/src/pullToRefresh.ts:48:          setTimeout(() => { setRefreshing(false); setPull(0); }, 400);
frontend/src/pullToRefresh.ts:49:        }
frontend/src/pullToRefresh.ts:50:      } else {
frontend/src/pullToRefresh.ts:51:        setPull(0);
frontend/src/pullToRefresh.ts:52:      }
frontend/src/pullToRefresh.ts:53:    };
frontend/src/pullToRefresh.ts:54:    window.addEventListener('touchstart', onStart, { passive: true });
frontend/src/pullToRefresh.ts:55:    window.addEventListener('touchmove', onMove, { passive: true });
frontend/src/pullToRefresh.ts:56:    window.addEventListener('touchend', onEnd, { passive: true });
frontend/src/pullToRefresh.ts:57:    window.addEventListener('touchcancel', onEnd, { passive: true });
frontend/src/pullToRefresh.ts:58:    return () => {
frontend/src/pullToRefresh.ts:59:      window.removeEventListener('touchstart', onStart);
frontend/src/pullToRefresh.ts:60:      window.removeEventListener('touchmove', onMove);
frontend/src/pullToRefresh.ts:61:      window.removeEventListener('touchend', onEnd);
frontend/src/pullToRefresh.ts:62:      window.removeEventListener('touchcancel', onEnd);
frontend/src/pullToRefresh.ts:63:    };
frontend/src/pullToRefresh.ts:64:  }, [pull, refreshing, onRefresh]);
frontend/src/pullToRefresh.ts:66:  return { pull, refreshing, threshold: THRESHOLD };
frontend/src/pullToRefresh.ts:67:}
frontend/src/swipeBack.ts:1:import { useEffect, type RefObject } from 'react';
frontend/src/swipeBack.ts:3:// Swipe-back for FULL-SCREEN pushed pages (profile, category map): a rightward
frontend/src/swipeBack.ts:4:// drag from ANYWHERE (not just the edge) — the page sticks to the finger from the
frontend/src/swipeBack.ts:5:// very first pixels; release past a third of the width (or a fling) → back,
frontend/src/swipeBack.ts:6:// else it springs home. Touches that start inside horizontal scrollers
frontend/src/swipeBack.ts:7:// (carousels, chip rows) are left alone. Sheets/cards keep their swipe-DOWN.
frontend/src/swipeBack.ts:8:export function useSwipeBack(
frontend/src/swipeBack.ts:9:  pageRef: RefObject<HTMLElement | null>,
frontend/src/swipeBack.ts:10:  onBack: () => void,
frontend/src/swipeBack.ts:11:  enabled = true,
frontend/src/swipeBack.ts:12:) {
frontend/src/swipeBack.ts:13:  useEffect(() => {
frontend/src/swipeBack.ts:14:    if (!enabled) return;
frontend/src/swipeBack.ts:15:    let raf = 0;
frontend/src/swipeBack.ts:16:    let cancelled = false;
frontend/src/swipeBack.ts:17:    let detach: (() => void) | null = null;
frontend/src/swipeBack.ts:18:    const tryAttach = () => {
frontend/src/swipeBack.ts:19:      if (cancelled) return;
frontend/src/swipeBack.ts:20:      const el = pageRef.current;
frontend/src/swipeBack.ts:21:      if (!el) {
frontend/src/swipeBack.ts:22:        raf = requestAnimationFrame(tryAttach);
frontend/src/swipeBack.ts:23:        return;
frontend/src/swipeBack.ts:24:      }
frontend/src/swipeBack.ts:25:      detach = attach(el);
frontend/src/swipeBack.ts:26:    };
frontend/src/swipeBack.ts:27:    const attach = (el: HTMLElement): (() => void) => {
frontend/src/swipeBack.ts:28:      let startX = 0;
frontend/src/swipeBack.ts:29:      let startY = 0;
frontend/src/swipeBack.ts:30:      let lastX = 0;
frontend/src/swipeBack.ts:31:      let lastT = 0;
frontend/src/swipeBack.ts:32:      let velocity = 0;
frontend/src/swipeBack.ts:33:      let dragging = false;
frontend/src/swipeBack.ts:34:      let armed = false;
frontend/src/swipeBack.ts:35:      let closed = false;
frontend/src/swipeBack.ts:37:      // horizontal scrollers keep their own gesture — a back-swipe must not
frontend/src/swipeBack.ts:38:      // hijack carousels / chip rows
frontend/src/swipeBack.ts:39:      const inHorizontalScroller = (t: EventTarget | null) =>
frontend/src/swipeBack.ts:40:        t instanceof Element &&
frontend/src/swipeBack.ts:41:        !!t.closest('.feed, .rc-carousel, .cat-bar, .opt-chips, .card-tags, .filterbar, .tabs, .leaflet-container');
frontend/src/swipeBack.ts:42:      const start = (e: TouchEvent) => {
frontend/src/swipeBack.ts:43:        startX = lastX = e.touches[0].clientX;
frontend/src/swipeBack.ts:44:        startY = e.touches[0].clientY;
frontend/src/swipeBack.ts:45:        lastT = performance.now();
frontend/src/swipeBack.ts:46:        velocity = 0;
frontend/src/swipeBack.ts:47:        armed = !inHorizontalScroller(e.target); // anywhere on the page, not just the edge
frontend/src/swipeBack.ts:48:        dragging = false;
frontend/src/swipeBack.ts:49:      };
frontend/src/swipeBack.ts:50:      const move = (e: TouchEvent) => {
frontend/src/swipeBack.ts:51:        if (closed || !armed) return;
frontend/src/swipeBack.ts:52:        const x = e.touches[0].clientX;
frontend/src/swipeBack.ts:53:        const dx = x - startX;
frontend/src/swipeBack.ts:54:        const dyAbs = Math.abs(e.touches[0].clientY - startY);
frontend/src/swipeBack.ts:55:        const now = performance.now();
frontend/src/swipeBack.ts:56:        velocity = (x - lastX) / Math.max(1, now - lastT);
frontend/src/swipeBack.ts:57:        lastX = x;
frontend/src/swipeBack.ts:58:        lastT = now;
frontend/src/swipeBack.ts:59:        if (!dragging) {
frontend/src/swipeBack.ts:60:          // react IMMEDIATELY: capture on the very first horizontal pixels
frontend/src/swipeBack.ts:61:          if (dx > 4 && dx > dyAbs * 1.2 && e.cancelable) dragging = true;
frontend/src/swipeBack.ts:62:          else if (dyAbs > 10) { armed = false; return; } // it's a vertical scroll
frontend/src/swipeBack.ts:63:          else return;
frontend/src/swipeBack.ts:64:        }
frontend/src/swipeBack.ts:65:        if (e.cancelable) e.preventDefault();
frontend/src/swipeBack.ts:66:        el.style.transition = 'none';
frontend/src/swipeBack.ts:67:        // 1:1 follow like iOS, with a soft rubber-band past the width so it never
frontend/src/swipeBack.ts:68:        // feels twitchy, and a depth shadow on the leading edge
frontend/src/swipeBack.ts:69:        const w = el.clientWidth || 1;
frontend/src/swipeBack.ts:70:        const t = dx <= w ? dx : w + (dx - w) * 0.35;
frontend/src/swipeBack.ts:71:        el.style.transform = `translateX(${Math.max(0, t)}px)`;
frontend/src/swipeBack.ts:72:        el.style.boxShadow = '-14px 0 32px rgba(0,0,0,0.16)';
frontend/src/swipeBack.ts:73:      };
frontend/src/swipeBack.ts:74:      const end = () => {
frontend/src/swipeBack.ts:75:        if (!dragging || closed) return;
frontend/src/swipeBack.ts:76:        dragging = false;
frontend/src/swipeBack.ts:77:        const dx = lastX - startX;
frontend/src/swipeBack.ts:78:        if (dx > el.clientWidth * 0.33 || (velocity > 0.6 && dx > 40)) {
frontend/src/swipeBack.ts:79:          closed = true;
frontend/src/swipeBack.ts:80:          // gentle iOS-like glide out (decelerating ease-out, slightly longer)
frontend/src/swipeBack.ts:81:          el.style.transition = 'transform 0.36s cubic-bezier(0.32, 0.72, 0, 1)';
frontend/src/swipeBack.ts:82:          el.style.transform = 'translateX(100%)';
frontend/src/swipeBack.ts:83:          setTimeout(() => {
frontend/src/swipeBack.ts:84:            onBack();
frontend/src/swipeBack.ts:85:            // pages that DON'T unmount (e.g. the home screen returning from a
frontend/src/swipeBack.ts:86:            // category view) must be snapped back to place, not left off-screen
frontend/src/swipeBack.ts:87:            el.style.transition = 'none';
frontend/src/swipeBack.ts:88:            el.style.transform = '';
frontend/src/swipeBack.ts:89:            el.style.boxShadow = '';
frontend/src/swipeBack.ts:90:            closed = false;
frontend/src/swipeBack.ts:91:          }, 330);
frontend/src/swipeBack.ts:92:        } else {
frontend/src/swipeBack.ts:93:          // soft settle back — no hard bounce
frontend/src/swipeBack.ts:94:          el.style.transition = 'transform 0.42s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.3s ease';
frontend/src/swipeBack.ts:95:          el.style.transform = '';
frontend/src/swipeBack.ts:96:          el.style.boxShadow = '';
frontend/src/swipeBack.ts:97:        }
frontend/src/swipeBack.ts:98:      };
frontend/src/swipeBack.ts:99:      el.addEventListener('touchstart', start, { passive: true });
frontend/src/swipeBack.ts:100:      el.addEventListener('touchmove', move, { passive: false });
frontend/src/swipeBack.ts:101:      el.addEventListener('touchend', end, { passive: true });
frontend/src/swipeBack.ts:102:      el.addEventListener('touchcancel', end, { passive: true });
frontend/src/swipeBack.ts:103:      return () => {
frontend/src/swipeBack.ts:104:        el.removeEventListener('touchstart', start);
frontend/src/swipeBack.ts:105:        el.removeEventListener('touchmove', move);
frontend/src/swipeBack.ts:106:        el.removeEventListener('touchend', end);
frontend/src/swipeBack.ts:107:        el.removeEventListener('touchcancel', end);
frontend/src/swipeBack.ts:108:      };
frontend/src/swipeBack.ts:109:    };
frontend/src/swipeBack.ts:110:    tryAttach();
frontend/src/swipeBack.ts:111:    return () => {
frontend/src/swipeBack.ts:112:      cancelled = true;
frontend/src/swipeBack.ts:113:      cancelAnimationFrame(raf);
frontend/src/swipeBack.ts:114:      detach?.();
frontend/src/swipeBack.ts:115:    };
frontend/src/swipeBack.ts:116:    // eslint-disable-next-line react-hooks/exhaustive-deps
frontend/src/swipeBack.ts:117:  }, [enabled]);
frontend/src/swipeBack.ts:118:}
frontend/src/main.tsx:1:import React, { lazy, Suspense, useEffect } from 'react';
frontend/src/main.tsx:2:import ReactDOM from 'react-dom/client';
frontend/src/main.tsx:3:import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
frontend/src/main.tsx:4:import './index.css';
frontend/src/main.tsx:5:import App from './App';
frontend/src/main.tsx:6:import Home from './screens/Home';
frontend/src/main.tsx:7:const Favorites = lazy(() => import('./screens/Favorites'));
frontend/src/main.tsx:8:const Alerts = lazy(() => import('./screens/Alerts'));
frontend/src/main.tsx:9:const MyRatings = lazy(() => import('./screens/MyRatings'));
frontend/src/main.tsx:10:const Business = lazy(() => import('./screens/Business'));
frontend/src/main.tsx:11:import { initTelegram, haptic, initData } from './telegram';
frontend/src/main.tsx:12:import { api } from './api';
frontend/src/main.tsx:13:import { initAnalytics } from './analytics';
frontend/src/main.tsx:14:
frontend/src/main.tsx:15:reportClient('module-start', 'main.tsx loaded');
frontend/src/main.tsx:16:initTelegram();
frontend/src/main.tsx:17:initAnalytics();
frontend/src/main.tsx:18:
frontend/src/main.tsx:19:function reportClient(kind: string, detail: unknown) {
frontend/src/main.tsx:20:  try {
frontend/src/main.tsx:21:    fetch('/api/health/client-error', {
frontend/src/main.tsx:22:      method: 'POST',
frontend/src/main.tsx:23:      headers: { 'Content-Type': 'application/json' },
frontend/src/main.tsx:24:      body: JSON.stringify({
frontend/src/main.tsx:25:        kind,
frontend/src/main.tsx:26:        detail: String(detail).slice(0, 500),
frontend/src/main.tsx:27:        url: location.href,
frontend/src/main.tsx:28:        hasInitData: !!(window.Telegram?.WebApp?.initData || initData),
frontend/src/main.tsx:29:      }),
frontend/src/main.tsx:30:      keepalive: true,
frontend/src/main.tsx:31:    }).catch(() => {});
frontend/src/main.tsx:32:  } catch {
frontend/src/main.tsx:33:    /* ignore */
frontend/src/main.tsx:34:  }
frontend/src/main.tsx:35:}
frontend/src/main.tsx:36:
frontend/src/main.tsx:37:class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
frontend/src/main.tsx:38:  state = { failed: false };
frontend/src/main.tsx:39:
frontend/src/main.tsx:40:  static getDerivedStateFromError() {
frontend/src/main.tsx:41:    return { failed: true };
frontend/src/main.tsx:42:  }
frontend/src/main.tsx:43:
frontend/src/main.tsx:44:  componentDidCatch(error: unknown) {
frontend/src/main.tsx:45:    reportClient('react-crash', (error as Error)?.stack || (error as Error)?.message || error);
frontend/src/main.tsx:46:  }
frontend/src/main.tsx:47:
frontend/src/main.tsx:48:  render() {
frontend/src/main.tsx:49:    if (!this.state.failed) return this.props.children;
frontend/src/main.tsx:50:    return (
frontend/src/main.tsx:51:      <div className="boot-fallback">
frontend/src/main.tsx:52:        <div className="boot-fallback-box">
frontend/src/main.tsx:53:          <b>Не удалось загрузить приложение</b>
frontend/src/main.tsx:54:          <button onClick={() => window.location.reload()}>Обновить</button>
frontend/src/main.tsx:55:        </div>
frontend/src/main.tsx:56:      </div>
frontend/src/main.tsx:57:    );
frontend/src/main.tsx:58:  }
frontend/src/main.tsx:59:}
frontend/src/main.tsx:60:
frontend/src/main.tsx:61:// TEMP: report client crashes to the server so we can see mobile-only errors that
frontend/src/main.tsx:62:// happen before any API call fires. Fire-and-forget, never throws.
frontend/src/main.tsx:63:{
frontend/src/main.tsx:64:  window.addEventListener('error', (e) => reportClient('error', e.message + ' @ ' + (e.filename || '') + ':' + e.lineno));
frontend/src/main.tsx:65:  window.addEventListener('unhandledrejection', (e) => reportClient('promise', (e.reason && (e.reason.stack || e.reason.message)) || e.reason));
frontend/src/main.tsx:66:}
frontend/src/main.tsx:67:
frontend/src/main.tsx:68:// block page pinch-zoom & double-tap zoom everywhere (Leaflet keeps its own
frontend/src/main.tsx:69:// zoom — it uses touch events, not these native gesture events).
frontend/src/main.tsx:70:for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
frontend/src/main.tsx:71:  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
frontend/src/main.tsx:72:}
frontend/src/main.tsx:73:let lastTouch = 0;
frontend/src/main.tsx:74:document.addEventListener(
frontend/src/main.tsx:75:  'touchend',
frontend/src/main.tsx:76:  (e) => {
frontend/src/main.tsx:77:    const now = Date.now();
frontend/src/main.tsx:78:    // kill double-tap zoom on empty areas ONLY — never on interactive elements, or we
frontend/src/main.tsx:79:    // cancel their tap (this was swallowing the `tel:` call link + needing double taps).
frontend/src/main.tsx:80:    const interactive = (e.target as HTMLElement)?.closest?.(
frontend/src/main.tsx:81:      '.leaflet-container, a, button, input, textarea, select, label, [role="button"], .chip, .cat-tile, .rate-star, .heart',
frontend/src/main.tsx:82:    );
frontend/src/main.tsx:83:    if (now - lastTouch < 300 && !interactive) {
frontend/src/main.tsx:84:      e.preventDefault();
frontend/src/main.tsx:85:    }
frontend/src/main.tsx:86:    lastTouch = now;
frontend/src/main.tsx:87:  },
frontend/src/main.tsx:88:  { passive: false },
frontend/src/main.tsx:89:);
frontend/src/main.tsx:90:
frontend/src/main.tsx:91:// app-open session tracking (start on open, end on close) for admin analytics
frontend/src/main.tsx:92:let sessionId: string | null = null;
frontend/src/main.tsx:93:api
frontend/src/main.tsx:94:  .sessionStart()
frontend/src/main.tsx:95:  .then((s) => {
frontend/src/main.tsx:96:    sessionId = s.id;
frontend/src/main.tsx:97:  })
frontend/src/main.tsx:98:  .catch(() => {});
frontend/src/main.tsx:99:const endSession = () => {
frontend/src/main.tsx:100:  if (!sessionId) return;
frontend/src/main.tsx:101:  // keepalive so the request survives the page being closed
frontend/src/main.tsx:102:  fetch('/api/session/end', {
frontend/src/main.tsx:103:    method: 'POST',
frontend/src/main.tsx:104:    headers: { Authorization: `tma ${initData}`, 'Content-Type': 'application/json' },
frontend/src/main.tsx:105:    body: JSON.stringify({ id: sessionId }),
frontend/src/main.tsx:106:    keepalive: true,
frontend/src/main.tsx:107:  }).catch(() => {});
frontend/src/main.tsx:108:  sessionId = null;
frontend/src/main.tsx:109:};
frontend/src/main.tsx:110:window.addEventListener('pagehide', endSession);
frontend/src/main.tsx:111:document.addEventListener('visibilitychange', () => {
frontend/src/main.tsx:112:  if (document.visibilityState === 'hidden') endSession();
frontend/src/main.tsx:113:});
frontend/src/main.tsx:114:
frontend/src/main.tsx:115:// light haptic feedback on any interactive tap
frontend/src/main.tsx:116:document.addEventListener(
frontend/src/main.tsx:117:  'click',
frontend/src/main.tsx:118:  (e) => {
frontend/src/main.tsx:119:    const t = e.target as HTMLElement | null;
frontend/src/main.tsx:120:    if (t?.closest?.('button, a, .chip, .cat-tile, .vcard, .post, .mini, .rate-star, .heart')) {
frontend/src/main.tsx:121:      haptic('light');
frontend/src/main.tsx:122:    }
frontend/src/main.tsx:123:  },
frontend/src/main.tsx:124:  { capture: true },
frontend/src/main.tsx:125:);
frontend/src/main.tsx:126:
frontend/src/main.tsx:127:const appChildren = [
frontend/src/main.tsx:128:  { index: true, element: <Home /> },
frontend/src/main.tsx:129:  { path: 'favorites', element: <Suspense fallback={null}><Favorites /></Suspense> },
frontend/src/main.tsx:130:  { path: 'alerts', element: <Suspense fallback={null}><Alerts /></Suspense> },
frontend/src/main.tsx:131:  { path: 'me', element: <Suspense fallback={null}><MyRatings /></Suspense> },
frontend/src/main.tsx:132:  { path: 'business', element: <Suspense fallback={null}><Business /></Suspense> },
frontend/src/main.tsx:133:];
frontend/src/main.tsx:134:
frontend/src/main.tsx:135:const router = createBrowserRouter([
frontend/src/main.tsx:136:  { path: '/', element: <App />, children: appChildren },
frontend/src/main.tsx:137:  // ANY boot path, present and future — hardcoding versions here is what kept
frontend/src/main.tsx:138:  // every new release 404ing inside Telegram
frontend/src/main.tsx:139:  { path: '/tg-boot-:v', element: <App />, children: appChildren },
frontend/src/main.tsx:140:  { path: '*', element: <Navigate to="/" replace /> },
frontend/src/main.tsx:141:]);
frontend/src/main.tsx:142:
frontend/src/main.tsx:143:function BootedRouter() {
frontend/src/main.tsx:144:  useEffect(() => {
frontend/src/main.tsx:145:    (window as any).__APP_BOOTED = true;
frontend/src/main.tsx:146:    reportClient('app-mounted', 'react mounted');
frontend/src/main.tsx:147:  }, []);
frontend/src/main.tsx:148:  return <RouterProvider router={router} />;
frontend/src/main.tsx:149:}
frontend/src/main.tsx:150:
frontend/src/main.tsx:151:ReactDOM.createRoot(document.getElementById('root')!).render(
frontend/src/main.tsx:152:  <React.StrictMode>
frontend/src/main.tsx:153:    <AppErrorBoundary>
frontend/src/main.tsx:154:      <BootedRouter />
frontend/src/main.tsx:155:    </AppErrorBoundary>
frontend/src/main.tsx:156:  </React.StrictMode>,
frontend/src/main.tsx:157:);
frontend/src/swipeDismiss.ts:1:import { useEffect, type RefObject } from 'react';
frontend/src/swipeDismiss.ts:3:// Swipe-to-dismiss for every sheet/card (Instagram/iOS-sheet pattern):
frontend/src/swipeDismiss.ts:4://  • drag starts only when the sheet is scrolled to the very top (otherwise it's
frontend/src/swipeDismiss.ts:5://    a normal content scroll) and the finger moves DOWN;
frontend/src/swipeDismiss.ts:6://  • the sheet follows the finger 1:1, the backdrop fades proportionally;
frontend/src/swipeDismiss.ts:7://  • release past 120px OR a fast downward fling (>0.5 px/ms) dismisses with
frontend/src/swipeDismiss.ts:8://    momentum; anything less springs back (slight iOS-style overshoot).
frontend/src/swipeDismiss.ts:9:// Native listeners with passive:false — React's synthetic touchmove cannot
frontend/src/swipeDismiss.ts:10:// preventDefault, and the content scroll must be frozen while dragging.
frontend/src/swipeDismiss.ts:11:export function useSwipeDismiss(
frontend/src/swipeDismiss.ts:12:  sheetRef: RefObject<HTMLElement | null>,
frontend/src/swipeDismiss.ts:13:  onDismiss: () => void,
frontend/src/swipeDismiss.ts:14:  opts: { fadeBackdrop?: boolean; deps?: unknown[]; canDismiss?: () => boolean } = {},
frontend/src/swipeDismiss.ts:15:) {
frontend/src/swipeDismiss.ts:16:  const { fadeBackdrop = true, deps = [], canDismiss } = opts;
frontend/src/swipeDismiss.ts:17:  useEffect(() => {
frontend/src/swipeDismiss.ts:18:    // the sheet may not exist on mount (cards render a loader until data arrives) —
frontend/src/swipeDismiss.ts:19:    // poll briefly until it appears, then attach. Pass `deps` to re-run on data load.
frontend/src/swipeDismiss.ts:20:    let raf = 0;
frontend/src/swipeDismiss.ts:21:    let cancelled = false;
frontend/src/swipeDismiss.ts:22:    let detach: (() => void) | null = null;
frontend/src/swipeDismiss.ts:23:    const tryAttach = () => {
frontend/src/swipeDismiss.ts:24:      if (cancelled) return;
frontend/src/swipeDismiss.ts:25:      const el = sheetRef.current;
frontend/src/swipeDismiss.ts:26:      if (!el) {
frontend/src/swipeDismiss.ts:27:        raf = requestAnimationFrame(tryAttach);
frontend/src/swipeDismiss.ts:28:        return;
frontend/src/swipeDismiss.ts:29:      }
frontend/src/swipeDismiss.ts:30:      detach = attach(el);
frontend/src/swipeDismiss.ts:31:    };
frontend/src/swipeDismiss.ts:32:    const attach = (el: HTMLElement): (() => void) => {
frontend/src/swipeDismiss.ts:33:    const backdrop = fadeBackdrop ? el.parentElement : null;
frontend/src/swipeDismiss.ts:34:    let startY = 0;
frontend/src/swipeDismiss.ts:35:    let lastY = 0;
frontend/src/swipeDismiss.ts:36:    let lastT = 0;
frontend/src/swipeDismiss.ts:37:    let velocity = 0;
frontend/src/swipeDismiss.ts:38:    let dragging = false;
frontend/src/swipeDismiss.ts:39:    let armed = false;
frontend/src/swipeDismiss.ts:40:    let closed = false;
frontend/src/swipeDismiss.ts:42:    const start = (e: TouchEvent) => {
frontend/src/swipeDismiss.ts:43:      startY = lastY = e.touches[0].clientY;
frontend/src/swipeDismiss.ts:44:      lastT = performance.now();
frontend/src/swipeDismiss.ts:45:      velocity = 0;
frontend/src/swipeDismiss.ts:46:      armed = el.scrollTop <= 0; // only from the very top
frontend/src/swipeDismiss.ts:47:      dragging = false;
frontend/src/swipeDismiss.ts:48:    };
frontend/src/swipeDismiss.ts:49:    const move = (e: TouchEvent) => {
frontend/src/swipeDismiss.ts:50:      if (closed) return;
frontend/src/swipeDismiss.ts:51:      const y = e.touches[0].clientY;
frontend/src/swipeDismiss.ts:52:      const dy = y - startY;
frontend/src/swipeDismiss.ts:53:      const now = performance.now();
frontend/src/swipeDismiss.ts:54:      velocity = (y - lastY) / Math.max(1, now - lastT);
frontend/src/swipeDismiss.ts:55:      lastY = y;
frontend/src/swipeDismiss.ts:56:      lastT = now;
frontend/src/swipeDismiss.ts:57:      if (!dragging) {
frontend/src/swipeDismiss.ts:58:        // decide on the FIRST move: on iOS the event stops being cancelable the
frontend/src/swipeDismiss.ts:59:        // moment native scroll wins, so an 8px threshold was already too late
frontend/src/swipeDismiss.ts:60:        if (armed && dy > 2 && el.scrollTop <= 0 && e.cancelable) dragging = true;
frontend/src/swipeDismiss.ts:61:        else if (dy < -2) { armed = false; return; } // scrolling content down → not ours
frontend/src/swipeDismiss.ts:62:        else if (!dragging) return;
frontend/src/swipeDismiss.ts:63:      }
frontend/src/swipeDismiss.ts:64:      if (e.cancelable) e.preventDefault(); // sheet follows the finger, not the scroll
frontend/src/swipeDismiss.ts:65:      const t = Math.max(0, dy);
frontend/src/swipeDismiss.ts:66:      el.style.transition = 'none';
frontend/src/swipeDismiss.ts:67:      el.style.transform = `translateY(${t}px)`;
frontend/src/swipeDismiss.ts:68:      if (backdrop) backdrop.style.background = `rgba(0,0,0,${Math.max(0.15, 0.5 - t / 600)})`;
frontend/src/swipeDismiss.ts:69:    };
frontend/src/swipeDismiss.ts:70:    const end = () => {
frontend/src/swipeDismiss.ts:71:      if (!dragging || closed) return;
frontend/src/swipeDismiss.ts:72:      dragging = false;
frontend/src/swipeDismiss.ts:73:      const dy = lastY - startY;
frontend/src/swipeDismiss.ts:74:      // iOS/Instagram-grade thresholds: a THIRD of the sheet height, or a real
frontend/src/swipeDismiss.ts:75:      // fling (~1000 px/s, like UIKit's velocity cutoff) that has already moved
frontend/src/swipeDismiss.ts:76:      // the sheet at least 60px — a casual short pull springs back.
frontend/src/swipeDismiss.ts:77:      const distanceThreshold = Math.max(200, el.clientHeight * 0.33);
frontend/src/swipeDismiss.ts:78:      if (dy > distanceThreshold || (velocity > 1.0 && dy > 60)) {
frontend/src/swipeDismiss.ts:79:        // Forms may veto dismissal (busy save) or ask for confirmation before
frontend/src/swipeDismiss.ts:80:        // the sheet animates away. A rejected dismissal must visibly spring back.
frontend/src/swipeDismiss.ts:81:        if (canDismiss && !canDismiss()) {
frontend/src/swipeDismiss.ts:82:          el.style.transition = 'transform 0.45s cubic-bezier(0.22, 1.1, 0.36, 1)';
frontend/src/swipeDismiss.ts:83:          el.style.transform = '';
frontend/src/swipeDismiss.ts:84:          if (backdrop) {
frontend/src/swipeDismiss.ts:85:            backdrop.style.transition = 'background 0.3s ease';
frontend/src/swipeDismiss.ts:86:            backdrop.style.background = '';
frontend/src/swipeDismiss.ts:87:          }
frontend/src/swipeDismiss.ts:88:          return;
frontend/src/swipeDismiss.ts:89:        }
frontend/src/swipeDismiss.ts:90:        closed = true;
frontend/src/swipeDismiss.ts:91:        // soft exit: longer ease-out glide + the backdrop dissolves WITH the sheet
frontend/src/swipeDismiss.ts:92:        el.style.transition = 'transform 0.34s cubic-bezier(0.22, 0.61, 0.36, 1)';
frontend/src/swipeDismiss.ts:93:        el.style.transform = 'translateY(105%)';
frontend/src/swipeDismiss.ts:94:        if (backdrop) {
frontend/src/swipeDismiss.ts:95:          backdrop.style.transition = 'background 0.3s ease';
frontend/src/swipeDismiss.ts:96:          backdrop.style.background = 'rgba(0,0,0,0)';
frontend/src/swipeDismiss.ts:97:        }
frontend/src/swipeDismiss.ts:98:        setTimeout(onDismiss, 320);
frontend/src/swipeDismiss.ts:99:      } else {
frontend/src/swipeDismiss.ts:100:        // gentle spring back — slow settle, barely-there overshoot
frontend/src/swipeDismiss.ts:101:        el.style.transition = 'transform 0.45s cubic-bezier(0.22, 1.1, 0.36, 1)';
frontend/src/swipeDismiss.ts:102:        el.style.transform = '';
frontend/src/swipeDismiss.ts:103:        if (backdrop) {
frontend/src/swipeDismiss.ts:104:          backdrop.style.transition = 'background 0.3s ease';
frontend/src/swipeDismiss.ts:105:          backdrop.style.background = '';
frontend/src/swipeDismiss.ts:106:        }
frontend/src/swipeDismiss.ts:107:      }
frontend/src/swipeDismiss.ts:108:    };
frontend/src/swipeDismiss.ts:109:    el.addEventListener('touchstart', start, { passive: true });
frontend/src/swipeDismiss.ts:110:    el.addEventListener('touchmove', move, { passive: false });
frontend/src/swipeDismiss.ts:111:    el.addEventListener('touchend', end, { passive: true });
frontend/src/swipeDismiss.ts:112:    el.addEventListener('touchcancel', end, { passive: true });
frontend/src/swipeDismiss.ts:113:    return () => {
frontend/src/swipeDismiss.ts:114:      el.removeEventListener('touchstart', start);
frontend/src/swipeDismiss.ts:115:      el.removeEventListener('touchmove', move);
frontend/src/swipeDismiss.ts:116:      el.removeEventListener('touchend', end);
frontend/src/swipeDismiss.ts:117:      el.removeEventListener('touchcancel', end);
frontend/src/swipeDismiss.ts:118:    };
frontend/src/swipeDismiss.ts:119:    };
frontend/src/swipeDismiss.ts:120:    tryAttach();
frontend/src/swipeDismiss.ts:121:    return () => {
frontend/src/swipeDismiss.ts:122:      cancelled = true;
frontend/src/swipeDismiss.ts:123:      cancelAnimationFrame(raf);
frontend/src/swipeDismiss.ts:124:      detach?.();
frontend/src/swipeDismiss.ts:125:    };
frontend/src/swipeDismiss.ts:126:    // eslint-disable-next-line react-hooks/exhaustive-deps
frontend/src/swipeDismiss.ts:127:  }, deps);
frontend/src/swipeDismiss.ts:128:}
frontend/src/telegram.ts:1:export const tg = window.Telegram?.WebApp;
frontend/src/telegram.ts:3:// Telegram may inject WebApp after this module is evaluated on a cold mobile
frontend/src/telegram.ts:4:// launch. Runtime actions must never rely on the module-scope snapshot.
frontend/src/telegram.ts:5:export function telegramWebApp() {
frontend/src/telegram.ts:6:  return window.Telegram?.WebApp ?? tg;
frontend/src/telegram.ts:7:}
frontend/src/telegram.ts:9:// Raw signed string we send to the backend for auth.
frontend/src/telegram.ts:10:export const initData = tg?.initData ?? '';
frontend/src/telegram.ts:12:export function initTelegram() {
frontend/src/telegram.ts:13:  try {
frontend/src/telegram.ts:14:    const webApp = telegramWebApp();
frontend/src/telegram.ts:15:    if (webApp?.initData) sessionStorage.setItem('tg:initData', webApp.initData);
frontend/src/telegram.ts:16:    webApp?.ready();
frontend/src/telegram.ts:17:    webApp?.expand();
frontend/src/telegram.ts:18:    // stop the app from collapsing when the user pulls a list down (Bot API 7.7+)
frontend/src/telegram.ts:19:    (webApp as any)?.disableVerticalSwipes?.();
frontend/src/telegram.ts:20:    // global tactile feedback: a light tap on every button/interactive element press
frontend/src/telegram.ts:21:    document.addEventListener(
frontend/src/telegram.ts:22:      'pointerdown',
frontend/src/telegram.ts:23:      (e) => {
frontend/src/telegram.ts:24:        const el = e.target as HTMLElement;
frontend/src/telegram.ts:25:        if (el?.closest?.('button, a, .chip, .cat-tile, [role="button"]')) haptic('light');
frontend/src/telegram.ts:26:      },
frontend/src/telegram.ts:27:      { passive: true, capture: true },
frontend/src/telegram.ts:28:    );
frontend/src/telegram.ts:29:  } catch {
frontend/src/telegram.ts:30:    // running outside Telegram (e.g. plain browser) — ignore
frontend/src/telegram.ts:31:  }
frontend/src/telegram.ts:32:}
frontend/src/telegram.ts:34:export const tgUser = tg?.initDataUnsafe?.user;
frontend/src/telegram.ts:36:const appOrigin = window.location.origin;
frontend/src/telegram.ts:38:// light haptic tap feedback (no-op outside Telegram)
frontend/src/telegram.ts:39:export function haptic(style: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' = 'light') {
frontend/src/telegram.ts:40:  try {
frontend/src/telegram.ts:41:    telegramWebApp()?.HapticFeedback?.impactOccurred(style);
frontend/src/telegram.ts:42:  } catch {
frontend/src/telegram.ts:43:    /* ignore */
frontend/src/telegram.ts:44:  }
frontend/src/telegram.ts:45:}
frontend/src/telegram.ts:47:// Opens a URL outside the Mini App (e.g. Yandex Maps) — uses Telegram's
frontend/src/telegram.ts:48:// native opener when available, falls back to a normal new tab.
frontend/src/telegram.ts:49:export function openExternal(url: string) {
frontend/src/telegram.ts:50:  const webApp = telegramWebApp();
frontend/src/telegram.ts:51:  if (webApp?.openLink) webApp.openLink(url);
frontend/src/telegram.ts:52:  else window.open(url, '_blank');
frontend/src/telegram.ts:53:}
frontend/src/telegram.ts:55:// Deep link that reopens the Mini App on a specific listing (needs the bot's
frontend/src/telegram.ts:56:// Main Mini App enabled in BotFather so ?startapp= opens the app, not the chat).
frontend/src/telegram.ts:57:export function appDeepLink(startParam: string): string {
frontend/src/telegram.ts:58:  return `https://t.me/togomoscow_bot?startapp=${startParam}`;
frontend/src/telegram.ts:59:}
frontend/src/telegram.ts:61:// Share a dish/drink review to the user's Telegram Story with a tappable link
frontend/src/telegram.ts:62:// back into the app (Bot API 7.8+). Falls back to the share sheet on old clients.
frontend/src/telegram.ts:63:export function shareToStory(mediaUrl: string, text: string, startParam: string): boolean {
frontend/src/telegram.ts:64:  const w = telegramWebApp() as any;
frontend/src/telegram.ts:65:  const link = appDeepLink(startParam);
frontend/src/telegram.ts:66:  const absoluteMedia = mediaUrl.startsWith('/') ? `${appOrigin}${mediaUrl}` : mediaUrl;
frontend/src/telegram.ts:67:  try {
frontend/src/telegram.ts:68:    if (w?.shareToStory) {
frontend/src/telegram.ts:69:      w.shareToStory(absoluteMedia, {
frontend/src/telegram.ts:70:        text,
frontend/src/telegram.ts:71:        // short link name → a small link sticker (placed top-right by default);
frontend/src/telegram.ts:72:        // its exact position is then user-draggable in Telegram's story editor.
frontend/src/telegram.ts:73:        widget_link: { url: link, name: 'togomoscow' },
frontend/src/telegram.ts:74:      });
frontend/src/telegram.ts:75:      return true;
frontend/src/telegram.ts:76:    }
frontend/src/telegram.ts:77:  } catch {
frontend/src/telegram.ts:78:    /* fall through to the share sheet */
frontend/src/telegram.ts:79:  }
frontend/src/telegram.ts:80:  openExternal(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
frontend/src/telegram.ts:81:  return true;
frontend/src/telegram.ts:82:}
frontend/src/telegram.ts:84:// Send a prepared rich message (photo + caption + button) to a friend's chat.
frontend/src/telegram.ts:85:// `id` comes from the backend's savePreparedInlineMessage. Returns true if handled.
frontend/src/telegram.ts:86:export function shareMessage(id: string): boolean {
frontend/src/telegram.ts:87:  const w = telegramWebApp() as any;
frontend/src/telegram.ts:88:  try {
frontend/src/telegram.ts:89:    if (w?.shareMessage) { w.shareMessage(id); return true; }
frontend/src/telegram.ts:90:  } catch { /* unsupported client */ }
frontend/src/telegram.ts:91:  return false;
frontend/src/telegram.ts:92:}
frontend/src/telegram.ts:94:// Send a check-in to a friend in Telegram (opens the "share to chat" picker).
frontend/src/telegram.ts:95:// If a review photo is given, it's shared as the link preview (so the friend sees
frontend/src/telegram.ts:96:// the photo); the user's own comment becomes the message text.
frontend/src/telegram.ts:97:export function shareToChat(text: string, startParam: string, photoUrl?: string) {
frontend/src/telegram.ts:98:  const link = appDeepLink(startParam);
frontend/src/telegram.ts:99:  // a relative /api/files/… path won't load for the friend → make it absolute
frontend/src/telegram.ts:100:  const absPhoto = photoUrl && photoUrl.startsWith('/') ? `${appOrigin}${photoUrl}` : photoUrl;
frontend/src/telegram.ts:101:  const shareUrl = absPhoto || link;
frontend/src/telegram.ts:102:  const shareText = photoUrl ? `${text}\n${link}` : text;
frontend/src/telegram.ts:103:  const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
frontend/src/telegram.ts:104:  const w = telegramWebApp() as any;
frontend/src/telegram.ts:105:  try {
frontend/src/telegram.ts:106:    if (w?.openTelegramLink) { w.openTelegramLink(url); return; }
frontend/src/telegram.ts:107:  } catch { /* fall through */ }
frontend/src/telegram.ts:108:  openExternal(url);
frontend/src/telegram.ts:109:}
frontend/src/telegram.ts:111:// Normalizes a phone to a tel: href. A REAL <a href="tel:"> tap is the only
frontend/src/telegram.ts:112:// thing that reliably opens the dialer in webviews (desktop + Android). iOS
frontend/src/telegram.ts:113:// Telegram still blocks it → callers show a copy-number fallback.
frontend/src/telegram.ts:114:export function telHref(raw: string): string {
frontend/src/telegram.ts:115:  return `tel:${(raw || '').replace(/[^\d+]/g, '')}`;
frontend/src/telegram.ts:116:}
frontend/src/telegram.ts:118:// Place a call. The Mini App WEBVIEW blocks the tel: scheme, but Telegram's IN-APP
frontend/src/telegram.ts:119:// BROWSER allows it — so we open a branded redirect page (call.html) via tg.openLink,
frontend/src/telegram.ts:120:// which fires tel: from that allowed context and shows the venue + a back-to-app link.
frontend/src/telegram.ts:121:// Outside Telegram → native tel:.
frontend/src/telegram.ts:122:export function callPhone(raw: string, venueName?: string, backParam?: string) {
frontend/src/telegram.ts:123:  const num = (raw || '').replace(/[^\d+]/g, '');
frontend/src/telegram.ts:124:  if (!num) return;
frontend/src/telegram.ts:125:  const w = telegramWebApp() as any;
frontend/src/telegram.ts:126:  try {
frontend/src/telegram.ts:127:    if (w?.openLink) {
frontend/src/telegram.ts:128:      const p = new URLSearchParams({ n: num });
frontend/src/telegram.ts:129:      if (venueName) p.set('name', venueName);
frontend/src/telegram.ts:130:      if (backParam) p.set('back', backParam); // e.g. "l_<listingId>" → reopen that card
frontend/src/telegram.ts:131:      w.openLink(`${appOrigin}/call.html?${p.toString()}`);
frontend/src/telegram.ts:132:      return;
frontend/src/telegram.ts:133:    }
frontend/src/telegram.ts:134:  } catch { /* fall through to native */ }
frontend/src/telegram.ts:135:  window.location.href = `tel:${num}`;
frontend/src/telegram.ts:136:}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "." frontend/src/main.tsx frontend/src/swipeBack.ts frontend/src/pullToRefresh.ts' in D:\Приложения\Yelp
 succeeded in 266ms:
frontend/src/pullToRefresh.ts:1:import { useEffect, useRef, useState } from 'react';
frontend/src/pullToRefresh.ts:2:import { haptic } from './telegram';
frontend/src/pullToRefresh.ts:4:// iOS-style pull-to-refresh: when the page is scrolled to the very top and the
frontend/src/pullToRefresh.ts:5:// user drags DOWN past a threshold, reload. Rubber-band follow + a spinner that
frontend/src/pullToRefresh.ts:6:// grows with the pull; releasing past the threshold triggers onRefresh (or a
frontend/src/pullToRefresh.ts:7:// full page reload by default). Ignores horizontal swipes (that's swipe-back).
frontend/src/pullToRefresh.ts:8:export function usePullToRefresh(onRefresh?: () => void | Promise<void>) {
frontend/src/pullToRefresh.ts:9:  const [pull, setPull] = useState(0); // px, damped
frontend/src/pullToRefresh.ts:10:  const [refreshing, setRefreshing] = useState(false);
frontend/src/pullToRefresh.ts:11:  const startY = useRef(0);
frontend/src/pullToRefresh.ts:12:  const startX = useRef(0);
frontend/src/pullToRefresh.ts:13:  const active = useRef(false);
frontend/src/pullToRefresh.ts:14:  const THRESHOLD = 72;
frontend/src/pullToRefresh.ts:16:  useEffect(() => {
frontend/src/pullToRefresh.ts:17:    const scroller = document.scrollingElement || document.documentElement;
frontend/src/pullToRefresh.ts:18:    const onStart = (e: TouchEvent) => {
frontend/src/pullToRefresh.ts:19:      if (refreshing) return;
frontend/src/pullToRefresh.ts:20:      // only arm at the very top and when nothing is scrolled under the finger
frontend/src/pullToRefresh.ts:21:      if ((scroller.scrollTop || 0) > 0) { active.current = false; return; }
frontend/src/pullToRefresh.ts:22:      startY.current = e.touches[0].clientY;
frontend/src/pullToRefresh.ts:23:      startX.current = e.touches[0].clientX;
frontend/src/pullToRefresh.ts:24:      active.current = true;
frontend/src/pullToRefresh.ts:25:    };
frontend/src/pullToRefresh.ts:26:    const onMove = (e: TouchEvent) => {
frontend/src/pullToRefresh.ts:27:      if (!active.current || refreshing) return;
frontend/src/pullToRefresh.ts:28:      const dy = e.touches[0].clientY - startY.current;
frontend/src/pullToRefresh.ts:29:      const dx = e.touches[0].clientX - startX.current;
frontend/src/pullToRefresh.ts:30:      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { active.current = false; setPull(0); return; }
frontend/src/pullToRefresh.ts:31:      if ((scroller.scrollTop || 0) > 0) { active.current = false; setPull(0); return; }
frontend/src/pullToRefresh.ts:32:      // rubber-band: the further you pull, the more resistance
frontend/src/pullToRefresh.ts:33:      const damped = Math.min(140, dy * 0.5);
frontend/src/pullToRefresh.ts:34:      setPull(damped);
frontend/src/pullToRefresh.ts:35:    };
frontend/src/pullToRefresh.ts:36:    const onEnd = async () => {
frontend/src/pullToRefresh.ts:37:      if (!active.current) return;
frontend/src/pullToRefresh.ts:38:      active.current = false;
frontend/src/pullToRefresh.ts:39:      if (pull >= THRESHOLD && !refreshing) {
frontend/src/pullToRefresh.ts:40:        haptic('medium');
frontend/src/pullToRefresh.ts:41:        setRefreshing(true);
frontend/src/pullToRefresh.ts:42:        setPull(THRESHOLD);
frontend/src/pullToRefresh.ts:43:        try {
frontend/src/pullToRefresh.ts:44:          if (onRefresh) await onRefresh();
frontend/src/pullToRefresh.ts:45:          else window.location.reload();
frontend/src/pullToRefresh.ts:46:        } finally {
frontend/src/pullToRefresh.ts:47:          // if onRefresh resolved without a reload, retract the spinner
frontend/src/pullToRefresh.ts:48:          setTimeout(() => { setRefreshing(false); setPull(0); }, 400);
frontend/src/pullToRefresh.ts:49:        }
frontend/src/pullToRefresh.ts:50:      } else {
frontend/src/pullToRefresh.ts:51:        setPull(0);
frontend/src/pullToRefresh.ts:52:      }
frontend/src/pullToRefresh.ts:53:    };
frontend/src/pullToRefresh.ts:54:    window.addEventListener('touchstart', onStart, { passive: true });
frontend/src/pullToRefresh.ts:55:    window.addEventListener('touchmove', onMove, { passive: true });
frontend/src/pullToRefresh.ts:56:    window.addEventListener('touchend', onEnd, { passive: true });
frontend/src/pullToRefresh.ts:57:    window.addEventListener('touchcancel', onEnd, { passive: true });
frontend/src/pullToRefresh.ts:58:    return () => {
frontend/src/pullToRefresh.ts:59:      window.removeEventListener('touchstart', onStart);
frontend/src/pullToRefresh.ts:60:      window.removeEventListener('touchmove', onMove);
frontend/src/pullToRefresh.ts:61:      window.removeEventListener('touchend', onEnd);
frontend/src/pullToRefresh.ts:62:      window.removeEventListener('touchcancel', onEnd);
frontend/src/pullToRefresh.ts:63:    };
frontend/src/pullToRefresh.ts:64:  }, [pull, refreshing, onRefresh]);
frontend/src/pullToRefresh.ts:66:  return { pull, refreshing, threshold: THRESHOLD };
frontend/src/pullToRefresh.ts:67:}
frontend/src/swipeBack.ts:1:import { useEffect, type RefObject } from 'react';
frontend/src/swipeBack.ts:3:// Swipe-back for FULL-SCREEN pushed pages (profile, category map): a rightward
frontend/src/swipeBack.ts:4:// drag from ANYWHERE (not just the edge) — the page sticks to the finger from the
frontend/src/swipeBack.ts:5:// very first pixels; release past a third of the width (or a fling) → back,
frontend/src/swipeBack.ts:6:// else it springs home. Touches that start inside horizontal scrollers
frontend/src/swipeBack.ts:7:// (carousels, chip rows) are left alone. Sheets/cards keep their swipe-DOWN.
frontend/src/swipeBack.ts:8:export function useSwipeBack(
frontend/src/swipeBack.ts:9:  pageRef: RefObject<HTMLElement | null>,
frontend/src/swipeBack.ts:10:  onBack: () => void,
frontend/src/swipeBack.ts:11:  enabled = true,
frontend/src/swipeBack.ts:12:) {
frontend/src/swipeBack.ts:13:  useEffect(() => {
frontend/src/swipeBack.ts:14:    if (!enabled) return;
frontend/src/swipeBack.ts:15:    let raf = 0;
frontend/src/swipeBack.ts:16:    let cancelled = false;
frontend/src/swipeBack.ts:17:    let detach: (() => void) | null = null;
frontend/src/swipeBack.ts:18:    const tryAttach = () => {
frontend/src/swipeBack.ts:19:      if (cancelled) return;
frontend/src/swipeBack.ts:20:      const el = pageRef.current;
frontend/src/swipeBack.ts:21:      if (!el) {
frontend/src/swipeBack.ts:22:        raf = requestAnimationFrame(tryAttach);
frontend/src/swipeBack.ts:23:        return;
frontend/src/swipeBack.ts:24:      }
frontend/src/swipeBack.ts:25:      detach = attach(el);
frontend/src/swipeBack.ts:26:    };
frontend/src/swipeBack.ts:27:    const attach = (el: HTMLElement): (() => void) => {
frontend/src/swipeBack.ts:28:      let startX = 0;
frontend/src/swipeBack.ts:29:      let startY = 0;
frontend/src/swipeBack.ts:30:      let lastX = 0;
frontend/src/swipeBack.ts:31:      let lastT = 0;
frontend/src/swipeBack.ts:32:      let velocity = 0;
frontend/src/swipeBack.ts:33:      let dragging = false;
frontend/src/swipeBack.ts:34:      let armed = false;
frontend/src/swipeBack.ts:35:      let closed = false;
frontend/src/swipeBack.ts:37:      // horizontal scrollers keep their own gesture — a back-swipe must not
frontend/src/swipeBack.ts:38:      // hijack carousels / chip rows
frontend/src/swipeBack.ts:39:      const inHorizontalScroller = (t: EventTarget | null) =>
frontend/src/swipeBack.ts:40:        t instanceof Element &&
frontend/src/swipeBack.ts:41:        !!t.closest('.feed, .rc-carousel, .cat-bar, .opt-chips, .card-tags, .filterbar, .tabs, .leaflet-container');
frontend/src/swipeBack.ts:42:      const start = (e: TouchEvent) => {
frontend/src/swipeBack.ts:43:        startX = lastX = e.touches[0].clientX;
frontend/src/swipeBack.ts:44:        startY = e.touches[0].clientY;
frontend/src/swipeBack.ts:45:        lastT = performance.now();
frontend/src/swipeBack.ts:46:        velocity = 0;
frontend/src/swipeBack.ts:47:        armed = !inHorizontalScroller(e.target); // anywhere on the page, not just the edge
frontend/src/swipeBack.ts:48:        dragging = false;
frontend/src/swipeBack.ts:49:      };
frontend/src/swipeBack.ts:50:      const move = (e: TouchEvent) => {
frontend/src/swipeBack.ts:51:        if (closed || !armed) return;
frontend/src/swipeBack.ts:52:        const x = e.touches[0].clientX;
frontend/src/swipeBack.ts:53:        const dx = x - startX;
frontend/src/swipeBack.ts:54:        const dyAbs = Math.abs(e.touches[0].clientY - startY);
frontend/src/swipeBack.ts:55:        const now = performance.now();
frontend/src/swipeBack.ts:56:        velocity = (x - lastX) / Math.max(1, now - lastT);
frontend/src/swipeBack.ts:57:        lastX = x;
frontend/src/swipeBack.ts:58:        lastT = now;
frontend/src/swipeBack.ts:59:        if (!dragging) {
frontend/src/swipeBack.ts:60:          // react IMMEDIATELY: capture on the very first horizontal pixels
frontend/src/swipeBack.ts:61:          if (dx > 4 && dx > dyAbs * 1.2 && e.cancelable) dragging = true;
frontend/src/swipeBack.ts:62:          else if (dyAbs > 10) { armed = false; return; } // it's a vertical scroll
frontend/src/swipeBack.ts:63:          else return;
frontend/src/swipeBack.ts:64:        }
frontend/src/swipeBack.ts:65:        if (e.cancelable) e.preventDefault();
frontend/src/swipeBack.ts:66:        el.style.transition = 'none';
frontend/src/swipeBack.ts:67:        // 1:1 follow like iOS, with a soft rubber-band past the width so it never
frontend/src/swipeBack.ts:68:        // feels twitchy, and a depth shadow on the leading edge
frontend/src/swipeBack.ts:69:        const w = el.clientWidth || 1;
frontend/src/swipeBack.ts:70:        const t = dx <= w ? dx : w + (dx - w) * 0.35;
frontend/src/swipeBack.ts:71:        el.style.transform = `translateX(${Math.max(0, t)}px)`;
frontend/src/swipeBack.ts:72:        el.style.boxShadow = '-14px 0 32px rgba(0,0,0,0.16)';
frontend/src/swipeBack.ts:73:      };
frontend/src/swipeBack.ts:74:      const end = () => {
frontend/src/swipeBack.ts:75:        if (!dragging || closed) return;
frontend/src/swipeBack.ts:76:        dragging = false;
frontend/src/swipeBack.ts:77:        const dx = lastX - startX;
frontend/src/swipeBack.ts:78:        if (dx > el.clientWidth * 0.33 || (velocity > 0.6 && dx > 40)) {
frontend/src/swipeBack.ts:79:          closed = true;
frontend/src/swipeBack.ts:80:          // gentle iOS-like glide out (decelerating ease-out, slightly longer)
frontend/src/swipeBack.ts:81:          el.style.transition = 'transform 0.36s cubic-bezier(0.32, 0.72, 0, 1)';
frontend/src/swipeBack.ts:82:          el.style.transform = 'translateX(100%)';
frontend/src/swipeBack.ts:83:          setTimeout(() => {
frontend/src/swipeBack.ts:84:            onBack();
frontend/src/swipeBack.ts:85:            // pages that DON'T unmount (e.g. the home screen returning from a
frontend/src/swipeBack.ts:86:            // category view) must be snapped back to place, not left off-screen
frontend/src/swipeBack.ts:87:            el.style.transition = 'none';
frontend/src/swipeBack.ts:88:            el.style.transform = '';
frontend/src/swipeBack.ts:89:            el.style.boxShadow = '';
frontend/src/swipeBack.ts:90:            closed = false;
frontend/src/swipeBack.ts:91:          }, 330);
frontend/src/swipeBack.ts:92:        } else {
frontend/src/swipeBack.ts:93:          // soft settle back — no hard bounce
frontend/src/swipeBack.ts:94:          el.style.transition = 'transform 0.42s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.3s ease';
frontend/src/swipeBack.ts:95:          el.style.transform = '';
frontend/src/swipeBack.ts:96:          el.style.boxShadow = '';
frontend/src/swipeBack.ts:97:        }
frontend/src/swipeBack.ts:98:      };
frontend/src/swipeBack.ts:99:      el.addEventListener('touchstart', start, { passive: true });
frontend/src/swipeBack.ts:100:      el.addEventListener('touchmove', move, { passive: false });
frontend/src/swipeBack.ts:101:      el.addEventListener('touchend', end, { passive: true });
frontend/src/swipeBack.ts:102:      el.addEventListener('touchcancel', end, { passive: true });
frontend/src/swipeBack.ts:103:      return () => {
frontend/src/swipeBack.ts:104:        el.removeEventListener('touchstart', start);
frontend/src/swipeBack.ts:105:        el.removeEventListener('touchmove', move);
frontend/src/swipeBack.ts:106:        el.removeEventListener('touchend', end);
frontend/src/swipeBack.ts:107:        el.removeEventListener('touchcancel', end);
frontend/src/swipeBack.ts:108:      };
frontend/src/swipeBack.ts:109:    };
frontend/src/swipeBack.ts:110:    tryAttach();
frontend/src/swipeBack.ts:111:    return () => {
frontend/src/swipeBack.ts:112:      cancelled = true;
frontend/src/swipeBack.ts:113:      cancelAnimationFrame(raf);
frontend/src/swipeBack.ts:114:      detach?.();
frontend/src/swipeBack.ts:115:    };
frontend/src/swipeBack.ts:116:    // eslint-disable-next-line react-hooks/exhaustive-deps
frontend/src/swipeBack.ts:117:  }, [enabled]);
frontend/src/swipeBack.ts:118:}
frontend/src/main.tsx:1:import React, { lazy, Suspense, useEffect } from 'react';
frontend/src/main.tsx:2:import ReactDOM from 'react-dom/client';
frontend/src/main.tsx:3:import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
frontend/src/main.tsx:4:import './index.css';
frontend/src/main.tsx:5:import App from './App';
frontend/src/main.tsx:6:import Home from './screens/Home';
frontend/src/main.tsx:7:const Favorites = lazy(() => import('./screens/Favorites'));
frontend/src/main.tsx:8:const Alerts = lazy(() => import('./screens/Alerts'));
frontend/src/main.tsx:9:const MyRatings = lazy(() => import('./screens/MyRatings'));
frontend/src/main.tsx:10:const Business = lazy(() => import('./screens/Business'));
frontend/src/main.tsx:11:import { initTelegram, haptic, initData } from './telegram';
frontend/src/main.tsx:12:import { api } from './api';
frontend/src/main.tsx:13:import { initAnalytics } from './analytics';
frontend/src/main.tsx:14:
frontend/src/main.tsx:15:reportClient('module-start', 'main.tsx loaded');
frontend/src/main.tsx:16:initTelegram();
frontend/src/main.tsx:17:initAnalytics();
frontend/src/main.tsx:18:
frontend/src/main.tsx:19:function reportClient(kind: string, detail: unknown) {
frontend/src/main.tsx:20:  try {
frontend/src/main.tsx:21:    fetch('/api/health/client-error', {
frontend/src/main.tsx:22:      method: 'POST',
frontend/src/main.tsx:23:      headers: { 'Content-Type': 'application/json' },
frontend/src/main.tsx:24:      body: JSON.stringify({
frontend/src/main.tsx:25:        kind,
frontend/src/main.tsx:26:        detail: String(detail).slice(0, 500),
frontend/src/main.tsx:27:        url: location.href,
frontend/src/main.tsx:28:        hasInitData: !!(window.Telegram?.WebApp?.initData || initData),
frontend/src/main.tsx:29:      }),
frontend/src/main.tsx:30:      keepalive: true,
frontend/src/main.tsx:31:    }).catch(() => {});
frontend/src/main.tsx:32:  } catch {
frontend/src/main.tsx:33:    /* ignore */
frontend/src/main.tsx:34:  }
frontend/src/main.tsx:35:}
frontend/src/main.tsx:36:
frontend/src/main.tsx:37:class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
frontend/src/main.tsx:38:  state = { failed: false };
frontend/src/main.tsx:39:
frontend/src/main.tsx:40:  static getDerivedStateFromError() {
frontend/src/main.tsx:41:    return { failed: true };
frontend/src/main.tsx:42:  }
frontend/src/main.tsx:43:
frontend/src/main.tsx:44:  componentDidCatch(error: unknown) {
frontend/src/main.tsx:45:    reportClient('react-crash', (error as Error)?.stack || (error as Error)?.message || error);
frontend/src/main.tsx:46:  }
frontend/src/main.tsx:47:
frontend/src/main.tsx:48:  render() {
frontend/src/main.tsx:49:    if (!this.state.failed) return this.props.children;
frontend/src/main.tsx:50:    return (
frontend/src/main.tsx:51:      <div className="boot-fallback">
frontend/src/main.tsx:52:        <div className="boot-fallback-box">
frontend/src/main.tsx:53:          <b>Не удалось загрузить приложение</b>
frontend/src/main.tsx:54:          <button onClick={() => window.location.reload()}>Обновить</button>
frontend/src/main.tsx:55:        </div>
frontend/src/main.tsx:56:      </div>
frontend/src/main.tsx:57:    );
frontend/src/main.tsx:58:  }
frontend/src/main.tsx:59:}
frontend/src/main.tsx:60:
frontend/src/main.tsx:61:// TEMP: report client crashes to the server so we can see mobile-only errors that
frontend/src/main.tsx:62:// happen before any API call fires. Fire-and-forget, never throws.
frontend/src/main.tsx:63:{
frontend/src/main.tsx:64:  window.addEventListener('error', (e) => reportClient('error', e.message + ' @ ' + (e.filename || '') + ':' + e.lineno));
frontend/src/main.tsx:65:  window.addEventListener('unhandledrejection', (e) => reportClient('promise', (e.reason && (e.reason.stack || e.reason.message)) || e.reason));
frontend/src/main.tsx:66:}
frontend/src/main.tsx:67:
frontend/src/main.tsx:68:// block page pinch-zoom & double-tap zoom everywhere (Leaflet keeps its own
frontend/src/main.tsx:69:// zoom — it uses touch events, not these native gesture events).
frontend/src/main.tsx:70:for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
frontend/src/main.tsx:71:  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
frontend/src/main.tsx:72:}
frontend/src/main.tsx:73:let lastTouch = 0;
frontend/src/main.tsx:74:document.addEventListener(
frontend/src/main.tsx:75:  'touchend',
frontend/src/main.tsx:76:  (e) => {
frontend/src/main.tsx:77:    const now = Date.now();
frontend/src/main.tsx:78:    // kill double-tap zoom on empty areas ONLY — never on interactive elements, or we
frontend/src/main.tsx:79:    // cancel their tap (this was swallowing the `tel:` call link + needing double taps).
frontend/src/main.tsx:80:    const interactive = (e.target as HTMLElement)?.closest?.(
frontend/src/main.tsx:81:      '.leaflet-container, a, button, input, textarea, select, label, [role="button"], .chip, .cat-tile, .rate-star, .heart',
frontend/src/main.tsx:82:    );
frontend/src/main.tsx:83:    if (now - lastTouch < 300 && !interactive) {
frontend/src/main.tsx:84:      e.preventDefault();
frontend/src/main.tsx:85:    }
frontend/src/main.tsx:86:    lastTouch = now;
frontend/src/main.tsx:87:  },
frontend/src/main.tsx:88:  { passive: false },
frontend/src/main.tsx:89:);
frontend/src/main.tsx:90:
frontend/src/main.tsx:91:// app-open session tracking (start on open, end on close) for admin analytics
frontend/src/main.tsx:92:let sessionId: string | null = null;
frontend/src/main.tsx:93:api
frontend/src/main.tsx:94:  .sessionStart()
frontend/src/main.tsx:95:  .then((s) => {
frontend/src/main.tsx:96:    sessionId = s.id;
frontend/src/main.tsx:97:  })
frontend/src/main.tsx:98:  .catch(() => {});
frontend/src/main.tsx:99:const endSession = () => {
frontend/src/main.tsx:100:  if (!sessionId) return;
frontend/src/main.tsx:101:  // keepalive so the request survives the page being closed
frontend/src/main.tsx:102:  fetch('/api/session/end', {
frontend/src/main.tsx:103:    method: 'POST',
frontend/src/main.tsx:104:    headers: { Authorization: `tma ${initData}`, 'Content-Type': 'application/json' },
frontend/src/main.tsx:105:    body: JSON.stringify({ id: sessionId }),
frontend/src/main.tsx:106:    keepalive: true,
frontend/src/main.tsx:107:  }).catch(() => {});
frontend/src/main.tsx:108:  sessionId = null;
frontend/src/main.tsx:109:};
frontend/src/main.tsx:110:window.addEventListener('pagehide', endSession);
frontend/src/main.tsx:111:document.addEventListener('visibilitychange', () => {
frontend/src/main.tsx:112:  if (document.visibilityState === 'hidden') endSession();
frontend/src/main.tsx:113:});
frontend/src/main.tsx:114:
frontend/src/main.tsx:115:// light haptic feedback on any interactive tap
frontend/src/main.tsx:116:document.addEventListener(
frontend/src/main.tsx:117:  'click',
frontend/src/main.tsx:118:  (e) => {
frontend/src/main.tsx:119:    const t = e.target as HTMLElement | null;
frontend/src/main.tsx:120:    if (t?.closest?.('button, a, .chip, .cat-tile, .vcard, .post, .mini, .rate-star, .heart')) {
frontend/src/main.tsx:121:      haptic('light');
frontend/src/main.tsx:122:    }
frontend/src/main.tsx:123:  },
frontend/src/main.tsx:124:  { capture: true },
frontend/src/main.tsx:125:);
frontend/src/main.tsx:126:
frontend/src/main.tsx:127:const appChildren = [
frontend/src/main.tsx:128:  { index: true, element: <Home /> },
frontend/src/main.tsx:129:  { path: 'favorites', element: <Suspense fallback={null}><Favorites /></Suspense> },
frontend/src/main.tsx:130:  { path: 'alerts', element: <Suspense fallback={null}><Alerts /></Suspense> },
frontend/src/main.tsx:131:  { path: 'me', element: <Suspense fallback={null}><MyRatings /></Suspense> },
frontend/src/main.tsx:132:  { path: 'business', element: <Suspense fallback={null}><Business /></Suspense> },
frontend/src/main.tsx:133:];
frontend/src/main.tsx:134:
frontend/src/main.tsx:135:const router = createBrowserRouter([
frontend/src/main.tsx:136:  { path: '/', element: <App />, children: appChildren },
frontend/src/main.tsx:137:  // ANY boot path, present and future — hardcoding versions here is what kept
frontend/src/main.tsx:138:  // every new release 404ing inside Telegram
frontend/src/main.tsx:139:  { path: '/tg-boot-:v', element: <App />, children: appChildren },
frontend/src/main.tsx:140:  { path: '*', element: <Navigate to="/" replace /> },
frontend/src/main.tsx:141:]);
frontend/src/main.tsx:142:
frontend/src/main.tsx:143:function BootedRouter() {
frontend/src/main.tsx:144:  useEffect(() => {
frontend/src/main.tsx:145:    (window as any).__APP_BOOTED = true;
frontend/src/main.tsx:146:    reportClient('app-mounted', 'react mounted');
frontend/src/main.tsx:147:  }, []);
frontend/src/main.tsx:148:  return <RouterProvider router={router} />;
frontend/src/main.tsx:149:}
frontend/src/main.tsx:150:
frontend/src/main.tsx:151:ReactDOM.createRoot(document.getElementById('root')!).render(
frontend/src/main.tsx:152:  <React.StrictMode>
frontend/src/main.tsx:153:    <AppErrorBoundary>
frontend/src/main.tsx:154:      <BootedRouter />
frontend/src/main.tsx:155:    </AppErrorBoundary>
frontend/src/main.tsx:156:  </React.StrictMode>,
frontend/src/main.tsx:157:);

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "''^(export default|function |const [A-Z]|  const '"\\[|  useEffect|  useSwipe|  return \\(|<header|<main|className=|onClick=|onKey|role=|aria-|loading|error|empty|skeleton|navigate|setSelected|modal|back|scroll|focus|placeholder)\" frontend/src/screens/Home.tsx" in D:\Приложения\Yelp
 succeeded in 276ms:
13:const ListingDetailModal = lazy(() => import('../components/ListingDetail').then((m) => ({ default: m.ListingDetailModal })));
16:const MapBrowse = lazy(() => import('../components/MapBrowse').then((m) => ({ default: m.MapBrowse })));
17:const AddBusiness = lazy(() => import('../components/AddBusiness').then((m) => ({ default: m.AddBusiness })));
32:const NONSTD = /^соус([^а-яёa-z0-9]|$)|соус\)?$|кетчуп|майонез|горчиц|васаби|сироп|топпинг|посыпк|варень|сгущ[её]нк|сметан|гарнир|халапень|лаваш|гренк|сухарик|приправ|заправк|минеральн|аква минерале|бонаква|боржоми|нарзан|пеллегрино|(^|[^а-яёa-z0-9])(м[её]д|хлеб|зелень|лимон|лайм|молоко|сливки|сахар|л[её]д|рис|пюре|сыр|яйцо|бекон|вод[аы])([^а-яёa-z0-9]|$)/i;
35:function seededShuffle<T>(arr: T[], seed: number): T[] {
48:function dedupeByVenue(events: VenueEvent[]): VenueEvent[] {
63:const SUGG_EMOJI: Record<string, string> = {
69:const HISTORY_KEY = 'searchHistory';
70:function readHistory(): string[] {
73:function pushHistory(q: string) {
84:function cachedLoad<T>(key: string, fetcher: () => Promise<T>, setter: (v: T) => void, after?: () => void) {
103:const FEEDQ_KEY = 'hc_feed_queue';
104:function readFeedQueue(): Review[] {
107:function writeFeedQueue(q: Review[]) {
111:const TILE_ICON: Record<string, JSX.Element> = {
115:const TILES: { key: Cat; icon: string; label: string }[] = [
125:export default function Home() {
126:  const [recommended, setRecommended] = useState<Listing[]>([]);
127:  const [topDrinks, setTopDrinks] = useState<Listing[]>([]);
128:  const [topDishes, setTopDishes] = useState<Listing[]>([]);
129:  const [smart, setSmart] = useState<Listing[]>([]);
130:  const [myReviews, setMyReviews] = useState<Review[]>([]);
131:  const [feedLoaded, setFeedLoaded] = useState(false);
132:  const [commentsReview, setCommentsReview] = useState<string | null>(null);
133:  const [photoReview, setPhotoReview] = useState<Review | null>(null); // tap feed photo → the review
134:  const [openUser, setOpenUser] = useState<string | null>(null);
135:  const [heroIdx, setHeroIdx] = useState(0);
138:  const [heroPinId, setHeroPinId] = useState<string | null>(null);
139:  const [myId, setMyId] = useState<string | null>(null);
140:  const [skipped, setSkipped] = useState<Set<string>>(new Set());
142:  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
143:  const [autoRate, setAutoRate] = useState<number | undefined>(undefined);
145:  const [wallPosts, setWallPosts] = useState<Review[]>([]);
148:  const [recCards, setRecCards] = useState<Listing[]>([]);
159:  const [loadingMore, setLoadingMore] = useState(false); // «показать ещё» spinner
163:  const [inFeed, setInFeed] = useState(false);
164:  const [topDismissed, setTopDismissed] = useState(false);
166:  useEffect(() => {
176:  const [search, setSearch] = useState('');
177:  const [suggestions, setSuggestions] = useState<Sugg[]>([]);
178:  const [searchFocused, setSearchFocused] = useState(false);
179:  const [history, setHistory] = useState<string[]>(() => readHistory());
180:  const [cat, setCat] = useState<Cat>('ALL');
181:  const [results, setResults] = useState<Listing[] | null>(null);
182:  const [showAdd, setShowAdd] = useState(false); // "не нашли? добавьте" — choice sheet
183:  const [showAddBiz, setShowAddBiz] = useState(false); // add a venue (AddBusiness)
184:  const [pickVenueForItem, setPickVenueForItem] = useState(false); // add a dish/drink → pick venue
185:  const [active, setActive] = useState<Listing | null>(null);
186:  const [deepId, setDeepId] = useState<string | null>(null);
187:  const [deepVenue, setDeepVenue] = useState<{ id: string; name: string } | null>(null);
188:  const [events, setEvents] = useState<VenueEvent[]>([]);
189:  const [firstTaster, setFirstTaster] = useState<Listing[]>([]);
199:  useEffect(() => {
203:  const [browse, setBrowse] = useState<BrowseCat | null>(null);
204:  const [filters, setFilters] = useState<FilterState>({
263:  useEffect(() => {
282:  useSwipeBack(
289:  useEffect(() => {
332:  useEffect(() => {
414:  useEffect(() => {
511:  useEffect(() => {
595:  return (

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/screens/Home.tsx'; "'$c=Get-Content $f; foreach($range in @(@(120,360),@(360,620),@(620,850),@(850,1021))){$s=$range[0];$e=$range[1]; for($i=$s;$i -le $e;$i++){"$i`:$($c[$i-1])"}; ""}' in D:\Приложения\Yelp
 succeeded in 826ms:
120:  { key: 'COFFEE', icon: 'в•', label: 'РљРѕС„РµР№РЅРё' },
121:  { key: 'CAFE', icon: 'рџЌ°', label: 'РљР°С„Рµ' },
122:  { key: 'BAR', icon: 'рџЌё', label: 'Р‘Р°СЂС‹' },
123:];
124:
125:export default function Home() {
126:  const [recommended, setRecommended] = useState<Listing[]>([]);
127:  const [topDrinks, setTopDrinks] = useState<Listing[]>([]);
128:  const [topDishes, setTopDishes] = useState<Listing[]>([]);
129:  const [smart, setSmart] = useState<Listing[]>([]);
130:  const [myReviews, setMyReviews] = useState<Review[]>([]);
131:  const [feedLoaded, setFeedLoaded] = useState(false);
132:  const [commentsReview, setCommentsReview] = useState<string | null>(null);
133:  const [photoReview, setPhotoReview] = useState<Review | null>(null); // tap feed photo в†’ the review
134:  const [openUser, setOpenUser] = useState<string | null>(null);
135:  const [heroIdx, setHeroIdx] = useState(0);
136:  // pin: opening the hero card must NOT advance the deck вЂ” the same card is
137:  // waiting when the user comes back (it leaves only after a rating/skip)
138:  const [heroPinId, setHeroPinId] = useState<string | null>(null);
139:  const [myId, setMyId] = useState<string | null>(null);
140:  const [skipped, setSkipped] = useState<Set<string>>(new Set());
141:  // changes every mount в†’ home cards reshuffle each time you open / switch tabs
142:  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
143:  const [autoRate, setAutoRate] = useState<number | undefined>(undefined);
144:  // server-ranked one-time feed: displayed posts + "all caught up" flag
145:  const [wallPosts, setWallPosts] = useState<Review[]>([]);
146:  // taste-based recommendation cards that keep the feed infinite once the
147:  // one-time user posts run out (В«РїРѕРєР°Р·Р°С‚СЊ РµС‰С‘В» loads more of these)
148:  const [recCards, setRecCards] = useState<Listing[]>([]);
149:  const recSeen = useRef(new Set<string>());
150:  const recFetching = useRef(false);
151:  // frozen feed layout: entries never move once shown; new batches append below
152:  const feedOrderRef = useRef<string[]>([]);
153:  const feedMountTs = useRef(Date.now());
154:  // swipe leftв†’right returns from a category/search view to the home feed (iOS
155:  // interactive-pop pattern) вЂ” active ONLY while a filter/category is on screen
156:  const homeRef = useRef<HTMLDivElement>(null);
157:  const catRef = useRef<HTMLDivElement>(null); // the category/search results overlay layer
158:  const homeScrollY = useRef(0); // home scroll position saved when entering a category
159:  const [loadingMore, setLoadingMore] = useState(false); // В«РїРѕРєР°Р·Р°С‚СЊ РµС‰С‘В» spinner
160:  // В«РЅР°РІРµСЂС…В»: auto-appears once you scroll INTO the feed section, auto-hides
161:  // when tapped or when you rise back above the feed (owner spec 16.07.2026)
162:  const feedTopRef = useRef<HTMLDivElement>(null); // the В«Р›РµРЅС‚Р°В» section title
163:  const [inFeed, setInFeed] = useState(false);
164:  const [topDismissed, setTopDismissed] = useState(false);
165:  const showScrollTop = inFeed && !topDismissed;
166:  useEffect(() => {
167:    const onScroll = () => {
168:      const top = feedTopRef.current ? feedTopRef.current.getBoundingClientRect().top + window.scrollY : Infinity;
169:      const past = window.scrollY > top - window.innerHeight * 0.5;
170:      setInFeed(past);
171:      if (!past) setTopDismissed(false); // rose above the feed в†’ re-arm
172:    };
173:    window.addEventListener('scroll', onScroll, { passive: true });
174:    return () => window.removeEventListener('scroll', onScroll);
175:  }, []);
176:  const [search, setSearch] = useState('');
177:  const [suggestions, setSuggestions] = useState<Sugg[]>([]);
178:  const [searchFocused, setSearchFocused] = useState(false);
179:  const [history, setHistory] = useState<string[]>(() => readHistory());
180:  const [cat, setCat] = useState<Cat>('ALL');
181:  const [results, setResults] = useState<Listing[] | null>(null);
182:  const [showAdd, setShowAdd] = useState(false); // "РЅРµ РЅР°С€Р»Рё? РґРѕР±Р°РІСЊС‚Рµ" вЂ” choice sheet
183:  const [showAddBiz, setShowAddBiz] = useState(false); // add a venue (AddBusiness)
184:  const [pickVenueForItem, setPickVenueForItem] = useState(false); // add a dish/drink в†’ pick venue
185:  const [active, setActive] = useState<Listing | null>(null);
186:  const [deepId, setDeepId] = useState<string | null>(null);
187:  const [deepVenue, setDeepVenue] = useState<{ id: string; name: string } | null>(null);
188:  const [events, setEvents] = useState<VenueEvent[]>([]);
189:  const [firstTaster, setFirstTaster] = useState<Listing[]>([]);
190:  // taste-personalized new dishes вЂ” re-fetched by loadFeeds so they refresh on
191:  // every return to home (a fresh shuffled set), not only on first mount.
192:  const loadEvents = useCallback(() => {
193:    api
194:      .eventsFeed(20)
195:      .then((e) => (e.length ? setEvents(e) : api.events(20).then(setEvents)))
196:      .catch(() => api.events(20).then(setEvents).catch(() => {}));
197:  }, []);
198:  // story / shared deep link: ?startapp=l_<listingId> в†’ open that card
199:  useEffect(() => {
200:    const sp = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param as string | undefined;
201:    if (sp && sp.startsWith('l_')) setDeepId(sp.slice(2));
202:  }, []);
203:  const [browse, setBrowse] = useState<BrowseCat | null>(null);
204:  const [filters, setFilters] = useState<FilterState>({
205:    sort: 'recommended',
206:    price: 0,
207:    openNow: false,
208:    cuisine: '',
209:  });
210:  const { ids, toggle } = useFavorites();
211:
212:  const setRecommendedFast = useCallback((items: Listing[]) => {
213:    preloadListingPhotos(items, 12);
214:    setRecommended(items);
215:  }, []);
216:  const setTopDishesFast = useCallback((items: Listing[]) => {
217:    preloadListingPhotos(items, 8);
218:    setTopDishes(items);
219:  }, []);
220:  const setTopDrinksFast = useCallback((items: Listing[]) => {
221:    preloadListingPhotos(items, 8);
222:    setTopDrinks(items);
223:  }, []);
224:  const setSmartFast = useCallback((items: Listing[]) => {
225:    preloadListingPhotos(items, 8);
226:    setSmart(items);
227:  }, []);
228:
229:  const openListing = (l: Listing) => {
230:    // chains open as a full card too (points are listed inside, at the bottom)
231:    setDeepId(null); // never stack two detail modals (their backdrops overlap в†’ dead taps)
232:    setDeepVenue(null);
233:    setActive(l);
234:  };
235:
236:  // tapping a "РЅРѕРІРёРЅРєР°" opens the DISH/DRINK at THAT venue (find-or-create it there),
237:  // with the venue as context so the card says "РћС†РµРЅРёС‚СЊ РІ В«вЂ¦В»" and links to it.
238:  const openNewDish = (ev: { title?: string | null; venueId: string; photoUrl?: string | null; venue?: { name?: string | null } | null }) => {
239:    const drink = /РєРѕС„Рµ|Р»Р°С‚С‚Рµ|РєР°РїСѓС‡РёРЅ|СЌСЃРїСЂРµСЃСЃРѕ|Р°РјРµСЂРёРєР°РЅРѕ|СЂР°С„|РєР°РєР°Рѕ|С‡Р°Р№|РјР°С‚С‡|С‚РѕРЅРёРє|Р»РёРјРѕРЅР°Рґ|СЃРјСѓР·Рё|СЃРѕРє|РјРѕСЂСЃ|РєРѕРєС‚РµР№Р»|РІРёРЅРѕ|РїРёРІРѕ|РіР»РёРЅС‚РІРµР№РЅ|РЅР°РїРёС‚РѕРє|РєРѕР»Р°|С€РµР№Рє/i.test(ev.title ?? '');
240:    if (ev.venue?.name) setDeepVenue({ id: ev.venueId, name: ev.venue.name });
241:    api
242:      .addItem(ev.venueId, { type: drink ? 'DRINK' : 'DISH', name: (ev.title || 'РќРѕРІРёРЅРєР°').slice(0, 60), photoUrl: ev.photoUrl ?? undefined })
243:      .then((item) => setDeepId(item.id))
244:      .catch(() => { setDeepVenue(null); setDeepId(ev.venueId); }); // fallback: open the venue
245:  };
246:
247:  // (re)loads the recommendation feed; called on mount and after every review. Every
248:  // feed renders from its cache instantly, then refreshes in the background.
249:  const loadFeeds = useCallback(() => {
250:    loadCategoryProgress(true); // refresh the unlock scale after a new review
251:    const recentCats = [
252:      ...new Set(getRecent().map((l) => l.category).filter((c): c is string => !!c)),
253:    ].slice(0, 8);
254:    cachedLoad('recsys', () => api.recsysFeed(30).catch(() => api.recommended()), setRecommendedFast, () => setFeedLoaded(true));
255:    cachedLoad('firstTaster', () => api.firstTasterItems(8), setFirstTaster);
256:    cachedLoad('topDish', () => api.listings('DISH', undefined, { sort: 'rating', take: 12 }), setTopDishesFast);
257:    cachedLoad('topDrink', () => api.listings('DRINK', undefined, { sort: 'rating', take: 12 }), setTopDrinksFast);
258:    cachedLoad('smart', () => api.recommendedSmart(recentCats), setSmartFast);
259:    cachedLoad('myrev', () => api.myReviews(), setMyReviews);
260:    // В«РќРѕРІРёРЅРєРё РїРѕРґ РІР°С€ РІРєСѓСЃВ» temporarily disabled (parsing paused) вЂ” see loadEvents
261:  }, [loadEvents, setRecommendedFast, setSmartFast, setTopDishesFast, setTopDrinksFast]);
262:
263:  useEffect(() => {
264:    loadFeeds();
265:    api.me().then((u) => setMyId(u?.id ?? null)).catch(() => {});
266:    api.skips().then((ids) => setSkipped(new Set(ids))).catch(() => {});
267:  }, [loadFeeds]);
268:
269:  // re-shuffle + reload the recommendation rows (new positions every time you
270:  // arrive at home вЂ” on app launch, on "Р“Р»Р°РІРЅР°СЏ" tap, on returning from a section)
271:  const refreshHome = useCallback(() => {
272:    setSeed(Math.floor(Math.random() * 1e9));
273:    loadFeeds();
274:  }, [loadFeeds]);
275:
276:  // latest filter state for the Esc handler (avoids stale closure)
277:  const escStateRef = useRef({ cat, search, results });
278:  escStateRef.current = { cat, search, results };
279:
280:  // a category/search view is on screen в†’ enable swipe-back to the home feed
281:  // swipe the RESULTS overlay away в†’ the home feed beneath is revealed (iOS pop)
282:  useSwipeBack(
283:    catRef,
284:    () => window.dispatchEvent(new Event('home-back')), // light return, no reload
285:    !!results,
286:  );
287:
288:  // tapping "Р“Р»Р°РІРЅР°СЏ" in the nav clears search and returns to the start screen
289:  useEffect(() => {
290:    const reset = () => {
291:      setSearch('');
292:      setCat('ALL');
293:      setResults(null);
294:      setFilters({ sort: 'recommended', price: 0, openNow: false, cuisine: '' });
295:      setActive(null);
296:      setBrowse(null);
297:      refreshHome();
298:      window.scrollTo({ top: 0, behavior: 'smooth' });
299:    };
300:    // Esc also exits a filtered view (category/search) в†’ back to the start screen,
301:    // unless a modal is open (its own Esc handler closes it first).
302:    const onKey = (e: KeyboardEvent) => {
303:      if (e.key !== 'Escape') return;
304:      if (hasOpenModal()) return; // a modal/overlay is up в†’ its own Esc handler steps back
305:      (document.activeElement as HTMLElement | null)?.blur?.(); // drop the focus outline box
306:      const { cat, search, results } = escStateRef.current;
307:      if (cat !== 'ALL' || search.trim() || results) reset();
308:    };
309:    // LIGHT return (swipe-back): just clear the category/search and restore the
310:    // home scroll position вЂ” DON'T reload/reshuffle the already-loaded feed
311:    const back = () => {
312:      setSearch('');
313:      setCat('ALL');
314:      setResults(null);
315:      setFilters({ sort: 'recommended', price: 0, openNow: false, cuisine: '' });
316:      setActive(null);
317:      setBrowse(null);
318:      const y = homeScrollY.current;
319:      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
320:    };
321:    window.addEventListener('home-reset', reset);
322:    window.addEventListener('home-back', back);
323:    window.addEventListener('keydown', onKey);
324:    return () => {
325:      window.removeEventListener('home-reset', reset);
326:      window.removeEventListener('home-back', back);
327:      window.removeEventListener('keydown', onKey);
328:    };
329:  }, [refreshHome]);
330:
331:  // search-bar autocomplete suggestions (debounced)
332:  useEffect(() => {
333:    const q = search.trim();
334:    if (q.length < 1) {
335:      setSuggestions([]);
336:      return;
337:    }
338:    const t = setTimeout(() => {
339:      api.suggest(q).then(setSuggestions).catch(() => {});
340:    }, 120);
341:    return () => clearTimeout(t);
342:  }, [search]);
343:
344:  // empty box в†’ recent searches (history); typing в†’ live suggestions filtered to the tab
345:  const commitSearch = (q: string) => {
346:    pushHistory(q);
347:    setHistory(readHistory());
348:    setSearch(q);
349:    setSuggestions([]);
350:  };
351:  const shownSuggestions: Sugg[] = !search.trim()
352:    ? history.map((h) => ({ name: h, kind: 'history', icon: 'history' }))
353:    : cat === 'DISH' || cat === 'DRINK'
354:      ? suggestions.filter((s) => s.kind === 'item')
355:      : cat === 'RESTAURANT' || cat === 'BAR'
356:        ? suggestions.filter((s) => s.kind === 'venue')
357:        : suggestions;
358:
359:  // one-time feed: pull the next posts from the local queue onto the screen and
360:  // top the queue up from the server (which never re-serves what it already gave).

360:  // top the queue up from the server (which never re-serves what it already gave).
361:  const wallIds = useRef(new Set<string>());
362:  const wallFetching = useRef(false);
363:  const topUpQueue = useCallback(async () => {
364:    if (wallFetching.current) return 0;
365:    wallFetching.current = true;
366:    try {
367:      const batch = await api.feed();
368:      const q = readFeedQueue();
369:      const known = new Set([...q.map((r) => r.id), ...wallIds.current]);
370:      const add = batch.filter((r) => !known.has(r.id)); // the server decides whose posts show
371:      if (add.length) writeFeedQueue([...q, ...add]);
372:      return add.length;
373:    } catch {
374:      return 0;
375:    } finally {
376:      wallFetching.current = false;
377:    }
378:  }, [myId]);
379:  const showNextPosts = useCallback((count = 5) => {
380:    const q = readFeedQueue();
381:    const next = q.filter((r) => !wallIds.current.has(r.id)).slice(0, count);
382:    if (next.length) {
383:      for (const r of next) wallIds.current.add(r.id);
384:      writeFeedQueue(q.filter((r) => !wallIds.current.has(r.id)));
385:      setWallPosts((p) => [...p, ...next]);
386:    }
387:    return next.length;
388:  }, []);
389:  // taste-based rec cards: loaded when user posts run out so the feed never ends.
390:  // recsysFeed shuffles a wide pool в†’ each call returns fresh items; dedup here.
391:  const loadMoreRec = useCallback(async (count = 6) => {
392:    if (recFetching.current) return 0;
393:    recFetching.current = true;
394:    try {
395:      // recsys already excludes items the user rated/disliked, server-side
396:      const pool = await api.recsysFeed(30).catch(() => [] as Listing[]);
397:      const fresh = pool.filter((l) => !recSeen.current.has(l.id) && !skipped.has(l.id));
398:      const add = fresh.slice(0, count);
399:      for (const l of add) recSeen.current.add(l.id);
400:      if (add.length) setRecCards((p) => [...p, ...add]);
401:      return add.length;
402:    } finally {
403:      recFetching.current = false;
404:    }
405:  }, [skipped]);
406:  // the single "load more of the wall" action: user posts first, then вЂ” when
407:  // those run out вЂ” an endless stream of taste-based recommendation cards.
408:  const extendFeed = useCallback(async (count = 5) => {
409:    if (showNextPosts(count) > 0) return;
410:    const added = await topUpQueue();
411:    if (added > 0 && showNextPosts(count) > 0) return;
412:    await loadMoreRec(count + 1); // no more posts в†’ recommendations keep it alive
413:  }, [showNextPosts, topUpQueue, loadMoreRec]);
414:  useEffect(() => {
415:    extendFeed(5);
416:    // rec cards join the FIRST screen of the feed (owner 17.07.2026) вЂ” the
417:    // score merge needs them present before any В«РїРѕРєР°Р·Р°С‚СЊ РµС‰С‘В» tap
418:    loadMoreRec(4);
419:    // clip telemetry: measure a real card once per session вЂ” if the footer is
420:    // clipped on THIS device, the exact numbers land in server logs
421:    const t = setTimeout(() => {
422:      try {
423:        if (sessionStorage.getItem('clipProbe')) return;
424:        const btn = document.querySelector('.feed .card .fav-btn') as HTMLElement | null;
425:        const card = btn?.closest('.card') as HTMLElement | null;
426:        if (!btn || !card) return;
427:        sessionStorage.setItem('clipProbe', '1');
428:        const b = btn.getBoundingClientRect();
429:        const cr = card.getBoundingClientRect();
430:        const clip = Math.round(b.bottom - cr.bottom);
431:        { // always report once вЂ” real numbers beat guessing
432:          const cs = (el: Element) => {
433:            const s = getComputedStyle(el);
434:            return { h: s.height, mh: s.minHeight, d: s.display, o: s.overflow, f: s.flex };
435:          };
436:          fetch('/api/health/client-error', {
437:            method: 'POST',
438:            headers: { 'Content-Type': 'application/json' },
439:            body: JSON.stringify({
440:              where: 'card-clip', clip, btnH: Math.round(b.height), cardH: Math.round(cr.height),
441:              card: cs(card),
442:              wrap: card.parentElement ? cs(card.parentElement) : null,
443:              cbody: card.querySelector('.body') ? cs(card.querySelector('.body')!) : null,
444:              ua: navigator.userAgent.slice(0, 80),
445:            }),
446:          }).catch(() => {});
447:        }
448:      } catch { /* diagnostics only */ }
449:    }, 2500);
450:    return () => clearTimeout(t);
451:    // eslint-disable-next-line react-hooks/exhaustive-deps
452:  }, []);
453:
454:  const ratedIds = new Set(
455:    myReviews.map((r) => r.listing?.id).filter((x): x is string => !!x),
456:  );
457:
458:  // pool of dishes/drinks to quick-rate. Round-robin across the chosen
459:  // categories so every taste shows up early (not buried by the first one),
460:  // then fill with the general pools. Drinks lead вЂ” the core loop is tasting drinks.
461:  const ratePool = (() => {
462:    const seen = new Set<string>();
463:    const seenName = new Set<string>();
464:    const out: Listing[] = [];
465:    const add = (l?: Listing) => {
466:      const nm = l?.name?.toLowerCase().trim();
467:      // no breakfast and no alcohol in the deck вЂ” only "rich" food & non-alcoholic drinks
468:      const SKIP_CAT = /Р·Р°РІС‚СЂР°Рє|РІС‹РїРµС‡Рє|РіСЂРёР»СЊ|СЃСЌРЅРґРІРёС‡|СЃРµРЅРґРІРёС‡/i;
469:      const ALCOHOL = /РїРёРІРѕ|РІРёРЅРѕ|РєРѕРєС‚РµР№Р»|РєСЂРµРїРє|СЃРёРґСЂ|РІРёСЃРєРё|РІРѕРґРє|Р»РёРєС‘СЂ|Р»РёРєРµСЂ|\bСЂРѕРј\b|РґР¶РёРЅ|С‚РµРєРёР»|РєРѕРЅСЊСЏРє|Р±СЂРµРЅРґРё|С€Р°РјРїР°РЅСЃРє|РёРіСЂРёСЃС‚|РіР»РёРЅС‚РІРµР№РЅ|СЃР°РЅРіСЂРё|РІРµСЂРјСѓС‚|Р°Р±СЃРµРЅС‚|\bСЃР°РєРµ\b|Р»Р°РіРµСЂ|\bСЌР»СЊ\b|\bipa\b|СЃС‚Р°СѓС‚|РїРѕСЂС‚РµСЂ|РїРёР»СЃРЅРµСЂ|РїСЂРѕСЃРµРєРєРѕ|РјРѕС…РёС‚Рѕ|РЅРµРіСЂРѕРЅРё|Р°РїРµСЂРѕР»СЊ|РјР°СЂС‚РёРЅРё/i;
470:      // "РЅР°СЂРѕРґРЅС‹Рµ"/everyday dishes вЂ” not "РґРѕСЂРѕРіРѕ-Р±РѕРіР°С‚Рѕ"
471:      const FOLK = /СѓС…Р°|Р±РѕСЂС‰|РѕРєСЂРѕС€Рє|СЃРѕР»СЏРЅРє|СЂР°СЃСЃРѕР»СЊРЅРёРє|РїРµР»СЊРјРµРЅ|РІР°СЂРµРЅРёРє|С…РѕР»РѕРґРµС†|СЃС‚СѓРґРµРЅСЊ|РІРёРЅРµРіСЂРµС‚|СЃРµР»С‘РґРє|СЃРµР»СЊРґСЊ|РіСЂРµС‡Рє|РєР°С€Р°|РѕР»Р°РґСЊ|РґСЂР°РЅРёРє|Р·Р°Р»РёРІРЅ|РєРІР°С€РµРЅ|РєРёСЃРµР»СЊ|РєРІР°СЃ|РјРѕСЂСЃ/i;
472:      const RUSSIAN = /СЂСѓСЃСЃРє/i; // only restaurant-grade cuisine вЂ” no Russian/folk cuisine
473:      const tags = `${l?.category ?? ''} ${l?.name ?? ''}`;
474:      // Keep venue-attached cards first. If Railway has items but no menu links after
475:      // a DB move, allow that explicit fallback so the home screen is not empty.
476:      // OWNER RULE: no venue attachment в†’ the card never enters the deck
477:      const hasVenue = !!(l && ((l as any).recVenue || l.bestVenue));
478:      if (
479:        l &&
480:        hasVenue &&
481:        (l.type === 'DISH' || l.type === 'DRINK') &&
482:        !SKIP_CAT.test(l.category ?? '') &&
483:        !ALCOHOL.test(tags) &&
484:        !FOLK.test(l.name ?? '') &&
485:        !NONSTD.test(l.name ?? '') &&
486:        !RUSSIAN.test(`${l.category ?? ''} ${l.cuisine ?? ''}`) &&
487:        !seen.has(l.id) &&
488:        !(nm && seenName.has(nm)) && // no duplicate dish names (e.g. two "Р“Р»РёРЅС‚РІРµР№РЅ")
489:        !skipped.has(l.id) &&
490:        !ratedIds.has(l.id) // already rated в†’ leaves the deck (visible progress)
491:      ) {
492:        seen.add(l.id);
493:        if (nm) seenName.add(nm);
494:        out.push(l);
495:      }
496:    };
497:    // recsys feed (dishes with a real venue attached) leads. Shuffle per-visit so the
498:    // deck isn't the same order every launch (even from cache). The "plain" pools below
499:    // have NO venue attachment, so we only add them AFTER the recsys feed has loaded вЂ”
500:    // otherwise they flash first as venue-less cards, then get replaced a second later.
501:    seededShuffle(recommended, seed).forEach(add);
502:    if (feedLoaded) {
503:      smart.forEach(add);
504:      seededShuffle([...topDrinks, ...topDishes], seed).forEach(add);
505:    }
506:    return out;
507:  })();
508:  const pinned = heroPinId ? ratePool.find((l) => l.id === heroPinId) : undefined;
509:  const heroItem = pinned ?? (ratePool.length ? ratePool[heroIdx % ratePool.length] : null);
510:
511:  useEffect(() => {
512:    const q = search.trim();
513:    const { sort, price, openNow, cuisine } = filters;
514:    const filtersActive =
515:      !!q || cat !== 'ALL' || sort !== 'recommended' || price > 0 || openNow || !!cuisine;
516:    if (!filtersActive) {
517:      setResults(null);
518:      return;
519:    }
520:    const t = setTimeout(() => {
521:      const opts = { sort, price: price || undefined, openNow, cuisine: cuisine || undefined };
522:      if (cat === 'DISH' || cat === 'DRINK') {
523:        // search WITHIN the items themselves (word-start match)
524:        if (q) api.searchItems(cat, q).then(setResults).catch(() => {});
525:        else api.listings(cat, undefined, opts).then(setResults).catch(() => {});
526:      } else if (cat === 'RESTAURANT' || cat === 'BAR') {
527:        // venues by name OR serving the typed dish/drink; bars filtered to category
528:        if (q) {
529:          api
530:            .searchVenues(q)
531:            .then((list) => setResults(cat === 'BAR' ? list.filter((l) => l.category === 'Р‘Р°СЂ') : list))
532:            .catch(() => {});
533:        } else {
534:          api
535:            .listings('RESTAURANT', undefined, { ...opts, category: cat === 'BAR' ? 'Р‘Р°СЂ' : undefined })
536:            .then(setResults)
537:            .catch(() => {});
538:        }
539:      } else if (q) {
540:        // no category selected в†’ item first, then venues
541:        api.searchAll(q).then(setResults).catch(() => {});
542:      } else {
543:        api.listings(undefined, undefined, opts).then(setResults).catch(() => {});
544:      }
545:    }, 250);
546:    return () => clearTimeout(t);
547:  }, [search, cat, filters]);
548:
549:
550:  // В«РќРµ РёРЅС‚РµСЂРµСЃРЅРѕВ» (YouTube-style): hide the card everywhere it shows AND send a
551:  // negative signal so the recommender learns to show less of this category
552:  const notInterested = (l: Listing) => {
553:    api.skip(l.id, l.category ?? undefined).catch(() => {});
554:    // optimistic: the card vanishes from EVERY section the moment you tap
555:    setSkipped((s) => new Set(s).add(l.id));
556:    setRecCards((p) => p.filter((x) => x.id !== l.id));
557:    setFirstTaster((p) => p.filter((x) => x.id !== l.id));
558:  };
559:
560:  const card = (l: Listing) => (
561:    <ListingCard
562:      key={l.id}
563:      listing={l}
564:      favorite={ids.has(l.id)}
565:      onToggleFavorite={() => toggle(l.id)}
566:      onNotInterested={() => notInterested(l)}
567:      onClick={() => {
568:        setAutoRate(undefined);
569:        openListing(l);
570:      }}
571:      onRate={(n) => {
572:        setAutoRate(n);
573:        setActive(l);
574:      }}
575:    />
576:  );
577:
578:  const row = (l: Listing, rank?: number) => (
579:    <ListRow
580:      key={l.id}
581:      listing={l}
582:      rank={rank}
583:      favorite={ids.has(l.id)}
584:      onToggleFavorite={() => toggle(l.id)}
585:      onNotInterested={() => notInterested(l)}
586:      onClick={() => openListing(l)}
587:      onTagClick={(tag) => {
588:        // tapping a tag в†’ put it in the search bar; venue search matches the cuisine
589:        setCat('RESTAURANT');
590:        setSearch(tag);
591:      }}
592:    />
593:  );
594:
595:  return (
596:    <div ref={homeRef}>
597:      <div className="cat-bar">
598:        {TILES.map((t) => (
599:          <button
600:            key={t.key}
601:            className={'cat-tile' + (cat === t.key ? ' active' : '')}
602:            onClick={() => {
603:              // tapping the already-active category deselects it в†’ back to the start screen
604:              if (cat === t.key) {
605:                window.dispatchEvent(new Event('home-back'));
606:                return;
607:              }
608:              // remember where we were so swipe-back restores the home scroll
609:              if (cat === 'ALL' && !search.trim()) homeScrollY.current = window.scrollY;
610:              setCat(t.key as Cat);
611:              // places в†’ map; dishes/drinks в†’ list (item first, then venues)
612:              if (t.key === 'RESTAURANT' || t.key === 'BAR' || t.key === 'CAFE' || t.key === 'COFFEE')
613:                setBrowse(t.key as BrowseCat);
614:            }}
615:          >
616:            <span className="cat-ico">{TILE_ICON[t.key] ?? null}</span>
617:            {t.label}
618:          </button>
619:        ))}
620:      </div>

620:      </div>
621:
622:      <div className="search">
623:        <div className="search-wrap">
624:          <div className="search-bar">
625:            {search || cat !== 'ALL' ? (
626:              // one step back: from a search в†’ clear it; from a category (РќР°РїРёС‚РєРё,
627:              // Р‘Р»СЋРґР°вЂ¦) в†’ back to the main screen
628:              <button
629:                className="search-ico back"
630:                onClick={() => {
631:                  setSearch('');
632:                  setCat('ALL');
633:                  setResults(null);
634:                }}
635:                aria-label="РќР°Р·Р°Рґ"
636:              >
637:                в†ђ
638:              </button>
639:            ) : (
640:              <span className="search-ico">рџ”Ќ</span>
641:            )}
642:            <input
643:              placeholder={
644:                cat === 'DISH'
645:                  ? 'РџРѕРёСЃРє Р±Р»СЋРґ'
646:                  : cat === 'DRINK'
647:                    ? 'РџРѕРёСЃРє РЅР°РїРёС‚РєРѕРІ'
648:                    : cat === 'RESTAURANT'
649:                      ? 'Р РµСЃС‚РѕСЂР°РЅ РёР»Рё Р±Р»СЋРґРѕ РІ РЅС‘Рј'
650:                      : cat === 'BAR'
651:                        ? 'Р‘Р°СЂ РёР»Рё РЅР°РїРёС‚РѕРє РІ РЅС‘Рј'
652:                        : 'РџРѕРёСЃРє: СЂРµСЃС‚РѕСЂР°РЅС‹, Р±Р»СЋРґР°, РЅР°РїРёС‚РєРё'
653:              }
654:              value={search}
655:              onChange={(e) => setSearch(e.target.value)}
656:              onFocus={() => { if (cat === 'ALL' && !search.trim()) homeScrollY.current = window.scrollY; setSearchFocused(true); }}
657:              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
658:              onKeyDown={(e) => {
659:                if (e.key === 'Enter') {
660:                  if (search.trim()) { pushHistory(search); setHistory(readHistory()); }
661:                  setSearchFocused(false);
662:                  (e.target as HTMLInputElement).blur(); // commit search, hide suggestions
663:                }
664:              }}
665:            />
666:            {/* search icon on the right once the user has typed something */}
667:            {search && (
668:              <button
669:                className="search-ico right"
670:                onClick={() => setSearchFocused(false)}
671:                aria-label="РСЃРєР°С‚СЊ"
672:              >
673:                рџ”Ќ
674:              </button>
675:            )}
676:          </div>
677:          {searchFocused && shownSuggestions.length > 0 && (
678:            <div className="search-sugg">
679:              {!search.trim() && (
680:                <div className="ss-head">
681:                  РќРµРґР°РІРЅРёРµ Р·Р°РїСЂРѕСЃС‹
682:                  <button
683:                    className="ss-clear"
684:                    onMouseDown={(e) => { e.preventDefault(); localStorage.removeItem(HISTORY_KEY); setHistory([]); }}
685:                  >
686:                    РћС‡РёСЃС‚РёС‚СЊ
687:                  </button>
688:                </div>
689:              )}
690:              {shownSuggestions.map((s) => (
691:                <button
692:                  key={s.kind + s.name}
693:                  className="search-sugg-item"
694:                  onMouseDown={(e) => { e.preventDefault(); commitSearch(s.name); }}
695:                >
696:                  <span className="ss-ico">{suggEmoji(s)}</span>
697:                  {s.name}
698:                </button>
699:              ))}
700:            </div>
701:          )}
702:        </div>
703:        {/* filters only in a category context: full for venues, sort-only for items */}
704:        {(cat === 'RESTAURANT' || cat === 'BAR') && (
705:          <Filters
706:            state={filters}
707:            onChange={(n) => setFilters((f) => ({ ...f, ...n }))}
708:          />
709:        )}
710:        {(cat === 'DISH' || cat === 'DRINK') && (
711:          <Filters
712:            variant="item"
713:            state={filters}
714:            onChange={(n) => setFilters((f) => ({ ...f, ...n }))}
715:          />
716:        )}
717:      </div>
718:
719:      <div className="home-content">
720:      {/* category/search results OVERLAY the home feed (iOS interactive-pop):
721:          swiping this layer away reveals the already-loaded home beneath it */}
722:      {results && (
723:        <div ref={catRef} className="cat-results-layer">
724:          <div className="section-title">Р РµР·СѓР»СЊС‚Р°С‚С‹</div>
725:          {results.length === 0 ? (
726:            <div className="empty">РќРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ</div>
727:          ) : (
728:            <div className="list">
729:              {(() => {
730:                const cards = results.map((l) => row(l));
731:                const cta = (
732:                  <button key="add-cta" className="btn rate-cta" onClick={() => setShowAdd(true)}>
733:                    вћ• РќРµ РЅР°С€Р»Рё С‚Рѕ, С‡С‚Рѕ РёСЃРєР°Р»Рё? Р”РѕР±Р°РІСЊС‚Рµ РІ РѕРґРёРЅ РєР»РёРє
734:                  </button>
735:                );
736:                // between the 9th and 10th card; shorter lists в†’ at the end
737:                if (cards.length >= 10) cards.splice(9, 0, cta);
738:                else cards.push(cta);
739:                return cards;
740:              })()}
741:            </div>
742:          )}
743:        </div>
744:      )}
745:      {/* base layer: the home feed, always mounted so it shows behind a swipe */}
746:      {!feedLoaded && ratePool.length === 0 && myReviews.length === 0 && wallPosts.length === 0 ? (
747:        <div style={{ padding: '4px 2px' }}>
748:          {[0, 1, 2].map((i) => (
749:            <div key={i} className="sk-card">
750:              <div className="sk sk-photo" />
751:              <div className="sk-lines">
752:                <div className="sk sk-line w70" />
753:                <div className="sk sk-line w40" />
754:                <div className="sk sk-line btn" />
755:              </div>
756:            </div>
757:          ))}
758:        </div>
759:      ) : (
760:        <>
761:          <TrainingScale />
762:          {/* "Р’Р°С€Рё РѕС†РµРЅРєРё" lives in the Profile only вЂ” removed from the home feed. */}
763:          {events.length > 0 && (
764:            <>
765:              <div className="section-title">рџ†• РќРѕРІРёРЅРєРё РїРѕРґ РІР°С€ РІРєСѓСЃ</div>
766:              <div className="feed">
767:                {dedupeByVenue(events).map((ev) => (
768:                  <button
769:                    key={ev.id}
770:                    className="myrate-card"
771:                    onClick={() => openNewDish(ev)}
772:                  >
773:                    <div className="newdish-media">
774:                      <img className="myrate-photo" src={ev.photoUrl!} alt="" loading="lazy" />
775:                      <span className="ev-badge">рџ†• РќРѕРІРёРЅРєР°</span>
776:                      {ev.price ? <span className="newdish-price">{ev.price} в‚Ѕ</span> : null}
777:                    </div>
778:                    <div className="myrate-name">{(ev.title || 'РќРѕРІРёРЅРєР° РјРµРЅСЋ').slice(0, 40)}</div>
779:                    <div className="myrate-place">рџ“Ќ {ev.venue?.name}</div>
780:                  </button>
781:                ))}
782:              </div>
783:            </>
784:          )}
785:          {heroItem && (
786:            <>
787:              <div className="section-title">Р§С‚Рѕ РїСЂРѕР±СѓРµРј?</div>
788:              <TasteHero
789:                key={heroItem.id}
790:                item={heroItem}
791:                favorite={ids.has(heroItem.id)}
792:                onFavorite={() => {
793:                  // swipe right / в™Ґ в†’ add to favorites, then next card
794:                  if (!ids.has(heroItem.id)) toggle(heroItem.id);
795:                  setHeroIdx((i) => i + 1);
796:                }}
797:                onSkip={() => {
798:                  // "РЅРµ Р»СЋР±Р»СЋ" вЂ” negative taste signal
799:                  api.skip(heroItem.id, heroItem.category).catch(() => {});
800:                  setSkipped((s) => new Set(s).add(heroItem.id));
801:                  setHeroIdx((i) => i + 1);
802:                }}
803:                onShuffle={() => { setHeroPinId(null); setHeroIdx((i) => i + 1); }}
804:                onOpenItem={() => {
805:                  setAutoRate(undefined);
806:                  openListing(heroItem);
807:                }}
808:                onRate={(n) => {
809:                  setAutoRate(n);
810:                  openListing(heroItem);
811:                }}
812:              />
813:            </>
814:          )}
815:          {(() => {
816:            const ft = firstTaster.filter((l) => (l as any).recVenue && !skipped.has(l.id) && !NONSTD.test(l.name ?? ''));
817:            return ft.length > 0 && (
818:              <>
819:                <div className="section-title">рџЏ… РЎС‚Р°РЅСЊС‚Рµ РїРµСЂРІС‹Рј РґРµРіСѓСЃС‚Р°С‚РѕСЂРѕРј</div>
820:                <p className="ft-sub">Р’Р°С€ РѕС‚Р·С‹РІ СЃС‚Р°РЅРµС‚ С‡Р°СЃС‚СЊСЋ РёСЃС‚РѕСЂРёРё РєР°СЂС‚РѕС‡РєРё</p>
821:                <div className="feed ft-feed">{ft.map(card)}</div>
822:              </>
823:            );
824:          })()}
825:          {/* В«Р•С‰С‘ РЅР° РѕС†РµРЅРєСѓВ» removed (owner 17.07.2026) вЂ” the deck lives in the hero */}
826:          {(wallPosts.length > 0 || recCards.length > 0) && (
827:            <>
828:              <div className="section-title" ref={feedTopRef}>Р›РµРЅС‚Р°</div>
829:              {/* ONE ranked feed (owner rules 17.07.2026): posts and rec cards
830:                  compete on a unified 0..1 score вЂ” a better-fitting rec card may
831:                  stand ABOVE a friend's post. But once something is ON SCREEN its
832:                  position is frozen: В«РїРѕРєР°Р·Р°С‚СЊ РµС‰С‘В» only APPENDS below, sorted
833:                  within the new batch вЂ” never reshuffles what the user has seen. */}
834:              {(() => {
835:                const byKey = new Map<string, { s: number; el: JSX.Element }>();
836:                wallPosts.forEach((r, i) => {
837:                  byKey.set('p:' + r.id, {
838:                    s: Number((r as any).normScore ?? Math.max(0.05, 1 - i * 0.04)),
839:                    el: (
840:                      <FeedPost
841:                        key={r.id}
842:                        review={r}
843:                        onOpen={() => r.listing && openListing(r.listing)}
844:                        onComments={() => setCommentsReview(r.id)}
845:                        onOpenUser={(uid) => setOpenUser(uid)}
846:                        onOpenPhoto={() => setPhotoReview(r)}
847:                        onOpenVenue={() => r.venue?.id && openListing({ id: r.venue.id, name: r.venue.name } as Listing)}
848:                      />
849:                    ),
850:                  });

850:                  });
851:                });
852:                recCards.forEach((l, i) => {
853:                  byKey.set('r:' + l.id, {
854:                    s: Number((l as any).normScore ?? Math.max(0.05, 0.9 - i * 0.04)),
855:                    el: (
856:                      <div key={'rec-' + l.id} className="rec-wrap">
857:                        <div className="rec-tag">вњЁ Р’Р°Рј РјРѕР¶РµС‚ РїРѕРЅСЂР°РІРёС‚СЊСЃСЏ</div>
858:                        {card(l)}
859:                      </div>
860:                    ),
861:                  });
862:                });
863:                const bySc = (a: string, b: string) => byKey.get(b)!.s - byKey.get(a)!.s;
864:                if (Date.now() - feedMountTs.current < 2500) {
865:                  // first paint window: full score merge (recs may lead)
866:                  feedOrderRef.current = [...byKey.keys()].sort(bySc);
867:                } else {
868:                  const known = new Set(feedOrderRef.current);
869:                  const fresh = [...byKey.keys()].filter((k) => !known.has(k)).sort(bySc);
870:                  if (fresh.length) feedOrderRef.current = [...feedOrderRef.current, ...fresh];
871:                }
872:                return feedOrderRef.current.map((k) => byKey.get(k)?.el).filter(Boolean);
873:              })()}
874:              {/* the feed never ends: В«РїРѕРєР°Р·Р°С‚СЊ РµС‰С‘В» always loads more. Premium
875:                  feedback вЂ” the button shows a spinner while the next batch loads */}
876:              <button
877:                className="btn secondary show-more"
878:                disabled={loadingMore}
879:                onClick={async () => {
880:                  if (loadingMore) return;
881:                  haptic('light');
882:                  setLoadingMore(true);
883:                  // min 400ms so the spinner is always felt (premium вЂ” no jarring flash)
884:                  try { await Promise.all([extendFeed(5), new Promise((r) => setTimeout(r, 400))]); }
885:                  finally { setLoadingMore(false); }
886:                }}
887:              >
888:                {loadingMore ? <span className="btn-spinner" /> : 'РџРѕРєР°Р·Р°С‚СЊ РµС‰С‘'}
889:              </button>
890:            </>
891:          )}
892:        </>
893:      )}
894:      </div>
895:      {/* frosted "up" button above the camera fab: auto-appears in the feed,
896:          hides on tap or when you rise back above the feed */}
897:      {showScrollTop && (
898:        <button
899:          className="scroll-top-btn"
900:          aria-label="РќР°РІРµСЂС…"
901:          onClick={() => { haptic('light'); setTopDismissed(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
902:        >
903:          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
904:            <path d="M18 15l-6-6-6 6" />
905:          </svg>
906:        </button>
907:      )}
908:
909:      {commentsReview && (
910:        <CommentsModal
911:          reviewId={commentsReview}
912:          onClose={() => setCommentsReview(null)}
913:          onOpenUser={(uid) => {
914:            setCommentsReview(null);
915:            setOpenUser(uid);
916:          }}
917:        />
918:      )}
919:      {photoReview && (
920:        <PhotoPostModal
921:          review={photoReview}
922:          onClose={() => setPhotoReview(null)}
923:          onOpenUser={(uid) => { setPhotoReview(null); setOpenUser(uid); }}
924:          onOpenListing={() => {
925:            const l = photoReview.listing;
926:            setPhotoReview(null);
927:            if (l) openListing(l as Listing);
928:          }}
929:          onOpenVenue={() => {
930:            const v = photoReview.venue;
931:            setPhotoReview(null);
932:            if (v?.id) openListing({ id: v.id, name: v.name } as Listing);
933:          }}
934:        />
935:      )}
936:      {openUser && <UserProfileModal id={openUser} onClose={() => setOpenUser(null)} />}
937:      {browse && (
938:        <Suspense fallback={null}>
939:        <MapBrowse
940:          cat={browse}
941:          onClose={() => {
942:            setBrowse(null);
943:            // fully return to the home feed вЂ” otherwise the category's stale
944:            // "Р РµР·СѓР»СЊС‚Р°С‚С‹" list stays on screen instead of the main page
945:            setCat('ALL');
946:            setResults(null);
947:            setSearch('');
948:            refreshHome(); // returning to home from a section в†’ fresh positions
949:          }}
950:        />
951:        </Suspense>
952:      )}
953:      {/* choice: add a venue or add a dish/drink (label follows the search category) */}
954:      {showAdd && (
955:        <div className="modal-backdrop" style={{ zIndex: 3200 }} onClick={() => setShowAdd(false)}>
956:          <div className="modal" onClick={(e) => e.stopPropagation()}>
957:            <h3>РќРµ РЅР°С€Р»Рё В«{search.trim()}В»?</h3>
958:            <div className="meta" style={{ color: 'var(--hint)', marginBottom: 12 }}>
959:              Р”РѕР±Р°РІСЊС‚Рµ РІ РєР°С‚Р°Р»РѕРі вЂ” СЌС‚Рѕ Р·Р°Р№РјС‘С‚ РјРёРЅСѓС‚Сѓ.
960:            </div>
961:            <button
962:              className="btn rate-cta"
963:              onClick={() => { setShowAdd(false); setShowAddBiz(true); }}
964:            >
965:              рџЏ  Р”РѕР±Р°РІРёС‚СЊ Р·Р°РІРµРґРµРЅРёРµ
966:            </button>
967:            <button
968:              className="btn rate-cta"
969:              style={{ marginTop: 8 }}
970:              onClick={() => { setShowAdd(false); setPickVenueForItem(true); }}
971:            >
972:              {cat === 'DRINK' ? 'рџЌ· Р”РѕР±Р°РІРёС‚СЊ РЅР°РїРёС‚РѕРє' : cat === 'DISH' ? 'рџЌЅ Р”РѕР±Р°РІРёС‚СЊ Р±Р»СЋРґРѕ' : 'рџЌЅ Р”РѕР±Р°РІРёС‚СЊ Р±Р»СЋРґРѕ РёР»Рё РЅР°РїРёС‚РѕРє'}
973:            </button>
974:          </div>
975:        </div>
976:      )}
977:      {showAddBiz && (
978:        <div className="modal-backdrop" style={{ zIndex: 3200 }} onClick={() => setShowAddBiz(false)}>
979:          <div className="modal" onClick={(e) => e.stopPropagation()}>
980:            <Suspense fallback={null}><AddBusiness onClose={() => setShowAddBiz(false)} initialName={search.trim()} /></Suspense>
981:          </div>
982:        </div>
983:      )}
984:      {pickVenueForItem && (
985:        <VenuePicker
986:          onClose={() => setPickVenueForItem(false)}
987:          onPick={(v) => { setPickVenueForItem(false); if (v.id) setDeepId(v.id); }} // open the venue в†’ add item there
988:          onAdded={() => setPickVenueForItem(false)}
989:        />
990:      )}
991:      {active && (
992:        <Suspense fallback={null}>
993:        <ListingDetailModal
994:          id={active.id}
995:          autoRate={autoRate}
996:          originVenue={active.recVenue ?? undefined} // check-in attaches to the recommended place
997:          onChanged={loadFeeds} // a new review в†’ rebuild the recommendation feed
998:          onClose={() => {
999:            setActive(null);
1000:            if (autoRate != null) {
1001:              setAutoRate(undefined);
1002:              setHeroIdx((i) => i + 1); // move to the next item to rate
1003:            }
1004:            // stay where the card was opened вЂ” never jump back to the top
1005:          }}
1006:        />
1007:        </Suspense>
1008:      )}
1009:      {deepId && !active && (
1010:        <Suspense fallback={null}>
1011:        <ListingDetailModal
1012:          id={deepId}
1013:          originVenue={deepVenue ?? undefined}
1014:          onChanged={loadFeeds}
1015:          onClose={() => { setDeepId(null); setDeepVenue(null); }}
1016:        />
1017:        </Suspense>
1018:      )}
1019:    </div>
1020:  );
1021:}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/screens/Home.tsx'; "'$c=Get-Content -Encoding utf8 $f; foreach($range in @(@(500,720),@(595,620))){$s=$range[0];$e=$range[1]; for($i=$s;$i -le $e;$i++){"$i`:$($c[$i-1])"}}' in D:\Приложения\Yelp
 succeeded in 824ms:
500:    // otherwise they flash first as venue-less cards, then get replaced a second later.
501:    seededShuffle(recommended, seed).forEach(add);
502:    if (feedLoaded) {
503:      smart.forEach(add);
504:      seededShuffle([...topDrinks, ...topDishes], seed).forEach(add);
505:    }
506:    return out;
507:  })();
508:  const pinned = heroPinId ? ratePool.find((l) => l.id === heroPinId) : undefined;
509:  const heroItem = pinned ?? (ratePool.length ? ratePool[heroIdx % ratePool.length] : null);
510:
511:  useEffect(() => {
512:    const q = search.trim();
513:    const { sort, price, openNow, cuisine } = filters;
514:    const filtersActive =
515:      !!q || cat !== 'ALL' || sort !== 'recommended' || price > 0 || openNow || !!cuisine;
516:    if (!filtersActive) {
517:      setResults(null);
518:      return;
519:    }
520:    const t = setTimeout(() => {
521:      const opts = { sort, price: price || undefined, openNow, cuisine: cuisine || undefined };
522:      if (cat === 'DISH' || cat === 'DRINK') {
523:        // search WITHIN the items themselves (word-start match)
524:        if (q) api.searchItems(cat, q).then(setResults).catch(() => {});
525:        else api.listings(cat, undefined, opts).then(setResults).catch(() => {});
526:      } else if (cat === 'RESTAURANT' || cat === 'BAR') {
527:        // venues by name OR serving the typed dish/drink; bars filtered to category
528:        if (q) {
529:          api
530:            .searchVenues(q)
531:            .then((list) => setResults(cat === 'BAR' ? list.filter((l) => l.category === 'Бар') : list))
532:            .catch(() => {});
533:        } else {
534:          api
535:            .listings('RESTAURANT', undefined, { ...opts, category: cat === 'BAR' ? 'Бар' : undefined })
536:            .then(setResults)
537:            .catch(() => {});
538:        }
539:      } else if (q) {
540:        // no category selected → item first, then venues
541:        api.searchAll(q).then(setResults).catch(() => {});
542:      } else {
543:        api.listings(undefined, undefined, opts).then(setResults).catch(() => {});
544:      }
545:    }, 250);
546:    return () => clearTimeout(t);
547:  }, [search, cat, filters]);
548:
549:
550:  // «Не интересно» (YouTube-style): hide the card everywhere it shows AND send a
551:  // negative signal so the recommender learns to show less of this category
552:  const notInterested = (l: Listing) => {
553:    api.skip(l.id, l.category ?? undefined).catch(() => {});
554:    // optimistic: the card vanishes from EVERY section the moment you tap
555:    setSkipped((s) => new Set(s).add(l.id));
556:    setRecCards((p) => p.filter((x) => x.id !== l.id));
557:    setFirstTaster((p) => p.filter((x) => x.id !== l.id));
558:  };
559:
560:  const card = (l: Listing) => (
561:    <ListingCard
562:      key={l.id}
563:      listing={l}
564:      favorite={ids.has(l.id)}
565:      onToggleFavorite={() => toggle(l.id)}
566:      onNotInterested={() => notInterested(l)}
567:      onClick={() => {
568:        setAutoRate(undefined);
569:        openListing(l);
570:      }}
571:      onRate={(n) => {
572:        setAutoRate(n);
573:        setActive(l);
574:      }}
575:    />
576:  );
577:
578:  const row = (l: Listing, rank?: number) => (
579:    <ListRow
580:      key={l.id}
581:      listing={l}
582:      rank={rank}
583:      favorite={ids.has(l.id)}
584:      onToggleFavorite={() => toggle(l.id)}
585:      onNotInterested={() => notInterested(l)}
586:      onClick={() => openListing(l)}
587:      onTagClick={(tag) => {
588:        // tapping a tag → put it in the search bar; venue search matches the cuisine
589:        setCat('RESTAURANT');
590:        setSearch(tag);
591:      }}
592:    />
593:  );
594:
595:  return (
596:    <div ref={homeRef}>
597:      <div className="cat-bar">
598:        {TILES.map((t) => (
599:          <button
600:            key={t.key}
601:            className={'cat-tile' + (cat === t.key ? ' active' : '')}
602:            onClick={() => {
603:              // tapping the already-active category deselects it → back to the start screen
604:              if (cat === t.key) {
605:                window.dispatchEvent(new Event('home-back'));
606:                return;
607:              }
608:              // remember where we were so swipe-back restores the home scroll
609:              if (cat === 'ALL' && !search.trim()) homeScrollY.current = window.scrollY;
610:              setCat(t.key as Cat);
611:              // places → map; dishes/drinks → list (item first, then venues)
612:              if (t.key === 'RESTAURANT' || t.key === 'BAR' || t.key === 'CAFE' || t.key === 'COFFEE')
613:                setBrowse(t.key as BrowseCat);
614:            }}
615:          >
616:            <span className="cat-ico">{TILE_ICON[t.key] ?? null}</span>
617:            {t.label}
618:          </button>
619:        ))}
620:      </div>
621:
622:      <div className="search">
623:        <div className="search-wrap">
624:          <div className="search-bar">
625:            {search || cat !== 'ALL' ? (
626:              // one step back: from a search → clear it; from a category (Напитки,
627:              // Блюда…) → back to the main screen
628:              <button
629:                className="search-ico back"
630:                onClick={() => {
631:                  setSearch('');
632:                  setCat('ALL');
633:                  setResults(null);
634:                }}
635:                aria-label="Назад"
636:              >
637:                ←
638:              </button>
639:            ) : (
640:              <span className="search-ico">🔍</span>
641:            )}
642:            <input
643:              placeholder={
644:                cat === 'DISH'
645:                  ? 'Поиск блюд'
646:                  : cat === 'DRINK'
647:                    ? 'Поиск напитков'
648:                    : cat === 'RESTAURANT'
649:                      ? 'Ресторан или блюдо в нём'
650:                      : cat === 'BAR'
651:                        ? 'Бар или напиток в нём'
652:                        : 'Поиск: рестораны, блюда, напитки'
653:              }
654:              value={search}
655:              onChange={(e) => setSearch(e.target.value)}
656:              onFocus={() => { if (cat === 'ALL' && !search.trim()) homeScrollY.current = window.scrollY; setSearchFocused(true); }}
657:              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
658:              onKeyDown={(e) => {
659:                if (e.key === 'Enter') {
660:                  if (search.trim()) { pushHistory(search); setHistory(readHistory()); }
661:                  setSearchFocused(false);
662:                  (e.target as HTMLInputElement).blur(); // commit search, hide suggestions
663:                }
664:              }}
665:            />
666:            {/* search icon on the right once the user has typed something */}
667:            {search && (
668:              <button
669:                className="search-ico right"
670:                onClick={() => setSearchFocused(false)}
671:                aria-label="Искать"
672:              >
673:                🔍
674:              </button>
675:            )}
676:          </div>
677:          {searchFocused && shownSuggestions.length > 0 && (
678:            <div className="search-sugg">
679:              {!search.trim() && (
680:                <div className="ss-head">
681:                  Недавние запросы
682:                  <button
683:                    className="ss-clear"
684:                    onMouseDown={(e) => { e.preventDefault(); localStorage.removeItem(HISTORY_KEY); setHistory([]); }}
685:                  >
686:                    Очистить
687:                  </button>
688:                </div>
689:              )}
690:              {shownSuggestions.map((s) => (
691:                <button
692:                  key={s.kind + s.name}
693:                  className="search-sugg-item"
694:                  onMouseDown={(e) => { e.preventDefault(); commitSearch(s.name); }}
695:                >
696:                  <span className="ss-ico">{suggEmoji(s)}</span>
697:                  {s.name}
698:                </button>
699:              ))}
700:            </div>
701:          )}
702:        </div>
703:        {/* filters only in a category context: full for venues, sort-only for items */}
704:        {(cat === 'RESTAURANT' || cat === 'BAR') && (
705:          <Filters
706:            state={filters}
707:            onChange={(n) => setFilters((f) => ({ ...f, ...n }))}
708:          />
709:        )}
710:        {(cat === 'DISH' || cat === 'DRINK') && (
711:          <Filters
712:            variant="item"
713:            state={filters}
714:            onChange={(n) => setFilters((f) => ({ ...f, ...n }))}
715:          />
716:        )}
717:      </div>
718:
719:      <div className="home-content">
720:      {/* category/search results OVERLAY the home feed (iOS interactive-pop):
595:  return (
596:    <div ref={homeRef}>
597:      <div className="cat-bar">
598:        {TILES.map((t) => (
599:          <button
600:            key={t.key}
601:            className={'cat-tile' + (cat === t.key ? ' active' : '')}
602:            onClick={() => {
603:              // tapping the already-active category deselects it → back to the start screen
604:              if (cat === t.key) {
605:                window.dispatchEvent(new Event('home-back'));
606:                return;
607:              }
608:              // remember where we were so swipe-back restores the home scroll
609:              if (cat === 'ALL' && !search.trim()) homeScrollY.current = window.scrollY;
610:              setCat(t.key as Cat);
611:              // places → map; dishes/drinks → list (item first, then venues)
612:              if (t.key === 'RESTAURANT' || t.key === 'BAR' || t.key === 'CAFE' || t.key === 'COFFEE')
613:                setBrowse(t.key as BrowseCat);
614:            }}
615:          >
616:            <span className="cat-ico">{TILE_ICON[t.key] ?? null}</span>
617:            {t.label}
618:          </button>
619:        ))}
620:      </div>

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "." frontend/src/screens/Favorites.tsx frontend/src/screens/Alerts.tsx frontend/src/screens/MapScreen.tsx; rg -n "''^(export default|function |  const '"\\[|  useEffect|  useSwipe|  return \\()|className=|onClick=|onSubmit=|onChange=|aria-|role=|placeholder=|disabled=|loading|error|empty|focus|window\\.scroll|localStorage\" frontend/src/screens/MyRatings.tsx frontend/src/screens/Business.tsx" in D:\Приложения\Yelp
 succeeded in 297ms:
frontend/src/screens/MapScreen.tsx:1:import { useEffect, useState } from 'react';
frontend/src/screens/MapScreen.tsx:2:import { api } from '../api';
frontend/src/screens/MapScreen.tsx:3:import { MapView } from '../components/MapView';
frontend/src/screens/MapScreen.tsx:4:import { ListingDetailModal } from '../components/ListingDetail';
frontend/src/screens/MapScreen.tsx:5:import type { GeoPoint } from '../types';
frontend/src/screens/MapScreen.tsx:7:export default function MapScreen() {
frontend/src/screens/MapScreen.tsx:8:  const [points, setPoints] = useState<GeoPoint[]>([]);
frontend/src/screens/MapScreen.tsx:9:  const [sel, setSel] = useState<string | null>(null);
frontend/src/screens/MapScreen.tsx:11:  useEffect(() => {
frontend/src/screens/MapScreen.tsx:12:    api.geo().then(setPoints).catch(() => {});
frontend/src/screens/MapScreen.tsx:13:  }, []);
frontend/src/screens/MapScreen.tsx:15:  return (
frontend/src/screens/MapScreen.tsx:16:    <div>
frontend/src/screens/MapScreen.tsx:17:      <div className="topbar">
frontend/src/screens/MapScreen.tsx:18:        <h2>Карта</h2>
frontend/src/screens/MapScreen.tsx:19:        <span className="meta" style={{ color: 'var(--hint)' }}>{points.length} мест</span>
frontend/src/screens/MapScreen.tsx:20:      </div>
frontend/src/screens/MapScreen.tsx:21:      <MapView points={points} height="calc(100vh - 150px)" onSelect={setSel} />
frontend/src/screens/MapScreen.tsx:22:      {sel && <ListingDetailModal id={sel} onClose={() => setSel(null)} />}
frontend/src/screens/MapScreen.tsx:23:    </div>
frontend/src/screens/MapScreen.tsx:24:  );
frontend/src/screens/MapScreen.tsx:25:}
frontend/src/screens/Favorites.tsx:1:import { useEffect, useState } from 'react';
frontend/src/screens/Favorites.tsx:2:import { useNavigate, useSearchParams } from 'react-router-dom';
frontend/src/screens/Favorites.tsx:3:import { api } from '../api';
frontend/src/screens/Favorites.tsx:4:import { ListingCard } from '../components/ListingCard';
frontend/src/screens/Favorites.tsx:5:import { ListingDetailModal } from '../components/ListingDetail';
frontend/src/screens/Favorites.tsx:6:import type { Favorite, Listing, ListingType } from '../types';
frontend/src/screens/Favorites.tsx:8:const TITLE: Record<string, string> = {
frontend/src/screens/Favorites.tsx:9:  RESTAURANT: 'Подписки на заведения',
frontend/src/screens/Favorites.tsx:10:  DISH: 'Подписки на блюда',
frontend/src/screens/Favorites.tsx:11:  DRINK: 'Подписки на напитки',
frontend/src/screens/Favorites.tsx:12:};
frontend/src/screens/Favorites.tsx:14:export default function Favorites() {
frontend/src/screens/Favorites.tsx:15:  const [favs, setFavs] = useState<Favorite[]>([]);
frontend/src/screens/Favorites.tsx:16:  const [active, setActive] = useState<Listing | null>(null);
frontend/src/screens/Favorites.tsx:17:  const nav = useNavigate();
frontend/src/screens/Favorites.tsx:18:  const [params] = useSearchParams();
frontend/src/screens/Favorites.tsx:19:  const type = params.get('type') as ListingType | null;
frontend/src/screens/Favorites.tsx:20:  const showBack = !!type || params.get('from') === 'profile';
frontend/src/screens/Favorites.tsx:22:  const load = () => api.favorites().then(setFavs).catch(() => {});
frontend/src/screens/Favorites.tsx:23:  useEffect(() => {
frontend/src/screens/Favorites.tsx:24:    load();
frontend/src/screens/Favorites.tsx:25:    // cold launch / tunnel warm-up can miss the first fetch → retry, and refetch
frontend/src/screens/Favorites.tsx:26:    // whenever the app regains focus (returning to this tab)
frontend/src/screens/Favorites.tsx:27:    const t = setTimeout(load, 1200);
frontend/src/screens/Favorites.tsx:28:    const onFocus = () => load();
frontend/src/screens/Favorites.tsx:29:    const onVis = () => { if (!document.hidden) load(); };
frontend/src/screens/Favorites.tsx:30:    window.addEventListener('focus', onFocus);
frontend/src/screens/Favorites.tsx:31:    document.addEventListener('visibilitychange', onVis);
frontend/src/screens/Favorites.tsx:32:    return () => {
frontend/src/screens/Favorites.tsx:33:      clearTimeout(t);
frontend/src/screens/Favorites.tsx:34:      window.removeEventListener('focus', onFocus);
frontend/src/screens/Favorites.tsx:35:      document.removeEventListener('visibilitychange', onVis);
frontend/src/screens/Favorites.tsx:36:    };
frontend/src/screens/Favorites.tsx:37:  }, []);
frontend/src/screens/Favorites.tsx:39:  async function remove(id: string) {
frontend/src/screens/Favorites.tsx:40:    await api.removeFavorite(id);
frontend/src/screens/Favorites.tsx:41:    load();
frontend/src/screens/Favorites.tsx:42:  }
frontend/src/screens/Favorites.tsx:44:  const shown = type ? favs.filter((f) => f.listing.type === type) : favs;
frontend/src/screens/Favorites.tsx:46:  return (
frontend/src/screens/Favorites.tsx:47:    <div>
frontend/src/screens/Favorites.tsx:48:      <div className={'topbar' + (showBack ? ' with-back' : '')}>
frontend/src/screens/Favorites.tsx:49:        {showBack && (
frontend/src/screens/Favorites.tsx:50:          <button className="back-btn" onClick={() => nav(-1)}>
frontend/src/screens/Favorites.tsx:51:            ←
frontend/src/screens/Favorites.tsx:52:          </button>
frontend/src/screens/Favorites.tsx:53:        )}
frontend/src/screens/Favorites.tsx:54:        <h2>{type ? TITLE[type] : 'Хочу попробовать'}</h2>
frontend/src/screens/Favorites.tsx:55:      </div>
frontend/src/screens/Favorites.tsx:56:      {shown.length === 0 ? (
frontend/src/screens/Favorites.tsx:57:        <div className="empty">Пока пусто. Нажимайте «Хочу попробовать» на карточках — они соберутся здесь.</div>
frontend/src/screens/Favorites.tsx:58:      ) : (
frontend/src/screens/Favorites.tsx:59:        <div className="grid">
frontend/src/screens/Favorites.tsx:60:          {shown.map((f) => (
frontend/src/screens/Favorites.tsx:61:            <ListingCard
frontend/src/screens/Favorites.tsx:62:              key={f.listingId}
frontend/src/screens/Favorites.tsx:63:              listing={f.listing}
frontend/src/screens/Favorites.tsx:64:              favorite
frontend/src/screens/Favorites.tsx:65:              onToggleFavorite={() => remove(f.listingId)}
frontend/src/screens/Favorites.tsx:66:              onClick={() => setActive(f.listing)}
frontend/src/screens/Favorites.tsx:67:            />
frontend/src/screens/Favorites.tsx:68:          ))}
frontend/src/screens/Favorites.tsx:69:        </div>
frontend/src/screens/Favorites.tsx:70:      )}
frontend/src/screens/Favorites.tsx:71:      {active && (
frontend/src/screens/Favorites.tsx:72:        <ListingDetailModal id={active.id} onClose={() => setActive(null)} />
frontend/src/screens/Favorites.tsx:73:      )}
frontend/src/screens/Favorites.tsx:74:    </div>
frontend/src/screens/Favorites.tsx:75:  );
frontend/src/screens/Favorites.tsx:76:}
frontend/src/screens/Alerts.tsx:1:import { lazy, Suspense, useEffect, useState } from 'react';
frontend/src/screens/Alerts.tsx:2:import { api } from '../api';
frontend/src/screens/Alerts.tsx:3:import { UserProfileModal } from '../components/People';
frontend/src/screens/Alerts.tsx:4:import type { AppNotification } from '../types';
frontend/src/screens/Alerts.tsx:5:const ListingDetailModal = lazy(() => import('../components/ListingDetail').then((m) => ({ default: m.ListingDetailModal })));
frontend/src/screens/Alerts.tsx:7:const KIND_ICON: Record<string, string> = { vote: '👍', comment: '💬', follow: '➕', friend_post: '📝', rating_up: '🏅' };
frontend/src/screens/Alerts.tsx:9:function ago(iso: string): string {
frontend/src/screens/Alerts.tsx:10:  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
frontend/src/screens/Alerts.tsx:11:  if (s < 60) return 'только что';
frontend/src/screens/Alerts.tsx:12:  const m = Math.floor(s / 60);
frontend/src/screens/Alerts.tsx:13:  if (m < 60) return `${m} мин назад`;
frontend/src/screens/Alerts.tsx:14:  const h = Math.floor(m / 60);
frontend/src/screens/Alerts.tsx:15:  if (h < 24) return `${h} ч назад`;
frontend/src/screens/Alerts.tsx:16:  const d = Math.floor(h / 24);
frontend/src/screens/Alerts.tsx:17:  return d === 1 ? 'вчера' : `${d} дн назад`;
frontend/src/screens/Alerts.tsx:18:}
frontend/src/screens/Alerts.tsx:20:// Notification center (the bell): every social event lands here; tapping an item
frontend/src/screens/Alerts.tsx:21:// opens its SOURCE — the review's card, or the actor's profile for follows.
frontend/src/screens/Alerts.tsx:22:export default function Alerts() {
frontend/src/screens/Alerts.tsx:23:  const [items, setItems] = useState<AppNotification[] | null>(null);
frontend/src/screens/Alerts.tsx:24:  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
frontend/src/screens/Alerts.tsx:25:  const [openListingId, setOpenListingId] = useState<string | null>(null);
frontend/src/screens/Alerts.tsx:26:  const [openUser, setOpenUser] = useState<string | null>(null);
frontend/src/screens/Alerts.tsx:28:  useEffect(() => {
frontend/src/screens/Alerts.tsx:29:    api
frontend/src/screens/Alerts.tsx:30:      .notifications()
frontend/src/screens/Alerts.tsx:31:      .then(({ items }) => {
frontend/src/screens/Alerts.tsx:32:        setItems(items);
frontend/src/screens/Alerts.tsx:33:        setFreshIds(new Set(items.filter((n) => !n.readAt).map((n) => n.id)));
frontend/src/screens/Alerts.tsx:34:        // opening the center reads everything → the badge resets
frontend/src/screens/Alerts.tsx:35:        api.notificationsRead().catch(() => {});
frontend/src/screens/Alerts.tsx:36:        window.dispatchEvent(new CustomEvent('alerts-read'));
frontend/src/screens/Alerts.tsx:37:      })
frontend/src/screens/Alerts.tsx:38:      .catch(() => setItems([]));
frontend/src/screens/Alerts.tsx:39:  }, []);
frontend/src/screens/Alerts.tsx:41:  const open = (n: AppNotification) => {
frontend/src/screens/Alerts.tsx:42:    if (n.kind === 'follow' && n.actorId) setOpenUser(n.actorId);
frontend/src/screens/Alerts.tsx:43:    else if (n.listingId) setOpenListingId(n.listingId);
frontend/src/screens/Alerts.tsx:44:    else if (n.actorId) setOpenUser(n.actorId);
frontend/src/screens/Alerts.tsx:45:  };
frontend/src/screens/Alerts.tsx:47:  return (
frontend/src/screens/Alerts.tsx:48:    <div>
frontend/src/screens/Alerts.tsx:49:      <div className="topbar">
frontend/src/screens/Alerts.tsx:50:        <h2>🔔 Уведомления</h2>
frontend/src/screens/Alerts.tsx:51:      </div>
frontend/src/screens/Alerts.tsx:52:      {items === null ? (
frontend/src/screens/Alerts.tsx:53:        <div className="empty">Загрузка…</div>
frontend/src/screens/Alerts.tsx:54:      ) : items.length === 0 ? (
frontend/src/screens/Alerts.tsx:55:        <div className="empty">
frontend/src/screens/Alerts.tsx:56:          Пока тихо. Здесь появятся оценки и комментарии к вашим отзывам, новые подписчики и посты тех, на кого вы подписаны.
frontend/src/screens/Alerts.tsx:57:        </div>
frontend/src/screens/Alerts.tsx:58:      ) : (
frontend/src/screens/Alerts.tsx:59:        items.map((n) => (
frontend/src/screens/Alerts.tsx:60:          <div key={n.id} className={`alert-row${freshIds.has(n.id) ? ' fresh' : ''}`} onClick={() => open(n)}>
frontend/src/screens/Alerts.tsx:61:            {n.actorPhoto ? (
frontend/src/screens/Alerts.tsx:62:              <img
frontend/src/screens/Alerts.tsx:63:                className="alert-avatar"
frontend/src/screens/Alerts.tsx:64:                src={n.actorPhoto}
frontend/src/screens/Alerts.tsx:65:                alt=""
frontend/src/screens/Alerts.tsx:66:                onClick={(e) => { if (n.actorId) { e.stopPropagation(); setOpenUser(n.actorId); } }}
frontend/src/screens/Alerts.tsx:67:              />
frontend/src/screens/Alerts.tsx:68:            ) : (
frontend/src/screens/Alerts.tsx:69:              <span className="alert-ico">{KIND_ICON[n.kind] ?? '🔔'}</span>
frontend/src/screens/Alerts.tsx:70:            )}
frontend/src/screens/Alerts.tsx:71:            <div className="alert-body">
frontend/src/screens/Alerts.tsx:72:              <div className="alert-text">{n.text}</div>
frontend/src/screens/Alerts.tsx:73:              <div className="alert-meta">
frontend/src/screens/Alerts.tsx:74:                {ago(n.createdAt)}
frontend/src/screens/Alerts.tsx:75:                {n.actorId && (
frontend/src/screens/Alerts.tsx:76:                  <>
frontend/src/screens/Alerts.tsx:77:                    {' · '}
frontend/src/screens/Alerts.tsx:78:                    <span
frontend/src/screens/Alerts.tsx:79:                      className="alert-user"
frontend/src/screens/Alerts.tsx:80:                      onClick={(e) => { e.stopPropagation(); setOpenUser(n.actorId!); }}
frontend/src/screens/Alerts.tsx:81:                    >
frontend/src/screens/Alerts.tsx:82:                      {n.actorName ?? 'профиль'}
frontend/src/screens/Alerts.tsx:83:                    </span>
frontend/src/screens/Alerts.tsx:84:                  </>
frontend/src/screens/Alerts.tsx:85:                )}
frontend/src/screens/Alerts.tsx:86:              </div>
frontend/src/screens/Alerts.tsx:87:            </div>
frontend/src/screens/Alerts.tsx:88:            {n.reviewPhoto && <img className="alert-thumb" src={n.reviewPhoto} alt="" loading="lazy" />}
frontend/src/screens/Alerts.tsx:89:            {freshIds.has(n.id) && <span className="alert-dot" />}
frontend/src/screens/Alerts.tsx:90:          </div>
frontend/src/screens/Alerts.tsx:91:        ))
frontend/src/screens/Alerts.tsx:92:      )}
frontend/src/screens/Alerts.tsx:93:      {openListingId && (
frontend/src/screens/Alerts.tsx:94:        <Suspense fallback={null}>
frontend/src/screens/Alerts.tsx:95:          <ListingDetailModal id={openListingId} onClose={() => setOpenListingId(null)} />
frontend/src/screens/Alerts.tsx:96:        </Suspense>
frontend/src/screens/Alerts.tsx:97:      )}
frontend/src/screens/Alerts.tsx:98:      {openUser && <UserProfileModal id={openUser} onClose={() => setOpenUser(null)} />}
frontend/src/screens/Alerts.tsx:99:    </div>
frontend/src/screens/Alerts.tsx:100:  );
frontend/src/screens/Alerts.tsx:101:}
frontend/src/screens/MyRatings.tsx:18:// cache the profile + reviews so a cold launch shows them INSTANTLY (no "Гость"/empty
frontend/src/screens/MyRatings.tsx:22:  try { return JSON.parse(localStorage.getItem(ME_CACHE) || '{}'); } catch { return {}; }
frontend/src/screens/MyRatings.tsx:25:  try { localStorage.setItem(ME_CACHE, JSON.stringify({ ...readCache(), ...patch })); } catch { /* quota */ }
frontend/src/screens/MyRatings.tsx:28:export default function MyRatings() {
frontend/src/screens/MyRatings.tsx:34:  const [profile, setProfile] = useState<Profile | null>(cached.profile?.user ? cached.profile : null);
frontend/src/screens/MyRatings.tsx:35:  const [reviews, setReviews] = useState<Review[]>(cached.reviews ?? []);
frontend/src/screens/MyRatings.tsx:36:  const [stats, setStats] = useState<UserStats | null>(null);
frontend/src/screens/MyRatings.tsx:37:  const [specs, setSpecs] = useState<Specialization[]>([]);
frontend/src/screens/MyRatings.tsx:38:  const [owned, setOwned] = useState<Listing[]>([]);
frontend/src/screens/MyRatings.tsx:39:  const [edit, setEdit] = useState<Review | null>(null);
frontend/src/screens/MyRatings.tsx:40:  const [showAdd, setShowAdd] = useState(false);
frontend/src/screens/MyRatings.tsx:41:  const [showSupport, setShowSupport] = useState(false);
frontend/src/screens/MyRatings.tsx:42:  const [taste, setTaste] = useState<TasteProfile | null>(cached.taste ?? null);
frontend/src/screens/MyRatings.tsx:43:  const [impactTab, setImpactTab] = useState<'taste' | 'photos'>('taste');
frontend/src/screens/MyRatings.tsx:44:  const [people, setPeople] = useState<'followers' | 'following' | null>(null);
frontend/src/screens/MyRatings.tsx:45:  const [openUser, setOpenUser] = useState<string | null>(null);
frontend/src/screens/MyRatings.tsx:46:  const [openListing, setOpenListing] = useState<string | null>(null);
frontend/src/screens/MyRatings.tsx:47:  const [recent, setRecent] = useState<Listing[]>([]);
frontend/src/screens/MyRatings.tsx:48:  const [noStory, setNoStory] = useState(localStorage.getItem('noStoryOnReview') === '1');
frontend/src/screens/MyRatings.tsx:49:  const [photoReview, setPhotoReview] = useState<Review | null>(null);
frontend/src/screens/MyRatings.tsx:65:  useEffect(() => {
frontend/src/screens/MyRatings.tsx:79:    window.addEventListener('focus', onFocus);
frontend/src/screens/MyRatings.tsx:83:      window.removeEventListener('focus', onFocus);
frontend/src/screens/MyRatings.tsx:116:  return (
frontend/src/screens/MyRatings.tsx:117:    <div className="me">
frontend/src/screens/MyRatings.tsx:118:      <div className="me-topbar">
frontend/src/screens/MyRatings.tsx:119:        <button className="me-icon" onClick={share} aria-label="Поделиться">
frontend/src/screens/MyRatings.tsx:124:      <div className="me-head">
frontend/src/screens/MyRatings.tsx:126:          <img className="me-avatar" src={profile.user.photoUrl} alt="" />
frontend/src/screens/MyRatings.tsx:128:          <div className="me-avatar ph">📷</div>
frontend/src/screens/MyRatings.tsx:130:        <div className="me-name">{name}</div>
frontend/src/screens/MyRatings.tsx:131:        <div className="me-stats">
frontend/src/screens/MyRatings.tsx:132:          <button className="stat-btn" onClick={() => setPeople('followers')}>
frontend/src/screens/MyRatings.tsx:135:          <button className="stat-btn" onClick={() => setPeople('following')}>
frontend/src/screens/MyRatings.tsx:143:      <div className="me-actions">
frontend/src/screens/MyRatings.tsx:144:        <button className="me-action" onClick={() => nav('/')}>
frontend/src/screens/MyRatings.tsx:145:          <span className="ma-ico">⭐</span>
frontend/src/screens/MyRatings.tsx:148:        <button className="me-action" onClick={() => nav('/')}>
frontend/src/screens/MyRatings.tsx:149:          <span className="ma-ico">📷</span>
frontend/src/screens/MyRatings.tsx:152:        <button className="me-action" onClick={() => setShowAdd(true)}>
frontend/src/screens/MyRatings.tsx:153:          <span className="ma-ico">🏪</span>
frontend/src/screens/MyRatings.tsx:163:        <div className="me-section">
frontend/src/screens/MyRatings.tsx:164:          <h2 className="me-h">🗺 Карта дегустатора</h2>
frontend/src/screens/MyRatings.tsx:165:          <div className="spec-grid">
frontend/src/screens/MyRatings.tsx:170:                <div key={s.id} className={'spec-card' + (s.tier ? ' on' : '')}>
frontend/src/screens/MyRatings.tsx:171:                  <span className="spec-ico">{s.icon}</span>
frontend/src/screens/MyRatings.tsx:172:                  <div className="spec-body">
frontend/src/screens/MyRatings.tsx:173:                    <div className="spec-label">{s.tier ? `${s.tier} · ${s.label}` : s.label}</div>
frontend/src/screens/MyRatings.tsx:174:                    <div className="spec-meta">
frontend/src/screens/MyRatings.tsx:187:        <div className="me-section">
frontend/src/screens/MyRatings.tsx:188:          <h2 className="me-h">🏆 Репутация</h2>
frontend/src/screens/MyRatings.tsx:189:          <div className="rep-grid">
frontend/src/screens/MyRatings.tsx:190:            <div className="rep-item">
frontend/src/screens/MyRatings.tsx:194:            <div className="rep-item">
frontend/src/screens/MyRatings.tsx:198:            <div className="rep-item">
frontend/src/screens/MyRatings.tsx:202:            <div className="rep-item">
frontend/src/screens/MyRatings.tsx:211:        <div className="me-section">
frontend/src/screens/MyRatings.tsx:212:          <h2 className="me-h">🎯 Обучение рекомендаций</h2>
frontend/src/screens/MyRatings.tsx:213:          <p className="me-hint" style={{ marginTop: -4 }}>
frontend/src/screens/MyRatings.tsx:217:          <div className="accuracy-block">
frontend/src/screens/MyRatings.tsx:221:                <div key={c.name} className="acc-row">
frontend/src/screens/MyRatings.tsx:222:                  <span className="acc-name">{c.name}</span>
frontend/src/screens/MyRatings.tsx:223:                  <div className="acc-track">
frontend/src/screens/MyRatings.tsx:224:                    <div className="acc-fill" style={{ width: `${acc}%` }} />
frontend/src/screens/MyRatings.tsx:226:                  <span className="acc-val">{acc}%</span>
frontend/src/screens/MyRatings.tsx:235:        <div className="me-section">
frontend/src/screens/MyRatings.tsx:236:          <h2 className="me-h">🔒 Вкусовой профиль</h2>
frontend/src/screens/MyRatings.tsx:240:              <div className="game-unlock">
frontend/src/screens/MyRatings.tsx:241:                <span className="game-unlock-ico">🔒</span>
frontend/src/screens/MyRatings.tsx:243:                  <div className="acc-track" style={{ marginTop: 4 }}>
frontend/src/screens/MyRatings.tsx:244:                    <div className="acc-fill" style={{ width: `${Math.min(100, (u.have / u.need) * 100)}%` }} />
frontend/src/screens/MyRatings.tsx:246:                  <div className="game-unlock-sub">
frontend/src/screens/MyRatings.tsx:256:        className="me-section"
frontend/src/screens/MyRatings.tsx:287:        <h2 className="me-h">О вкусе</h2>
frontend/src/screens/MyRatings.tsx:288:        <div className="impact-tabs">
frontend/src/screens/MyRatings.tsx:290:            className={'impact-tab' + (impactTab === 'taste' ? ' active' : '')}
frontend/src/screens/MyRatings.tsx:291:            onClick={() => setImpactTab('taste')}
frontend/src/screens/MyRatings.tsx:296:            className={'impact-tab' + (impactTab === 'photos' ? ' active' : '')}
frontend/src/screens/MyRatings.tsx:297:            onClick={() => setImpactTab('photos')}
frontend/src/screens/MyRatings.tsx:303:        <div key={impactTab} className="impact-pane">
frontend/src/screens/MyRatings.tsx:307:              <p className="me-hint">
frontend/src/screens/MyRatings.tsx:311:              <button className="btn secondary" onClick={() => nav('/')}>
frontend/src/screens/MyRatings.tsx:316:            <div className="taste-card">
frontend/src/screens/MyRatings.tsx:318:                <div className="taste-line">
frontend/src/screens/MyRatings.tsx:319:                  <span className="taste-key">🥇 Лучшая находка</span>
frontend/src/screens/MyRatings.tsx:320:                  <span className="taste-val">{taste.best.name} · {taste.best.rating.toFixed(1)}★</span>
frontend/src/screens/MyRatings.tsx:324:                <div className="taste-line">
frontend/src/screens/MyRatings.tsx:325:                  <span className="taste-key">Чаще всего пробует</span>
frontend/src/screens/MyRatings.tsx:326:                  <span className="taste-val">{taste.favorite.name} ({taste.favorite.count})</span>
frontend/src/screens/MyRatings.tsx:330:                <div className="taste-line">
frontend/src/screens/MyRatings.tsx:331:                  <span className="taste-key">Любит</span>
frontend/src/screens/MyRatings.tsx:332:                  <span className="taste-val">{taste.loves.join(' · ')}</span>
frontend/src/screens/MyRatings.tsx:335:              <div className="taste-line">
frontend/src/screens/MyRatings.tsx:336:                <span className="taste-key">Средняя оценка</span>
frontend/src/screens/MyRatings.tsx:337:                <span className="taste-val">{taste.avg?.toFixed(1)}★</span>
frontend/src/screens/MyRatings.tsx:339:              <div className="taste-line">
frontend/src/screens/MyRatings.tsx:340:                <span className="taste-key">Распробовал категорий</span>
frontend/src/screens/MyRatings.tsx:341:                <span className="taste-val">{taste.categoriesTried}</span>
frontend/src/screens/MyRatings.tsx:347:          <p className="me-hint">Пока нет фото. Прикрепите фото к отзыву.</p>
frontend/src/screens/MyRatings.tsx:349:          <div className="me-photo-grid">
frontend/src/screens/MyRatings.tsx:361:        <div className="me-section">
frontend/src/screens/MyRatings.tsx:362:          <h2 className="me-h">Оценки по категориям</h2>
frontend/src/screens/MyRatings.tsx:368:        <div className="me-section">
frontend/src/screens/MyRatings.tsx:369:          <h2 className="me-h">Недавно смотрели</h2>
frontend/src/screens/MyRatings.tsx:371:            <button key={l.id} className="recent-row" onClick={() => setOpenListing(l.id)}>
frontend/src/screens/MyRatings.tsx:372:              <VenuePhoto listing={l} className="recent-img" />
frontend/src/screens/MyRatings.tsx:374:                <div className="name">{l.name}</div>
frontend/src/screens/MyRatings.tsx:375:                {l.address && <div className="meta">{l.address}</div>}
frontend/src/screens/MyRatings.tsx:382:      <div className="me-section">
frontend/src/screens/MyRatings.tsx:383:        <h2 className="me-h">Вклад</h2>
frontend/src/screens/MyRatings.tsx:384:        <div className="contrib-row">
frontend/src/screens/MyRatings.tsx:388:        <button className="contrib-row link" onClick={() => nav('/business')}>
frontend/src/screens/MyRatings.tsx:396:      <div className="me-section">
frontend/src/screens/MyRatings.tsx:397:        <h2 className="me-h">Ещё</h2>
frontend/src/screens/MyRatings.tsx:398:        <button className="contrib-row link" onClick={() => nav('/business')}>
frontend/src/screens/MyRatings.tsx:400:          <span className="chev">›</span>
frontend/src/screens/MyRatings.tsx:402:        <button className="contrib-row link" onClick={() => nav('/favorites?from=profile')}>
frontend/src/screens/MyRatings.tsx:404:          <span className="chev">›</span>
frontend/src/screens/MyRatings.tsx:407:          className="contrib-row link"
frontend/src/screens/MyRatings.tsx:408:          onClick={() => {
frontend/src/screens/MyRatings.tsx:409:            localStorage.setItem('force_quiz', '1');
frontend/src/screens/MyRatings.tsx:414:          <span className="chev">›</span>
frontend/src/screens/MyRatings.tsx:416:        <button className="contrib-row link" onClick={() => setShowSupport(true)}>
frontend/src/screens/MyRatings.tsx:418:          <span className="chev">›</span>
frontend/src/screens/MyRatings.tsx:422:          className="contrib-row link"
frontend/src/screens/MyRatings.tsx:423:          onClick={() => {
frontend/src/screens/MyRatings.tsx:426:            localStorage.setItem('noStoryOnReview', v ? '1' : '0');
frontend/src/screens/MyRatings.tsx:430:          <span className={'toggle' + (noStory ? ' on' : '')}>{noStory ? 'Вкл' : 'Выкл'}</span>
frontend/src/screens/MyRatings.tsx:436:        <div className="me-section">
frontend/src/screens/MyRatings.tsx:437:          <h2 className="me-h">Мои отзывы</h2>
frontend/src/screens/MyRatings.tsx:438:          <div className="empty">
frontend/src/screens/MyRatings.tsx:450:                <div className="me-section">
frontend/src/screens/MyRatings.tsx:451:                  <h2 className="me-h">Оценки</h2>
frontend/src/screens/MyRatings.tsx:452:                  <div className="rc-carousel">
frontend/src/screens/MyRatings.tsx:454:                      <button key={r.id} onClick={() => setPhotoReview(withMe(r))}>
frontend/src/screens/MyRatings.tsx:461:              <div className="me-section">
frontend/src/screens/MyRatings.tsx:462:                <h2 className="me-h">Мои отзывы</h2>
frontend/src/screens/Business.tsx:27:export default function Business() {
frontend/src/screens/Business.tsx:29:  const [me, setMe] = useState<Profile['user'] | null>(null);
frontend/src/screens/Business.tsx:30:  const [claims, setClaims] = useState<Claim[]>([]);
frontend/src/screens/Business.tsx:31:  const [venues, setVenues] = useState<Listing[]>([]);
frontend/src/screens/Business.tsx:32:  const [adminClaims, setAdminClaims] = useState<Claim[]>([]);
frontend/src/screens/Business.tsx:33:  const [adminBiz, setAdminBiz] = useState<BusinessSubmission[]>([]);
frontend/src/screens/Business.tsx:34:  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
frontend/src/screens/Business.tsx:35:  const [adminItems, setAdminItems] = useState<PendingMenuLink[]>([]);
frontend/src/screens/Business.tsx:36:  const [adminCorr, setAdminCorr] = useState<Correction[]>([]);
frontend/src/screens/Business.tsx:37:  const [adminSupport, setAdminSupport] = useState<SupportMsg[]>([]);
frontend/src/screens/Business.tsx:38:  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
frontend/src/screens/Business.tsx:39:  const [adminChal, setAdminChal] = useState<AdminChallenge[]>([]);
frontend/src/screens/Business.tsx:41:  const [ux, setUx] = useState<Awaited<ReturnType<typeof api.uxInsights>> | null>(null);
frontend/src/screens/Business.tsx:42:  const [gameCfg, setGameCfg] = useState<Record<string, unknown> | null>(null);
frontend/src/screens/Business.tsx:43:  const [cfgDraft, setCfgDraft] = useState<Record<string, string>>({});
frontend/src/screens/Business.tsx:44:  const [cfgStatus, setCfgStatus] = useState<Record<string, string>>({});
frontend/src/screens/Business.tsx:45:  const [chForm, setChForm] = useState({ title: '', category: '', target: '5', days: '14' });
frontend/src/screens/Business.tsx:46:  const [openSec, setOpenSec] = useState<string | null>(null);
frontend/src/screens/Business.tsx:47:  const [mySubs, setMySubs] = useState<BusinessSubmission[]>([]);
frontend/src/screens/Business.tsx:48:  const [edit, setEdit] = useState<Listing | null>(null);
frontend/src/screens/Business.tsx:49:  const [reviewsFor, setReviewsFor] = useState<Listing | null>(null);
frontend/src/screens/Business.tsx:50:  const [pendingFor, setPendingFor] = useState<Listing | null>(null);
frontend/src/screens/Business.tsx:51:  const [openListing, setOpenListing] = useState<string | null>(null);
frontend/src/screens/Business.tsx:52:  const [openUser, setOpenUser] = useState<string | null>(null);
frontend/src/screens/Business.tsx:60:  useEffect(() => {
frontend/src/screens/Business.tsx:122:  useEffect(() => {
frontend/src/screens/Business.tsx:158:  return (
frontend/src/screens/Business.tsx:160:      <div className="topbar with-back">
frontend/src/screens/Business.tsx:161:        <button className="back-btn" onClick={() => nav('/me')} aria-label="Назад">
frontend/src/screens/Business.tsx:168:        <div className="biz-note">
frontend/src/screens/Business.tsx:171:            <div className="meta" style={{ color: 'var(--hint)', marginTop: 4 }}>
frontend/src/screens/Business.tsx:182:            <div className="empty">Заявок нет</div>
frontend/src/screens/Business.tsx:185:              <div key={c.id} className="biz-card">
frontend/src/screens/Business.tsx:187:                <div className="meta" style={{ color: 'var(--hint)' }}>
frontend/src/screens/Business.tsx:192:                  <button className="btn" onClick={() => decide(c.id, true)}>
frontend/src/screens/Business.tsx:195:                  <button className="btn secondary" onClick={() => decide(c.id, false)}>
frontend/src/screens/Business.tsx:206:            <div className="empty">Нет отзывов на проверке</div>
frontend/src/screens/Business.tsx:221:            <div className="empty">Нет предложений</div>
frontend/src/screens/Business.tsx:224:              <div key={p.itemId} className="biz-card">
frontend/src/screens/Business.tsx:226:                <div className="meta" style={{ color: 'var(--hint)' }}>
frontend/src/screens/Business.tsx:232:                  <button className="btn" onClick={() => decideItem(p.venueId, p.itemId, true)}>
frontend/src/screens/Business.tsx:235:                  <button className="btn secondary" onClick={() => decideItem(p.venueId, p.itemId, false)}>
frontend/src/screens/Business.tsx:247:            <div className="empty">Заявок нет</div>
frontend/src/screens/Business.tsx:255:            <div className="empty">Сообщений нет</div>
frontend/src/screens/Business.tsx:258:              <div key={m.id} className="biz-card">
frontend/src/screens/Business.tsx:261:                  <span className="meta" style={{ color: 'var(--hint)' }}> @{m.user.username}</span>
frontend/src/screens/Business.tsx:264:                <div className="meta" style={{ color: 'var(--hint)', fontSize: 12, marginTop: 2 }}>
frontend/src/screens/Business.tsx:274:            <div className="empty">Правок нет</div>
frontend/src/screens/Business.tsx:277:              <div key={c.id} className="biz-card">
frontend/src/screens/Business.tsx:279:                <div className="meta" style={{ color: 'var(--hint)' }}>
frontend/src/screens/Business.tsx:283:                <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => resolveCorr(c.id)}>
frontend/src/screens/Business.tsx:292:          <div className="biz-card">
frontend/src/screens/Business.tsx:294:              placeholder="Название (напр. Оцените 5 кофеен)"
frontend/src/screens/Business.tsx:296:              onChange={(e) => setChForm({ ...chForm, title: e.target.value })}
frontend/src/screens/Business.tsx:301:                placeholder="Категория (кофе/вино…, пусто=любое)"
frontend/src/screens/Business.tsx:303:                onChange={(e) => setChForm({ ...chForm, category: e.target.value })}
frontend/src/screens/Business.tsx:307:                placeholder="Цель"
frontend/src/screens/Business.tsx:309:                onChange={(e) => setChForm({ ...chForm, target: e.target.value })}
frontend/src/screens/Business.tsx:313:                placeholder="Дней"
frontend/src/screens/Business.tsx:315:                onChange={(e) => setChForm({ ...chForm, days: e.target.value })}
frontend/src/screens/Business.tsx:319:            <button className="btn" onClick={createChallenge}>
frontend/src/screens/Business.tsx:324:            <div key={c.id} className="biz-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
frontend/src/screens/Business.tsx:327:                <div className="meta" style={{ color: 'var(--hint)' }}>
frontend/src/screens/Business.tsx:331:              <button className="btn secondary" onClick={() => deactivateChallenge(c.id)}>
frontend/src/screens/Business.tsx:342:              className="biz-card"
frontend/src/screens/Business.tsx:344:              onClick={() => setOpenUser(u.id)}
frontend/src/screens/Business.tsx:347:              <span className="meta" style={{ color: 'var(--hint)' }}>
frontend/src/screens/Business.tsx:351:              <div className="meta" style={{ color: 'var(--hint)', fontSize: 12, marginTop: 2 }}>
frontend/src/screens/Business.tsx:384:              <div className="empty">Загрузка…</div>
frontend/src/screens/Business.tsx:387:                <div className="meta" style={{ color: 'var(--hint)', marginBottom: 8 }}>
frontend/src/screens/Business.tsx:391:                  <div key={key} className="biz-card">
frontend/src/screens/Business.tsx:394:                      className="cfg-edit"
frontend/src/screens/Business.tsx:397:                      onChange={(e) => {
frontend/src/screens/Business.tsx:403:                      <button className="btn" style={{ padding: '8px 14px' }} onClick={() => saveCfg(key)}>
frontend/src/screens/Business.tsx:406:                      {cfgStatus[key] && <span className="meta">{cfgStatus[key]}</span>}
frontend/src/screens/Business.tsx:416:              <div className="empty">Загрузка…</div>
frontend/src/screens/Business.tsx:418:              <div className="empty">Пока нет данных о поведении. Появятся по мере использования.</div>
frontend/src/screens/Business.tsx:421:                <div className="meta" style={{ color: 'var(--hint)', marginBottom: 8 }}>
frontend/src/screens/Business.tsx:425:                  <div key={i} className="biz-card" style={{ lineHeight: 1.4 }}>{t}</div>
frontend/src/screens/Business.tsx:429:                    <div className="section-title" style={{ fontSize: 15, marginTop: 10 }}>
frontend/src/screens/Business.tsx:433:                      <div key={t.el} className="biz-card" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
frontend/src/screens/Business.tsx:440:                <div className="section-title" style={{ fontSize: 15, marginTop: 10 }}>По экранам</div>
frontend/src/screens/Business.tsx:442:                  <div key={s.name} className="biz-card">
frontend/src/screens/Business.tsx:444:                    <div className="meta" style={{ color: 'var(--hint)' }}>
frontend/src/screens/Business.tsx:458:          <div className="section-title">Мои заявки на добавление</div>
frontend/src/screens/Business.tsx:460:            <div key={s.id} className="biz-card">
frontend/src/screens/Business.tsx:462:              <div className="meta" style={{ color: 'var(--hint)' }}>
frontend/src/screens/Business.tsx:470:      <div className="section-title">Мои заведения ({venues.length})</div>
frontend/src/screens/Business.tsx:472:        <div className="empty">
frontend/src/screens/Business.tsx:477:          <div key={v.id} className="biz-card">
frontend/src/screens/Business.tsx:478:            <div className="vcard-top">
frontend/src/screens/Business.tsx:480:              {v.priceLevel ? <span className="price">{'₽'.repeat(v.priceLevel)}</span> : null}
frontend/src/screens/Business.tsx:484:              <span className="meta" style={{ color: 'var(--hint)' }}>
frontend/src/screens/Business.tsx:489:              <button className="btn secondary" onClick={() => setEdit(v)}>
frontend/src/screens/Business.tsx:492:              <button className="btn secondary" onClick={() => setReviewsFor(v)}>
frontend/src/screens/Business.tsx:495:              <button className="btn secondary" onClick={() => setPendingFor(v)}>
frontend/src/screens/Business.tsx:505:          <div className="section-title">Мои заявки</div>
frontend/src/screens/Business.tsx:507:            <div key={c.id} className="biz-card" style={{ display: 'flex', justifyContent: 'space-between' }}>
frontend/src/screens/Business.tsx:509:              <span className={`biz-status ${c.status}`}>{STATUS_LABEL[c.status]}</span>
frontend/src/screens/Business.tsx:540:function Acc({
frontend/src/screens/Business.tsx:556:  return (
frontend/src/screens/Business.tsx:557:    <div className="acc">
frontend/src/screens/Business.tsx:558:      <button className="acc-head" onClick={() => setOpenSec(open ? null : id)}>
frontend/src/screens/Business.tsx:559:        <span className="acc-title">{title}</span>
frontend/src/screens/Business.tsx:560:        <span className="acc-right">
frontend/src/screens/Business.tsx:561:          {count > 0 && <span className="acc-badge">{count}</span>}
frontend/src/screens/Business.tsx:562:          <span className="acc-chev">{open ? '▴' : '▾'}</span>
frontend/src/screens/Business.tsx:565:      {open && <div className="acc-body">{children}</div>}
frontend/src/screens/Business.tsx:572:function ReviewModCard({
frontend/src/screens/Business.tsx:582:  const [price, setPrice] = useState<string>(initial != null ? String(initial) : '');
frontend/src/screens/Business.tsx:584:  return (
frontend/src/screens/Business.tsx:585:    <div className="biz-card">
frontend/src/screens/Business.tsx:586:      <button className="link-name" onClick={() => r.listing && onOpen(r.listing.id)}>
frontend/src/screens/Business.tsx:589:      <div className="meta" style={{ color: 'var(--hint)' }}>
frontend/src/screens/Business.tsx:595:        <div className="photo-thumbs">
frontend/src/screens/Business.tsx:611:            onChange={(e) => setPrice(e.target.value)}
frontend/src/screens/Business.tsx:612:            placeholder="—"
frontend/src/screens/Business.tsx:619:          className="btn"
frontend/src/screens/Business.tsx:620:          onClick={() => onDecide(r.id, true, price ? Number(price) : undefined)}
frontend/src/screens/Business.tsx:624:        <button className="btn secondary" onClick={() => onDecide(r.id, false)}>
frontend/src/screens/Business.tsx:632:function BizCard({
frontend/src/screens/Business.tsx:643:  const [address, setAddress] = useState(sub.address ?? '');
frontend/src/screens/Business.tsx:644:  const [phone, setPhone] = useState(sub.phone ?? '');
frontend/src/screens/Business.tsx:645:  return (
frontend/src/screens/Business.tsx:646:    <div className="biz-card">
frontend/src/screens/Business.tsx:648:      <div className="meta" style={{ color: 'var(--hint)' }}>
frontend/src/screens/Business.tsx:655:      <div className="field" style={{ marginTop: 8 }}>
frontend/src/screens/Business.tsx:657:        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом" />
frontend/src/screens/Business.tsx:659:      <div className="field">
frontend/src/screens/Business.tsx:661:        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7…" />
frontend/src/screens/Business.tsx:665:          className="btn"
frontend/src/screens/Business.tsx:666:          onClick={() =>
frontend/src/screens/Business.tsx:672:        <button className="btn secondary" onClick={() => onDecide(sub.id, false)}>
frontend/src/screens/Business.tsx:680:function PendingItemsModal({ venue, onClose }: { venue: Listing; onClose: () => void }) {
frontend/src/screens/Business.tsx:681:  const [items, setItems] = useState<PendingMenuLink[]>([]);
frontend/src/screens/Business.tsx:682:  const [prices, setPrices] = useState<Record<string, string>>({});
frontend/src/screens/Business.tsx:684:  useEffect(() => {
frontend/src/screens/Business.tsx:695:  return (
frontend/src/screens/Business.tsx:696:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src/screens/Business.tsx:697:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src/screens/Business.tsx:700:          <div className="empty">Нет предложений на модерации</div>
frontend/src/screens/Business.tsx:703:            <div key={m.itemId} className="biz-card">
frontend/src/screens/Business.tsx:705:              <div className="meta" style={{ color: 'var(--hint)' }}>
frontend/src/screens/Business.tsx:714:                  placeholder="Цена ₽"
frontend/src/screens/Business.tsx:717:                  onChange={(e) => setPrices((p) => ({ ...p, [m.itemId]: e.target.value }))}
frontend/src/screens/Business.tsx:725:                <button className="btn" style={{ width: 'auto' }} onClick={() => decide(m.itemId, 'APPROVED')}>
frontend/src/screens/Business.tsx:729:                  className="btn secondary"
frontend/src/screens/Business.tsx:731:                  onClick={() => decide(m.itemId, 'REJECTED')}
frontend/src/screens/Business.tsx:739:        <button className="btn secondary" style={{ marginTop: 14 }} onClick={onClose}>
frontend/src/screens/Business.tsx:747:function EditVenueModal({
frontend/src/screens/Business.tsx:756:  const [f, setF] = useState({
frontend/src/screens/Business.tsx:764:  const [busy, setBusy] = useState(false);
frontend/src/screens/Business.tsx:775:  return (
frontend/src/screens/Business.tsx:776:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src/screens/Business.tsx:777:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src/screens/Business.tsx:779:        <div className="field">
frontend/src/screens/Business.tsx:781:          <input value={f.name} onChange={(e) => set('name', e.target.value)} />
frontend/src/screens/Business.tsx:783:        <div className="field">
frontend/src/screens/Business.tsx:785:          <textarea value={f.description} onChange={(e) => set('description', e.target.value)} />
frontend/src/screens/Business.tsx:787:        <div className="field">
frontend/src/screens/Business.tsx:791:            onChange={(e) => set('hours', e.target.value)}
frontend/src/screens/Business.tsx:792:            placeholder="Mo-Su 10:00-22:00"
frontend/src/screens/Business.tsx:795:        <div className="field">
frontend/src/screens/Business.tsx:797:          <input value={f.phone} onChange={(e) => set('phone', e.target.value)} />
frontend/src/screens/Business.tsx:799:        <div className="field">
frontend/src/screens/Business.tsx:801:          <input value={f.website} onChange={(e) => set('website', e.target.value)} />
frontend/src/screens/Business.tsx:803:        <div className="field">
frontend/src/screens/Business.tsx:807:            onChange={(e) => set('priceLevel', Number(e.target.value))}
frontend/src/screens/Business.tsx:817:          <button className="btn secondary" onClick={onClose} disabled={busy}>
frontend/src/screens/Business.tsx:820:          <button className="btn" onClick={save} disabled={busy}>
frontend/src/screens/Business.tsx:829:function VenueReviewsModal({ venue, onClose }: { venue: Listing; onClose: () => void }) {
frontend/src/screens/Business.tsx:830:  const [reviews, setReviews] = useState<Review[]>([]);
frontend/src/screens/Business.tsx:831:  const [drafts, setDrafts] = useState<Record<string, string>>({});
frontend/src/screens/Business.tsx:833:  useEffect(() => {
frontend/src/screens/Business.tsx:845:  return (
frontend/src/screens/Business.tsx:846:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src/screens/Business.tsx:847:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src/screens/Business.tsx:850:          <div className="empty">Отзывов пока нет</div>
frontend/src/screens/Business.tsx:860:                <div className="owner-reply">
frontend/src/screens/Business.tsx:866:                    placeholder="Ответить…"
frontend/src/screens/Business.tsx:868:                    onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
frontend/src/screens/Business.tsx:876:                  <button className="btn" style={{ width: 'auto' }} onClick={() => send(r.id)}>
frontend/src/screens/Business.tsx:884:        <button className="btn secondary" style={{ marginTop: 14 }} onClick={onClose}>

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "." frontend/src/components/ListingCard.tsx frontend/src/components/ListRow.tsx frontend/src/components/FeedPost.tsx frontend/src/components/SmartImg.tsx frontend/src/components/VenuePhoto.tsx frontend/src/components/Stars.tsx frontend/src/components/StarInput.tsx frontend/src/components/QuickRate.tsx frontend/src/components/NotInterested.tsx frontend/src/components/SimilarItems.tsx' in D:\Приложения\Yelp
 succeeded in 270ms:
frontend/src/components/SimilarItems.tsx:1:import { useEffect, useState } from 'react';
frontend/src/components/SimilarItems.tsx:2:import { api } from '../api';
frontend/src/components/SimilarItems.tsx:3:import type { Listing } from '../types';
frontend/src/components/SimilarItems.tsx:4:import { Stars } from './Stars';
frontend/src/components/SimilarItems.tsx:5:import { VenuePhoto } from './VenuePhoto';
frontend/src/components/SimilarItems.tsx:7:// "🤖 Похожие — вам зайдёт": semantic neighbours (embedding vector search over the
frontend/src/components/SimilarItems.tsx:8:// catalog). GATED server-side — only shown to users with enough rated cards to have a
frontend/src/components/SimilarItems.tsx:9:// taste profile. If locked or empty, renders NOTHING (no empty state, per spec).
frontend/src/components/SimilarItems.tsx:10:// `onOpen` navigates the parent detail modal (avoids a circular import).
frontend/src/components/SimilarItems.tsx:11:export function SimilarItems({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
frontend/src/components/SimilarItems.tsx:12:  const [items, setItems] = useState<Listing[] | null>(null);
frontend/src/components/SimilarItems.tsx:14:  useEffect(() => {
frontend/src/components/SimilarItems.tsx:15:    let alive = true;
frontend/src/components/SimilarItems.tsx:16:    api
frontend/src/components/SimilarItems.tsx:17:      .visionSimilar(id)
frontend/src/components/SimilarItems.tsx:18:      .then((r) => alive && setItems(r.locked ? [] : r.items))
frontend/src/components/SimilarItems.tsx:19:      .catch(() => alive && setItems([]));
frontend/src/components/SimilarItems.tsx:20:    return () => { alive = false; };
frontend/src/components/SimilarItems.tsx:21:  }, [id]);
frontend/src/components/SimilarItems.tsx:23:  if (!items || items.length === 0) return null;
frontend/src/components/SimilarItems.tsx:25:  return (
frontend/src/components/SimilarItems.tsx:26:    <div className="feed-section">
frontend/src/components/SimilarItems.tsx:27:      <div className="section-title big">🤖 Похожие — вам зайдёт</div>
frontend/src/components/SimilarItems.tsx:28:      <div className="feed">
frontend/src/components/SimilarItems.tsx:29:        {items.map((l) => (
frontend/src/components/SimilarItems.tsx:30:          <button key={l.id} className="myrate-card" onClick={() => onOpen(l.id)}>
frontend/src/components/SimilarItems.tsx:31:            <VenuePhoto listing={l} className="myrate-photo" />
frontend/src/components/SimilarItems.tsx:32:            <div className="myrate-name">{l.name}</div>
frontend/src/components/SimilarItems.tsx:33:            <div className="myrate-row">
frontend/src/components/SimilarItems.tsx:34:              <Stars value={l.avgRating} size={13} />
frontend/src/components/SimilarItems.tsx:35:              <span className="myrate-val">{l.reviewCount > 0 ? l.avgRating.toFixed(1) : '—'}</span>
frontend/src/components/SimilarItems.tsx:36:            </div>
frontend/src/components/SimilarItems.tsx:37:          </button>
frontend/src/components/SimilarItems.tsx:38:        ))}
frontend/src/components/SimilarItems.tsx:39:      </div>
frontend/src/components/SimilarItems.tsx:40:    </div>
frontend/src/components/SimilarItems.tsx:41:  );
frontend/src/components/SimilarItems.tsx:42:}
frontend/src/components/NotInterested.tsx:1:import { useEffect, useRef, useState } from 'react';
frontend/src/components/NotInterested.tsx:2:import { haptic } from '../telegram';
frontend/src/components/NotInterested.tsx:4:// YouTube-style «⋯ → Не интересно» control for a card. Tapping the dots opens a
frontend/src/components/NotInterested.tsx:5:// small popover; «Не интересно» sends a negative signal (the parent hides the
frontend/src/components/NotInterested.tsx:6:// card and the recommender learns to show less of this category).
frontend/src/components/NotInterested.tsx:7:export function NotInterested({ onNotInterested }: { onNotInterested: () => void }) {
frontend/src/components/NotInterested.tsx:8:  const [open, setOpen] = useState(false);
frontend/src/components/NotInterested.tsx:9:  const ref = useRef<HTMLDivElement>(null);
frontend/src/components/NotInterested.tsx:10:  useEffect(() => {
frontend/src/components/NotInterested.tsx:11:    if (!open) return;
frontend/src/components/NotInterested.tsx:12:    const away = (e: Event) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
frontend/src/components/NotInterested.tsx:13:    document.addEventListener('pointerdown', away, true);
frontend/src/components/NotInterested.tsx:14:    return () => document.removeEventListener('pointerdown', away, true);
frontend/src/components/NotInterested.tsx:15:  }, [open]);
frontend/src/components/NotInterested.tsx:16:  return (
frontend/src/components/NotInterested.tsx:17:    <div className="ni-wrap" ref={ref} onClick={(e) => e.stopPropagation()}>
frontend/src/components/NotInterested.tsx:18:      <button
frontend/src/components/NotInterested.tsx:19:        className="ni-dots"
frontend/src/components/NotInterested.tsx:20:        aria-label="Ещё"
frontend/src/components/NotInterested.tsx:21:        onClick={(e) => { e.stopPropagation(); haptic('light'); setOpen((o) => !o); }}
frontend/src/components/NotInterested.tsx:22:      >
frontend/src/components/NotInterested.tsx:23:        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
frontend/src/components/NotInterested.tsx:24:          <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
frontend/src/components/NotInterested.tsx:25:        </svg>
frontend/src/components/NotInterested.tsx:26:      </button>
frontend/src/components/NotInterested.tsx:27:      {open && (
frontend/src/components/NotInterested.tsx:28:        <div className="ni-pop">
frontend/src/components/NotInterested.tsx:29:          <button
frontend/src/components/NotInterested.tsx:30:            className="ni-item"
frontend/src/components/NotInterested.tsx:31:            onClick={(e) => { e.stopPropagation(); setOpen(false); haptic('medium'); onNotInterested(); }}
frontend/src/components/NotInterested.tsx:32:          >
frontend/src/components/NotInterested.tsx:33:            🚫 Не интересно
frontend/src/components/NotInterested.tsx:34:          </button>
frontend/src/components/NotInterested.tsx:35:        </div>
frontend/src/components/NotInterested.tsx:36:      )}
frontend/src/components/NotInterested.tsx:37:    </div>
frontend/src/components/NotInterested.tsx:38:  );
frontend/src/components/NotInterested.tsx:39:}
frontend/src/components/StarInput.tsx:1:import { useState } from 'react';
frontend/src/components/StarInput.tsx:3:// Tappable star rating with half-star precision (tap left half = .5).
frontend/src/components/StarInput.tsx:4:// Hovering previews the rating (desktop): hovering the 4th star lights 1–4.
frontend/src/components/StarInput.tsx:5:export function StarInput({
frontend/src/components/StarInput.tsx:6:  value,
frontend/src/components/StarInput.tsx:7:  onChange,
frontend/src/components/StarInput.tsx:8:}: {
frontend/src/components/StarInput.tsx:9:  value: number;
frontend/src/components/StarInput.tsx:10:  onChange: (v: number) => void;
frontend/src/components/StarInput.tsx:11:}) {
frontend/src/components/StarInput.tsx:12:  const [hover, setHover] = useState(0);
frontend/src/components/StarInput.tsx:13:  const shown = hover || value;
frontend/src/components/StarInput.tsx:14:  return (
frontend/src/components/StarInput.tsx:15:    <div className="star-input" onMouseLeave={() => setHover(0)}>
frontend/src/components/StarInput.tsx:16:      {[1, 2, 3, 4, 5].map((i) => {
frontend/src/components/StarInput.tsx:17:        const fillPct = Math.max(0, Math.min(1, shown - (i - 1))) * 100;
frontend/src/components/StarInput.tsx:18:        return (
frontend/src/components/StarInput.tsx:19:          <span key={i} className="s">
frontend/src/components/StarInput.tsx:20:            ★
frontend/src/components/StarInput.tsx:21:            <span className="fill" style={{ width: `${fillPct}%` }}>
frontend/src/components/StarInput.tsx:22:              ★
frontend/src/components/StarInput.tsx:23:            </span>
frontend/src/components/StarInput.tsx:24:            <span style={{ position: 'absolute', inset: 0, display: 'flex' }}>
frontend/src/components/StarInput.tsx:25:              <span
frontend/src/components/StarInput.tsx:26:                style={{ flex: 1 }}
frontend/src/components/StarInput.tsx:27:                onMouseEnter={() => setHover(i - 0.5)}
frontend/src/components/StarInput.tsx:28:                onClick={() => onChange(i - 0.5)}
frontend/src/components/StarInput.tsx:29:              />
frontend/src/components/StarInput.tsx:30:              <span
frontend/src/components/StarInput.tsx:31:                style={{ flex: 1 }}
frontend/src/components/StarInput.tsx:32:                onMouseEnter={() => setHover(i)}
frontend/src/components/StarInput.tsx:33:                onClick={() => onChange(i)}
frontend/src/components/StarInput.tsx:34:              />
frontend/src/components/StarInput.tsx:35:            </span>
frontend/src/components/StarInput.tsx:36:          </span>
frontend/src/components/StarInput.tsx:37:        );
frontend/src/components/StarInput.tsx:38:      })}
frontend/src/components/StarInput.tsx:39:    </div>
frontend/src/components/StarInput.tsx:40:  );
frontend/src/components/StarInput.tsx:41:}
frontend/src/components/Stars.tsx:1:// Yelp-style rating: red rounded squares with a white star, grey when empty,
frontend/src/components/Stars.tsx:2:// half-filled square for fractional ratings. `size` in px (default 16).
frontend/src/components/Stars.tsx:3:export function Stars({ value, size = 16 }: { value: number; size?: number }) {
frontend/src/components/Stars.tsx:4:  return (
frontend/src/components/Stars.tsx:5:    <span className="stars" style={{ ['--star-size' as string]: `${size}px` }}>
frontend/src/components/Stars.tsx:6:      {[0, 1, 2, 3, 4].map((i) => {
frontend/src/components/Stars.tsx:7:        const f = value - i;
frontend/src/components/Stars.tsx:8:        const cls = f >= 1 ? ' full' : f >= 0.5 ? ' half' : '';
frontend/src/components/Stars.tsx:9:        return (
frontend/src/components/Stars.tsx:10:          <span key={i} className={`star-box${cls}`}>
frontend/src/components/Stars.tsx:11:            ★
frontend/src/components/Stars.tsx:12:          </span>
frontend/src/components/Stars.tsx:13:        );
frontend/src/components/Stars.tsx:14:      })}
frontend/src/components/Stars.tsx:15:    </span>
frontend/src/components/Stars.tsx:16:  );
frontend/src/components/Stars.tsx:17:}
frontend/src/components/QuickRate.tsx:1:import { useState } from 'react';
frontend/src/components/QuickRate.tsx:2:import { api } from '../api';
frontend/src/components/QuickRate.tsx:4:// 1-tap rating straight from a card. Text is optional — tapping a star publishes
frontend/src/components/QuickRate.tsx:5:// the rating immediately; "добавить отзыв" is offered but never required.
frontend/src/components/QuickRate.tsx:6:export function QuickRate({
frontend/src/components/QuickRate.tsx:7:  listingId,
frontend/src/components/QuickRate.tsx:8:  onOpenReview,
frontend/src/components/QuickRate.tsx:9:  onRated,
frontend/src/components/QuickRate.tsx:10:}: {
frontend/src/components/QuickRate.tsx:11:  listingId: string;
frontend/src/components/QuickRate.tsx:12:  onOpenReview?: (rating: number) => void;
frontend/src/components/QuickRate.tsx:13:  onRated?: () => void;
frontend/src/components/QuickRate.tsx:14:}) {
frontend/src/components/QuickRate.tsx:15:  const [hover, setHover] = useState(0);
frontend/src/components/QuickRate.tsx:16:  const [done, setDone] = useState(false);
frontend/src/components/QuickRate.tsx:18:  const rate = (n: number, e: React.MouseEvent) => {
frontend/src/components/QuickRate.tsx:19:    e.stopPropagation();
frontend/src/components/QuickRate.tsx:20:    setDone(true);
frontend/src/components/QuickRate.tsx:21:    api.createReview(listingId, { rating: n }).then(() => onRated?.()).catch(() => {});
frontend/src/components/QuickRate.tsx:22:  };
frontend/src/components/QuickRate.tsx:24:  if (done) {
frontend/src/components/QuickRate.tsx:25:    return (
frontend/src/components/QuickRate.tsx:26:      <div className="qr-done" onClick={(e) => e.stopPropagation()}>
frontend/src/components/QuickRate.tsx:27:        Оценка принята ✓
frontend/src/components/QuickRate.tsx:28:        {onOpenReview && (
frontend/src/components/QuickRate.tsx:29:          <button className="qr-add" onClick={(e) => { e.stopPropagation(); onOpenReview(0); }}>
frontend/src/components/QuickRate.tsx:30:            ✎ добавить отзыв
frontend/src/components/QuickRate.tsx:31:          </button>
frontend/src/components/QuickRate.tsx:32:        )}
frontend/src/components/QuickRate.tsx:33:      </div>
frontend/src/components/QuickRate.tsx:34:    );
frontend/src/components/QuickRate.tsx:35:  }
frontend/src/components/QuickRate.tsx:37:  return (
frontend/src/components/QuickRate.tsx:38:    <div className="qr" onMouseLeave={() => setHover(0)} onClick={(e) => e.stopPropagation()}>
frontend/src/components/QuickRate.tsx:39:      {[1, 2, 3, 4, 5].map((n) => (
frontend/src/components/QuickRate.tsx:40:        <button
frontend/src/components/QuickRate.tsx:41:          key={n}
frontend/src/components/QuickRate.tsx:42:          className={'qr-star' + (n <= hover ? ' on' : '')}
frontend/src/components/QuickRate.tsx:43:          onMouseEnter={() => setHover(n)}
frontend/src/components/QuickRate.tsx:44:          onClick={(e) => rate(n, e)}
frontend/src/components/QuickRate.tsx:45:        >
frontend/src/components/QuickRate.tsx:46:          ★
frontend/src/components/QuickRate.tsx:47:        </button>
frontend/src/components/QuickRate.tsx:48:      ))}
frontend/src/components/QuickRate.tsx:49:    </div>
frontend/src/components/QuickRate.tsx:50:  );
frontend/src/components/QuickRate.tsx:51:}
frontend/src/components/VenuePhoto.tsx:1:import type { Listing } from '../types';
frontend/src/components/VenuePhoto.tsx:2:import { thumb } from '../img';
frontend/src/components/VenuePhoto.tsx:3:import { SmartImg } from './SmartImg';
frontend/src/components/VenuePhoto.tsx:5:export const TYPE_EMOJI: Record<Listing['type'], string> = {
frontend/src/components/VenuePhoto.tsx:6:  RESTAURANT: '🍽️',
frontend/src/components/VenuePhoto.tsx:7:  DISH: '🍝',
frontend/src/components/VenuePhoto.tsx:8:  DRINK: '🍷',
frontend/src/components/VenuePhoto.tsx:9:};
frontend/src/components/VenuePhoto.tsx:11:export function listingPhotoCandidates(listing: Listing): string[] {
frontend/src/components/VenuePhoto.tsx:12:  const candidates: string[] = [];
frontend/src/components/VenuePhoto.tsx:13:  // real photo FIRST, but through our resize-proxy (small webp, our origin,
frontend/src/components/VenuePhoto.tsx:14:  // immutable cache) — the raw external URL stays as the fallback candidate
frontend/src/components/VenuePhoto.tsx:15:  if (listing.photoUrl) {
frontend/src/components/VenuePhoto.tsx:16:    const proxied = thumb(listing.photoUrl, 600);
frontend/src/components/VenuePhoto.tsx:17:    if (proxied && proxied !== listing.photoUrl) candidates.push(proxied);
frontend/src/components/VenuePhoto.tsx:18:  }
frontend/src/components/VenuePhoto.tsx:19:  if (listing.photoUrl) candidates.push(listing.photoUrl);
frontend/src/components/VenuePhoto.tsx:20:  if (listing.placeholderPhoto) candidates.push(listing.placeholderPhoto);
frontend/src/components/VenuePhoto.tsx:21:  // NO brand logos/favicons — запрещены. Guaranteed appetizing fallback for ANY
frontend/src/components/VenuePhoto.tsx:22:  // listing (venues in «Где ещё попробовать» etc. that have no placeholderPhoto):
frontend/src/components/VenuePhoto.tsx:23:  // a deterministic licensed category stock, never a bare letter tile.
frontend/src/components/VenuePhoto.tsx:24:  candidates.push(
frontend/src/components/VenuePhoto.tsx:25:    `/api/venue-stock?type=${listing.type}&category=${encodeURIComponent(listing.category ?? '')}` +
frontend/src/components/VenuePhoto.tsx:26:      `&name=${encodeURIComponent(listing.name ?? '')}&seed=${encodeURIComponent(listing.id ?? listing.name ?? '')}`,
frontend/src/components/VenuePhoto.tsx:27:  );
frontend/src/components/VenuePhoto.tsx:28:  return candidates;
frontend/src/components/VenuePhoto.tsx:29:}
frontend/src/components/VenuePhoto.tsx:31:export function preloadListingPhotos(listings: Listing[], limit = 10) {
frontend/src/components/VenuePhoto.tsx:32:  if (typeof Image === 'undefined') return;
frontend/src/components/VenuePhoto.tsx:33:  const seen = new Set<string>();
frontend/src/components/VenuePhoto.tsx:34:  for (const l of listings) {
frontend/src/components/VenuePhoto.tsx:35:    const src = listingPhotoCandidates(l)[0];
frontend/src/components/VenuePhoto.tsx:36:    if (!src || seen.has(src)) continue;
frontend/src/components/VenuePhoto.tsx:37:    seen.add(src);
frontend/src/components/VenuePhoto.tsx:38:    const img = new Image();
frontend/src/components/VenuePhoto.tsx:39:    img.decoding = 'async';
frontend/src/components/VenuePhoto.tsx:40:    img.src = src;
frontend/src/components/VenuePhoto.tsx:41:    if (seen.size >= limit) break;
frontend/src/components/VenuePhoto.tsx:42:  }
frontend/src/components/VenuePhoto.tsx:43:}
frontend/src/components/VenuePhoto.tsx:45:/**
frontend/src/components/VenuePhoto.tsx:46: * Best available image for a venue, with graceful fallback on load error:
frontend/src/components/VenuePhoto.tsx:47: * real/local photo → licensed category stock → monogram tile. Logos are BANNED.
frontend/src/components/VenuePhoto.tsx:48: */
frontend/src/components/VenuePhoto.tsx:49:export function VenuePhoto({
frontend/src/components/VenuePhoto.tsx:50:  listing,
frontend/src/components/VenuePhoto.tsx:51:  className = 'photo',
frontend/src/components/VenuePhoto.tsx:52:  draggable,
frontend/src/components/VenuePhoto.tsx:53:  loading = 'lazy',
frontend/src/components/VenuePhoto.tsx:54:  allowVenuePhoto = false,
frontend/src/components/VenuePhoto.tsx:55:}: {
frontend/src/components/VenuePhoto.tsx:56:  listing: Listing;
frontend/src/components/VenuePhoto.tsx:57:  className?: string;
frontend/src/components/VenuePhoto.tsx:58:  draggable?: boolean;
frontend/src/components/VenuePhoto.tsx:59:  loading?: 'eager' | 'lazy';
frontend/src/components/VenuePhoto.tsx:60:  /** detail hero may show the real venue photo; cards never do */
frontend/src/components/VenuePhoto.tsx:61:  allowVenuePhoto?: boolean;
frontend/src/components/VenuePhoto.tsx:62:}) {
frontend/src/components/VenuePhoto.tsx:63:  // OWNER RULE 18.07.2026 (reverted the name-tile): a venue card shows a nice
frontend/src/components/VenuePhoto.tsx:64:  // random photo of ONE OF ITS OWN dishes/drinks — dishPhoto is picked server-side
frontend/src/components/VenuePhoto.tsx:65:  // (deterministic per venue). Falls back to any listing photo, then stock.
frontend/src/components/VenuePhoto.tsx:66:  const src = (listing as any).dishPhoto ?? listing.photoUrl;
frontend/src/components/VenuePhoto.tsx:67:  return (
frontend/src/components/VenuePhoto.tsx:68:    <SmartImg
frontend/src/components/VenuePhoto.tsx:69:      className={className}
frontend/src/components/VenuePhoto.tsx:70:      src={src}
frontend/src/components/VenuePhoto.tsx:71:      alt={listing.name}
frontend/src/components/VenuePhoto.tsx:72:      loading={allowVenuePhoto ? 'eager' : loading}
frontend/src/components/VenuePhoto.tsx:73:      draggable={draggable}
frontend/src/components/VenuePhoto.tsx:74:      stockFallbacks={[listing.placeholderPhoto]}
frontend/src/components/VenuePhoto.tsx:75:      stock={{ type: listing.type, category: listing.category, name: listing.name, seed: listing.id }}
frontend/src/components/VenuePhoto.tsx:76:      monogram={listing.name}
frontend/src/components/VenuePhoto.tsx:77:    />
frontend/src/components/VenuePhoto.tsx:78:  );
frontend/src/components/VenuePhoto.tsx:79:}
frontend/src/components/SmartImg.tsx:1:import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
frontend/src/components/SmartImg.tsx:2:import { retryImageUrl, thumb } from '../img';
frontend/src/components/SmartImg.tsx:4:type StockPhoto = {
frontend/src/components/SmartImg.tsx:5:  type?: string | null;
frontend/src/components/SmartImg.tsx:6:  category?: string | null;
frontend/src/components/SmartImg.tsx:7:  name?: string | null;
frontend/src/components/SmartImg.tsx:8:  seed?: string | null;
frontend/src/components/SmartImg.tsx:9:  src?: string | null;
frontend/src/components/SmartImg.tsx:10:};
frontend/src/components/SmartImg.tsx:12:function colorFromName(name: string): string {
frontend/src/components/SmartImg.tsx:13:  let h = 0;
frontend/src/components/SmartImg.tsx:14:  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
frontend/src/components/SmartImg.tsx:15:  return `hsl(${h % 360} 42% 42%)`;
frontend/src/components/SmartImg.tsx:16:}
frontend/src/components/SmartImg.tsx:18:function stockUrl(stock?: StockPhoto): string | undefined {
frontend/src/components/SmartImg.tsx:19:  if (!stock) return undefined;
frontend/src/components/SmartImg.tsx:20:  if (stock.src) return stock.src;
frontend/src/components/SmartImg.tsx:21:  return (
frontend/src/components/SmartImg.tsx:22:    `/api/venue-stock?type=${encodeURIComponent(stock.type ?? '')}` +
frontend/src/components/SmartImg.tsx:23:    `&category=${encodeURIComponent(stock.category ?? '')}` +
frontend/src/components/SmartImg.tsx:24:    `&name=${encodeURIComponent(stock.name ?? '')}` +
frontend/src/components/SmartImg.tsx:25:    `&seed=${encodeURIComponent(stock.seed ?? stock.name ?? '')}`
frontend/src/components/SmartImg.tsx:26:  );
frontend/src/components/SmartImg.tsx:27:}
frontend/src/components/SmartImg.tsx:29:/** Resized thumbnail -> original -> cache-busted retry -> stock -> monogram. */
frontend/src/components/SmartImg.tsx:30:export function SmartImg({
frontend/src/components/SmartImg.tsx:31:  src,
frontend/src/components/SmartImg.tsx:32:  className,
frontend/src/components/SmartImg.tsx:33:  alt = '',
frontend/src/components/SmartImg.tsx:34:  width = 600,
frontend/src/components/SmartImg.tsx:35:  loading = 'lazy',
frontend/src/components/SmartImg.tsx:36:  draggable,
frontend/src/components/SmartImg.tsx:37:  stock,
frontend/src/components/SmartImg.tsx:38:  stockFallbacks = [],
frontend/src/components/SmartImg.tsx:39:  monogram,
frontend/src/components/SmartImg.tsx:40:  style,
frontend/src/components/SmartImg.tsx:41:}: {
frontend/src/components/SmartImg.tsx:42:  src?: string | null;
frontend/src/components/SmartImg.tsx:43:  className?: string;
frontend/src/components/SmartImg.tsx:44:  alt?: string;
frontend/src/components/SmartImg.tsx:45:  width?: 200 | 400 | 600 | 900;
frontend/src/components/SmartImg.tsx:46:  loading?: 'eager' | 'lazy';
frontend/src/components/SmartImg.tsx:47:  draggable?: boolean;
frontend/src/components/SmartImg.tsx:48:  stock?: StockPhoto;
frontend/src/components/SmartImg.tsx:49:  stockFallbacks?: Array<string | null | undefined>;
frontend/src/components/SmartImg.tsx:50:  monogram?: string | null;
frontend/src/components/SmartImg.tsx:51:  style?: CSSProperties;
frontend/src/components/SmartImg.tsx:52:}) {
frontend/src/components/SmartImg.tsx:53:  const [retryToken] = useState(() => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
frontend/src/components/SmartImg.tsx:54:  const fallbackSignature = stockFallbacks.join('|');
frontend/src/components/SmartImg.tsx:55:  const candidates = useMemo(() => {
frontend/src/components/SmartImg.tsx:56:    const result: string[] = [];
frontend/src/components/SmartImg.tsx:57:    const add = (value?: string | null) => {
frontend/src/components/SmartImg.tsx:58:      if (value && !result.includes(value)) result.push(value);
frontend/src/components/SmartImg.tsx:59:    };
frontend/src/components/SmartImg.tsx:60:    if (src) {
frontend/src/components/SmartImg.tsx:61:      add(thumb(src, width));
frontend/src/components/SmartImg.tsx:62:      add(src);
frontend/src/components/SmartImg.tsx:63:      add(retryImageUrl(src, retryToken));
frontend/src/components/SmartImg.tsx:64:    }
frontend/src/components/SmartImg.tsx:65:    for (const fallback of stockFallbacks) add(fallback);
frontend/src/components/SmartImg.tsx:66:    add(stockUrl(stock));
frontend/src/components/SmartImg.tsx:67:    return result;
frontend/src/components/SmartImg.tsx:68:  }, [src, width, retryToken, stock?.type, stock?.category, stock?.name, stock?.seed, stock?.src, fallbackSignature]);
frontend/src/components/SmartImg.tsx:70:  const signature = candidates.join('\n');
frontend/src/components/SmartImg.tsx:71:  const [idx, setIdx] = useState(0);
frontend/src/components/SmartImg.tsx:72:  const candidateKey = `${signature}:${idx}`;
frontend/src/components/SmartImg.tsx:73:  const [loadedKey, setLoadedKey] = useState('');
frontend/src/components/SmartImg.tsx:74:  const [nearViewport, setNearViewport] = useState(loading === 'eager');
frontend/src/components/SmartImg.tsx:75:  const imgRef = useRef<HTMLImageElement>(null);
frontend/src/components/SmartImg.tsx:77:  useEffect(() => setIdx(0), [signature]);
frontend/src/components/SmartImg.tsx:79:  useEffect(() => {
frontend/src/components/SmartImg.tsx:80:    if (loading === 'eager') {
frontend/src/components/SmartImg.tsx:81:      setNearViewport(true);
frontend/src/components/SmartImg.tsx:82:      return;
frontend/src/components/SmartImg.tsx:83:    }
frontend/src/components/SmartImg.tsx:84:    const el = imgRef.current;
frontend/src/components/SmartImg.tsx:85:    if (!el || typeof IntersectionObserver === 'undefined') {
frontend/src/components/SmartImg.tsx:86:      setNearViewport(true);
frontend/src/components/SmartImg.tsx:87:      return;
frontend/src/components/SmartImg.tsx:88:    }
frontend/src/components/SmartImg.tsx:89:    const observer = new IntersectionObserver(
frontend/src/components/SmartImg.tsx:90:      (entries) => {
frontend/src/components/SmartImg.tsx:91:        if (entries.some((entry) => entry.isIntersecting)) {
frontend/src/components/SmartImg.tsx:92:          setNearViewport(true);
frontend/src/components/SmartImg.tsx:93:          observer.disconnect();
frontend/src/components/SmartImg.tsx:94:        }
frontend/src/components/SmartImg.tsx:95:      },
frontend/src/components/SmartImg.tsx:96:      { rootMargin: '1000px 0px' },
frontend/src/components/SmartImg.tsx:97:    );
frontend/src/components/SmartImg.tsx:98:    observer.observe(el);
frontend/src/components/SmartImg.tsx:99:    return () => observer.disconnect();
frontend/src/components/SmartImg.tsx:100:  }, [loading, signature, idx]);
frontend/src/components/SmartImg.tsx:102:  useEffect(() => {
frontend/src/components/SmartImg.tsx:103:    if (!nearViewport || idx >= candidates.length || loadedKey === candidateKey) return;
frontend/src/components/SmartImg.tsx:104:    const el = imgRef.current;
frontend/src/components/SmartImg.tsx:105:    if (el?.complete && el.naturalWidth > 0) return;
frontend/src/components/SmartImg.tsx:106:    const timeout = window.setTimeout(() => setIdx((current) => current + 1), 12_000);
frontend/src/components/SmartImg.tsx:107:    return () => window.clearTimeout(timeout);
frontend/src/components/SmartImg.tsx:108:  }, [nearViewport, idx, signature, candidates.length, candidateKey, loadedKey]);
frontend/src/components/SmartImg.tsx:110:  if (idx < candidates.length) {
frontend/src/components/SmartImg.tsx:111:    return (
frontend/src/components/SmartImg.tsx:112:      <img
frontend/src/components/SmartImg.tsx:113:        key={candidateKey}
frontend/src/components/SmartImg.tsx:114:        ref={imgRef}
frontend/src/components/SmartImg.tsx:115:        className={className}
frontend/src/components/SmartImg.tsx:116:        src={candidates[idx]}
frontend/src/components/SmartImg.tsx:117:        alt={alt}
frontend/src/components/SmartImg.tsx:118:        loading={nearViewport ? 'eager' : loading}
frontend/src/components/SmartImg.tsx:119:        decoding="async"
frontend/src/components/SmartImg.tsx:120:        draggable={draggable}
frontend/src/components/SmartImg.tsx:121:        style={style}
frontend/src/components/SmartImg.tsx:122:        onLoad={() => setLoadedKey(candidateKey)}
frontend/src/components/SmartImg.tsx:123:        onError={() => setIdx((current) => current + 1)}
frontend/src/components/SmartImg.tsx:124:      />
frontend/src/components/SmartImg.tsx:125:    );
frontend/src/components/SmartImg.tsx:126:  }
frontend/src/components/SmartImg.tsx:128:  const label = (monogram || alt || '?').trim();
frontend/src/components/SmartImg.tsx:129:  return (
frontend/src/components/SmartImg.tsx:130:    <div
frontend/src/components/SmartImg.tsx:131:      className={`${className ?? ''} ph mono smart-img-mono`.trim()}
frontend/src/components/SmartImg.tsx:132:      style={{ background: colorFromName(label), ...style }}
frontend/src/components/SmartImg.tsx:133:      role="img"
frontend/src/components/SmartImg.tsx:134:      aria-label={alt || label}
frontend/src/components/SmartImg.tsx:135:    >
frontend/src/components/SmartImg.tsx:136:      {(label[0] ?? '?').toUpperCase()}
frontend/src/components/SmartImg.tsx:137:    </div>
frontend/src/components/SmartImg.tsx:138:  );
frontend/src/components/SmartImg.tsx:139:}
frontend/src/components/ListRow.tsx:1:import type { Listing } from '../types';
frontend/src/components/ListRow.tsx:2:import { cuisineTags } from '../cuisine';
frontend/src/components/ListRow.tsx:3:import { telHref, callPhone } from '../telegram';
frontend/src/components/ListRow.tsx:4:import { useCategoryProgress } from '../categoryGate';
frontend/src/components/ListRow.tsx:5:import { ratingsWord, openStatus } from '../plural';
frontend/src/components/ListRow.tsx:6:import { Stars } from './Stars';
frontend/src/components/ListRow.tsx:7:import { VenuePhoto } from './VenuePhoto';
frontend/src/components/ListRow.tsx:8:import { NotInterested } from './NotInterested';
frontend/src/components/ListRow.tsx:9:
frontend/src/components/ListRow.tsx:10:const TYPE_LABEL: Record<Listing['type'], string> = {
frontend/src/components/ListRow.tsx:11:  RESTAURANT: 'Ресторан',
frontend/src/components/ListRow.tsx:12:  DISH: 'Блюдо',
frontend/src/components/ListRow.tsx:13:  DRINK: 'Напиток',
frontend/src/components/ListRow.tsx:14:};
frontend/src/components/ListRow.tsx:15:
frontend/src/components/ListRow.tsx:16:// Yelp-style list card: image banner + name/rating/meta + a Call button.
frontend/src/components/ListRow.tsx:17:export function ListRow({
frontend/src/components/ListRow.tsx:18:  listing,
frontend/src/components/ListRow.tsx:19:  rank,
frontend/src/components/ListRow.tsx:20:  favorite,
frontend/src/components/ListRow.tsx:21:  onToggleFavorite,
frontend/src/components/ListRow.tsx:22:  onClick,
frontend/src/components/ListRow.tsx:23:  onTagClick,
frontend/src/components/ListRow.tsx:24:  onNotInterested,
frontend/src/components/ListRow.tsx:25:}: {
frontend/src/components/ListRow.tsx:26:  listing: Listing;
frontend/src/components/ListRow.tsx:27:  rank?: number;
frontend/src/components/ListRow.tsx:28:  favorite?: boolean;
frontend/src/components/ListRow.tsx:29:  onToggleFavorite?: () => void;
frontend/src/components/ListRow.tsx:30:  onClick?: () => void;
frontend/src/components/ListRow.tsx:31:  onTagClick?: (tag: string) => void;
frontend/src/components/ListRow.tsx:32:  onNotInterested?: () => void;
frontend/src/components/ListRow.tsx:33:}) {
frontend/src/components/ListRow.tsx:34:  const isItem = listing.type === 'DISH' || listing.type === 'DRINK';
frontend/src/components/ListRow.tsx:35:  const { isUnlocked } = useCategoryProgress();
frontend/src/components/ListRow.tsx:36:  // when the search matched a dish/drink this venue serves, show ITS rating here
frontend/src/components/ListRow.tsx:37:  const matched = (listing as any).matchedItem as { name: string; rating: number | null; count: number } | undefined;
frontend/src/components/ListRow.tsx:38:  const status = !isItem ? openStatus(listing.hours) : null;
frontend/src/components/ListRow.tsx:39:  let tags = cuisineTags(listing.cuisine);
frontend/src/components/ListRow.tsx:40:  // fall back to a meaningful category when no cuisine; never the generic type word
frontend/src/components/ListRow.tsx:41:  if (tags.length === 0 && listing.category && !/ресторан|заведение|блюдо|напиток/i.test(listing.category)) {
frontend/src/components/ListRow.tsx:42:    tags = [listing.category];
frontend/src/components/ListRow.tsx:43:  }
frontend/src/components/ListRow.tsx:44:
frontend/src/components/ListRow.tsx:45:  return (
frontend/src/components/ListRow.tsx:46:    <div className="vcard" onClick={onClick}>
frontend/src/components/ListRow.tsx:47:      <div className="vcard-media">
frontend/src/components/ListRow.tsx:48:        <VenuePhoto listing={listing} className="vcard-photo" />
frontend/src/components/ListRow.tsx:49:        {onToggleFavorite && (
frontend/src/components/ListRow.tsx:50:          <button
frontend/src/components/ListRow.tsx:51:            className="heart"
frontend/src/components/ListRow.tsx:52:            onClick={(e) => {
frontend/src/components/ListRow.tsx:53:              e.stopPropagation();
frontend/src/components/ListRow.tsx:54:              onToggleFavorite();
frontend/src/components/ListRow.tsx:55:            }}
frontend/src/components/ListRow.tsx:56:          >
frontend/src/components/ListRow.tsx:57:            {favorite ? '♥' : '♡'}
frontend/src/components/ListRow.tsx:58:          </button>
frontend/src/components/ListRow.tsx:59:        )}
frontend/src/components/ListRow.tsx:60:        {onNotInterested && <NotInterested onNotInterested={onNotInterested} />}
frontend/src/components/ListRow.tsx:61:      </div>
frontend/src/components/ListRow.tsx:62:
frontend/src/components/ListRow.tsx:63:      <div className="vcard-body">
frontend/src/components/ListRow.tsx:64:        <div className="vcard-top">
frontend/src/components/ListRow.tsx:65:          <div className="name">
frontend/src/components/ListRow.tsx:66:            {rank ? `${rank}. ` : ''}
frontend/src/components/ListRow.tsx:67:            {listing.name}
frontend/src/components/ListRow.tsx:68:          </div>
frontend/src/components/ListRow.tsx:69:          {listing.priceLevel ? (
frontend/src/components/ListRow.tsx:70:            <span className="price">{'₽'.repeat(listing.priceLevel)}</span>
frontend/src/components/ListRow.tsx:71:          ) : null}
frontend/src/components/ListRow.tsx:72:        </div>
frontend/src/components/ListRow.tsx:73:
frontend/src/components/ListRow.tsx:74:        {/* recommendation card → the recommended place (from recsys) */}
frontend/src/components/ListRow.tsx:75:        {isItem && !listing.bestVenue && listing.recVenue && (
frontend/src/components/ListRow.tsx:76:          <div className="sub" style={{ color: 'var(--accent)', fontWeight: 600 }}>
frontend/src/components/ListRow.tsx:77:            {listing.reviewCount === 0 ? 'Попробуйте в:' : ''}📍{listing.recVenue.name}
frontend/src/components/ListRow.tsx:78:          </div>
frontend/src/components/ListRow.tsx:79:        )}
frontend/src/components/ListRow.tsx:80:        {/* no best venue yet → a random venue that serves it */}
frontend/src/components/ListRow.tsx:81:        {isItem && !listing.bestVenue && !listing.recVenue && (listing as any).tryAt && (
frontend/src/components/ListRow.tsx:82:          <div className="sub">
frontend/src/components/ListRow.tsx:83:            {listing.reviewCount === 0 ? 'Попробуйте в:' : ''}📍{(listing as any).tryAt.name}
frontend/src/components/ListRow.tsx:84:          </div>
frontend/src/components/ListRow.tsx:85:        )}
frontend/src/components/ListRow.tsx:86:        {/* dish/drink: «Лучшее в» is earned by ratings — zero reviews means it's
frontend/src/components/ListRow.tsx:87:            just a place to try, not the best one */}
frontend/src/components/ListRow.tsx:88:        {isItem && listing.bestVenue && (
frontend/src/components/ListRow.tsx:89:          listing.reviewCount > 0 ? (
frontend/src/components/ListRow.tsx:90:            <div className="sub" style={{ color: 'var(--accent)', fontWeight: 600 }}>
frontend/src/components/ListRow.tsx:91:              🏆 Лучшее в: {listing.bestVenue.name}
frontend/src/components/ListRow.tsx:92:            </div>
frontend/src/components/ListRow.tsx:93:          ) : (
frontend/src/components/ListRow.tsx:94:            <div className="sub">Попробуйте в: 📍{listing.bestVenue.name}</div>
frontend/src/components/ListRow.tsx:95:          )
frontend/src/components/ListRow.tsx:96:        )}
frontend/src/components/ListRow.tsx:97:        {/* searched a dish/drink → this venue shows ITS name above the rating */}
frontend/src/components/ListRow.tsx:98:        {matched && (
frontend/src/components/ListRow.tsx:99:          <div className="sub" style={{ color: 'var(--accent)', fontWeight: 700 }}>
frontend/src/components/ListRow.tsx:100:            ☕ {matched.name}
frontend/src/components/ListRow.tsx:101:          </div>
frontend/src/components/ListRow.tsx:102:        )}
frontend/src/components/ListRow.tsx:103:        {/* rating: the searched item's rating here (or the venue's own for items/no
frontend/src/components/ListRow.tsx:104:            search). 5 GREY stars when there are no ratings yet. */}
frontend/src/components/ListRow.tsx:105:        <div className="rowline">
frontend/src/components/ListRow.tsx:106:          {(() => {
frontend/src/components/ListRow.tsx:107:            const val = matched ? matched.rating : listing.reviewCount > 0 ? listing.avgRating : null;
frontend/src/components/ListRow.tsx:108:            const cnt = matched ? matched.count : listing.reviewCount;
frontend/src/components/ListRow.tsx:109:            return (
frontend/src/components/ListRow.tsx:110:              <>
frontend/src/components/ListRow.tsx:111:                <Stars value={val ?? 0} />
frontend/src/components/ListRow.tsx:112:                {val != null ? (
frontend/src/components/ListRow.tsx:113:                  <span className="cnt">
frontend/src/components/ListRow.tsx:114:                    {val.toFixed(1)} ({cnt} {ratingsWord(cnt)})
frontend/src/components/ListRow.tsx:115:                  </span>
frontend/src/components/ListRow.tsx:116:                ) : (
frontend/src/components/ListRow.tsx:117:                  <span className="cnt" style={{ color: 'var(--hint)' }}>Нет оценок</span>
frontend/src/components/ListRow.tsx:118:                )}
frontend/src/components/ListRow.tsx:119:              </>
frontend/src/components/ListRow.tsx:120:            );
frontend/src/components/ListRow.tsx:121:          })()}
frontend/src/components/ListRow.tsx:122:        </div>
frontend/src/components/ListRow.tsx:123:
frontend/src/components/ListRow.tsx:124:        {/* venue: location · price · open/closed — Yelp-style. No "Ресторан"/"Сеть". */}
frontend/src/components/ListRow.tsx:125:        {!isItem && (
frontend/src/components/ListRow.tsx:126:          <div className="sub loc-line">
frontend/src/components/ListRow.tsx:127:            {/* a chain spans many points → no single metro; show the city instead.
frontend/src/components/ListRow.tsx:128:                A single venue shows its nearest metro station ("м. …"). */}
frontend/src/components/ListRow.tsx:129:            📍 {(listing.branchCount ?? 1) > 1
frontend/src/components/ListRow.tsx:130:              ? (listing.cityLabel || 'Москва')
frontend/src/components/ListRow.tsx:131:              : listing.metro
frontend/src/components/ListRow.tsx:132:                ? `м. ${listing.metro}`
frontend/src/components/ListRow.tsx:133:                : listing.cityLabel || 'Москва'}
frontend/src/components/ListRow.tsx:134:            {listing.priceLevel ? ` · ${'₽'.repeat(listing.priceLevel)}` : ''}
frontend/src/components/ListRow.tsx:135:            {status && (
frontend/src/components/ListRow.tsx:136:              <>
frontend/src/components/ListRow.tsx:137:                {' · '}
frontend/src/components/ListRow.tsx:138:                <span style={{ color: status.open ? '#2e7d32' : 'var(--accent)', fontWeight: 700 }}>
frontend/src/components/ListRow.tsx:139:                  {status.text}
frontend/src/components/ListRow.tsx:140:                </span>
frontend/src/components/ListRow.tsx:141:              </>
frontend/src/components/ListRow.tsx:142:            )}
frontend/src/components/ListRow.tsx:143:          </div>
frontend/src/components/ListRow.tsx:144:        )}
frontend/src/components/ListRow.tsx:145:        {listing.snippet && (
frontend/src/components/ListRow.tsx:146:          <div className="card-review">
frontend/src/components/ListRow.tsx:147:            «{listing.snippet.text.length > 120
frontend/src/components/ListRow.tsx:148:              ? listing.snippet.text.slice(0, 120) + '…'
frontend/src/components/ListRow.tsx:149:              : listing.snippet.text}»
frontend/src/components/ListRow.tsx:150:          </div>
frontend/src/components/ListRow.tsx:151:        )}
frontend/src/components/ListRow.tsx:152:        {tags.length > 0 && (
frontend/src/components/ListRow.tsx:153:          <div className="card-tags">
frontend/src/components/ListRow.tsx:154:            {tags.map((t) => (
frontend/src/components/ListRow.tsx:155:              <button
frontend/src/components/ListRow.tsx:156:                key={t}
frontend/src/components/ListRow.tsx:157:                className="ctag"
frontend/src/components/ListRow.tsx:158:                onClick={(e) => {
frontend/src/components/ListRow.tsx:159:                  e.stopPropagation(); // never open the card from a tag
frontend/src/components/ListRow.tsx:160:                  onTagClick?.(t);
frontend/src/components/ListRow.tsx:161:                }}
frontend/src/components/ListRow.tsx:162:              >
frontend/src/components/ListRow.tsx:163:                {t}
frontend/src/components/ListRow.tsx:164:              </button>
frontend/src/components/ListRow.tsx:165:            ))}
frontend/src/components/ListRow.tsx:166:          </div>
frontend/src/components/ListRow.tsx:167:        )}
frontend/src/components/ListRow.tsx:168:      </div>
frontend/src/components/ListRow.tsx:169:
frontend/src/components/ListRow.tsx:170:      <div className="vcard-actions">
frontend/src/components/ListRow.tsx:171:        {onToggleFavorite && (
frontend/src/components/ListRow.tsx:172:          <button
frontend/src/components/ListRow.tsx:173:            className={'fav-btn' + (favorite ? ' on' : '')}
frontend/src/components/ListRow.tsx:174:            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
frontend/src/components/ListRow.tsx:175:          >
frontend/src/components/ListRow.tsx:176:            {favorite ? '✓ Хочу попробовать' : '♡ Хочу попробовать'}
frontend/src/components/ListRow.tsx:177:          </button>
frontend/src/components/ListRow.tsx:178:        )}
frontend/src/components/ListRow.tsx:179:        {listing.phone && (
frontend/src/components/ListRow.tsx:180:          <a
frontend/src/components/ListRow.tsx:181:            className="call-btn"
frontend/src/components/ListRow.tsx:182:            href={telHref(listing.phone)}
frontend/src/components/ListRow.tsx:183:            onClick={(e) => { e.preventDefault(); e.stopPropagation(); callPhone(listing.phone!, listing.name, `l_${listing.id}`); }}
frontend/src/components/ListRow.tsx:184:          >
frontend/src/components/ListRow.tsx:185:            📞 Позвонить
frontend/src/components/ListRow.tsx:186:          </a>
frontend/src/components/ListRow.tsx:187:        )}
frontend/src/components/ListRow.tsx:188:      </div>
frontend/src/components/ListRow.tsx:189:    </div>
frontend/src/components/ListRow.tsx:190:  );
frontend/src/components/ListRow.tsx:191:}
frontend/src/components/FeedPost.tsx:1:import { useState } from 'react';
frontend/src/components/FeedPost.tsx:2:import { api } from '../api';
frontend/src/components/FeedPost.tsx:3:import type { Review, VoteState, VoteType } from '../types';
frontend/src/components/FeedPost.tsx:4:import { Stars } from './Stars';
frontend/src/components/FeedPost.tsx:5:import { SmartImg } from './SmartImg';
frontend/src/components/FeedPost.tsx:7:const VOTE_LABEL: Record<VoteType, string> = {
frontend/src/components/FeedPost.tsx:8:  USEFUL: '👍 Полезно',
frontend/src/components/FeedPost.tsx:9:  FUNNY: '😄 Смешно',
frontend/src/components/FeedPost.tsx:10:  COOL: '😎 Круто',
frontend/src/components/FeedPost.tsx:11:  OHNO: '🙀 О нет',
frontend/src/components/FeedPost.tsx:12:};
frontend/src/components/FeedPost.tsx:14:// Feed photos use the shared resilient renderer below.
frontend/src/components/FeedPost.tsx:15:// A user's activity post (Yelp-style): author + photo + the item/venue they reviewed.
frontend/src/components/FeedPost.tsx:16:export function FeedPost({
frontend/src/components/FeedPost.tsx:17:  review,
frontend/src/components/FeedPost.tsx:18:  onOpen,
frontend/src/components/FeedPost.tsx:19:  onComments,
frontend/src/components/FeedPost.tsx:20:  onOpenUser,
frontend/src/components/FeedPost.tsx:21:  onOpenPhoto,
frontend/src/components/FeedPost.tsx:22:  onOpenVenue,
frontend/src/components/FeedPost.tsx:23:}: {
frontend/src/components/FeedPost.tsx:24:  review: Review;
frontend/src/components/FeedPost.tsx:25:  onOpen: () => void;
frontend/src/components/FeedPost.tsx:26:  onComments?: () => void;
frontend/src/components/FeedPost.tsx:27:  onOpenUser?: (userId: string) => void;
frontend/src/components/FeedPost.tsx:28:  onOpenPhoto?: () => void; // tap the PHOTO → the review itself (check-in detail)
frontend/src/components/FeedPost.tsx:29:  onOpenVenue?: () => void; // tap the "📍 place" line → the venue card
frontend/src/components/FeedPost.tsx:30:}) {
frontend/src/components/FeedPost.tsx:31:  // the user's own photo leads; text-only posts fall back to the dish's card
frontend/src/components/FeedPost.tsx:32:  // photo (illustrative, labeled) so the wall never looks broken/empty
frontend/src/components/FeedPost.tsx:33:  const photo = review.photoUrls?.[0];
frontend/src/components/FeedPost.tsx:34:  const cardPhoto = !photo ? review.listing?.photoUrl : null;
frontend/src/components/FeedPost.tsx:35:  const imageFallback = review.listing
frontend/src/components/FeedPost.tsx:36:    ? {
frontend/src/components/FeedPost.tsx:37:        type: review.listing.type,
frontend/src/components/FeedPost.tsx:38:        category: review.listing.category,
frontend/src/components/FeedPost.tsx:39:        name: review.listing.name,
frontend/src/components/FeedPost.tsx:40:        seed: review.listing.id,
frontend/src/components/FeedPost.tsx:41:      }
frontend/src/components/FeedPost.tsx:42:    : undefined;
frontend/src/components/FeedPost.tsx:43:  const u = review.user;
frontend/src/components/FeedPost.tsx:44:  const initial = (u?.firstName ?? u?.username ?? '?').trim()[0]?.toUpperCase() ?? '?';
frontend/src/components/FeedPost.tsx:45:  const [vote, setVote] = useState<VoteState>({
frontend/src/components/FeedPost.tsx:46:    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
frontend/src/components/FeedPost.tsx:47:    // server hydrates the viewer's own votes → likes are lit on first render
frontend/src/components/FeedPost.tsx:48:    mine: ((review as any).myVotes ?? []) as VoteType[],
frontend/src/components/FeedPost.tsx:49:  });
frontend/src/components/FeedPost.tsx:50:  const doVote = (t: VoteType) =>
frontend/src/components/FeedPost.tsx:51:    api.vote(review.id, t).then(setVote).catch(() => {});
frontend/src/components/FeedPost.tsx:53:  return (
frontend/src/components/FeedPost.tsx:54:    <div className="post" onClick={onOpen}>
frontend/src/components/FeedPost.tsx:55:      <button
frontend/src/components/FeedPost.tsx:56:        type="button"
frontend/src/components/FeedPost.tsx:57:        className="post-head"
frontend/src/components/FeedPost.tsx:58:        onClick={(e) => {
frontend/src/components/FeedPost.tsx:59:          e.stopPropagation(); // open the author's profile, never the post
frontend/src/components/FeedPost.tsx:60:          if (u?.id && onOpenUser) onOpenUser(u.id);
frontend/src/components/FeedPost.tsx:61:        }}
frontend/src/components/FeedPost.tsx:62:      >
frontend/src/components/FeedPost.tsx:63:        <SmartImg className="post-avatar" src={u?.photoUrl} width={200} loading="eager" monogram={initial} />
frontend/src/components/FeedPost.tsx:64:        <div style={{ textAlign: 'left' }}>
frontend/src/components/FeedPost.tsx:65:          <b>{u?.firstName ?? u?.username ?? 'Гость'}</b>
frontend/src/components/FeedPost.tsx:66:          <div className="meta" style={{ color: 'var(--hint)', fontSize: 13 }}>
frontend/src/components/FeedPost.tsx:67:            {photo ? 'поделился(ась) фото' : 'оставил(а) отзыв'}
frontend/src/components/FeedPost.tsx:68:          </div>
frontend/src/components/FeedPost.tsx:69:        </div>
frontend/src/components/FeedPost.tsx:70:      </button>
frontend/src/components/FeedPost.tsx:72:      {/* tap the photo → the REVIEW opens (the rest of the post opens the item card) */}
frontend/src/components/FeedPost.tsx:73:      {photo ? (
frontend/src/components/FeedPost.tsx:74:        <div
frontend/src/components/FeedPost.tsx:75:          className="post-photo-wrap"
frontend/src/components/FeedPost.tsx:76:          onClick={(e) => {
frontend/src/components/FeedPost.tsx:77:            if (onOpenPhoto) {
frontend/src/components/FeedPost.tsx:78:              e.stopPropagation();
frontend/src/components/FeedPost.tsx:79:              onOpenPhoto();
frontend/src/components/FeedPost.tsx:80:            }
frontend/src/components/FeedPost.tsx:81:          }}
frontend/src/components/FeedPost.tsx:82:        >
frontend/src/components/FeedPost.tsx:83:          <SmartImg className="post-photo" src={photo} stock={imageFallback} monogram={review.listing?.name} />
frontend/src/components/FeedPost.tsx:84:          {/* ↗ affordance: the photo IS tappable (opens the check-in) */}
frontend/src/components/FeedPost.tsx:85:          {onOpenPhoto && <span className="post-photo-open">↗</span>}
frontend/src/components/FeedPost.tsx:86:        </div>
frontend/src/components/FeedPost.tsx:87:      ) : cardPhoto || review.listing ? (
frontend/src/components/FeedPost.tsx:88:        <div className="post-photo-wrap">
frontend/src/components/FeedPost.tsx:89:          <SmartImg className="post-photo" src={cardPhoto} stock={imageFallback} monogram={review.listing?.name} />
frontend/src/components/FeedPost.tsx:90:        </div>
frontend/src/components/FeedPost.tsx:91:      ) : null}
frontend/src/components/FeedPost.tsx:93:      <div className="post-venue">
frontend/src/components/FeedPost.tsx:94:        <b>{review.listing?.name}</b>
frontend/src/components/FeedPost.tsx:95:        {review.venue && (
frontend/src/components/FeedPost.tsx:96:          <button
frontend/src/components/FeedPost.tsx:97:            type="button"
frontend/src/components/FeedPost.tsx:98:            className="meta post-venue-link"
frontend/src/components/FeedPost.tsx:99:            style={{ color: 'var(--hint)', fontSize: 13, marginTop: 2, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block' }}
frontend/src/components/FeedPost.tsx:100:            onClick={(e) => {
frontend/src/components/FeedPost.tsx:101:              if (onOpenVenue) {
frontend/src/components/FeedPost.tsx:102:                e.stopPropagation(); // venue tap opens the VENUE, not the item
frontend/src/components/FeedPost.tsx:103:                onOpenVenue();
frontend/src/components/FeedPost.tsx:104:              }
frontend/src/components/FeedPost.tsx:105:            }}
frontend/src/components/FeedPost.tsx:106:          >
frontend/src/components/FeedPost.tsx:107:            📍 {review.venue.name}
frontend/src/components/FeedPost.tsx:108:          </button>
frontend/src/components/FeedPost.tsx:109:        )}
frontend/src/components/FeedPost.tsx:110:        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
frontend/src/components/FeedPost.tsx:111:          <Stars value={review.rating} />
frontend/src/components/FeedPost.tsx:112:          <span className="meta" style={{ color: 'var(--hint)', fontSize: 13 }}>
frontend/src/components/FeedPost.tsx:113:            {review.rating.toFixed(1)}
frontend/src/components/FeedPost.tsx:114:          </span>
frontend/src/components/FeedPost.tsx:115:        </div>
frontend/src/components/FeedPost.tsx:116:        {review.text && <div className="post-text">{review.text}</div>}
frontend/src/components/FeedPost.tsx:118:        <div className="vote-row" onClick={(e) => e.stopPropagation()}>
frontend/src/components/FeedPost.tsx:119:          {(['USEFUL', 'FUNNY', 'COOL', 'OHNO'] as VoteType[]).map((t) => (
frontend/src/components/FeedPost.tsx:120:            <button
frontend/src/components/FeedPost.tsx:121:              key={t}
frontend/src/components/FeedPost.tsx:122:              className={'vote-btn' + (vote.mine.includes(t) ? ' active' : '')}
frontend/src/components/FeedPost.tsx:123:              onClick={() => doVote(t)}
frontend/src/components/FeedPost.tsx:124:            >
frontend/src/components/FeedPost.tsx:125:              {VOTE_LABEL[t]}
frontend/src/components/FeedPost.tsx:126:              {vote.counts[t] ? ` ${vote.counts[t]}` : ''}
frontend/src/components/FeedPost.tsx:127:            </button>
frontend/src/components/FeedPost.tsx:128:          ))}
frontend/src/components/FeedPost.tsx:129:        </div>
frontend/src/components/FeedPost.tsx:131:        {review.topComment && (
frontend/src/components/FeedPost.tsx:132:          <div className="post-cmt">
frontend/src/components/FeedPost.tsx:133:            <b
frontend/src/components/FeedPost.tsx:134:              onClick={(e) => {
frontend/src/components/FeedPost.tsx:135:                const uid = review.topComment?.user?.id;
frontend/src/components/FeedPost.tsx:136:                if (uid && onOpenUser) {
frontend/src/components/FeedPost.tsx:137:                  e.stopPropagation();
frontend/src/components/FeedPost.tsx:138:                  onOpenUser(uid);
frontend/src/components/FeedPost.tsx:139:                }
frontend/src/components/FeedPost.tsx:140:              }}
frontend/src/components/FeedPost.tsx:141:            >
frontend/src/components/FeedPost.tsx:142:              {review.topComment.user?.firstName ?? review.topComment.user?.username ?? 'Гость'}:
frontend/src/components/FeedPost.tsx:143:            </b>{' '}
frontend/src/components/FeedPost.tsx:144:            {review.topComment.text}
frontend/src/components/FeedPost.tsx:145:          </div>
frontend/src/components/FeedPost.tsx:146:        )}
frontend/src/components/FeedPost.tsx:147:        {onComments && (
frontend/src/components/FeedPost.tsx:148:          <button
frontend/src/components/FeedPost.tsx:149:            className="post-discuss"
frontend/src/components/FeedPost.tsx:150:            onClick={(e) => {
frontend/src/components/FeedPost.tsx:151:              e.stopPropagation();
frontend/src/components/FeedPost.tsx:152:              onComments();
frontend/src/components/FeedPost.tsx:153:            }}
frontend/src/components/FeedPost.tsx:154:          >
frontend/src/components/FeedPost.tsx:155:            💬{' '}
frontend/src/components/FeedPost.tsx:156:            {(review.commentCount ?? 0) > 1
frontend/src/components/FeedPost.tsx:157:              ? `Показать остальные комментарии (${review.commentCount})`
frontend/src/components/FeedPost.tsx:158:              : review.commentCount === 1
frontend/src/components/FeedPost.tsx:159:                ? 'Ответить'
frontend/src/components/FeedPost.tsx:160:                : 'Обсудить'}
frontend/src/components/FeedPost.tsx:161:          </button>
frontend/src/components/FeedPost.tsx:162:        )}
frontend/src/components/FeedPost.tsx:163:      </div>
frontend/src/components/FeedPost.tsx:165:      {/* no rate-CTA on someone else's review post (product decision): opening a
frontend/src/components/FeedPost.tsx:166:          friend's tasting must not push the viewer to rate the same item */}
frontend/src/components/FeedPost.tsx:167:    </div>
frontend/src/components/FeedPost.tsx:168:  );
frontend/src/components/FeedPost.tsx:169:}
frontend/src/components/ListingCard.tsx:1:import { useState } from 'react';
frontend/src/components/ListingCard.tsx:2:import type { Listing } from '../types';
frontend/src/components/ListingCard.tsx:3:import { ratingsWord } from '../plural';
frontend/src/components/ListingCard.tsx:4:import { Stars } from './Stars';
frontend/src/components/ListingCard.tsx:5:import { VenuePhoto } from './VenuePhoto';
frontend/src/components/ListingCard.tsx:6:import { NotInterested } from './NotInterested';
frontend/src/components/ListingCard.tsx:7:
frontend/src/components/ListingCard.tsx:8:const TYPE_LABEL: Record<Listing['type'], string> = {
frontend/src/components/ListingCard.tsx:9:  RESTAURANT: 'Ресторан',
frontend/src/components/ListingCard.tsx:10:  DISH: 'Блюдо',
frontend/src/components/ListingCard.tsx:11:  DRINK: 'Напиток',
frontend/src/components/ListingCard.tsx:12:};
frontend/src/components/ListingCard.tsx:13:
frontend/src/components/ListingCard.tsx:14:export function ListingCard({
frontend/src/components/ListingCard.tsx:15:  listing,
frontend/src/components/ListingCard.tsx:16:  favorite,
frontend/src/components/ListingCard.tsx:17:  onToggleFavorite,
frontend/src/components/ListingCard.tsx:18:  onClick,
frontend/src/components/ListingCard.tsx:19:  onRate,
frontend/src/components/ListingCard.tsx:20:  onNotInterested,
frontend/src/components/ListingCard.tsx:21:}: {
frontend/src/components/ListingCard.tsx:22:  listing: Listing;
frontend/src/components/ListingCard.tsx:23:  favorite?: boolean;
frontend/src/components/ListingCard.tsx:24:  onToggleFavorite?: () => void;
frontend/src/components/ListingCard.tsx:25:  onClick?: () => void;
frontend/src/components/ListingCard.tsx:26:  onRate?: (rating: number) => void; // tap a star → ask where → fill card
frontend/src/components/ListingCard.tsx:27:  onNotInterested?: () => void;
frontend/src/components/ListingCard.tsx:28:}) {
frontend/src/components/ListingCard.tsx:29:  const [hover, setHover] = useState(0);
frontend/src/components/ListingCard.tsx:30:  return (
frontend/src/components/ListingCard.tsx:31:    <div className="card-wrap">
frontend/src/components/ListingCard.tsx:32:      <div className="card" onClick={onClick}>
frontend/src/components/ListingCard.tsx:33:        <div className="card-photo-wrap">
frontend/src/components/ListingCard.tsx:34:          <VenuePhoto listing={listing} className="photo" />
frontend/src/components/ListingCard.tsx:35:          {(listing as any).matchPct != null && (
frontend/src/components/ListingCard.tsx:36:            <span className="match-pct">🤖 {(listing as any).matchPct}%</span>
frontend/src/components/ListingCard.tsx:37:          )}
frontend/src/components/ListingCard.tsx:38:          {/* price on the photo (bottom-left) only when tied to a specific venue */}
frontend/src/components/ListingCard.tsx:39:          {listing.recVenue && (listing.recVenue as any).price != null && (
frontend/src/components/ListingCard.tsx:40:            <span className="newdish-price">{(listing.recVenue as any).price} ₽</span>
frontend/src/components/ListingCard.tsx:41:          )}
frontend/src/components/ListingCard.tsx:42:        </div>
frontend/src/components/ListingCard.tsx:43:        <div className="body">
frontend/src/components/ListingCard.tsx:44:          {/* "Блюдо"/"Напиток" is implied — only label real venues */}
frontend/src/components/ListingCard.tsx:45:          {listing.type === 'RESTAURANT' && (
frontend/src/components/ListingCard.tsx:46:            <span className="badge-type">{TYPE_LABEL[listing.type]}</span>
frontend/src/components/ListingCard.tsx:47:          )}
frontend/src/components/ListingCard.tsx:48:          <div className="name" style={{ marginTop: listing.type === 'RESTAURANT' ? 6 : 0 }}>
frontend/src/components/ListingCard.tsx:49:            {listing.name}
frontend/src/components/ListingCard.tsx:50:          </div>
frontend/src/components/ListingCard.tsx:51:          {(listing as any).matchedItem ? (
frontend/src/components/ListingCard.tsx:52:            // searched a dish/drink → show ITS rating at this venue (empty if none yet)
frontend/src/components/ListingCard.tsx:53:            <div className="meta best-on-card">
frontend/src/components/ListingCard.tsx:54:              {(listing as any).matchedItem.name}{' '}
frontend/src/components/ListingCard.tsx:55:              {(listing as any).matchedItem.rating != null
frontend/src/components/ListingCard.tsx:56:                ? `★ ${(listing as any).matchedItem.rating.toFixed(1)} (${(listing as any).matchedItem.count})`
frontend/src/components/ListingCard.tsx:57:                : '· пока без оценок'}
frontend/src/components/ListingCard.tsx:58:            </div>
frontend/src/components/ListingCard.tsx:59:          ) : listing.bestVenue ? (
frontend/src/components/ListingCard.tsx:60:            // «Лучшее в» is EARNED by ratings; with zero reviews it's just a place
frontend/src/components/ListingCard.tsx:61:            listing.reviewCount > 0 ? (
frontend/src/components/ListingCard.tsx:62:              <div className="meta best-on-card">🏆 Лучшее в: {listing.bestVenue.name}</div>
frontend/src/components/ListingCard.tsx:63:            ) : (
frontend/src/components/ListingCard.tsx:64:              <div className="meta">Попробуйте в: 📍{listing.bestVenue.name}</div>
frontend/src/components/ListingCard.tsx:65:            )
frontend/src/components/ListingCard.tsx:66:          ) : listing.recVenue ? (
frontend/src/components/ListingCard.tsx:67:            // recommended dish "в конкретном месте" → venue name (price is on the photo)
frontend/src/components/ListingCard.tsx:68:            <div className="meta">📍 {listing.recVenue.name}</div>
frontend/src/components/ListingCard.tsx:69:          ) : (listing as any).tryAt ? (
frontend/src/components/ListingCard.tsx:70:            // no best venue → a random place that serves it
frontend/src/components/ListingCard.tsx:71:            <div className="meta">
frontend/src/components/ListingCard.tsx:72:              {listing.reviewCount === 0 ? 'Попробуйте в:' : ''}📍{(listing as any).tryAt.name}
frontend/src/components/ListingCard.tsx:73:            </div>
frontend/src/components/ListingCard.tsx:74:          ) : (
frontend/src/components/ListingCard.tsx:75:            <div className="meta">
frontend/src/components/ListingCard.tsx:76:              {listing.category && !/^(блюдо|напиток)$/i.test(listing.category) ? listing.category : ''}
frontend/src/components/ListingCard.tsx:77:              {listing.priceLevel ? ` · ${'₽'.repeat(listing.priceLevel)}` : ''}
frontend/src/components/ListingCard.tsx:78:            </div>
frontend/src/components/ListingCard.tsx:79:          )}
frontend/src/components/ListingCard.tsx:80:          {listing.type === 'RESTAURANT' && (listing.address || listing.cityLabel) && (
frontend/src/components/ListingCard.tsx:81:            <div className="meta">📍 {listing.address || listing.cityLabel}</div>
frontend/src/components/ListingCard.tsx:82:          )}
frontend/src/components/ListingCard.tsx:83:          <div className="row">
frontend/src/components/ListingCard.tsx:84:            {listing.reviewCount > 0 ? (
frontend/src/components/ListingCard.tsx:85:              <>
frontend/src/components/ListingCard.tsx:86:                <Stars value={listing.avgRating} />
frontend/src/components/ListingCard.tsx:87:                <span style={{ fontWeight: 600 }}>{listing.avgRating.toFixed(1)}</span>
frontend/src/components/ListingCard.tsx:88:                <span className="meta">({listing.reviewCount} {ratingsWord(listing.reviewCount)})</span>
frontend/src/components/ListingCard.tsx:89:              </>
frontend/src/components/ListingCard.tsx:90:            ) : (
frontend/src/components/ListingCard.tsx:91:              // consistent everywhere: 5 grey stars + "Нет оценок". When others are
frontend/src/components/ListingCard.tsx:92:              // already eyeing this card, say so — social proof beats a bare zero.
frontend/src/components/ListingCard.tsx:93:              <>
frontend/src/components/ListingCard.tsx:94:                <Stars value={0} />
frontend/src/components/ListingCard.tsx:95:                {((listing as any).wantCount ?? 0) > 0 || ((listing as any).viewCount ?? 0) > 1 ? (
frontend/src/components/ListingCard.tsx:96:                  <span className="no-rating proof">
frontend/src/components/ListingCard.tsx:97:                    {((listing as any).viewCount ?? 0) > 1 ? `👀 ${(listing as any).viewCount}` : ''}
frontend/src/components/ListingCard.tsx:98:                    {((listing as any).viewCount ?? 0) > 1 && ((listing as any).wantCount ?? 0) > 0 ? ' · ' : ''}
frontend/src/components/ListingCard.tsx:99:                    {((listing as any).wantCount ?? 0) > 0 ? `❤️ ${(listing as any).wantCount}` : ''}
frontend/src/components/ListingCard.tsx:100:                  </span>
frontend/src/components/ListingCard.tsx:101:                ) : (
frontend/src/components/ListingCard.tsx:102:                  <span className="no-rating">Нет оценок</span>
frontend/src/components/ListingCard.tsx:103:                )}
frontend/src/components/ListingCard.tsx:104:              </>
frontend/src/components/ListingCard.tsx:105:            )}
frontend/src/components/ListingCard.tsx:106:          </div>
frontend/src/components/ListingCard.tsx:107:          {/* pinned to the card bottom so every card is the same height */}
frontend/src/components/ListingCard.tsx:108:          <div className="card-foot">
frontend/src/components/ListingCard.tsx:109:            {(listing.type === 'DISH' || listing.type === 'DRINK') && onRate && (
frontend/src/components/ListingCard.tsx:110:              <div className="qr" onMouseLeave={() => setHover(0)} onClick={(e) => e.stopPropagation()}>
frontend/src/components/ListingCard.tsx:111:                {[1, 2, 3, 4, 5].map((n) => (
frontend/src/components/ListingCard.tsx:112:                  <button
frontend/src/components/ListingCard.tsx:113:                    key={n}
frontend/src/components/ListingCard.tsx:114:                    className={'qr-star' + (n <= hover ? ' on' : '')}
frontend/src/components/ListingCard.tsx:115:                    onMouseEnter={() => setHover(n)}
frontend/src/components/ListingCard.tsx:116:                    onClick={(e) => {
frontend/src/components/ListingCard.tsx:117:                      e.stopPropagation();
frontend/src/components/ListingCard.tsx:118:                      onRate(n);
frontend/src/components/ListingCard.tsx:119:                    }}
frontend/src/components/ListingCard.tsx:120:                  >
frontend/src/components/ListingCard.tsx:121:                    ★
frontend/src/components/ListingCard.tsx:122:                  </button>
frontend/src/components/ListingCard.tsx:123:                ))}
frontend/src/components/ListingCard.tsx:124:              </div>
frontend/src/components/ListingCard.tsx:125:            )}
frontend/src/components/ListingCard.tsx:126:            {onToggleFavorite && (
frontend/src/components/ListingCard.tsx:127:              <button
frontend/src/components/ListingCard.tsx:128:                className={'fav-btn' + (favorite ? ' on' : '')}
frontend/src/components/ListingCard.tsx:129:                onClick={(e) => {
frontend/src/components/ListingCard.tsx:130:                  e.stopPropagation();
frontend/src/components/ListingCard.tsx:131:                  onToggleFavorite();
frontend/src/components/ListingCard.tsx:132:                }}
frontend/src/components/ListingCard.tsx:133:              >
frontend/src/components/ListingCard.tsx:134:                {favorite ? '✓ Хочу попробовать' : 'Хочу попробовать'}
frontend/src/components/ListingCard.tsx:135:              </button>
frontend/src/components/ListingCard.tsx:136:            )}
frontend/src/components/ListingCard.tsx:137:          </div>
frontend/src/components/ListingCard.tsx:138:        </div>
frontend/src/components/ListingCard.tsx:139:      </div>
frontend/src/components/ListingCard.tsx:140:      {onToggleFavorite && (
frontend/src/components/ListingCard.tsx:141:        <button
frontend/src/components/ListingCard.tsx:142:          className="heart"
frontend/src/components/ListingCard.tsx:143:          onClick={(e) => {
frontend/src/components/ListingCard.tsx:144:            e.stopPropagation();
frontend/src/components/ListingCard.tsx:145:            onToggleFavorite();
frontend/src/components/ListingCard.tsx:146:          }}
frontend/src/components/ListingCard.tsx:147:        >
frontend/src/components/ListingCard.tsx:148:          {favorite ? '♥' : '♡'}
frontend/src/components/ListingCard.tsx:149:        </button>
frontend/src/components/ListingCard.tsx:150:      )}
frontend/src/components/ListingCard.tsx:151:      {onNotInterested && <NotInterested onNotInterested={onNotInterested} />}
frontend/src/components/ListingCard.tsx:152:    </div>
frontend/src/components/ListingCard.tsx:153:  );
frontend/src/components/ListingCard.tsx:154:}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "." frontend/src/components/SmartImg.tsx frontend/src/components/FeedPost.tsx frontend/src/components/ListRow.tsx frontend/src/hooks/useFavorites.ts' in D:\Приложения\Yelp
 succeeded in 258ms:
frontend/src/hooks/useFavorites.ts:1:import { useCallback, useEffect, useState } from 'react';
frontend/src/hooks/useFavorites.ts:2:import { api } from '../api';
frontend/src/hooks/useFavorites.ts:4:export function useFavorites() {
frontend/src/hooks/useFavorites.ts:5:  const [ids, setIds] = useState<Set<string>>(new Set());
frontend/src/hooks/useFavorites.ts:7:  const reload = useCallback(() => {
frontend/src/hooks/useFavorites.ts:8:    api
frontend/src/hooks/useFavorites.ts:9:      .favorites()
frontend/src/hooks/useFavorites.ts:10:      .then((favs) => setIds(new Set(favs.map((f) => f.listingId))))
frontend/src/hooks/useFavorites.ts:11:      .catch(() => {});
frontend/src/hooks/useFavorites.ts:12:  }, []);
frontend/src/hooks/useFavorites.ts:14:  useEffect(() => {
frontend/src/hooks/useFavorites.ts:15:    reload();
frontend/src/hooks/useFavorites.ts:16:  }, [reload]);
frontend/src/hooks/useFavorites.ts:18:  const toggle = useCallback((id: string) => {
frontend/src/hooks/useFavorites.ts:19:    setIds((prev) => {
frontend/src/hooks/useFavorites.ts:20:      const has = prev.has(id);
frontend/src/hooks/useFavorites.ts:21:      const next = new Set(prev);
frontend/src/hooks/useFavorites.ts:22:      if (has) {
frontend/src/hooks/useFavorites.ts:23:        next.delete(id);
frontend/src/hooks/useFavorites.ts:24:        api.removeFavorite(id).catch(() => {});
frontend/src/hooks/useFavorites.ts:25:      } else {
frontend/src/hooks/useFavorites.ts:26:        next.add(id);
frontend/src/hooks/useFavorites.ts:27:        api.addFavorite(id).catch(() => {});
frontend/src/hooks/useFavorites.ts:28:        api.logEvent(id, 'SAVE'); // implicit-feedback signal for the recommender
frontend/src/hooks/useFavorites.ts:29:      }
frontend/src/hooks/useFavorites.ts:30:      return next;
frontend/src/hooks/useFavorites.ts:31:    });
frontend/src/hooks/useFavorites.ts:32:  }, []);
frontend/src/hooks/useFavorites.ts:34:  return { ids, toggle, reload };
frontend/src/hooks/useFavorites.ts:35:}
frontend/src/components/ListRow.tsx:1:import type { Listing } from '../types';
frontend/src/components/ListRow.tsx:2:import { cuisineTags } from '../cuisine';
frontend/src/components/ListRow.tsx:3:import { telHref, callPhone } from '../telegram';
frontend/src/components/ListRow.tsx:4:import { useCategoryProgress } from '../categoryGate';
frontend/src/components/ListRow.tsx:5:import { ratingsWord, openStatus } from '../plural';
frontend/src/components/ListRow.tsx:6:import { Stars } from './Stars';
frontend/src/components/ListRow.tsx:7:import { VenuePhoto } from './VenuePhoto';
frontend/src/components/ListRow.tsx:8:import { NotInterested } from './NotInterested';
frontend/src/components/ListRow.tsx:9:
frontend/src/components/ListRow.tsx:10:const TYPE_LABEL: Record<Listing['type'], string> = {
frontend/src/components/ListRow.tsx:11:  RESTAURANT: 'Ресторан',
frontend/src/components/ListRow.tsx:12:  DISH: 'Блюдо',
frontend/src/components/ListRow.tsx:13:  DRINK: 'Напиток',
frontend/src/components/ListRow.tsx:14:};
frontend/src/components/ListRow.tsx:15:
frontend/src/components/ListRow.tsx:16:// Yelp-style list card: image banner + name/rating/meta + a Call button.
frontend/src/components/ListRow.tsx:17:export function ListRow({
frontend/src/components/ListRow.tsx:18:  listing,
frontend/src/components/ListRow.tsx:19:  rank,
frontend/src/components/ListRow.tsx:20:  favorite,
frontend/src/components/ListRow.tsx:21:  onToggleFavorite,
frontend/src/components/ListRow.tsx:22:  onClick,
frontend/src/components/ListRow.tsx:23:  onTagClick,
frontend/src/components/ListRow.tsx:24:  onNotInterested,
frontend/src/components/ListRow.tsx:25:}: {
frontend/src/components/ListRow.tsx:26:  listing: Listing;
frontend/src/components/ListRow.tsx:27:  rank?: number;
frontend/src/components/ListRow.tsx:28:  favorite?: boolean;
frontend/src/components/ListRow.tsx:29:  onToggleFavorite?: () => void;
frontend/src/components/ListRow.tsx:30:  onClick?: () => void;
frontend/src/components/ListRow.tsx:31:  onTagClick?: (tag: string) => void;
frontend/src/components/ListRow.tsx:32:  onNotInterested?: () => void;
frontend/src/components/ListRow.tsx:33:}) {
frontend/src/components/ListRow.tsx:34:  const isItem = listing.type === 'DISH' || listing.type === 'DRINK';
frontend/src/components/ListRow.tsx:35:  const { isUnlocked } = useCategoryProgress();
frontend/src/components/ListRow.tsx:36:  // when the search matched a dish/drink this venue serves, show ITS rating here
frontend/src/components/ListRow.tsx:37:  const matched = (listing as any).matchedItem as { name: string; rating: number | null; count: number } | undefined;
frontend/src/components/ListRow.tsx:38:  const status = !isItem ? openStatus(listing.hours) : null;
frontend/src/components/ListRow.tsx:39:  let tags = cuisineTags(listing.cuisine);
frontend/src/components/ListRow.tsx:40:  // fall back to a meaningful category when no cuisine; never the generic type word
frontend/src/components/ListRow.tsx:41:  if (tags.length === 0 && listing.category && !/ресторан|заведение|блюдо|напиток/i.test(listing.category)) {
frontend/src/components/ListRow.tsx:42:    tags = [listing.category];
frontend/src/components/ListRow.tsx:43:  }
frontend/src/components/ListRow.tsx:44:
frontend/src/components/ListRow.tsx:45:  return (
frontend/src/components/ListRow.tsx:46:    <div className="vcard" onClick={onClick}>
frontend/src/components/ListRow.tsx:47:      <div className="vcard-media">
frontend/src/components/ListRow.tsx:48:        <VenuePhoto listing={listing} className="vcard-photo" />
frontend/src/components/ListRow.tsx:49:        {onToggleFavorite && (
frontend/src/components/ListRow.tsx:50:          <button
frontend/src/components/ListRow.tsx:51:            className="heart"
frontend/src/components/ListRow.tsx:52:            onClick={(e) => {
frontend/src/components/ListRow.tsx:53:              e.stopPropagation();
frontend/src/components/ListRow.tsx:54:              onToggleFavorite();
frontend/src/components/ListRow.tsx:55:            }}
frontend/src/components/ListRow.tsx:56:          >
frontend/src/components/ListRow.tsx:57:            {favorite ? '♥' : '♡'}
frontend/src/components/ListRow.tsx:58:          </button>
frontend/src/components/ListRow.tsx:59:        )}
frontend/src/components/ListRow.tsx:60:        {onNotInterested && <NotInterested onNotInterested={onNotInterested} />}
frontend/src/components/ListRow.tsx:61:      </div>
frontend/src/components/ListRow.tsx:62:
frontend/src/components/ListRow.tsx:63:      <div className="vcard-body">
frontend/src/components/ListRow.tsx:64:        <div className="vcard-top">
frontend/src/components/ListRow.tsx:65:          <div className="name">
frontend/src/components/ListRow.tsx:66:            {rank ? `${rank}. ` : ''}
frontend/src/components/ListRow.tsx:67:            {listing.name}
frontend/src/components/ListRow.tsx:68:          </div>
frontend/src/components/ListRow.tsx:69:          {listing.priceLevel ? (
frontend/src/components/ListRow.tsx:70:            <span className="price">{'₽'.repeat(listing.priceLevel)}</span>
frontend/src/components/ListRow.tsx:71:          ) : null}
frontend/src/components/ListRow.tsx:72:        </div>
frontend/src/components/ListRow.tsx:73:
frontend/src/components/ListRow.tsx:74:        {/* recommendation card → the recommended place (from recsys) */}
frontend/src/components/ListRow.tsx:75:        {isItem && !listing.bestVenue && listing.recVenue && (
frontend/src/components/ListRow.tsx:76:          <div className="sub" style={{ color: 'var(--accent)', fontWeight: 600 }}>
frontend/src/components/ListRow.tsx:77:            {listing.reviewCount === 0 ? 'Попробуйте в:' : ''}📍{listing.recVenue.name}
frontend/src/components/ListRow.tsx:78:          </div>
frontend/src/components/ListRow.tsx:79:        )}
frontend/src/components/ListRow.tsx:80:        {/* no best venue yet → a random venue that serves it */}
frontend/src/components/ListRow.tsx:81:        {isItem && !listing.bestVenue && !listing.recVenue && (listing as any).tryAt && (
frontend/src/components/ListRow.tsx:82:          <div className="sub">
frontend/src/components/ListRow.tsx:83:            {listing.reviewCount === 0 ? 'Попробуйте в:' : ''}📍{(listing as any).tryAt.name}
frontend/src/components/ListRow.tsx:84:          </div>
frontend/src/components/ListRow.tsx:85:        )}
frontend/src/components/ListRow.tsx:86:        {/* dish/drink: «Лучшее в» is earned by ratings — zero reviews means it's
frontend/src/components/ListRow.tsx:87:            just a place to try, not the best one */}
frontend/src/components/ListRow.tsx:88:        {isItem && listing.bestVenue && (
frontend/src/components/ListRow.tsx:89:          listing.reviewCount > 0 ? (
frontend/src/components/ListRow.tsx:90:            <div className="sub" style={{ color: 'var(--accent)', fontWeight: 600 }}>
frontend/src/components/ListRow.tsx:91:              🏆 Лучшее в: {listing.bestVenue.name}
frontend/src/components/ListRow.tsx:92:            </div>
frontend/src/components/ListRow.tsx:93:          ) : (
frontend/src/components/ListRow.tsx:94:            <div className="sub">Попробуйте в: 📍{listing.bestVenue.name}</div>
frontend/src/components/ListRow.tsx:95:          )
frontend/src/components/ListRow.tsx:96:        )}
frontend/src/components/ListRow.tsx:97:        {/* searched a dish/drink → this venue shows ITS name above the rating */}
frontend/src/components/ListRow.tsx:98:        {matched && (
frontend/src/components/ListRow.tsx:99:          <div className="sub" style={{ color: 'var(--accent)', fontWeight: 700 }}>
frontend/src/components/ListRow.tsx:100:            ☕ {matched.name}
frontend/src/components/ListRow.tsx:101:          </div>
frontend/src/components/ListRow.tsx:102:        )}
frontend/src/components/ListRow.tsx:103:        {/* rating: the searched item's rating here (or the venue's own for items/no
frontend/src/components/ListRow.tsx:104:            search). 5 GREY stars when there are no ratings yet. */}
frontend/src/components/ListRow.tsx:105:        <div className="rowline">
frontend/src/components/ListRow.tsx:106:          {(() => {
frontend/src/components/ListRow.tsx:107:            const val = matched ? matched.rating : listing.reviewCount > 0 ? listing.avgRating : null;
frontend/src/components/ListRow.tsx:108:            const cnt = matched ? matched.count : listing.reviewCount;
frontend/src/components/ListRow.tsx:109:            return (
frontend/src/components/ListRow.tsx:110:              <>
frontend/src/components/ListRow.tsx:111:                <Stars value={val ?? 0} />
frontend/src/components/ListRow.tsx:112:                {val != null ? (
frontend/src/components/ListRow.tsx:113:                  <span className="cnt">
frontend/src/components/ListRow.tsx:114:                    {val.toFixed(1)} ({cnt} {ratingsWord(cnt)})
frontend/src/components/ListRow.tsx:115:                  </span>
frontend/src/components/ListRow.tsx:116:                ) : (
frontend/src/components/ListRow.tsx:117:                  <span className="cnt" style={{ color: 'var(--hint)' }}>Нет оценок</span>
frontend/src/components/ListRow.tsx:118:                )}
frontend/src/components/ListRow.tsx:119:              </>
frontend/src/components/ListRow.tsx:120:            );
frontend/src/components/ListRow.tsx:121:          })()}
frontend/src/components/ListRow.tsx:122:        </div>
frontend/src/components/ListRow.tsx:123:
frontend/src/components/ListRow.tsx:124:        {/* venue: location · price · open/closed — Yelp-style. No "Ресторан"/"Сеть". */}
frontend/src/components/ListRow.tsx:125:        {!isItem && (
frontend/src/components/ListRow.tsx:126:          <div className="sub loc-line">
frontend/src/components/ListRow.tsx:127:            {/* a chain spans many points → no single metro; show the city instead.
frontend/src/components/ListRow.tsx:128:                A single venue shows its nearest metro station ("м. …"). */}
frontend/src/components/ListRow.tsx:129:            📍 {(listing.branchCount ?? 1) > 1
frontend/src/components/ListRow.tsx:130:              ? (listing.cityLabel || 'Москва')
frontend/src/components/ListRow.tsx:131:              : listing.metro
frontend/src/components/ListRow.tsx:132:                ? `м. ${listing.metro}`
frontend/src/components/ListRow.tsx:133:                : listing.cityLabel || 'Москва'}
frontend/src/components/ListRow.tsx:134:            {listing.priceLevel ? ` · ${'₽'.repeat(listing.priceLevel)}` : ''}
frontend/src/components/ListRow.tsx:135:            {status && (
frontend/src/components/ListRow.tsx:136:              <>
frontend/src/components/ListRow.tsx:137:                {' · '}
frontend/src/components/ListRow.tsx:138:                <span style={{ color: status.open ? '#2e7d32' : 'var(--accent)', fontWeight: 700 }}>
frontend/src/components/ListRow.tsx:139:                  {status.text}
frontend/src/components/ListRow.tsx:140:                </span>
frontend/src/components/ListRow.tsx:141:              </>
frontend/src/components/ListRow.tsx:142:            )}
frontend/src/components/ListRow.tsx:143:          </div>
frontend/src/components/ListRow.tsx:144:        )}
frontend/src/components/ListRow.tsx:145:        {listing.snippet && (
frontend/src/components/ListRow.tsx:146:          <div className="card-review">
frontend/src/components/ListRow.tsx:147:            «{listing.snippet.text.length > 120
frontend/src/components/ListRow.tsx:148:              ? listing.snippet.text.slice(0, 120) + '…'
frontend/src/components/ListRow.tsx:149:              : listing.snippet.text}»
frontend/src/components/ListRow.tsx:150:          </div>
frontend/src/components/ListRow.tsx:151:        )}
frontend/src/components/ListRow.tsx:152:        {tags.length > 0 && (
frontend/src/components/ListRow.tsx:153:          <div className="card-tags">
frontend/src/components/ListRow.tsx:154:            {tags.map((t) => (
frontend/src/components/ListRow.tsx:155:              <button
frontend/src/components/ListRow.tsx:156:                key={t}
frontend/src/components/ListRow.tsx:157:                className="ctag"
frontend/src/components/ListRow.tsx:158:                onClick={(e) => {
frontend/src/components/ListRow.tsx:159:                  e.stopPropagation(); // never open the card from a tag
frontend/src/components/ListRow.tsx:160:                  onTagClick?.(t);
frontend/src/components/ListRow.tsx:161:                }}
frontend/src/components/ListRow.tsx:162:              >
frontend/src/components/ListRow.tsx:163:                {t}
frontend/src/components/ListRow.tsx:164:              </button>
frontend/src/components/ListRow.tsx:165:            ))}
frontend/src/components/ListRow.tsx:166:          </div>
frontend/src/components/ListRow.tsx:167:        )}
frontend/src/components/ListRow.tsx:168:      </div>
frontend/src/components/ListRow.tsx:169:
frontend/src/components/ListRow.tsx:170:      <div className="vcard-actions">
frontend/src/components/ListRow.tsx:171:        {onToggleFavorite && (
frontend/src/components/ListRow.tsx:172:          <button
frontend/src/components/ListRow.tsx:173:            className={'fav-btn' + (favorite ? ' on' : '')}
frontend/src/components/ListRow.tsx:174:            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
frontend/src/components/ListRow.tsx:175:          >
frontend/src/components/ListRow.tsx:176:            {favorite ? '✓ Хочу попробовать' : '♡ Хочу попробовать'}
frontend/src/components/ListRow.tsx:177:          </button>
frontend/src/components/ListRow.tsx:178:        )}
frontend/src/components/ListRow.tsx:179:        {listing.phone && (
frontend/src/components/ListRow.tsx:180:          <a
frontend/src/components/ListRow.tsx:181:            className="call-btn"
frontend/src/components/ListRow.tsx:182:            href={telHref(listing.phone)}
frontend/src/components/ListRow.tsx:183:            onClick={(e) => { e.preventDefault(); e.stopPropagation(); callPhone(listing.phone!, listing.name, `l_${listing.id}`); }}
frontend/src/components/ListRow.tsx:184:          >
frontend/src/components/ListRow.tsx:185:            📞 Позвонить
frontend/src/components/ListRow.tsx:186:          </a>
frontend/src/components/ListRow.tsx:187:        )}
frontend/src/components/ListRow.tsx:188:      </div>
frontend/src/components/ListRow.tsx:189:    </div>
frontend/src/components/ListRow.tsx:190:  );
frontend/src/components/ListRow.tsx:191:}
frontend/src/components/SmartImg.tsx:1:import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
frontend/src/components/SmartImg.tsx:2:import { retryImageUrl, thumb } from '../img';
frontend/src/components/SmartImg.tsx:4:type StockPhoto = {
frontend/src/components/SmartImg.tsx:5:  type?: string | null;
frontend/src/components/SmartImg.tsx:6:  category?: string | null;
frontend/src/components/SmartImg.tsx:7:  name?: string | null;
frontend/src/components/SmartImg.tsx:8:  seed?: string | null;
frontend/src/components/SmartImg.tsx:9:  src?: string | null;
frontend/src/components/SmartImg.tsx:10:};
frontend/src/components/SmartImg.tsx:12:function colorFromName(name: string): string {
frontend/src/components/SmartImg.tsx:13:  let h = 0;
frontend/src/components/SmartImg.tsx:14:  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
frontend/src/components/SmartImg.tsx:15:  return `hsl(${h % 360} 42% 42%)`;
frontend/src/components/SmartImg.tsx:16:}
frontend/src/components/SmartImg.tsx:18:function stockUrl(stock?: StockPhoto): string | undefined {
frontend/src/components/SmartImg.tsx:19:  if (!stock) return undefined;
frontend/src/components/SmartImg.tsx:20:  if (stock.src) return stock.src;
frontend/src/components/SmartImg.tsx:21:  return (
frontend/src/components/SmartImg.tsx:22:    `/api/venue-stock?type=${encodeURIComponent(stock.type ?? '')}` +
frontend/src/components/SmartImg.tsx:23:    `&category=${encodeURIComponent(stock.category ?? '')}` +
frontend/src/components/SmartImg.tsx:24:    `&name=${encodeURIComponent(stock.name ?? '')}` +
frontend/src/components/SmartImg.tsx:25:    `&seed=${encodeURIComponent(stock.seed ?? stock.name ?? '')}`
frontend/src/components/SmartImg.tsx:26:  );
frontend/src/components/SmartImg.tsx:27:}
frontend/src/components/SmartImg.tsx:29:/** Resized thumbnail -> original -> cache-busted retry -> stock -> monogram. */
frontend/src/components/SmartImg.tsx:30:export function SmartImg({
frontend/src/components/SmartImg.tsx:31:  src,
frontend/src/components/SmartImg.tsx:32:  className,
frontend/src/components/SmartImg.tsx:33:  alt = '',
frontend/src/components/SmartImg.tsx:34:  width = 600,
frontend/src/components/SmartImg.tsx:35:  loading = 'lazy',
frontend/src/components/SmartImg.tsx:36:  draggable,
frontend/src/components/SmartImg.tsx:37:  stock,
frontend/src/components/SmartImg.tsx:38:  stockFallbacks = [],
frontend/src/components/SmartImg.tsx:39:  monogram,
frontend/src/components/SmartImg.tsx:40:  style,
frontend/src/components/SmartImg.tsx:41:}: {
frontend/src/components/SmartImg.tsx:42:  src?: string | null;
frontend/src/components/SmartImg.tsx:43:  className?: string;
frontend/src/components/SmartImg.tsx:44:  alt?: string;
frontend/src/components/SmartImg.tsx:45:  width?: 200 | 400 | 600 | 900;
frontend/src/components/SmartImg.tsx:46:  loading?: 'eager' | 'lazy';
frontend/src/components/SmartImg.tsx:47:  draggable?: boolean;
frontend/src/components/SmartImg.tsx:48:  stock?: StockPhoto;
frontend/src/components/SmartImg.tsx:49:  stockFallbacks?: Array<string | null | undefined>;
frontend/src/components/SmartImg.tsx:50:  monogram?: string | null;
frontend/src/components/SmartImg.tsx:51:  style?: CSSProperties;
frontend/src/components/SmartImg.tsx:52:}) {
frontend/src/components/SmartImg.tsx:53:  const [retryToken] = useState(() => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
frontend/src/components/SmartImg.tsx:54:  const fallbackSignature = stockFallbacks.join('|');
frontend/src/components/SmartImg.tsx:55:  const candidates = useMemo(() => {
frontend/src/components/SmartImg.tsx:56:    const result: string[] = [];
frontend/src/components/SmartImg.tsx:57:    const add = (value?: string | null) => {
frontend/src/components/SmartImg.tsx:58:      if (value && !result.includes(value)) result.push(value);
frontend/src/components/SmartImg.tsx:59:    };
frontend/src/components/SmartImg.tsx:60:    if (src) {
frontend/src/components/SmartImg.tsx:61:      add(thumb(src, width));
frontend/src/components/SmartImg.tsx:62:      add(src);
frontend/src/components/SmartImg.tsx:63:      add(retryImageUrl(src, retryToken));
frontend/src/components/SmartImg.tsx:64:    }
frontend/src/components/SmartImg.tsx:65:    for (const fallback of stockFallbacks) add(fallback);
frontend/src/components/SmartImg.tsx:66:    add(stockUrl(stock));
frontend/src/components/SmartImg.tsx:67:    return result;
frontend/src/components/SmartImg.tsx:68:  }, [src, width, retryToken, stock?.type, stock?.category, stock?.name, stock?.seed, stock?.src, fallbackSignature]);
frontend/src/components/SmartImg.tsx:70:  const signature = candidates.join('\n');
frontend/src/components/SmartImg.tsx:71:  const [idx, setIdx] = useState(0);
frontend/src/components/SmartImg.tsx:72:  const candidateKey = `${signature}:${idx}`;
frontend/src/components/SmartImg.tsx:73:  const [loadedKey, setLoadedKey] = useState('');
frontend/src/components/SmartImg.tsx:74:  const [nearViewport, setNearViewport] = useState(loading === 'eager');
frontend/src/components/SmartImg.tsx:75:  const imgRef = useRef<HTMLImageElement>(null);
frontend/src/components/SmartImg.tsx:77:  useEffect(() => setIdx(0), [signature]);
frontend/src/components/SmartImg.tsx:79:  useEffect(() => {
frontend/src/components/SmartImg.tsx:80:    if (loading === 'eager') {
frontend/src/components/SmartImg.tsx:81:      setNearViewport(true);
frontend/src/components/SmartImg.tsx:82:      return;
frontend/src/components/SmartImg.tsx:83:    }
frontend/src/components/SmartImg.tsx:84:    const el = imgRef.current;
frontend/src/components/SmartImg.tsx:85:    if (!el || typeof IntersectionObserver === 'undefined') {
frontend/src/components/SmartImg.tsx:86:      setNearViewport(true);
frontend/src/components/SmartImg.tsx:87:      return;
frontend/src/components/SmartImg.tsx:88:    }
frontend/src/components/SmartImg.tsx:89:    const observer = new IntersectionObserver(
frontend/src/components/SmartImg.tsx:90:      (entries) => {
frontend/src/components/SmartImg.tsx:91:        if (entries.some((entry) => entry.isIntersecting)) {
frontend/src/components/SmartImg.tsx:92:          setNearViewport(true);
frontend/src/components/SmartImg.tsx:93:          observer.disconnect();
frontend/src/components/SmartImg.tsx:94:        }
frontend/src/components/SmartImg.tsx:95:      },
frontend/src/components/SmartImg.tsx:96:      { rootMargin: '1000px 0px' },
frontend/src/components/SmartImg.tsx:97:    );
frontend/src/components/SmartImg.tsx:98:    observer.observe(el);
frontend/src/components/SmartImg.tsx:99:    return () => observer.disconnect();
frontend/src/components/SmartImg.tsx:100:  }, [loading, signature, idx]);
frontend/src/components/SmartImg.tsx:102:  useEffect(() => {
frontend/src/components/SmartImg.tsx:103:    if (!nearViewport || idx >= candidates.length || loadedKey === candidateKey) return;
frontend/src/components/SmartImg.tsx:104:    const el = imgRef.current;
frontend/src/components/SmartImg.tsx:105:    if (el?.complete && el.naturalWidth > 0) return;
frontend/src/components/SmartImg.tsx:106:    const timeout = window.setTimeout(() => setIdx((current) => current + 1), 12_000);
frontend/src/components/SmartImg.tsx:107:    return () => window.clearTimeout(timeout);
frontend/src/components/SmartImg.tsx:108:  }, [nearViewport, idx, signature, candidates.length, candidateKey, loadedKey]);
frontend/src/components/SmartImg.tsx:110:  if (idx < candidates.length) {
frontend/src/components/SmartImg.tsx:111:    return (
frontend/src/components/SmartImg.tsx:112:      <img
frontend/src/components/SmartImg.tsx:113:        key={candidateKey}
frontend/src/components/SmartImg.tsx:114:        ref={imgRef}
frontend/src/components/SmartImg.tsx:115:        className={className}
frontend/src/components/SmartImg.tsx:116:        src={candidates[idx]}
frontend/src/components/SmartImg.tsx:117:        alt={alt}
frontend/src/components/SmartImg.tsx:118:        loading={nearViewport ? 'eager' : loading}
frontend/src/components/SmartImg.tsx:119:        decoding="async"
frontend/src/components/SmartImg.tsx:120:        draggable={draggable}
frontend/src/components/SmartImg.tsx:121:        style={style}
frontend/src/components/SmartImg.tsx:122:        onLoad={() => setLoadedKey(candidateKey)}
frontend/src/components/SmartImg.tsx:123:        onError={() => setIdx((current) => current + 1)}
frontend/src/components/SmartImg.tsx:124:      />
frontend/src/components/SmartImg.tsx:125:    );
frontend/src/components/SmartImg.tsx:126:  }
frontend/src/components/SmartImg.tsx:128:  const label = (monogram || alt || '?').trim();
frontend/src/components/SmartImg.tsx:129:  return (
frontend/src/components/SmartImg.tsx:130:    <div
frontend/src/components/SmartImg.tsx:131:      className={`${className ?? ''} ph mono smart-img-mono`.trim()}
frontend/src/components/SmartImg.tsx:132:      style={{ background: colorFromName(label), ...style }}
frontend/src/components/SmartImg.tsx:133:      role="img"
frontend/src/components/SmartImg.tsx:134:      aria-label={alt || label}
frontend/src/components/SmartImg.tsx:135:    >
frontend/src/components/SmartImg.tsx:136:      {(label[0] ?? '?').toUpperCase()}
frontend/src/components/SmartImg.tsx:137:    </div>
frontend/src/components/SmartImg.tsx:138:  );
frontend/src/components/SmartImg.tsx:139:}
frontend/src/components/FeedPost.tsx:1:import { useState } from 'react';
frontend/src/components/FeedPost.tsx:2:import { api } from '../api';
frontend/src/components/FeedPost.tsx:3:import type { Review, VoteState, VoteType } from '../types';
frontend/src/components/FeedPost.tsx:4:import { Stars } from './Stars';
frontend/src/components/FeedPost.tsx:5:import { SmartImg } from './SmartImg';
frontend/src/components/FeedPost.tsx:7:const VOTE_LABEL: Record<VoteType, string> = {
frontend/src/components/FeedPost.tsx:8:  USEFUL: '👍 Полезно',
frontend/src/components/FeedPost.tsx:9:  FUNNY: '😄 Смешно',
frontend/src/components/FeedPost.tsx:10:  COOL: '😎 Круто',
frontend/src/components/FeedPost.tsx:11:  OHNO: '🙀 О нет',
frontend/src/components/FeedPost.tsx:12:};
frontend/src/components/FeedPost.tsx:14:// Feed photos use the shared resilient renderer below.
frontend/src/components/FeedPost.tsx:15:// A user's activity post (Yelp-style): author + photo + the item/venue they reviewed.
frontend/src/components/FeedPost.tsx:16:export function FeedPost({
frontend/src/components/FeedPost.tsx:17:  review,
frontend/src/components/FeedPost.tsx:18:  onOpen,
frontend/src/components/FeedPost.tsx:19:  onComments,
frontend/src/components/FeedPost.tsx:20:  onOpenUser,
frontend/src/components/FeedPost.tsx:21:  onOpenPhoto,
frontend/src/components/FeedPost.tsx:22:  onOpenVenue,
frontend/src/components/FeedPost.tsx:23:}: {
frontend/src/components/FeedPost.tsx:24:  review: Review;
frontend/src/components/FeedPost.tsx:25:  onOpen: () => void;
frontend/src/components/FeedPost.tsx:26:  onComments?: () => void;
frontend/src/components/FeedPost.tsx:27:  onOpenUser?: (userId: string) => void;
frontend/src/components/FeedPost.tsx:28:  onOpenPhoto?: () => void; // tap the PHOTO → the review itself (check-in detail)
frontend/src/components/FeedPost.tsx:29:  onOpenVenue?: () => void; // tap the "📍 place" line → the venue card
frontend/src/components/FeedPost.tsx:30:}) {
frontend/src/components/FeedPost.tsx:31:  // the user's own photo leads; text-only posts fall back to the dish's card
frontend/src/components/FeedPost.tsx:32:  // photo (illustrative, labeled) so the wall never looks broken/empty
frontend/src/components/FeedPost.tsx:33:  const photo = review.photoUrls?.[0];
frontend/src/components/FeedPost.tsx:34:  const cardPhoto = !photo ? review.listing?.photoUrl : null;
frontend/src/components/FeedPost.tsx:35:  const imageFallback = review.listing
frontend/src/components/FeedPost.tsx:36:    ? {
frontend/src/components/FeedPost.tsx:37:        type: review.listing.type,
frontend/src/components/FeedPost.tsx:38:        category: review.listing.category,
frontend/src/components/FeedPost.tsx:39:        name: review.listing.name,
frontend/src/components/FeedPost.tsx:40:        seed: review.listing.id,
frontend/src/components/FeedPost.tsx:41:      }
frontend/src/components/FeedPost.tsx:42:    : undefined;
frontend/src/components/FeedPost.tsx:43:  const u = review.user;
frontend/src/components/FeedPost.tsx:44:  const initial = (u?.firstName ?? u?.username ?? '?').trim()[0]?.toUpperCase() ?? '?';
frontend/src/components/FeedPost.tsx:45:  const [vote, setVote] = useState<VoteState>({
frontend/src/components/FeedPost.tsx:46:    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
frontend/src/components/FeedPost.tsx:47:    // server hydrates the viewer's own votes → likes are lit on first render
frontend/src/components/FeedPost.tsx:48:    mine: ((review as any).myVotes ?? []) as VoteType[],
frontend/src/components/FeedPost.tsx:49:  });
frontend/src/components/FeedPost.tsx:50:  const doVote = (t: VoteType) =>
frontend/src/components/FeedPost.tsx:51:    api.vote(review.id, t).then(setVote).catch(() => {});
frontend/src/components/FeedPost.tsx:53:  return (
frontend/src/components/FeedPost.tsx:54:    <div className="post" onClick={onOpen}>
frontend/src/components/FeedPost.tsx:55:      <button
frontend/src/components/FeedPost.tsx:56:        type="button"
frontend/src/components/FeedPost.tsx:57:        className="post-head"
frontend/src/components/FeedPost.tsx:58:        onClick={(e) => {
frontend/src/components/FeedPost.tsx:59:          e.stopPropagation(); // open the author's profile, never the post
frontend/src/components/FeedPost.tsx:60:          if (u?.id && onOpenUser) onOpenUser(u.id);
frontend/src/components/FeedPost.tsx:61:        }}
frontend/src/components/FeedPost.tsx:62:      >
frontend/src/components/FeedPost.tsx:63:        <SmartImg className="post-avatar" src={u?.photoUrl} width={200} loading="eager" monogram={initial} />
frontend/src/components/FeedPost.tsx:64:        <div style={{ textAlign: 'left' }}>
frontend/src/components/FeedPost.tsx:65:          <b>{u?.firstName ?? u?.username ?? 'Гость'}</b>
frontend/src/components/FeedPost.tsx:66:          <div className="meta" style={{ color: 'var(--hint)', fontSize: 13 }}>
frontend/src/components/FeedPost.tsx:67:            {photo ? 'поделился(ась) фото' : 'оставил(а) отзыв'}
frontend/src/components/FeedPost.tsx:68:          </div>
frontend/src/components/FeedPost.tsx:69:        </div>
frontend/src/components/FeedPost.tsx:70:      </button>
frontend/src/components/FeedPost.tsx:72:      {/* tap the photo → the REVIEW opens (the rest of the post opens the item card) */}
frontend/src/components/FeedPost.tsx:73:      {photo ? (
frontend/src/components/FeedPost.tsx:74:        <div
frontend/src/components/FeedPost.tsx:75:          className="post-photo-wrap"
frontend/src/components/FeedPost.tsx:76:          onClick={(e) => {
frontend/src/components/FeedPost.tsx:77:            if (onOpenPhoto) {
frontend/src/components/FeedPost.tsx:78:              e.stopPropagation();
frontend/src/components/FeedPost.tsx:79:              onOpenPhoto();
frontend/src/components/FeedPost.tsx:80:            }
frontend/src/components/FeedPost.tsx:81:          }}
frontend/src/components/FeedPost.tsx:82:        >
frontend/src/components/FeedPost.tsx:83:          <SmartImg className="post-photo" src={photo} stock={imageFallback} monogram={review.listing?.name} />
frontend/src/components/FeedPost.tsx:84:          {/* ↗ affordance: the photo IS tappable (opens the check-in) */}
frontend/src/components/FeedPost.tsx:85:          {onOpenPhoto && <span className="post-photo-open">↗</span>}
frontend/src/components/FeedPost.tsx:86:        </div>
frontend/src/components/FeedPost.tsx:87:      ) : cardPhoto || review.listing ? (
frontend/src/components/FeedPost.tsx:88:        <div className="post-photo-wrap">
frontend/src/components/FeedPost.tsx:89:          <SmartImg className="post-photo" src={cardPhoto} stock={imageFallback} monogram={review.listing?.name} />
frontend/src/components/FeedPost.tsx:90:        </div>
frontend/src/components/FeedPost.tsx:91:      ) : null}
frontend/src/components/FeedPost.tsx:93:      <div className="post-venue">
frontend/src/components/FeedPost.tsx:94:        <b>{review.listing?.name}</b>
frontend/src/components/FeedPost.tsx:95:        {review.venue && (
frontend/src/components/FeedPost.tsx:96:          <button
frontend/src/components/FeedPost.tsx:97:            type="button"
frontend/src/components/FeedPost.tsx:98:            className="meta post-venue-link"
frontend/src/components/FeedPost.tsx:99:            style={{ color: 'var(--hint)', fontSize: 13, marginTop: 2, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block' }}
frontend/src/components/FeedPost.tsx:100:            onClick={(e) => {
frontend/src/components/FeedPost.tsx:101:              if (onOpenVenue) {
frontend/src/components/FeedPost.tsx:102:                e.stopPropagation(); // venue tap opens the VENUE, not the item
frontend/src/components/FeedPost.tsx:103:                onOpenVenue();
frontend/src/components/FeedPost.tsx:104:              }
frontend/src/components/FeedPost.tsx:105:            }}
frontend/src/components/FeedPost.tsx:106:          >
frontend/src/components/FeedPost.tsx:107:            📍 {review.venue.name}
frontend/src/components/FeedPost.tsx:108:          </button>
frontend/src/components/FeedPost.tsx:109:        )}
frontend/src/components/FeedPost.tsx:110:        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
frontend/src/components/FeedPost.tsx:111:          <Stars value={review.rating} />
frontend/src/components/FeedPost.tsx:112:          <span className="meta" style={{ color: 'var(--hint)', fontSize: 13 }}>
frontend/src/components/FeedPost.tsx:113:            {review.rating.toFixed(1)}
frontend/src/components/FeedPost.tsx:114:          </span>
frontend/src/components/FeedPost.tsx:115:        </div>
frontend/src/components/FeedPost.tsx:116:        {review.text && <div className="post-text">{review.text}</div>}
frontend/src/components/FeedPost.tsx:118:        <div className="vote-row" onClick={(e) => e.stopPropagation()}>
frontend/src/components/FeedPost.tsx:119:          {(['USEFUL', 'FUNNY', 'COOL', 'OHNO'] as VoteType[]).map((t) => (
frontend/src/components/FeedPost.tsx:120:            <button
frontend/src/components/FeedPost.tsx:121:              key={t}
frontend/src/components/FeedPost.tsx:122:              className={'vote-btn' + (vote.mine.includes(t) ? ' active' : '')}
frontend/src/components/FeedPost.tsx:123:              onClick={() => doVote(t)}
frontend/src/components/FeedPost.tsx:124:            >
frontend/src/components/FeedPost.tsx:125:              {VOTE_LABEL[t]}
frontend/src/components/FeedPost.tsx:126:              {vote.counts[t] ? ` ${vote.counts[t]}` : ''}
frontend/src/components/FeedPost.tsx:127:            </button>
frontend/src/components/FeedPost.tsx:128:          ))}
frontend/src/components/FeedPost.tsx:129:        </div>
frontend/src/components/FeedPost.tsx:131:        {review.topComment && (
frontend/src/components/FeedPost.tsx:132:          <div className="post-cmt">
frontend/src/components/FeedPost.tsx:133:            <b
frontend/src/components/FeedPost.tsx:134:              onClick={(e) => {
frontend/src/components/FeedPost.tsx:135:                const uid = review.topComment?.user?.id;
frontend/src/components/FeedPost.tsx:136:                if (uid && onOpenUser) {
frontend/src/components/FeedPost.tsx:137:                  e.stopPropagation();
frontend/src/components/FeedPost.tsx:138:                  onOpenUser(uid);
frontend/src/components/FeedPost.tsx:139:                }
frontend/src/components/FeedPost.tsx:140:              }}
frontend/src/components/FeedPost.tsx:141:            >
frontend/src/components/FeedPost.tsx:142:              {review.topComment.user?.firstName ?? review.topComment.user?.username ?? 'Гость'}:
frontend/src/components/FeedPost.tsx:143:            </b>{' '}
frontend/src/components/FeedPost.tsx:144:            {review.topComment.text}
frontend/src/components/FeedPost.tsx:145:          </div>
frontend/src/components/FeedPost.tsx:146:        )}
frontend/src/components/FeedPost.tsx:147:        {onComments && (
frontend/src/components/FeedPost.tsx:148:          <button
frontend/src/components/FeedPost.tsx:149:            className="post-discuss"
frontend/src/components/FeedPost.tsx:150:            onClick={(e) => {
frontend/src/components/FeedPost.tsx:151:              e.stopPropagation();
frontend/src/components/FeedPost.tsx:152:              onComments();
frontend/src/components/FeedPost.tsx:153:            }}
frontend/src/components/FeedPost.tsx:154:          >
frontend/src/components/FeedPost.tsx:155:            💬{' '}
frontend/src/components/FeedPost.tsx:156:            {(review.commentCount ?? 0) > 1
frontend/src/components/FeedPost.tsx:157:              ? `Показать остальные комментарии (${review.commentCount})`
frontend/src/components/FeedPost.tsx:158:              : review.commentCount === 1
frontend/src/components/FeedPost.tsx:159:                ? 'Ответить'
frontend/src/components/FeedPost.tsx:160:                : 'Обсудить'}
frontend/src/components/FeedPost.tsx:161:          </button>
frontend/src/components/FeedPost.tsx:162:        )}
frontend/src/components/FeedPost.tsx:163:      </div>
frontend/src/components/FeedPost.tsx:165:      {/* no rate-CTA on someone else's review post (product decision): opening a
frontend/src/components/FeedPost.tsx:166:          friend's tasting must not push the viewer to rate the same item */}
frontend/src/components/FeedPost.tsx:167:    </div>
frontend/src/components/FeedPost.tsx:168:  );
frontend/src/components/FeedPost.tsx:169:}

codex
Карта интерфейса уже показывает важный системный разрыв: приложение имитирует iOS-переходы локальными оверлеями, но не ведёт единый navigation stack. Сейчас углубляюсь в формы и модалки — именно там чаще всего проявляются потеря контекста, конфликт клавиатуры со свайпом и отсутствие focus trap.
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "." frontend/src/components/ReviewForm.tsx frontend/src/components/VenuePicker.tsx frontend/src/components/CommentsModal.tsx frontend/src/components/PhotoPostModal.tsx frontend/src/components/SupportModal.tsx frontend/src/components/CorrectionModal.tsx frontend/src/components/AddBusiness.tsx' in D:\Приложения\Yelp
 succeeded in 318ms:
frontend/src/components/SupportModal.tsx:1:import { useState } from 'react';
frontend/src/components/SupportModal.tsx:2:import { api } from '../api';
frontend/src/components/SupportModal.tsx:4:export function SupportModal({ onClose }: { onClose: () => void }) {
frontend/src/components/SupportModal.tsx:5:  const [text, setText] = useState('');
frontend/src/components/SupportModal.tsx:6:  const [busy, setBusy] = useState(false);
frontend/src/components/SupportModal.tsx:7:  const [sent, setSent] = useState(false);
frontend/src/components/SupportModal.tsx:9:  const send = () => {
frontend/src/components/SupportModal.tsx:10:    if (!text.trim()) return;
frontend/src/components/SupportModal.tsx:11:    setBusy(true);
frontend/src/components/SupportModal.tsx:12:    api
frontend/src/components/SupportModal.tsx:13:      .support(text.trim())
frontend/src/components/SupportModal.tsx:14:      .then(() => setSent(true))
frontend/src/components/SupportModal.tsx:15:      .catch(() => setBusy(false));
frontend/src/components/SupportModal.tsx:16:  };
frontend/src/components/SupportModal.tsx:18:  return (
frontend/src/components/SupportModal.tsx:19:    <div className="modal-backdrop" style={{ zIndex: 3000 }} onClick={onClose}>
frontend/src/components/SupportModal.tsx:20:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src/components/SupportModal.tsx:21:        {sent ? (
frontend/src/components/SupportModal.tsx:22:          <div style={{ textAlign: 'center', padding: '12px 0' }}>
frontend/src/components/SupportModal.tsx:23:            <div style={{ fontSize: 40 }}>✅</div>
frontend/src/components/SupportModal.tsx:24:            <h3>Сообщение отправлено</h3>
frontend/src/components/SupportModal.tsx:25:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, margin: '8px 0 16px' }}>
frontend/src/components/SupportModal.tsx:26:              Мы получили ваше обращение и ответим как можно скорее.
frontend/src/components/SupportModal.tsx:27:            </p>
frontend/src/components/SupportModal.tsx:28:            <button className="btn" onClick={onClose}>
frontend/src/components/SupportModal.tsx:29:              Готово
frontend/src/components/SupportModal.tsx:30:            </button>
frontend/src/components/SupportModal.tsx:31:          </div>
frontend/src/components/SupportModal.tsx:32:        ) : (
frontend/src/components/SupportModal.tsx:33:          <>
frontend/src/components/SupportModal.tsx:34:            <h3>🛟 Поддержка togomoscow</h3>
frontend/src/components/SupportModal.tsx:35:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, marginBottom: 10 }}>
frontend/src/components/SupportModal.tsx:36:              Идея, вопрос или проблема? Напишете нам 😊
frontend/src/components/SupportModal.tsx:37:            </p>
frontend/src/components/SupportModal.tsx:38:            <div className="field">
frontend/src/components/SupportModal.tsx:39:              <textarea
frontend/src/components/SupportModal.tsx:40:                value={text}
frontend/src/components/SupportModal.tsx:41:                onChange={(e) => setText(e.target.value)}
frontend/src/components/SupportModal.tsx:42:                placeholder="Ваше сообщение…"
frontend/src/components/SupportModal.tsx:43:                rows={5}
frontend/src/components/SupportModal.tsx:44:              />
frontend/src/components/SupportModal.tsx:45:            </div>
frontend/src/components/SupportModal.tsx:46:            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
frontend/src/components/SupportModal.tsx:47:              <button className="btn secondary" onClick={onClose} disabled={busy}>
frontend/src/components/SupportModal.tsx:48:                Отмена
frontend/src/components/SupportModal.tsx:49:              </button>
frontend/src/components/SupportModal.tsx:50:              <button className="btn" onClick={send} disabled={busy || !text.trim()}>
frontend/src/components/SupportModal.tsx:51:                {busy ? 'Отправка…' : 'Отправить'}
frontend/src/components/SupportModal.tsx:52:              </button>
frontend/src/components/SupportModal.tsx:53:            </div>
frontend/src/components/SupportModal.tsx:54:          </>
frontend/src/components/SupportModal.tsx:55:        )}
frontend/src/components/SupportModal.tsx:56:      </div>
frontend/src/components/SupportModal.tsx:57:    </div>
frontend/src/components/SupportModal.tsx:58:  );
frontend/src/components/SupportModal.tsx:59:}
frontend/src/components/CorrectionModal.tsx:1:import { useState } from 'react';
frontend/src/components/CorrectionModal.tsx:2:import { api } from '../api';
frontend/src/components/CorrectionModal.tsx:4:export function CorrectionModal({
frontend/src/components/CorrectionModal.tsx:5:  listingId,
frontend/src/components/CorrectionModal.tsx:6:  venueName,
frontend/src/components/CorrectionModal.tsx:7:  onClose,
frontend/src/components/CorrectionModal.tsx:8:}: {
frontend/src/components/CorrectionModal.tsx:9:  listingId: string;
frontend/src/components/CorrectionModal.tsx:10:  venueName: string;
frontend/src/components/CorrectionModal.tsx:11:  onClose: () => void;
frontend/src/components/CorrectionModal.tsx:12:}) {
frontend/src/components/CorrectionModal.tsx:13:  const [text, setText] = useState('');
frontend/src/components/CorrectionModal.tsx:14:  const [busy, setBusy] = useState(false);
frontend/src/components/CorrectionModal.tsx:15:  const [sent, setSent] = useState(false);
frontend/src/components/CorrectionModal.tsx:17:  const send = () => {
frontend/src/components/CorrectionModal.tsx:18:    if (!text.trim()) return;
frontend/src/components/CorrectionModal.tsx:19:    setBusy(true);
frontend/src/components/CorrectionModal.tsx:20:    api
frontend/src/components/CorrectionModal.tsx:21:      .sendCorrection(listingId, text.trim())
frontend/src/components/CorrectionModal.tsx:22:      .then(() => setSent(true))
frontend/src/components/CorrectionModal.tsx:23:      .catch(() => setBusy(false));
frontend/src/components/CorrectionModal.tsx:24:  };
frontend/src/components/CorrectionModal.tsx:26:  return (
frontend/src/components/CorrectionModal.tsx:27:    <div
frontend/src/components/CorrectionModal.tsx:28:      className="modal-backdrop"
frontend/src/components/CorrectionModal.tsx:29:      style={{ zIndex: 3000 }}
frontend/src/components/CorrectionModal.tsx:30:      onClick={(e) => {
frontend/src/components/CorrectionModal.tsx:31:        e.stopPropagation();
frontend/src/components/CorrectionModal.tsx:32:        onClose();
frontend/src/components/CorrectionModal.tsx:33:      }}
frontend/src/components/CorrectionModal.tsx:34:    >
frontend/src/components/CorrectionModal.tsx:35:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src/components/CorrectionModal.tsx:36:        {sent ? (
frontend/src/components/CorrectionModal.tsx:37:          <div style={{ textAlign: 'center', padding: '12px 0' }}>
frontend/src/components/CorrectionModal.tsx:38:            <div style={{ fontSize: 40 }}>✅</div>
frontend/src/components/CorrectionModal.tsx:39:            <h3>Спасибо!</h3>
frontend/src/components/CorrectionModal.tsx:40:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, margin: '8px 0 16px' }}>
frontend/src/components/CorrectionModal.tsx:41:              Правка отправлена модератору и владельцу заведения.
frontend/src/components/CorrectionModal.tsx:42:            </p>
frontend/src/components/CorrectionModal.tsx:43:            <button className="btn" onClick={onClose}>
frontend/src/components/CorrectionModal.tsx:44:              Готово
frontend/src/components/CorrectionModal.tsx:45:            </button>
frontend/src/components/CorrectionModal.tsx:46:          </div>
frontend/src/components/CorrectionModal.tsx:47:        ) : (
frontend/src/components/CorrectionModal.tsx:48:          <>
frontend/src/components/CorrectionModal.tsx:49:            <h3>Предложить правку</h3>
frontend/src/components/CorrectionModal.tsx:50:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, marginBottom: 10 }}>
frontend/src/components/CorrectionModal.tsx:51:              Что не так или чего не хватает в карточке «{venueName}»? Ваша правка придёт модератору
frontend/src/components/CorrectionModal.tsx:52:              и владельцу.
frontend/src/components/CorrectionModal.tsx:53:            </p>
frontend/src/components/CorrectionModal.tsx:54:            <div className="field">
frontend/src/components/CorrectionModal.tsx:55:              <textarea
frontend/src/components/CorrectionModal.tsx:56:                value={text}
frontend/src/components/CorrectionModal.tsx:57:                onChange={(e) => setText(e.target.value)}
frontend/src/components/CorrectionModal.tsx:58:                placeholder="Например: неверный адрес, нет телефона, закрылись…"
frontend/src/components/CorrectionModal.tsx:59:                rows={5}
frontend/src/components/CorrectionModal.tsx:60:              />
frontend/src/components/CorrectionModal.tsx:61:            </div>
frontend/src/components/CorrectionModal.tsx:62:            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
frontend/src/components/CorrectionModal.tsx:63:              <button className="btn secondary" onClick={onClose} disabled={busy}>
frontend/src/components/CorrectionModal.tsx:64:                Отмена
frontend/src/components/CorrectionModal.tsx:65:              </button>
frontend/src/components/CorrectionModal.tsx:66:              <button className="btn" onClick={send} disabled={busy || !text.trim()}>
frontend/src/components/CorrectionModal.tsx:67:                {busy ? 'Отправка…' : 'Отправить'}
frontend/src/components/CorrectionModal.tsx:68:              </button>
frontend/src/components/CorrectionModal.tsx:69:            </div>
frontend/src/components/CorrectionModal.tsx:70:          </>
frontend/src/components/CorrectionModal.tsx:71:        )}
frontend/src/components/CorrectionModal.tsx:72:      </div>
frontend/src/components/CorrectionModal.tsx:73:    </div>
frontend/src/components/CorrectionModal.tsx:74:  );
frontend/src/components/CorrectionModal.tsx:75:}
frontend/src/components/AddBusiness.tsx:1:import { useState } from 'react';
frontend/src/components/AddBusiness.tsx:2:import { api } from '../api';
frontend/src/components/AddBusiness.tsx:4:const CATEGORIES = ['Ресторан', 'Кафе', 'Бар', 'Паб', 'Фастфуд', 'Кофейня', 'Пекарня', 'Столовая'];
frontend/src/components/AddBusiness.tsx:5:const COUNTRIES = ['Россия', 'Беларусь', 'Казахстан'];
frontend/src/components/AddBusiness.tsx:7:export function AddBusiness({ onClose, initialName }: { onClose: () => void; initialName?: string }) {
frontend/src/components/AddBusiness.tsx:8:  const [step, setStep] = useState<'choice' | 'form' | 'done'>('choice');
frontend/src/components/AddBusiness.tsx:9:  const [rel, setRel] = useState<'customer' | 'owner'>('customer');
frontend/src/components/AddBusiness.tsx:10:  const [country, setCountry] = useState('Россия');
frontend/src/components/AddBusiness.tsx:11:  const [city, setCity] = useState('Москва');
frontend/src/components/AddBusiness.tsx:12:  const [name, setName] = useState(initialName ?? '');
frontend/src/components/AddBusiness.tsx:13:  const [address, setAddress] = useState('');
frontend/src/components/AddBusiness.tsx:14:  const [category, setCategory] = useState('');
frontend/src/components/AddBusiness.tsx:15:  const [phone, setPhone] = useState('');
frontend/src/components/AddBusiness.tsx:16:  const [website, setWebsite] = useState('');
frontend/src/components/AddBusiness.tsx:17:  const [notes, setNotes] = useState('');
frontend/src/components/AddBusiness.tsx:18:  const [busy, setBusy] = useState(false);
frontend/src/components/AddBusiness.tsx:19:  const [error, setError] = useState<string | null>(null);
frontend/src/components/AddBusiness.tsx:21:  const isOwner = rel === 'owner';
frontend/src/components/AddBusiness.tsx:22:  const phoneRequired = isOwner;
frontend/src/components/AddBusiness.tsx:24:  const start = (r: 'customer' | 'owner') => {
frontend/src/components/AddBusiness.tsx:25:    setRel(r);
frontend/src/components/AddBusiness.tsx:26:    setStep('form');
frontend/src/components/AddBusiness.tsx:27:  };
frontend/src/components/AddBusiness.tsx:29:  const submit = () => {
frontend/src/components/AddBusiness.tsx:30:    if (!name.trim() || !city.trim() || !category) {
frontend/src/components/AddBusiness.tsx:31:      setError('Заполните название, город и категорию');
frontend/src/components/AddBusiness.tsx:32:      return;
frontend/src/components/AddBusiness.tsx:33:    }
frontend/src/components/AddBusiness.tsx:34:    if (phoneRequired && !phone.trim()) {
frontend/src/components/AddBusiness.tsx:35:      setError('Для сотрудников телефон обязателен');
frontend/src/components/AddBusiness.tsx:36:      return;
frontend/src/components/AddBusiness.tsx:37:    }
frontend/src/components/AddBusiness.tsx:38:    setBusy(true);
frontend/src/components/AddBusiness.tsx:39:    setError(null);
frontend/src/components/AddBusiness.tsx:40:    api
frontend/src/components/AddBusiness.tsx:41:      .submitBusiness({
frontend/src/components/AddBusiness.tsx:42:        relationship: rel,
frontend/src/components/AddBusiness.tsx:43:        name: name.trim(),
frontend/src/components/AddBusiness.tsx:44:        city: city.trim(),
frontend/src/components/AddBusiness.tsx:45:        address: address.trim() || undefined,
frontend/src/components/AddBusiness.tsx:46:        category,
frontend/src/components/AddBusiness.tsx:47:        phone: phone.trim() || undefined,
frontend/src/components/AddBusiness.tsx:48:        website: website.trim() || undefined,
frontend/src/components/AddBusiness.tsx:49:        notes: notes.trim() || undefined,
frontend/src/components/AddBusiness.tsx:50:        country,
frontend/src/components/AddBusiness.tsx:51:      })
frontend/src/components/AddBusiness.tsx:52:      .then(() => setStep('done'))
frontend/src/components/AddBusiness.tsx:53:      .catch(() => {
frontend/src/components/AddBusiness.tsx:54:        setError('Не удалось отправить');
frontend/src/components/AddBusiness.tsx:55:        setBusy(false);
frontend/src/components/AddBusiness.tsx:56:      });
frontend/src/components/AddBusiness.tsx:57:  };
frontend/src/components/AddBusiness.tsx:59:  return (
frontend/src/components/AddBusiness.tsx:60:    <div className="modal-backdrop" style={{ zIndex: 3000 }} onClick={onClose}>
frontend/src/components/AddBusiness.tsx:61:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src/components/AddBusiness.tsx:62:        {step === 'choice' && (
frontend/src/components/AddBusiness.tsx:63:          <>
frontend/src/components/AddBusiness.tsx:64:            <h3>Добавить заведение</h3>
frontend/src/components/AddBusiness.tsx:65:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, marginBottom: 14 }}>
frontend/src/components/AddBusiness.tsx:66:              Кем вы приходитесь заведению, которое хотите добавить?
frontend/src/components/AddBusiness.tsx:67:            </p>
frontend/src/components/AddBusiness.tsx:68:            <button className="btn secondary" style={{ marginBottom: 10 }} onClick={() => start('customer')}>
frontend/src/components/AddBusiness.tsx:69:              Я посетитель
frontend/src/components/AddBusiness.tsx:70:            </button>
frontend/src/components/AddBusiness.tsx:71:            <button className="btn secondary" onClick={() => start('owner')}>
frontend/src/components/AddBusiness.tsx:72:              Я работаю в этом месте
frontend/src/components/AddBusiness.tsx:73:            </button>
frontend/src/components/AddBusiness.tsx:74:          </>
frontend/src/components/AddBusiness.tsx:75:        )}
frontend/src/components/AddBusiness.tsx:77:        {step === 'form' && (
frontend/src/components/AddBusiness.tsx:78:          <>
frontend/src/components/AddBusiness.tsx:79:            <h3>Добавить заведение</h3>
frontend/src/components/AddBusiness.tsx:80:            <div className="meta" style={{ color: 'var(--hint)', fontSize: 13, marginBottom: 8 }}>
frontend/src/components/AddBusiness.tsx:81:              {isOwner ? 'Вы сотрудник — станете владельцем после проверки' : 'Вы посетитель'}
frontend/src/components/AddBusiness.tsx:82:            </div>
frontend/src/components/AddBusiness.tsx:84:            <div className="field">
frontend/src/components/AddBusiness.tsx:85:              <label>Страна</label>
frontend/src/components/AddBusiness.tsx:86:              <select value={country} onChange={(e) => setCountry(e.target.value)}>
frontend/src/components/AddBusiness.tsx:87:                {COUNTRIES.map((c) => (
frontend/src/components/AddBusiness.tsx:88:                  <option key={c} value={c}>
frontend/src/components/AddBusiness.tsx:89:                    {c}
frontend/src/components/AddBusiness.tsx:90:                  </option>
frontend/src/components/AddBusiness.tsx:91:                ))}
frontend/src/components/AddBusiness.tsx:92:              </select>
frontend/src/components/AddBusiness.tsx:93:            </div>
frontend/src/components/AddBusiness.tsx:95:            <div className="section-title">Обязательная информация</div>
frontend/src/components/AddBusiness.tsx:96:            <div className="field">
frontend/src/components/AddBusiness.tsx:97:              <label>Название</label>
frontend/src/components/AddBusiness.tsx:98:              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Кофемания" />
frontend/src/components/AddBusiness.tsx:99:            </div>
frontend/src/components/AddBusiness.tsx:100:            <div className="field">
frontend/src/components/AddBusiness.tsx:101:              <label>Город</label>
frontend/src/components/AddBusiness.tsx:102:              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" />
frontend/src/components/AddBusiness.tsx:103:            </div>
frontend/src/components/AddBusiness.tsx:104:            <div className="field">
frontend/src/components/AddBusiness.tsx:105:              <label>Адрес (необязательно)</label>
frontend/src/components/AddBusiness.tsx:106:              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом" />
frontend/src/components/AddBusiness.tsx:107:            </div>
frontend/src/components/AddBusiness.tsx:108:            <div className="field">
frontend/src/components/AddBusiness.tsx:109:              <label>Категория</label>
frontend/src/components/AddBusiness.tsx:110:              <select value={category} onChange={(e) => setCategory(e.target.value)}>
frontend/src/components/AddBusiness.tsx:111:                <option value="">Выберите…</option>
frontend/src/components/AddBusiness.tsx:112:                {CATEGORIES.map((c) => (
frontend/src/components/AddBusiness.tsx:113:                  <option key={c} value={c}>
frontend/src/components/AddBusiness.tsx:114:                    {c}
frontend/src/components/AddBusiness.tsx:115:                  </option>
frontend/src/components/AddBusiness.tsx:116:                ))}
frontend/src/components/AddBusiness.tsx:117:              </select>
frontend/src/components/AddBusiness.tsx:118:            </div>
frontend/src/components/AddBusiness.tsx:119:            {phoneRequired && (
frontend/src/components/AddBusiness.tsx:120:              <div className="field">
frontend/src/components/AddBusiness.tsx:121:                <label>Телефон</label>
frontend/src/components/AddBusiness.tsx:122:                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7…" />
frontend/src/components/AddBusiness.tsx:123:              </div>
frontend/src/components/AddBusiness.tsx:124:            )}
frontend/src/components/AddBusiness.tsx:126:            <div className="section-title">Дополнительно</div>
frontend/src/components/AddBusiness.tsx:127:            {!phoneRequired && (
frontend/src/components/AddBusiness.tsx:128:              <div className="field">
frontend/src/components/AddBusiness.tsx:129:                <label>Телефон</label>
frontend/src/components/AddBusiness.tsx:130:                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7…" />
frontend/src/components/AddBusiness.tsx:131:              </div>
frontend/src/components/AddBusiness.tsx:132:            )}
frontend/src/components/AddBusiness.tsx:133:            <div className="field">
frontend/src/components/AddBusiness.tsx:134:              <label>Сайт</label>
frontend/src/components/AddBusiness.tsx:135:              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
frontend/src/components/AddBusiness.tsx:136:            </div>
frontend/src/components/AddBusiness.tsx:137:            {!isOwner && (
frontend/src/components/AddBusiness.tsx:138:              <div className="field">
frontend/src/components/AddBusiness.tsx:139:                <label>Заметка для команды</label>
frontend/src/components/AddBusiness.tsx:140:                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
frontend/src/components/AddBusiness.tsx:141:              </div>
frontend/src/components/AddBusiness.tsx:142:            )}
frontend/src/components/AddBusiness.tsx:144:            {error && <p style={{ color: 'crimson', fontSize: 13 }}>{error}</p>}
frontend/src/components/AddBusiness.tsx:145:            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
frontend/src/components/AddBusiness.tsx:146:              <button className="btn secondary" onClick={() => setStep('choice')} disabled={busy}>
frontend/src/components/AddBusiness.tsx:147:                Назад
frontend/src/components/AddBusiness.tsx:148:              </button>
frontend/src/components/AddBusiness.tsx:149:              <button className="btn" onClick={submit} disabled={busy}>
frontend/src/components/AddBusiness.tsx:150:                {busy ? 'Отправка…' : 'Отправить'}
frontend/src/components/AddBusiness.tsx:151:              </button>
frontend/src/components/AddBusiness.tsx:152:            </div>
frontend/src/components/AddBusiness.tsx:153:          </>
frontend/src/components/AddBusiness.tsx:154:        )}
frontend/src/components/AddBusiness.tsx:156:        {step === 'done' && (
frontend/src/components/AddBusiness.tsx:157:          <div style={{ textAlign: 'center', padding: '12px 0' }}>
frontend/src/components/AddBusiness.tsx:158:            <div style={{ fontSize: 40 }}>✅</div>
frontend/src/components/AddBusiness.tsx:159:            <h3>Заявка отправлена</h3>
frontend/src/components/AddBusiness.tsx:160:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, margin: '8px 0 16px' }}>
frontend/src/components/AddBusiness.tsx:161:              Мы проверим заведение и добавим его на платформу.
frontend/src/components/AddBusiness.tsx:162:              {isOwner ? ' После одобрения оно появится в вашем кабинете.' : ''}
frontend/src/components/AddBusiness.tsx:163:            </p>
frontend/src/components/AddBusiness.tsx:164:            <button className="btn" onClick={onClose}>
frontend/src/components/AddBusiness.tsx:165:              Готово
frontend/src/components/AddBusiness.tsx:166:            </button>
frontend/src/components/AddBusiness.tsx:167:          </div>
frontend/src/components/AddBusiness.tsx:168:        )}
frontend/src/components/AddBusiness.tsx:169:      </div>
frontend/src/components/AddBusiness.tsx:170:    </div>
frontend/src/components/AddBusiness.tsx:171:  );
frontend/src/components/AddBusiness.tsx:172:}
frontend/src/components/PhotoPostModal.tsx:1:import { useEffect, useRef, useState } from 'react';
frontend/src/components/PhotoPostModal.tsx:2:import { api } from '../api';
frontend/src/components/PhotoPostModal.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src/components/PhotoPostModal.tsx:4:import { useSwipeDismiss } from '../swipeDismiss';
frontend/src/components/PhotoPostModal.tsx:5:import { tg, openExternal } from '../telegram';
frontend/src/components/PhotoPostModal.tsx:6:import type { Comment, Review, VoteState, VoteType } from '../types';
frontend/src/components/PhotoPostModal.tsx:7:import { Stars } from './Stars';
frontend/src/components/PhotoPostModal.tsx:8:import { thumb } from '../img';
frontend/src/components/PhotoPostModal.tsx:10:const VOTE_LABEL: Record<VoteType, string> = {
frontend/src/components/PhotoPostModal.tsx:11:  USEFUL: '👍 Полезно',
frontend/src/components/PhotoPostModal.tsx:12:  FUNNY: '😄 Смешно',
frontend/src/components/PhotoPostModal.tsx:13:  COOL: '😎 Круто',
frontend/src/components/PhotoPostModal.tsx:14:  OHNO: '🙀 О нет',
frontend/src/components/PhotoPostModal.tsx:15:};
frontend/src/components/PhotoPostModal.tsx:17:// Full "Check-in Detail" view of a single photo review (our red/black/white style):
frontend/src/components/PhotoPostModal.tsx:18:// hero photo + author, item card, date, reactions, LOCATION, comments.
frontend/src/components/PhotoPostModal.tsx:19:export function PhotoPostModal({
frontend/src/components/PhotoPostModal.tsx:20:  review,
frontend/src/components/PhotoPostModal.tsx:21:  onClose,
frontend/src/components/PhotoPostModal.tsx:22:  onOpenUser,
frontend/src/components/PhotoPostModal.tsx:23:  onOpenListing,
frontend/src/components/PhotoPostModal.tsx:24:  onOpenVenue,
frontend/src/components/PhotoPostModal.tsx:25:  onEdit,
frontend/src/components/PhotoPostModal.tsx:26:  onDelete,
frontend/src/components/PhotoPostModal.tsx:27:}: {
frontend/src/components/PhotoPostModal.tsx:28:  review: Review;
frontend/src/components/PhotoPostModal.tsx:29:  onClose: () => void;
frontend/src/components/PhotoPostModal.tsx:30:  onOpenUser?: (userId: string) => void;
frontend/src/components/PhotoPostModal.tsx:31:  onOpenListing?: () => void;
frontend/src/components/PhotoPostModal.tsx:32:  onOpenVenue?: () => void;
frontend/src/components/PhotoPostModal.tsx:33:  onEdit?: () => void;
frontend/src/components/PhotoPostModal.tsx:34:  onDelete?: () => void;
frontend/src/components/PhotoPostModal.tsx:35:}) {
frontend/src/components/PhotoPostModal.tsx:36:  const photo = review.photoUrls?.[0] || review.listing?.photoUrl || undefined;
frontend/src/components/PhotoPostModal.tsx:37:  const u = review.user;
frontend/src/components/PhotoPostModal.tsx:38:  const initial = (u?.firstName ?? u?.username ?? '?').trim()[0]?.toUpperCase() ?? '?';
frontend/src/components/PhotoPostModal.tsx:39:  const [closing, setClosing] = useState(false);
frontend/src/components/PhotoPostModal.tsx:40:  // dead photo URL → hide the media instead of showing a broken-image icon
frontend/src/components/PhotoPostModal.tsx:41:  const [photoBroken, setPhotoBroken] = useState(false);
frontend/src/components/PhotoPostModal.tsx:42:  const [thumbBroken, setThumbBroken] = useState(false);
frontend/src/components/PhotoPostModal.tsx:43:  const [menu, setMenu] = useState(false);
frontend/src/components/PhotoPostModal.tsx:44:  const [toast, setToast] = useState('');
frontend/src/components/PhotoPostModal.tsx:45:  const [vote, setVote] = useState<VoteState>({
frontend/src/components/PhotoPostModal.tsx:46:    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
frontend/src/components/PhotoPostModal.tsx:47:    mine: [],
frontend/src/components/PhotoPostModal.tsx:48:  });
frontend/src/components/PhotoPostModal.tsx:49:  const [comments, setComments] = useState<Comment[]>([]);
frontend/src/components/PhotoPostModal.tsx:50:  const [text, setText] = useState('');
frontend/src/components/PhotoPostModal.tsx:51:  const [busy, setBusy] = useState(false);
frontend/src/components/PhotoPostModal.tsx:52:  const [err, setErr] = useState('');
frontend/src/components/PhotoPostModal.tsx:54:  const reqClose = () => {
frontend/src/components/PhotoPostModal.tsx:55:    setClosing(true);
frontend/src/components/PhotoPostModal.tsx:56:    setTimeout(onClose, 220);
frontend/src/components/PhotoPostModal.tsx:57:  };
frontend/src/components/PhotoPostModal.tsx:58:  useEscClose(reqClose);
frontend/src/components/PhotoPostModal.tsx:60:  // swipe-down anywhere (from the scroll top) dismisses — shared app-wide pattern
frontend/src/components/PhotoPostModal.tsx:61:  const sheetRef = useRef<HTMLDivElement>(null);
frontend/src/components/PhotoPostModal.tsx:62:  useSwipeDismiss(sheetRef, onClose);
frontend/src/components/PhotoPostModal.tsx:64:  useEffect(() => {
frontend/src/components/PhotoPostModal.tsx:65:    api.comments(review.id).then(setComments).catch(() => {});
frontend/src/components/PhotoPostModal.tsx:66:    api.voteState(review.id).then(setVote).catch(() => {});
frontend/src/components/PhotoPostModal.tsx:67:    // eslint-disable-next-line react-hooks/exhaustive-deps
frontend/src/components/PhotoPostModal.tsx:68:  }, [review.id]);
frontend/src/components/PhotoPostModal.tsx:70:  const doVote = (t: VoteType) => api.vote(review.id, t).then(setVote).catch(() => {});
frontend/src/components/PhotoPostModal.tsx:71:  const send = async () => {
frontend/src/components/PhotoPostModal.tsx:72:    if (!text.trim()) return;
frontend/src/components/PhotoPostModal.tsx:73:    setBusy(true);
frontend/src/components/PhotoPostModal.tsx:74:    setErr('');
frontend/src/components/PhotoPostModal.tsx:75:    try {
frontend/src/components/PhotoPostModal.tsx:76:      const c = await api.addComment(review.id, text.trim());
frontend/src/components/PhotoPostModal.tsx:77:      if (c) setComments((p) => [...p, c]);
frontend/src/components/PhotoPostModal.tsx:78:      setText('');
frontend/src/components/PhotoPostModal.tsx:79:    } catch (e: any) {
frontend/src/components/PhotoPostModal.tsx:80:      setErr(e?.message?.trim() || 'Не удалось отправить');
frontend/src/components/PhotoPostModal.tsx:81:    }
frontend/src/components/PhotoPostModal.tsx:82:    setBusy(false);
frontend/src/components/PhotoPostModal.tsx:83:  };
frontend/src/components/PhotoPostModal.tsx:85:  const shareLink = `https://t.me/togomoscow_bot?startapp=l_${review.listing?.id ?? ''}`;
frontend/src/components/PhotoPostModal.tsx:86:  const shareText = `${review.listing?.name ?? ''} — ${review.rating.toFixed(1)}★`;
frontend/src/components/PhotoPostModal.tsx:87:  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1600); };
frontend/src/components/PhotoPostModal.tsx:88:  const sendToFriend = () => {
frontend/src/components/PhotoPostModal.tsx:89:    setMenu(false);
frontend/src/components/PhotoPostModal.tsx:90:    const url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`;
frontend/src/components/PhotoPostModal.tsx:91:    if ((tg as any)?.openTelegramLink) (tg as any).openTelegramLink(url);
frontend/src/components/PhotoPostModal.tsx:92:    else openExternal(url);
frontend/src/components/PhotoPostModal.tsx:93:  };
frontend/src/components/PhotoPostModal.tsx:94:  const sharePhoto = () => { setMenu(false); if (photo) openExternal(photo); };
frontend/src/components/PhotoPostModal.tsx:95:  const copyLink = () => {
frontend/src/components/PhotoPostModal.tsx:96:    setMenu(false);
frontend/src/components/PhotoPostModal.tsx:97:    navigator.clipboard?.writeText(shareLink).then(() => showToast('Ссылка скопирована')).catch(() => showToast('Не удалось'));
frontend/src/components/PhotoPostModal.tsx:98:  };
frontend/src/components/PhotoPostModal.tsx:100:  const dateStr = (review as any).createdAt
frontend/src/components/PhotoPostModal.tsx:101:    ? new Date((review as any).createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
frontend/src/components/PhotoPostModal.tsx:102:    : '';
frontend/src/components/PhotoPostModal.tsx:104:  return (
frontend/src/components/PhotoPostModal.tsx:105:    <div className="modal-backdrop photo-post-backdrop" style={{ zIndex: 3400 }} onClick={reqClose}>
frontend/src/components/PhotoPostModal.tsx:106:      <div ref={sheetRef} className={'photo-post' + (closing ? ' closing' : '')} onClick={(e) => e.stopPropagation()}>
frontend/src/components/PhotoPostModal.tsx:107:        <button className="pp-dots" onClick={() => setMenu(true)} aria-label="Ещё">⋯</button>
frontend/src/components/PhotoPostModal.tsx:108:        <button className="pp-close" onClick={reqClose} aria-label="Закрыть">✕</button>
frontend/src/components/PhotoPostModal.tsx:110:        {/* HERO: full (uncropped) photo with the author + place overlaid on top */}
frontend/src/components/PhotoPostModal.tsx:111:        <div className="pp-hero">
frontend/src/components/PhotoPostModal.tsx:112:          {/* SAME 600px asset the list card already loaded → appears instantly from
frontend/src/components/PhotoPostModal.tsx:113:              the browser cache (900px was a different file = a visible re-fetch) */}
frontend/src/components/PhotoPostModal.tsx:114:          {photo && !photoBroken && <div className="ph-blur" style={{ backgroundImage: `url("${thumb(photo, 200)}")` }} />}
frontend/src/components/PhotoPostModal.tsx:115:          {photo && !photoBroken && <img className="pp-photo" src={thumb(photo, 600)} alt="" onError={() => setPhotoBroken(true)} />}
frontend/src/components/PhotoPostModal.tsx:116:          <button type="button" className="pp-head" onClick={() => u?.id && onOpenUser?.(u.id)}>
frontend/src/components/PhotoPostModal.tsx:117:            {u?.photoUrl ? (
frontend/src/components/PhotoPostModal.tsx:118:              <img className="pp-avatar" src={u.photoUrl} alt="" />
frontend/src/components/PhotoPostModal.tsx:119:            ) : (
frontend/src/components/PhotoPostModal.tsx:120:              <div className="pp-avatar ph">{initial}</div>
frontend/src/components/PhotoPostModal.tsx:121:            )}
frontend/src/components/PhotoPostModal.tsx:122:            <div className="pp-head-txt">
frontend/src/components/PhotoPostModal.tsx:123:              <b>{u?.firstName ?? u?.username ?? 'Гость'}</b>
frontend/src/components/PhotoPostModal.tsx:124:              {review.venue && (
frontend/src/components/PhotoPostModal.tsx:125:                <span
frontend/src/components/PhotoPostModal.tsx:126:                  className="pp-head-venue"
frontend/src/components/PhotoPostModal.tsx:127:                  onClick={(e) => { e.stopPropagation(); onOpenVenue?.(); }}
frontend/src/components/PhotoPostModal.tsx:128:                >
frontend/src/components/PhotoPostModal.tsx:129:                  {review.venue.name} ›
frontend/src/components/PhotoPostModal.tsx:130:                </span>
frontend/src/components/PhotoPostModal.tsx:131:              )}
frontend/src/components/PhotoPostModal.tsx:132:            </div>
frontend/src/components/PhotoPostModal.tsx:133:          </button>
frontend/src/components/PhotoPostModal.tsx:134:        </div>
frontend/src/components/PhotoPostModal.tsx:136:        {/* item card: thumb + name + place + style, then rating and caption */}
frontend/src/components/PhotoPostModal.tsx:137:        <div className="pp-card">
frontend/src/components/PhotoPostModal.tsx:138:          <button type="button" className="pp-card-main" onClick={onOpenListing}>
frontend/src/components/PhotoPostModal.tsx:139:            {review.listing?.photoUrl && !thumbBroken && (
frontend/src/components/PhotoPostModal.tsx:140:              <img className="pp-card-thumb" src={thumb(review.listing.photoUrl, 200)} alt="" onError={() => setThumbBroken(true)} />
frontend/src/components/PhotoPostModal.tsx:141:            )}
frontend/src/components/PhotoPostModal.tsx:142:            <div className="pp-card-info">
frontend/src/components/PhotoPostModal.tsx:143:              <b className="pp-card-name">{review.listing?.name}</b>
frontend/src/components/PhotoPostModal.tsx:144:              {review.venue && (
frontend/src/components/PhotoPostModal.tsx:145:                <span
frontend/src/components/PhotoPostModal.tsx:146:                  className="pp-card-sub"
frontend/src/components/PhotoPostModal.tsx:147:                  onClick={(e) => { e.stopPropagation(); onOpenVenue?.(); }}
frontend/src/components/PhotoPostModal.tsx:148:                >
frontend/src/components/PhotoPostModal.tsx:149:                  {review.venue.name}
frontend/src/components/PhotoPostModal.tsx:150:                </span>
frontend/src/components/PhotoPostModal.tsx:151:              )}
frontend/src/components/PhotoPostModal.tsx:152:              {review.listing?.category && !/^(блюдо|напиток)$/i.test(review.listing.category) && (
frontend/src/components/PhotoPostModal.tsx:153:                <span className="pp-card-style">{review.listing.category}</span>
frontend/src/components/PhotoPostModal.tsx:154:              )}
frontend/src/components/PhotoPostModal.tsx:155:            </div>
frontend/src/components/PhotoPostModal.tsx:156:          </button>
frontend/src/components/PhotoPostModal.tsx:157:          <div className="pp-card-rating">
frontend/src/components/PhotoPostModal.tsx:158:            <Stars value={review.rating} />
frontend/src/components/PhotoPostModal.tsx:159:            <span className="pp-card-score">{review.rating.toFixed(2)}</span>
frontend/src/components/PhotoPostModal.tsx:160:          </div>
frontend/src/components/PhotoPostModal.tsx:161:          {review.text && <div className="pp-card-text">{review.text}</div>}
frontend/src/components/PhotoPostModal.tsx:162:        </div>
frontend/src/components/PhotoPostModal.tsx:164:        <div className="pp-body">
frontend/src/components/PhotoPostModal.tsx:165:          {dateStr && <div className="pp-date">{dateStr}</div>}
frontend/src/components/PhotoPostModal.tsx:167:          <div className="pp-votes">
frontend/src/components/PhotoPostModal.tsx:168:            {(['USEFUL', 'FUNNY', 'COOL', 'OHNO'] as VoteType[]).map((t) => (
frontend/src/components/PhotoPostModal.tsx:169:              <button
frontend/src/components/PhotoPostModal.tsx:170:                key={t}
frontend/src/components/PhotoPostModal.tsx:171:                className={'pp-vote' + (vote.mine.includes(t) ? ' active' : '')}
frontend/src/components/PhotoPostModal.tsx:172:                onClick={() => doVote(t)}
frontend/src/components/PhotoPostModal.tsx:173:              >
frontend/src/components/PhotoPostModal.tsx:174:                {VOTE_LABEL[t]}
frontend/src/components/PhotoPostModal.tsx:175:                {vote.counts[t] ? ` ${vote.counts[t]}` : ''}
frontend/src/components/PhotoPostModal.tsx:176:              </button>
frontend/src/components/PhotoPostModal.tsx:177:            ))}
frontend/src/components/PhotoPostModal.tsx:178:          </div>
frontend/src/components/PhotoPostModal.tsx:180:          {review.venue && (
frontend/src/components/PhotoPostModal.tsx:181:            <button type="button" className="pp-location" onClick={onOpenVenue}>
frontend/src/components/PhotoPostModal.tsx:182:              <div className="pp-loc-head">МЕСТО</div>
frontend/src/components/PhotoPostModal.tsx:183:              <div className="pp-loc-row">
frontend/src/components/PhotoPostModal.tsx:184:                <span className="pp-loc-ico">📍</span>
frontend/src/components/PhotoPostModal.tsx:185:                <b>{review.venue.name}</b>
frontend/src/components/PhotoPostModal.tsx:186:                <span className="pp-loc-chev">›</span>
frontend/src/components/PhotoPostModal.tsx:187:              </div>
frontend/src/components/PhotoPostModal.tsx:188:            </button>
frontend/src/components/PhotoPostModal.tsx:189:          )}
frontend/src/components/PhotoPostModal.tsx:191:          <div className="pp-comments">
frontend/src/components/PhotoPostModal.tsx:192:            <div className="pp-comments-title">Комментарии</div>
frontend/src/components/PhotoPostModal.tsx:193:            {comments.length === 0 ? (
frontend/src/components/PhotoPostModal.tsx:194:              <div className="pp-empty">Пока нет комментариев. Будьте первым!</div>
frontend/src/components/PhotoPostModal.tsx:195:            ) : (
frontend/src/components/PhotoPostModal.tsx:196:              comments.map((c) => (
frontend/src/components/PhotoPostModal.tsx:197:                <div key={c.id} className="pp-cmt">
frontend/src/components/PhotoPostModal.tsx:198:                  <button
frontend/src/components/PhotoPostModal.tsx:199:                    type="button"
frontend/src/components/PhotoPostModal.tsx:200:                    className="pp-cmt-av"
frontend/src/components/PhotoPostModal.tsx:201:                    onClick={() => c.user?.id && onOpenUser?.(c.user.id)}
frontend/src/components/PhotoPostModal.tsx:202:                  >
frontend/src/components/PhotoPostModal.tsx:203:                    {c.user?.photoUrl ? (
frontend/src/components/PhotoPostModal.tsx:204:                      <img src={c.user.photoUrl} alt="" />
frontend/src/components/PhotoPostModal.tsx:205:                    ) : (
frontend/src/components/PhotoPostModal.tsx:206:                      <span className="ph">{(c.user?.firstName ?? '?')[0]?.toUpperCase() ?? '?'}</span>
frontend/src/components/PhotoPostModal.tsx:207:                    )}
frontend/src/components/PhotoPostModal.tsx:208:                  </button>
frontend/src/components/PhotoPostModal.tsx:209:                  <div className="pp-cmt-body">
frontend/src/components/PhotoPostModal.tsx:210:                    <b>{c.user?.firstName ?? c.user?.username ?? 'Гость'}</b> {c.text}
frontend/src/components/PhotoPostModal.tsx:211:                  </div>
frontend/src/components/PhotoPostModal.tsx:212:                </div>
frontend/src/components/PhotoPostModal.tsx:213:              ))
frontend/src/components/PhotoPostModal.tsx:214:            )}
frontend/src/components/PhotoPostModal.tsx:215:          </div>
frontend/src/components/PhotoPostModal.tsx:217:          {err && <div className="pp-err">{err}</div>}
frontend/src/components/PhotoPostModal.tsx:218:          <div className="pp-form">
frontend/src/components/PhotoPostModal.tsx:219:            <input
frontend/src/components/PhotoPostModal.tsx:220:              placeholder="Добавить комментарий…"
frontend/src/components/PhotoPostModal.tsx:221:              value={text}
frontend/src/components/PhotoPostModal.tsx:222:              onChange={(e) => setText(e.target.value)}
frontend/src/components/PhotoPostModal.tsx:223:              onKeyDown={(e) => e.key === 'Enter' && send()}
frontend/src/components/PhotoPostModal.tsx:224:            />
frontend/src/components/PhotoPostModal.tsx:225:            <button className="pp-send" disabled={busy || !text.trim()} onClick={send} aria-label="Отправить">
frontend/src/components/PhotoPostModal.tsx:226:              ➤
frontend/src/components/PhotoPostModal.tsx:227:            </button>
frontend/src/components/PhotoPostModal.tsx:228:          </div>
frontend/src/components/PhotoPostModal.tsx:229:        </div>
frontend/src/components/PhotoPostModal.tsx:230:      </div>
frontend/src/components/PhotoPostModal.tsx:232:      {/* action sheet from the ⋯ button */}
frontend/src/components/PhotoPostModal.tsx:233:      {menu && (
frontend/src/components/PhotoPostModal.tsx:234:        <div className="pp-sheet-back" onClick={(e) => { e.stopPropagation(); setMenu(false); }}>
frontend/src/components/PhotoPostModal.tsx:235:          <div className="pp-sheet" onClick={(e) => e.stopPropagation()}>
frontend/src/components/PhotoPostModal.tsx:236:            {onEdit && (
frontend/src/components/PhotoPostModal.tsx:237:              <button className="pp-sheet-item" onClick={() => { setMenu(false); onEdit(); }}>Изменить</button>
frontend/src/components/PhotoPostModal.tsx:238:            )}
frontend/src/components/PhotoPostModal.tsx:239:            <button className="pp-sheet-item" onClick={sendToFriend}>Отправить другу</button>
frontend/src/components/PhotoPostModal.tsx:240:            {photo && <button className="pp-sheet-item" onClick={sharePhoto}>Поделиться фото</button>}
frontend/src/components/PhotoPostModal.tsx:241:            <button className="pp-sheet-item" onClick={copyLink}>Поделиться ссылкой</button>
frontend/src/components/PhotoPostModal.tsx:242:            {onDelete && (
frontend/src/components/PhotoPostModal.tsx:243:              <button className="pp-sheet-item danger" onClick={() => { setMenu(false); onDelete(); }}>Удалить</button>
frontend/src/components/PhotoPostModal.tsx:244:            )}
frontend/src/components/PhotoPostModal.tsx:245:            <button className="pp-sheet-item cancel" onClick={() => setMenu(false)}>Отмена</button>
frontend/src/components/PhotoPostModal.tsx:246:          </div>
frontend/src/components/PhotoPostModal.tsx:247:        </div>
frontend/src/components/PhotoPostModal.tsx:248:      )}
frontend/src/components/PhotoPostModal.tsx:249:      {toast && <div className="pp-toast">{toast}</div>}
frontend/src/components/PhotoPostModal.tsx:250:    </div>
frontend/src/components/PhotoPostModal.tsx:251:  );
frontend/src/components/PhotoPostModal.tsx:252:}
frontend/src/components/CommentsModal.tsx:1:import { useEffect, useMemo, useState, useRef} from 'react';
frontend/src/components/CommentsModal.tsx:2:import { api } from '../api';
frontend/src/components/CommentsModal.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src/components/CommentsModal.tsx:4:import { useSwipeDismiss } from '../swipeDismiss';
frontend/src/components/CommentsModal.tsx:5:import type { Comment } from '../types';
frontend/src/components/CommentsModal.tsx:7:type Node = Comment & { children: Node[] };
frontend/src/components/CommentsModal.tsx:9:function buildTree(list: Comment[]): Node[] {
frontend/src/components/CommentsModal.tsx:10:  const map = new Map<string, Node>();
frontend/src/components/CommentsModal.tsx:11:  list.forEach((c) => map.set(c.id, { ...c, children: [] }));
frontend/src/components/CommentsModal.tsx:12:  const roots: Node[] = [];
frontend/src/components/CommentsModal.tsx:13:  for (const c of list) {
frontend/src/components/CommentsModal.tsx:14:    const node = map.get(c.id)!;
frontend/src/components/CommentsModal.tsx:15:    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
frontend/src/components/CommentsModal.tsx:16:    else roots.push(node);
frontend/src/components/CommentsModal.tsx:17:  }
frontend/src/components/CommentsModal.tsx:18:  return roots;
frontend/src/components/CommentsModal.tsx:19:}
frontend/src/components/CommentsModal.tsx:21:function CommentNode({
frontend/src/components/CommentsModal.tsx:22:  node,
frontend/src/components/CommentsModal.tsx:23:  depth,
frontend/src/components/CommentsModal.tsx:24:  onReply,
frontend/src/components/CommentsModal.tsx:25:  onOpenUser,
frontend/src/components/CommentsModal.tsx:26:  meId,
frontend/src/components/CommentsModal.tsx:27:  isAdmin,
frontend/src/components/CommentsModal.tsx:28:  onDelete,
frontend/src/components/CommentsModal.tsx:29:}: {
frontend/src/components/CommentsModal.tsx:30:  node: Node;
frontend/src/components/CommentsModal.tsx:31:  depth: number;
frontend/src/components/CommentsModal.tsx:32:  onReply: (parentId: string, text: string) => Promise<void>;
frontend/src/components/CommentsModal.tsx:33:  onOpenUser?: (userId: string) => void;
frontend/src/components/CommentsModal.tsx:34:  meId?: string;
frontend/src/components/CommentsModal.tsx:35:  isAdmin?: boolean;
frontend/src/components/CommentsModal.tsx:36:  onDelete: (id: string) => void;
frontend/src/components/CommentsModal.tsx:37:}) {
frontend/src/components/CommentsModal.tsx:38:  const [replying, setReplying] = useState(false);
frontend/src/components/CommentsModal.tsx:39:  const [text, setText] = useState('');
frontend/src/components/CommentsModal.tsx:40:  const [busy, setBusy] = useState(false);
frontend/src/components/CommentsModal.tsx:41:  const name = node.user?.firstName ?? node.user?.username ?? 'Гость';
frontend/src/components/CommentsModal.tsx:42:  const canDelete = !!meId && (node.user?.id === meId || isAdmin);
frontend/src/components/CommentsModal.tsx:44:  const send = async () => {
frontend/src/components/CommentsModal.tsx:45:    if (!text.trim()) return;
frontend/src/components/CommentsModal.tsx:46:    setBusy(true);
frontend/src/components/CommentsModal.tsx:47:    await onReply(node.id, text.trim());
frontend/src/components/CommentsModal.tsx:48:    setText('');
frontend/src/components/CommentsModal.tsx:49:    setReplying(false);
frontend/src/components/CommentsModal.tsx:50:    setBusy(false);
frontend/src/components/CommentsModal.tsx:51:  };
frontend/src/components/CommentsModal.tsx:53:  return (
frontend/src/components/CommentsModal.tsx:54:    <div className="cmt" style={{ marginLeft: depth > 0 ? 14 : 0 }}>
frontend/src/components/CommentsModal.tsx:55:      <div
frontend/src/components/CommentsModal.tsx:56:        className="cmt-head"
frontend/src/components/CommentsModal.tsx:57:        onClick={() => node.user?.id && onOpenUser?.(node.user.id)}
frontend/src/components/CommentsModal.tsx:58:        style={{ cursor: node.user?.id && onOpenUser ? 'pointer' : 'default' }}
frontend/src/components/CommentsModal.tsx:59:      >
frontend/src/components/CommentsModal.tsx:60:        {node.user?.photoUrl ? (
frontend/src/components/CommentsModal.tsx:61:          <img className="cmt-avatar" src={node.user.photoUrl} alt="" />
frontend/src/components/CommentsModal.tsx:62:        ) : (
frontend/src/components/CommentsModal.tsx:63:          <div className="cmt-avatar ph">{name[0]?.toUpperCase() ?? '?'}</div>
frontend/src/components/CommentsModal.tsx:64:        )}
frontend/src/components/CommentsModal.tsx:65:        <b className="cmt-name">{name}</b>
frontend/src/components/CommentsModal.tsx:66:      </div>
frontend/src/components/CommentsModal.tsx:67:      <div className="cmt-text">{node.text}</div>
frontend/src/components/CommentsModal.tsx:68:      <button className="cmt-reply" onClick={() => setReplying((r) => !r)}>
frontend/src/components/CommentsModal.tsx:69:        Ответить
frontend/src/components/CommentsModal.tsx:70:      </button>
frontend/src/components/CommentsModal.tsx:71:      {canDelete && (
frontend/src/components/CommentsModal.tsx:72:        <button
frontend/src/components/CommentsModal.tsx:73:          className="cmt-reply"
frontend/src/components/CommentsModal.tsx:74:          style={{ color: 'var(--accent)' }}
frontend/src/components/CommentsModal.tsx:75:          onClick={() => onDelete(node.id)}
frontend/src/components/CommentsModal.tsx:76:        >
frontend/src/components/CommentsModal.tsx:77:          Удалить
frontend/src/components/CommentsModal.tsx:78:        </button>
frontend/src/components/CommentsModal.tsx:79:      )}
frontend/src/components/CommentsModal.tsx:80:      {replying && (
frontend/src/components/CommentsModal.tsx:81:        <div className="cmt-form">
frontend/src/components/CommentsModal.tsx:82:          <input
frontend/src/components/CommentsModal.tsx:83:            autoFocus
frontend/src/components/CommentsModal.tsx:84:            placeholder="Ваш ответ…"
frontend/src/components/CommentsModal.tsx:85:            value={text}
frontend/src/components/CommentsModal.tsx:86:            onChange={(e) => setText(e.target.value)}
frontend/src/components/CommentsModal.tsx:87:            onKeyDown={(e) => e.key === 'Enter' && send()}
frontend/src/components/CommentsModal.tsx:88:          />
frontend/src/components/CommentsModal.tsx:89:          <button className="btn cmt-send" disabled={busy || !text.trim()} onClick={send}>
frontend/src/components/CommentsModal.tsx:90:            Отправить
frontend/src/components/CommentsModal.tsx:91:          </button>
frontend/src/components/CommentsModal.tsx:92:        </div>
frontend/src/components/CommentsModal.tsx:93:      )}
frontend/src/components/CommentsModal.tsx:94:      {node.children.map((ch) => (
frontend/src/components/CommentsModal.tsx:95:        <CommentNode
frontend/src/components/CommentsModal.tsx:96:          key={ch.id}
frontend/src/components/CommentsModal.tsx:97:          node={ch}
frontend/src/components/CommentsModal.tsx:98:          depth={depth + 1}
frontend/src/components/CommentsModal.tsx:99:          onReply={onReply}
frontend/src/components/CommentsModal.tsx:100:          onOpenUser={onOpenUser}
frontend/src/components/CommentsModal.tsx:101:          meId={meId}
frontend/src/components/CommentsModal.tsx:102:          isAdmin={isAdmin}
frontend/src/components/CommentsModal.tsx:103:          onDelete={onDelete}
frontend/src/components/CommentsModal.tsx:104:        />
frontend/src/components/CommentsModal.tsx:105:      ))}
frontend/src/components/CommentsModal.tsx:106:    </div>
frontend/src/components/CommentsModal.tsx:107:  );
frontend/src/components/CommentsModal.tsx:108:}
frontend/src/components/CommentsModal.tsx:110:export function CommentsModal({
frontend/src/components/CommentsModal.tsx:111:  reviewId,
frontend/src/components/CommentsModal.tsx:112:  onClose,
frontend/src/components/CommentsModal.tsx:113:  onOpenUser,
frontend/src/components/CommentsModal.tsx:114:}: {
frontend/src/components/CommentsModal.tsx:115:  reviewId: string;
frontend/src/components/CommentsModal.tsx:116:  onClose: () => void;
frontend/src/components/CommentsModal.tsx:117:  onOpenUser?: (userId: string) => void;
frontend/src/components/CommentsModal.tsx:118:}) {
frontend/src/components/CommentsModal.tsx:119:  const [list, setList] = useState<Comment[]>([]);
frontend/src/components/CommentsModal.tsx:120:  const [text, setText] = useState('');
frontend/src/components/CommentsModal.tsx:121:  const [busy, setBusy] = useState(false);
frontend/src/components/CommentsModal.tsx:122:  const [closing, setClosing] = useState(false);
frontend/src/components/CommentsModal.tsx:123:  const [loading, setLoading] = useState(true);
frontend/src/components/CommentsModal.tsx:124:  const [error, setError] = useState(false);
frontend/src/components/CommentsModal.tsx:125:  const [modErr, setModErr] = useState('');
frontend/src/components/CommentsModal.tsx:126:  const [me, setMe] = useState<{ id: string; role?: string } | null>(null);
frontend/src/components/CommentsModal.tsx:128:  const load = () => {
frontend/src/components/CommentsModal.tsx:129:    setLoading(true);
frontend/src/components/CommentsModal.tsx:130:    setError(false);
frontend/src/components/CommentsModal.tsx:131:    return api
frontend/src/components/CommentsModal.tsx:132:      .comments(reviewId)
frontend/src/components/CommentsModal.tsx:133:      .then((c) => setList(c))
frontend/src/components/CommentsModal.tsx:134:      .catch(() => setError(true))
frontend/src/components/CommentsModal.tsx:135:      .finally(() => setLoading(false));
frontend/src/components/CommentsModal.tsx:136:  };
frontend/src/components/CommentsModal.tsx:137:  useEffect(() => {
frontend/src/components/CommentsModal.tsx:138:    load();
frontend/src/components/CommentsModal.tsx:139:    api.me().then((u) => setMe({ id: u.id, role: (u as any).role })).catch(() => {});
frontend/src/components/CommentsModal.tsx:140:    // eslint-disable-next-line react-hooks/exhaustive-deps
frontend/src/components/CommentsModal.tsx:141:  }, [reviewId]);
frontend/src/components/CommentsModal.tsx:143:  const tree = useMemo(() => buildTree(list), [list]);
frontend/src/components/CommentsModal.tsx:144:  const reqClose = () => {
frontend/src/components/CommentsModal.tsx:145:    setClosing(true);
frontend/src/components/CommentsModal.tsx:146:    setTimeout(onClose, 220);
frontend/src/components/CommentsModal.tsx:147:  };
frontend/src/components/CommentsModal.tsx:148:  useEscClose(reqClose);
frontend/src/components/CommentsModal.tsx:149:  // swipe-down from the top dismisses (shared app-wide pattern)
frontend/src/components/CommentsModal.tsx:150:  const sheetRef = useRef<HTMLDivElement>(null);
frontend/src/components/CommentsModal.tsx:151:  useSwipeDismiss(sheetRef, onClose);
frontend/src/components/CommentsModal.tsx:153:  const reply = async (parentId: string | undefined, t: string) => {
frontend/src/components/CommentsModal.tsx:154:    setModErr('');
frontend/src/components/CommentsModal.tsx:155:    try {
frontend/src/components/CommentsModal.tsx:156:      const created = await api.addComment(reviewId, t, parentId);
frontend/src/components/CommentsModal.tsx:157:      if (created) setList((prev) => [...prev, created]); // show instantly
frontend/src/components/CommentsModal.tsx:158:      load(); // …and sync with server
frontend/src/components/CommentsModal.tsx:159:    } catch (e: any) {
frontend/src/components/CommentsModal.tsx:160:      // surface the real reason (moderation vs. network) instead of always blaming moderation
frontend/src/components/CommentsModal.tsx:161:      setModErr(e?.message?.trim() || 'Не удалось отправить комментарий. Попробуйте ещё раз.');
frontend/src/components/CommentsModal.tsx:162:    }
frontend/src/components/CommentsModal.tsx:163:  };
frontend/src/components/CommentsModal.tsx:165:  const removeComment = (id: string) => {
frontend/src/components/CommentsModal.tsx:166:    api.deleteComment(id).then(load).catch(() => {});
frontend/src/components/CommentsModal.tsx:167:  };
frontend/src/components/CommentsModal.tsx:169:  const sendRoot = async () => {
frontend/src/components/CommentsModal.tsx:170:    if (!text.trim()) return;
frontend/src/components/CommentsModal.tsx:171:    setBusy(true);
frontend/src/components/CommentsModal.tsx:172:    await reply(undefined, text.trim());
frontend/src/components/CommentsModal.tsx:173:    setText('');
frontend/src/components/CommentsModal.tsx:174:    setBusy(false);
frontend/src/components/CommentsModal.tsx:175:  };
frontend/src/components/CommentsModal.tsx:177:  return (
frontend/src/components/CommentsModal.tsx:178:    <div
frontend/src/components/CommentsModal.tsx:179:      className="modal-backdrop"
frontend/src/components/CommentsModal.tsx:180:      style={{ zIndex: 3300 }}
frontend/src/components/CommentsModal.tsx:181:      onClick={(e) => {
frontend/src/components/CommentsModal.tsx:182:        e.stopPropagation();
frontend/src/components/CommentsModal.tsx:183:        reqClose();
frontend/src/components/CommentsModal.tsx:184:      }}
frontend/src/components/CommentsModal.tsx:185:    >
frontend/src/components/CommentsModal.tsx:186:      <div
frontend/src/components/CommentsModal.tsx:187:        ref={sheetRef}
frontend/src/components/CommentsModal.tsx:188:        className={'modal cmt-modal' + (closing ? ' closing' : '')}
frontend/src/components/CommentsModal.tsx:189:        onClick={(e) => e.stopPropagation()}
frontend/src/components/CommentsModal.tsx:190:      >
frontend/src/components/CommentsModal.tsx:191:        <h3>Обсуждение</h3>
frontend/src/components/CommentsModal.tsx:192:        <div className="cmt-list">
frontend/src/components/CommentsModal.tsx:193:          {loading ? (
frontend/src/components/CommentsModal.tsx:194:            <div className="meta" style={{ color: 'var(--hint)', padding: '8px 0' }}>
frontend/src/components/CommentsModal.tsx:195:              Загрузка…
frontend/src/components/CommentsModal.tsx:196:            </div>
frontend/src/components/CommentsModal.tsx:197:          ) : error ? (
frontend/src/components/CommentsModal.tsx:198:            <div className="meta" style={{ color: 'var(--hint)', padding: '8px 0' }}>
frontend/src/components/CommentsModal.tsx:199:              Не удалось загрузить комментарии.{' '}
frontend/src/components/CommentsModal.tsx:200:              <button
frontend/src/components/CommentsModal.tsx:201:                onClick={load}
frontend/src/components/CommentsModal.tsx:202:                style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
frontend/src/components/CommentsModal.tsx:203:              >
frontend/src/components/CommentsModal.tsx:204:                Повторить
frontend/src/components/CommentsModal.tsx:205:              </button>
frontend/src/components/CommentsModal.tsx:206:            </div>
frontend/src/components/CommentsModal.tsx:207:          ) : tree.length === 0 ? (
frontend/src/components/CommentsModal.tsx:208:            <div className="meta" style={{ color: 'var(--hint)', padding: '8px 0' }}>
frontend/src/components/CommentsModal.tsx:209:              Пока нет комментариев. Будьте первым!
frontend/src/components/CommentsModal.tsx:210:            </div>
frontend/src/components/CommentsModal.tsx:211:          ) : (
frontend/src/components/CommentsModal.tsx:212:            tree.map((n) => (
frontend/src/components/CommentsModal.tsx:213:              <CommentNode
frontend/src/components/CommentsModal.tsx:214:                key={n.id}
frontend/src/components/CommentsModal.tsx:215:                node={n}
frontend/src/components/CommentsModal.tsx:216:                depth={0}
frontend/src/components/CommentsModal.tsx:217:                onReply={(pid, t) => reply(pid, t)}
frontend/src/components/CommentsModal.tsx:218:                onOpenUser={onOpenUser}
frontend/src/components/CommentsModal.tsx:219:                meId={me?.id}
frontend/src/components/CommentsModal.tsx:220:                isAdmin={me?.role === 'ADMIN'}
frontend/src/components/CommentsModal.tsx:221:                onDelete={removeComment}
frontend/src/components/CommentsModal.tsx:222:              />
frontend/src/components/CommentsModal.tsx:223:            ))
frontend/src/components/CommentsModal.tsx:224:          )}
frontend/src/components/CommentsModal.tsx:225:        </div>
frontend/src/components/CommentsModal.tsx:226:        {modErr && (
frontend/src/components/CommentsModal.tsx:227:          <div className="meta" style={{ color: 'var(--accent)', padding: '4px 0' }}>{modErr}</div>
frontend/src/components/CommentsModal.tsx:228:        )}
frontend/src/components/CommentsModal.tsx:229:        <div className="cmt-form root">
frontend/src/components/CommentsModal.tsx:230:          <input
frontend/src/components/CommentsModal.tsx:231:            placeholder="Написать комментарий…"
frontend/src/components/CommentsModal.tsx:232:            value={text}
frontend/src/components/CommentsModal.tsx:233:            onChange={(e) => setText(e.target.value)}
frontend/src/components/CommentsModal.tsx:234:            onKeyDown={(e) => e.key === 'Enter' && sendRoot()}
frontend/src/components/CommentsModal.tsx:235:          />
frontend/src/components/CommentsModal.tsx:236:          <button className="btn cmt-send" disabled={busy || !text.trim()} onClick={sendRoot}>
frontend/src/components/CommentsModal.tsx:237:            Отправить
frontend/src/components/CommentsModal.tsx:238:          </button>
frontend/src/components/CommentsModal.tsx:239:        </div>
frontend/src/components/CommentsModal.tsx:240:      </div>
frontend/src/components/CommentsModal.tsx:241:    </div>
frontend/src/components/CommentsModal.tsx:242:  );
frontend/src/components/CommentsModal.tsx:243:}
frontend/src/components/VenuePicker.tsx:1:import { useEffect, useState } from 'react';
frontend/src/components/VenuePicker.tsx:2:import { api } from '../api';
frontend/src/components/VenuePicker.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src/components/VenuePicker.tsx:4:import type { Listing } from '../types';
frontend/src/components/VenuePicker.tsx:6:// collapse chain branches into one row ("Бургер Кинг" once, not 7×)
frontend/src/components/VenuePicker.tsx:7:function dedupeChains(list: Listing[]): (Listing & { branchCount?: number })[] {
frontend/src/components/VenuePicker.tsx:8:  const groups = new Map<string, Listing & { branchCount?: number }>();
frontend/src/components/VenuePicker.tsx:9:  for (const v of list) {
frontend/src/components/VenuePicker.tsx:10:    const key = (v.groupKey || v.name).toLowerCase().trim();
frontend/src/components/VenuePicker.tsx:11:    const existing = groups.get(key);
frontend/src/components/VenuePicker.tsx:12:    // keep the server's chain size if it already collapsed the chain into one card
frontend/src/components/VenuePicker.tsx:13:    if (existing) existing.branchCount = (existing.branchCount ?? 1) + 1;
frontend/src/components/VenuePicker.tsx:14:    else groups.set(key, { ...v, branchCount: v.branchCount && v.branchCount > 1 ? v.branchCount : 1 });
frontend/src/components/VenuePicker.tsx:15:  }
frontend/src/components/VenuePicker.tsx:16:  return [...groups.values()];
frontend/src/components/VenuePicker.tsx:17:}
frontend/src/components/VenuePicker.tsx:19:export function VenuePicker({
frontend/src/components/VenuePicker.tsx:20:  itemId,
frontend/src/components/VenuePicker.tsx:21:  onPick,
frontend/src/components/VenuePicker.tsx:22:  onAdded,
frontend/src/components/VenuePicker.tsx:23:  onClose,
frontend/src/components/VenuePicker.tsx:24:}: {
frontend/src/components/VenuePicker.tsx:25:  itemId?: string; // when set, the default list = venues that SERVE this item
frontend/src/components/VenuePicker.tsx:26:  onPick: (venue: Listing) => void;
frontend/src/components/VenuePicker.tsx:27:  // a new (pending-moderation) place was submitted → proceed to the review form
frontend/src/components/VenuePicker.tsx:28:  onAdded?: (name: string) => void;
frontend/src/components/VenuePicker.tsx:29:  onClose: () => void;
frontend/src/components/VenuePicker.tsx:30:}) {
frontend/src/components/VenuePicker.tsx:31:  const [q, setQ] = useState('');
frontend/src/components/VenuePicker.tsx:32:  const [results, setResults] = useState<Listing[]>([]);
frontend/src/components/VenuePicker.tsx:33:  const [addMode, setAddMode] = useState(false);
frontend/src/components/VenuePicker.tsx:34:  const [name, setName] = useState('');
frontend/src/components/VenuePicker.tsx:35:  const [city, setCity] = useState('Москва');
frontend/src/components/VenuePicker.tsx:36:  const [address, setAddress] = useState('');
frontend/src/components/VenuePicker.tsx:37:  const [busy, setBusy] = useState(false);
frontend/src/components/VenuePicker.tsx:38:  const [sent, setSent] = useState(false);
frontend/src/components/VenuePicker.tsx:39:  useEscClose(onClose);
frontend/src/components/VenuePicker.tsx:41:  useEffect(() => {
frontend/src/components/VenuePicker.tsx:42:    const query = q.trim();
frontend/src/components/VenuePicker.tsx:43:    const t = setTimeout(() => {
frontend/src/components/VenuePicker.tsx:44:      // no query → venues that already SERVE this item (the honest default);
frontend/src/components/VenuePicker.tsx:45:      // typing → translit-aware search across all venues
frontend/src/components/VenuePicker.tsx:46:      (query
frontend/src/components/VenuePicker.tsx:47:        ? api.searchVenues(query)
frontend/src/components/VenuePicker.tsx:48:        : itemId
frontend/src/components/VenuePicker.tsx:49:          ? api.placesForItem(itemId).then((v) => (v.length ? v : api.listings('RESTAURANT', undefined, { take: 25 })))
frontend/src/components/VenuePicker.tsx:50:          : api.listings('RESTAURANT', undefined, { take: 25 })
frontend/src/components/VenuePicker.tsx:51:      )
frontend/src/components/VenuePicker.tsx:52:        .then(setResults)
frontend/src/components/VenuePicker.tsx:53:        .catch(() => {});
frontend/src/components/VenuePicker.tsx:54:    }, 180);
frontend/src/components/VenuePicker.tsx:55:    return () => clearTimeout(t);
frontend/src/components/VenuePicker.tsx:56:  }, [q, itemId]);
frontend/src/components/VenuePicker.tsx:58:  const startAdd = () => {
frontend/src/components/VenuePicker.tsx:59:    setName(q.trim());
frontend/src/components/VenuePicker.tsx:60:    setAddress('');
frontend/src/components/VenuePicker.tsx:61:    setAddMode(true);
frontend/src/components/VenuePicker.tsx:62:  };
frontend/src/components/VenuePicker.tsx:64:  const submit = () => {
frontend/src/components/VenuePicker.tsx:65:    if (!name.trim() || !city.trim()) return;
frontend/src/components/VenuePicker.tsx:66:    setBusy(true);
frontend/src/components/VenuePicker.tsx:67:    const placeName = name.trim();
frontend/src/components/VenuePicker.tsx:68:    api
frontend/src/components/VenuePicker.tsx:69:      .submitBusiness({
frontend/src/components/VenuePicker.tsx:70:        relationship: 'customer',
frontend/src/components/VenuePicker.tsx:71:        name: placeName,
frontend/src/components/VenuePicker.tsx:72:        city: city.trim(),
frontend/src/components/VenuePicker.tsx:73:        address: address.trim() || undefined,
frontend/src/components/VenuePicker.tsx:74:        category: 'Ресторан',
frontend/src/components/VenuePicker.tsx:75:      })
frontend/src/components/VenuePicker.tsx:76:      .then(() => {
frontend/src/components/VenuePicker.tsx:77:        // go straight to the review form — the place is pending moderation but
frontend/src/components/VenuePicker.tsx:78:        // the user can rate it now; we attach the name and link once approved.
frontend/src/components/VenuePicker.tsx:79:        if (onAdded) onAdded(placeName);
frontend/src/components/VenuePicker.tsx:80:        else setSent(true);
frontend/src/components/VenuePicker.tsx:81:      })
frontend/src/components/VenuePicker.tsx:82:      .catch(() => setBusy(false));
frontend/src/components/VenuePicker.tsx:83:  };
frontend/src/components/VenuePicker.tsx:85:  return (
frontend/src/components/VenuePicker.tsx:86:    <div
frontend/src/components/VenuePicker.tsx:87:      className="modal-backdrop"
frontend/src/components/VenuePicker.tsx:88:      style={{ zIndex: 2700 }}
frontend/src/components/VenuePicker.tsx:89:      onClick={(e) => {
frontend/src/components/VenuePicker.tsx:90:        e.stopPropagation();
frontend/src/components/VenuePicker.tsx:91:        onClose();
frontend/src/components/VenuePicker.tsx:92:      }}
frontend/src/components/VenuePicker.tsx:93:    >
frontend/src/components/VenuePicker.tsx:94:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src/components/VenuePicker.tsx:95:        {sent ? (
frontend/src/components/VenuePicker.tsx:96:          <div style={{ textAlign: 'center', padding: '12px 0' }}>
frontend/src/components/VenuePicker.tsx:97:            <div style={{ fontSize: 40 }}>✅</div>
frontend/src/components/VenuePicker.tsx:98:            <h3>Заявка отправлена</h3>
frontend/src/components/VenuePicker.tsx:99:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, margin: '8px 0 16px' }}>
frontend/src/components/VenuePicker.tsx:100:              Заведение появится после проверки модератором.
frontend/src/components/VenuePicker.tsx:101:            </p>
frontend/src/components/VenuePicker.tsx:102:            <button className="btn" onClick={onClose}>
frontend/src/components/VenuePicker.tsx:103:              Готово
frontend/src/components/VenuePicker.tsx:104:            </button>
frontend/src/components/VenuePicker.tsx:105:          </div>
frontend/src/components/VenuePicker.tsx:106:        ) : addMode ? (
frontend/src/components/VenuePicker.tsx:107:          <>
frontend/src/components/VenuePicker.tsx:108:            <h3>Добавить заведение</h3>
frontend/src/components/VenuePicker.tsx:109:            <div className="field">
frontend/src/components/VenuePicker.tsx:110:              <label>Название</label>
frontend/src/components/VenuePicker.tsx:111:              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Север" />
frontend/src/components/VenuePicker.tsx:112:            </div>
frontend/src/components/VenuePicker.tsx:113:            <div className="field">
frontend/src/components/VenuePicker.tsx:114:              <label>Город</label>
frontend/src/components/VenuePicker.tsx:115:              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" />
frontend/src/components/VenuePicker.tsx:116:            </div>
frontend/src/components/VenuePicker.tsx:117:            <div className="field">
frontend/src/components/VenuePicker.tsx:118:              <label>Адрес (необязательно)</label>
frontend/src/components/VenuePicker.tsx:119:              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом" />
frontend/src/components/VenuePicker.tsx:120:            </div>
frontend/src/components/VenuePicker.tsx:121:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 12 }}>
frontend/src/components/VenuePicker.tsx:122:              Найдём заведение по карте. Если у сети много точек — добавим все.
frontend/src/components/VenuePicker.tsx:123:            </p>
frontend/src/components/VenuePicker.tsx:124:            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
frontend/src/components/VenuePicker.tsx:125:              <button className="btn secondary" onClick={() => setAddMode(false)} disabled={busy}>
frontend/src/components/VenuePicker.tsx:126:                Назад
frontend/src/components/VenuePicker.tsx:127:              </button>
frontend/src/components/VenuePicker.tsx:128:              <button className="btn" onClick={submit} disabled={busy || !name.trim() || !city.trim()}>
frontend/src/components/VenuePicker.tsx:129:                {busy ? 'Отправка…' : 'Отправить'}
frontend/src/components/VenuePicker.tsx:130:              </button>
frontend/src/components/VenuePicker.tsx:131:            </div>
frontend/src/components/VenuePicker.tsx:132:          </>
frontend/src/components/VenuePicker.tsx:133:        ) : (
frontend/src/components/VenuePicker.tsx:134:          <>
frontend/src/components/VenuePicker.tsx:135:            <h3>Где вы это пробовали?</h3>
frontend/src/components/VenuePicker.tsx:136:            <div className="pu-search">
frontend/src/components/VenuePicker.tsx:137:              <span className="search-ico">🔍</span>
frontend/src/components/VenuePicker.tsx:138:              <input
frontend/src/components/VenuePicker.tsx:139:                placeholder="Найти ресторан или бар…"
frontend/src/components/VenuePicker.tsx:140:                value={q}
frontend/src/components/VenuePicker.tsx:141:                onChange={(e) => setQ(e.target.value)}
frontend/src/components/VenuePicker.tsx:142:              />
frontend/src/components/VenuePicker.tsx:143:            </div>
frontend/src/components/VenuePicker.tsx:144:            <div className="pu-list">
frontend/src/components/VenuePicker.tsx:145:              {dedupeChains(results).map((v) => (
frontend/src/components/VenuePicker.tsx:146:                <button key={v.id} className="pick-row" onClick={() => onPick(v)}>
frontend/src/components/VenuePicker.tsx:147:                  <div className="pu-name">{v.name}</div>
frontend/src/components/VenuePicker.tsx:148:                  {v.branchCount && v.branchCount > 1 ? (
frontend/src/components/VenuePicker.tsx:149:                    <div className="pu-meta">Сеть · {v.branchCount} точек</div>
frontend/src/components/VenuePicker.tsx:150:                  ) : (
frontend/src/components/VenuePicker.tsx:151:                    v.address && <div className="pu-meta">{v.address}</div>
frontend/src/components/VenuePicker.tsx:152:                  )}
frontend/src/components/VenuePicker.tsx:153:                </button>
frontend/src/components/VenuePicker.tsx:154:              ))}
frontend/src/components/VenuePicker.tsx:155:              {q.trim().length >= 2 && (
frontend/src/components/VenuePicker.tsx:156:                <button className="pick-row add-row" onClick={startAdd}>
frontend/src/components/VenuePicker.tsx:157:                  <div className="pu-name" style={{ color: 'var(--accent)' }}>
frontend/src/components/VenuePicker.tsx:158:                    ➕ Нет в списке — добавить «{q.trim()}»
frontend/src/components/VenuePicker.tsx:159:                  </div>
frontend/src/components/VenuePicker.tsx:160:                  <div className="pu-meta">Добавим сразу, если адрес подтвердится</div>
frontend/src/components/VenuePicker.tsx:161:                </button>
frontend/src/components/VenuePicker.tsx:162:              )}
frontend/src/components/VenuePicker.tsx:163:            </div>
frontend/src/components/VenuePicker.tsx:164:            <button className="btn secondary" style={{ marginTop: 12 }} onClick={onClose}>
frontend/src/components/VenuePicker.tsx:165:              Отмена
frontend/src/components/VenuePicker.tsx:166:            </button>
frontend/src/components/VenuePicker.tsx:167:          </>
frontend/src/components/VenuePicker.tsx:168:        )}
frontend/src/components/VenuePicker.tsx:169:      </div>
frontend/src/components/VenuePicker.tsx:170:    </div>
frontend/src/components/VenuePicker.tsx:171:  );
frontend/src/components/VenuePicker.tsx:172:}
frontend/src/components/ReviewForm.tsx:1:import { useCallback, useEffect, useState, useRef } from 'react';
frontend/src/components/ReviewForm.tsx:2:import { api } from '../api';
frontend/src/components/ReviewForm.tsx:3:import { composeStoryImage } from '../storyImage';
frontend/src/components/ReviewForm.tsx:4:import { useSwipeDismiss } from '../swipeDismiss';
frontend/src/components/ReviewForm.tsx:5:import { useEscClose } from '../modalEsc';
frontend/src/components/ReviewForm.tsx:6:import type { Listing, PublicUser, Review } from '../types';
frontend/src/components/ReviewForm.tsx:7:import { StarInput } from './StarInput';
frontend/src/components/ReviewForm.tsx:8:import { templateFor } from '../tasting';
frontend/src/components/ReviewForm.tsx:10:export type ReviewSavedMedia = {
frontend/src/components/ReviewForm.tsx:11:  photo?: string;
frontend/src/components/ReviewForm.tsx:12:  photos?: string[];
frontend/src/components/ReviewForm.tsx:13:  video?: string;
frontend/src/components/ReviewForm.tsx:14:  text?: string;
frontend/src/components/ReviewForm.tsx:15:  slides?: Record<string, string>;
frontend/src/components/ReviewForm.tsx:16:  review?: Review;
frontend/src/components/ReviewForm.tsx:17:};
frontend/src/components/ReviewForm.tsx:19:type ReviewDraft = {
frontend/src/components/ReviewForm.tsx:20:  rating: number;
frontend/src/components/ReviewForm.tsx:21:  text: string;
frontend/src/components/ReviewForm.tsx:22:  choices: Record<string, string[]>;
frontend/src/components/ReviewForm.tsx:23:  ratings: Record<string, number>;
frontend/src/components/ReviewForm.tsx:24:  price: string;
frontend/src/components/ReviewForm.tsx:25:  visitDate: string;
frontend/src/components/ReviewForm.tsx:26:  photoUrls: string[];
frontend/src/components/ReviewForm.tsx:27:  videoUrls: string[];
frontend/src/components/ReviewForm.tsx:28:  tagged: string[];
frontend/src/components/ReviewForm.tsx:29:};
frontend/src/components/ReviewForm.tsx:31:function readDraft(key: string): Partial<ReviewDraft> | null {
frontend/src/components/ReviewForm.tsx:32:  try {
frontend/src/components/ReviewForm.tsx:33:    const value = JSON.parse(localStorage.getItem(key) || 'null');
frontend/src/components/ReviewForm.tsx:34:    return value && typeof value === 'object' ? value : null;
frontend/src/components/ReviewForm.tsx:35:  } catch {
frontend/src/components/ReviewForm.tsx:36:    return null;
frontend/src/components/ReviewForm.tsx:37:  }
frontend/src/components/ReviewForm.tsx:38:}
frontend/src/components/ReviewForm.tsx:40:export function ReviewForm({
frontend/src/components/ReviewForm.tsx:41:  listing,
frontend/src/components/ReviewForm.tsx:42:  venue,
frontend/src/components/ReviewForm.tsx:43:  existing,
frontend/src/components/ReviewForm.tsx:44:  initialRating,
frontend/src/components/ReviewForm.tsx:45:  initialPhotoUrls,
frontend/src/components/ReviewForm.tsx:46:  knownPrice,
frontend/src/components/ReviewForm.tsx:47:  onClose,
frontend/src/components/ReviewForm.tsx:48:  onSaved,
frontend/src/components/ReviewForm.tsx:49:}: {
frontend/src/components/ReviewForm.tsx:50:  listing: Listing;
frontend/src/components/ReviewForm.tsx:51:  venue?: { id?: string; name: string; pending?: boolean } | null;
frontend/src/components/ReviewForm.tsx:52:  existing?: Review;
frontend/src/components/ReviewForm.tsx:53:  initialRating?: number;
frontend/src/components/ReviewForm.tsx:54:  initialPhotoUrls?: string[]; // e.g. the photo the user just scanned — prefilled
frontend/src/components/ReviewForm.tsx:55:  knownPrice?: number | null; // item already has a price here → don't ask for it
frontend/src/components/ReviewForm.tsx:56:  onClose: () => void;
frontend/src/components/ReviewForm.tsx:57:  onSaved: (media?: ReviewSavedMedia) => void;
frontend/src/components/ReviewForm.tsx:58:}) {
frontend/src/components/ReviewForm.tsx:59:  const tpl = templateFor(listing);
frontend/src/components/ReviewForm.tsx:60:  const prev = (existing?.attributes ?? {}) as Record<string, any>;
frontend/src/components/ReviewForm.tsx:61:  const draftKey = `reviewDraft:v1:${listing.id}:${existing?.id ?? 'new'}`;
frontend/src/components/ReviewForm.tsx:62:  const [restoredDraft] = useState(() => readDraft(draftKey));
frontend/src/components/ReviewForm.tsx:64:  // if the item already IS a specific option (e.g. "Капучино"), pre-fill that
frontend/src/components/ReviewForm.tsx:65:  // choice and hide the question — no point asking the kind again.
frontend/src/components/ReviewForm.tsx:66:  const normName = listing.name.toLowerCase().replace(/[\s-]/g, '');
frontend/src/components/ReviewForm.tsx:67:  const autoChoice: Record<string, string> = {};
frontend/src/components/ReviewForm.tsx:68:  for (const ch of tpl.choices) {
frontend/src/components/ReviewForm.tsx:69:    const m = ch.options.find((o) => o.toLowerCase().replace(/[\s-]/g, '') === normName);
frontend/src/components/ReviewForm.tsx:70:    if (m) autoChoice[ch.key] = m;
frontend/src/components/ReviewForm.tsx:71:  }
frontend/src/components/ReviewForm.tsx:73:  const [rating, setRating] = useState(restoredDraft?.rating ?? existing?.rating ?? initialRating ?? 5);
frontend/src/components/ReviewForm.tsx:74:  const [text, setText] = useState(restoredDraft?.text ?? existing?.text ?? '');
frontend/src/components/ReviewForm.tsx:75:  const [choices, setChoices] = useState<Record<string, string[]>>(
frontend/src/components/ReviewForm.tsx:76:    restoredDraft?.choices ?? prev.choices ?? Object.fromEntries(Object.entries(autoChoice).map(([k, v]) => [k, [v]])),
frontend/src/components/ReviewForm.tsx:77:  );
frontend/src/components/ReviewForm.tsx:78:  const [ratings] = useState<Record<string, number>>(restoredDraft?.ratings ?? prev.ratings ?? {});
frontend/src/components/ReviewForm.tsx:79:  const [price, setPrice] = useState<string>(restoredDraft?.price ?? (prev.price ? String(prev.price) : ''));
frontend/src/components/ReviewForm.tsx:80:  const [visitDate, setVisitDate] = useState(restoredDraft?.visitDate ?? prev.visitDate ?? new Date().toISOString().slice(0, 10));
frontend/src/components/ReviewForm.tsx:81:  const [photoUrls, setPhotoUrls] = useState<string[]>(() => [
frontend/src/components/ReviewForm.tsx:82:    ...new Set([
frontend/src/components/ReviewForm.tsx:83:      ...(restoredDraft?.photoUrls ?? existing?.photoUrls ?? []),
frontend/src/components/ReviewForm.tsx:84:      ...(initialPhotoUrls ?? []),
frontend/src/components/ReviewForm.tsx:85:    ]),
frontend/src/components/ReviewForm.tsx:86:  ]);
frontend/src/components/ReviewForm.tsx:87:  const [videoUrls, setVideoUrls] = useState<string[]>(restoredDraft?.videoUrls ?? existing?.videoUrls ?? []);
frontend/src/components/ReviewForm.tsx:88:  const [busy, setBusy] = useState(false);
frontend/src/components/ReviewForm.tsx:89:  const busyRef = useRef(false); // sync re-entry guard: iOS ghost-taps beat setState
frontend/src/components/ReviewForm.tsx:90:  // the form is a bottom sheet — pull-down closes it, same as feed posts
frontend/src/components/ReviewForm.tsx:91:  const sheetRef = useRef<HTMLDivElement>(null);
frontend/src/components/ReviewForm.tsx:92:  const onCloseRef = useRef(onClose);
frontend/src/components/ReviewForm.tsx:93:  onCloseRef.current = onClose;
frontend/src/components/ReviewForm.tsx:94:  const hasUnsavedTextRef = useRef(false);
frontend/src/components/ReviewForm.tsx:95:  hasUnsavedTextRef.current = text.trim() !== (existing?.text ?? '').trim();
frontend/src/components/ReviewForm.tsx:96:  const canClose = useCallback(() => {
frontend/src/components/ReviewForm.tsx:97:    if (busyRef.current) return false;
frontend/src/components/ReviewForm.tsx:98:    return !hasUnsavedTextRef.current || window.confirm('В отзыве есть несохранённый текст. Выйти? Черновик останется на этом устройстве.');
frontend/src/components/ReviewForm.tsx:99:  }, []);
frontend/src/components/ReviewForm.tsx:100:  const closeNow = useCallback(() => onCloseRef.current(), []);
frontend/src/components/ReviewForm.tsx:101:  const requestClose = useCallback(() => {
frontend/src/components/ReviewForm.tsx:102:    if (canClose()) closeNow();
frontend/src/components/ReviewForm.tsx:103:  }, [canClose, closeNow]);
frontend/src/components/ReviewForm.tsx:104:  useSwipeDismiss(sheetRef, closeNow, { canDismiss: canClose });
frontend/src/components/ReviewForm.tsx:105:  // story slides pre-compose WHILE the user types — so the editor opens the
frontend/src/components/ReviewForm.tsx:106:  // instant they hit «Опубликовать» instead of seconds later (or never)
frontend/src/components/ReviewForm.tsx:107:  const slides = useRef(new Map<string, string>());
frontend/src/components/ReviewForm.tsx:108:  const precompose = (url: string) => {
frontend/src/components/ReviewForm.tsx:109:    composeStoryImage(url).then((s) => { if (s) slides.current.set(url, s); }).catch(() => {});
frontend/src/components/ReviewForm.tsx:110:  };
frontend/src/components/ReviewForm.tsx:111:  const [error, setError] = useState<string | null>(null);
frontend/src/components/ReviewForm.tsx:112:  const [canRetrySave, setCanRetrySave] = useState(false);
frontend/src/components/ReviewForm.tsx:114:  // tag friends (Untappd-style) — people you follow
frontend/src/components/ReviewForm.tsx:115:  const [following, setFollowing] = useState<PublicUser[]>([]);
frontend/src/components/ReviewForm.tsx:116:  const [tagged, setTagged] = useState<string[]>(
frontend/src/components/ReviewForm.tsx:117:    restoredDraft?.tagged ?? (prev.taggedUsers ?? []).map((u: any) => u.id),
frontend/src/components/ReviewForm.tsx:118:  );
frontend/src/components/ReviewForm.tsx:119:  useEffect(() => {
frontend/src/components/ReviewForm.tsx:120:    api.myFollowing().then(setFollowing).catch(() => {});
frontend/src/components/ReviewForm.tsx:121:  }, []);
frontend/src/components/ReviewForm.tsx:122:  const toggleTag = (id: string) =>
frontend/src/components/ReviewForm.tsx:123:    setTagged((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
frontend/src/components/ReviewForm.tsx:125:  const showDate = tpl.id === 'dish' || tpl.id === 'place' || tpl.id === 'steak';
frontend/src/components/ReviewForm.tsx:126:  useEscClose(requestClose);
frontend/src/components/ReviewForm.tsx:128:  // Keep the user's work after every field change. Uploaded media are URLs, so
frontend/src/components/ReviewForm.tsx:129:  // the complete draft is small enough for localStorage and can survive a WebView restart.
frontend/src/components/ReviewForm.tsx:130:  useEffect(() => {
frontend/src/components/ReviewForm.tsx:131:    try {
frontend/src/components/ReviewForm.tsx:132:      const draft: ReviewDraft = { rating, text, choices, ratings, price, visitDate, photoUrls, videoUrls, tagged };
frontend/src/components/ReviewForm.tsx:133:      localStorage.setItem(draftKey, JSON.stringify(draft));
frontend/src/components/ReviewForm.tsx:134:    } catch {
frontend/src/components/ReviewForm.tsx:135:      // Storage may be unavailable in a locked-down WebView; saving the review still works.
frontend/src/components/ReviewForm.tsx:136:    }
frontend/src/components/ReviewForm.tsx:137:  }, [draftKey, rating, text, choices, ratings, price, visitDate, photoUrls, videoUrls, tagged]);
frontend/src/components/ReviewForm.tsx:139:  const pickChoice = (key: string, opt: string, multi?: boolean) => {
frontend/src/components/ReviewForm.tsx:140:    setChoices((c) => {
frontend/src/components/ReviewForm.tsx:141:      const cur = c[key] ?? [];
frontend/src/components/ReviewForm.tsx:142:      if (multi) {
frontend/src/components/ReviewForm.tsx:143:        return { ...c, [key]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
frontend/src/components/ReviewForm.tsx:144:      }
frontend/src/components/ReviewForm.tsx:145:      return { ...c, [key]: cur[0] === opt ? [] : [opt] };
frontend/src/components/ReviewForm.tsx:146:    });
frontend/src/components/ReviewForm.tsx:147:  };
frontend/src/components/ReviewForm.tsx:149:  async function addPhotos(files: FileList | null) {
frontend/src/components/ReviewForm.tsx:150:    if (!files) return;
frontend/src/components/ReviewForm.tsx:151:    if (busyRef.current) return;
frontend/src/components/ReviewForm.tsx:152:    busyRef.current = true;
frontend/src/components/ReviewForm.tsx:153:    setBusy(true);
frontend/src/components/ReviewForm.tsx:154:    setError(null);
frontend/src/components/ReviewForm.tsx:155:    setCanRetrySave(false);
frontend/src/components/ReviewForm.tsx:156:    try {
frontend/src/components/ReviewForm.tsx:157:      const urls = await Promise.all(Array.from(files).map((f) => api.upload(f)));
frontend/src/components/ReviewForm.tsx:158:      setPhotoUrls((p) => [...p, ...urls]);
frontend/src/components/ReviewForm.tsx:159:      urls.slice(0, 2).forEach(precompose); // stories use the first two photos
frontend/src/components/ReviewForm.tsx:160:    } catch {
frontend/src/components/ReviewForm.tsx:161:      setError('Не удалось загрузить фото');
frontend/src/components/ReviewForm.tsx:162:      setCanRetrySave(false);
frontend/src/components/ReviewForm.tsx:163:    } finally {
frontend/src/components/ReviewForm.tsx:164:      busyRef.current = false;
frontend/src/components/ReviewForm.tsx:165:      setBusy(false);
frontend/src/components/ReviewForm.tsx:166:    }
frontend/src/components/ReviewForm.tsx:167:  }
frontend/src/components/ReviewForm.tsx:168:  async function save() {
frontend/src/components/ReviewForm.tsx:169:    // iOS can ghost-fire a second tap before the disabled state re-renders —
frontend/src/components/ReviewForm.tsx:170:    // that double-ran the whole save (and opened the story editor twice)
frontend/src/components/ReviewForm.tsx:171:    if (busyRef.current) return;
frontend/src/components/ReviewForm.tsx:172:    busyRef.current = true;
frontend/src/components/ReviewForm.tsx:173:    setBusy(true);
frontend/src/components/ReviewForm.tsx:174:    setError(null);
frontend/src/components/ReviewForm.tsx:175:    setCanRetrySave(false);
frontend/src/components/ReviewForm.tsx:176:    let saved: Review;
frontend/src/components/ReviewForm.tsx:177:    try {
frontend/src/components/ReviewForm.tsx:178:      const venueId = venue?.id ?? (prev.venueId as string | undefined);
frontend/src/components/ReviewForm.tsx:179:      // pending place (no id yet) → store its name so the card can show it now
frontend/src/components/ReviewForm.tsx:180:      const venueName = !venueId ? (venue?.name ?? (prev.venueName as string | undefined)) : undefined;
frontend/src/components/ReviewForm.tsx:181:      const priceNum = price ? Math.max(0, Math.round(Number(price))) : 0;
frontend/src/components/ReviewForm.tsx:182:      const taggedUsers = following
frontend/src/components/ReviewForm.tsx:183:        .filter((u) => tagged.includes(u.id))
frontend/src/components/ReviewForm.tsx:184:        .map((u) => ({ id: u.id, name: u.firstName ?? u.username ?? 'Гость' }));
frontend/src/components/ReviewForm.tsx:185:      const attributes: Record<string, any> = {
frontend/src/components/ReviewForm.tsx:186:        template: tpl.id,
frontend/src/components/ReviewForm.tsx:187:        choices,
frontend/src/components/ReviewForm.tsx:188:        ratings,
frontend/src/components/ReviewForm.tsx:189:        ...(venueId ? { venueId } : {}),
frontend/src/components/ReviewForm.tsx:190:        ...(venueName ? { venueName } : {}),
frontend/src/components/ReviewForm.tsx:191:        ...(priceNum ? { price: priceNum } : {}),
frontend/src/components/ReviewForm.tsx:192:        ...(showDate ? { visitDate } : {}),
frontend/src/components/ReviewForm.tsx:193:        ...(taggedUsers.length ? { taggedUsers } : {}),
frontend/src/components/ReviewForm.tsx:194:      };
frontend/src/components/ReviewForm.tsx:195:      saved = await api.createReview(listing.id, { rating, text, attributes, photoUrls, videoUrls });
frontend/src/components/ReviewForm.tsx:196:    } catch (saveError) {
frontend/src/components/ReviewForm.tsx:197:      setError(saveError instanceof Error && saveError.message
frontend/src/components/ReviewForm.tsx:198:        ? saveError.message
frontend/src/components/ReviewForm.tsx:199:        : 'Не удалось сохранить. Черновик сохранён — нажмите «Повторить».');
frontend/src/components/ReviewForm.tsx:200:      setCanRetrySave(true);
frontend/src/components/ReviewForm.tsx:201:      busyRef.current = false;
frontend/src/components/ReviewForm.tsx:202:      setBusy(false);
frontend/src/components/ReviewForm.tsx:203:      return;
frontend/src/components/ReviewForm.tsx:204:    }
frontend/src/components/ReviewForm.tsx:205:    // A response means the idempotent upsert is durable. Clear the draft before
frontend/src/components/ReviewForm.tsx:206:    // invoking UI/story callbacks so an unrelated callback failure cannot cause a retry prompt.
frontend/src/components/ReviewForm.tsx:207:    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
frontend/src/components/ReviewForm.tsx:208:    busyRef.current = false;
frontend/src/components/ReviewForm.tsx:209:    setBusy(false);
frontend/src/components/ReviewForm.tsx:210:    try {
frontend/src/components/ReviewForm.tsx:211:      onSaved({ photo: photoUrls[0], photos: photoUrls, video: videoUrls[0], text: text.trim() || undefined, slides: Object.fromEntries(slides.current), review: saved });
frontend/src/components/ReviewForm.tsx:212:    } catch (callbackError) {
frontend/src/components/ReviewForm.tsx:213:      // The review is already saved; never mislabel a story/UI callback failure as data loss.
frontend/src/components/ReviewForm.tsx:214:      console.error('Post-save callback failed', callbackError);
frontend/src/components/ReviewForm.tsx:215:      closeNow();
frontend/src/components/ReviewForm.tsx:216:    }
frontend/src/components/ReviewForm.tsx:217:  }
frontend/src/components/ReviewForm.tsx:219:  return (
frontend/src/components/ReviewForm.tsx:220:    <div
frontend/src/components/ReviewForm.tsx:221:      className="modal-backdrop"
frontend/src/components/ReviewForm.tsx:222:      style={{ zIndex: 3000 }}
frontend/src/components/ReviewForm.tsx:223:      onClick={(e) => {
frontend/src/components/ReviewForm.tsx:224:        e.stopPropagation();
frontend/src/components/ReviewForm.tsx:225:        requestClose();
frontend/src/components/ReviewForm.tsx:226:      }}
frontend/src/components/ReviewForm.tsx:227:    >
frontend/src/components/ReviewForm.tsx:228:      <div className="modal" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
frontend/src/components/ReviewForm.tsx:229:        <h3>{listing.name}</h3>
frontend/src/components/ReviewForm.tsx:230:        {venue && (
frontend/src/components/ReviewForm.tsx:231:          <div className="meta" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
frontend/src/components/ReviewForm.tsx:232:            📍 {venue.name}
frontend/src/components/ReviewForm.tsx:233:            {venue.pending ? ' · на модерации' : ''}
frontend/src/components/ReviewForm.tsx:234:          </div>
frontend/src/components/ReviewForm.tsx:235:        )}
frontend/src/components/ReviewForm.tsx:236:        <div className="meta" style={{ color: 'var(--hint)', fontSize: 13 }}>{tpl.title}</div>
frontend/src/components/ReviewForm.tsx:237:        <div className="geo-note" style={{ marginTop: 10 }}>
frontend/src/components/ReviewForm.tsx:238:          <span style={{ color: 'var(--hint)' }}>🛡 Отзыв появится после быстрой проверки модератором</span>
frontend/src/components/ReviewForm.tsx:239:        </div>
frontend/src/components/ReviewForm.tsx:241:        {/* note + photo right at the top (Untappd-style) */}
frontend/src/components/ReviewForm.tsx:242:        <div className="field note-top">
frontend/src/components/ReviewForm.tsx:243:          <div className="note-row">
frontend/src/components/ReviewForm.tsx:244:            <textarea
frontend/src/components/ReviewForm.tsx:245:              className="note-area"
frontend/src/components/ReviewForm.tsx:246:              value={text}
frontend/src/components/ReviewForm.tsx:247:              onChange={(e) => setText(e.target.value)}
frontend/src/components/ReviewForm.tsx:248:              placeholder="Как вам? Оставьте заметку…"
frontend/src/components/ReviewForm.tsx:249:            />
frontend/src/components/ReviewForm.tsx:250:            <label className="photo-box">
frontend/src/components/ReviewForm.tsx:251:              <svg className="photo-box-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
frontend/src/components/ReviewForm.tsx:252:                <rect x="3" y="4" width="18" height="16" rx="3" />
frontend/src/components/ReviewForm.tsx:253:                <circle cx="8.5" cy="9.5" r="1.6" />
frontend/src/components/ReviewForm.tsx:254:                <path d="M21 16.5l-4.5-4.5L9 19.5" />
frontend/src/components/ReviewForm.tsx:255:              </svg>
frontend/src/components/ReviewForm.tsx:256:              <span className="photo-box-label">Добавить фото</span>
frontend/src/components/ReviewForm.tsx:257:              <input type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
frontend/src/components/ReviewForm.tsx:258:            </label>
frontend/src/components/ReviewForm.tsx:259:          </div>
frontend/src/components/ReviewForm.tsx:260:          {/* video upload removed (owner rule 13.07.2026) — photos only */}
frontend/src/components/ReviewForm.tsx:261:          {(photoUrls.length > 0 || videoUrls.length > 0) && (
frontend/src/components/ReviewForm.tsx:262:            <div className="photo-thumbs">
frontend/src/components/ReviewForm.tsx:263:              {photoUrls.map((u) => (
frontend/src/components/ReviewForm.tsx:264:                <div key={u} className="thumb-wrap">
frontend/src/components/ReviewForm.tsx:265:                  <img src={u} alt="" />
frontend/src/components/ReviewForm.tsx:266:                  <button
frontend/src/components/ReviewForm.tsx:267:                    type="button"
frontend/src/components/ReviewForm.tsx:268:                    className="thumb-del"
frontend/src/components/ReviewForm.tsx:269:                    aria-label="Удалить фото"
frontend/src/components/ReviewForm.tsx:270:                    onClick={() => setPhotoUrls((p) => p.filter((x) => x !== u))}
frontend/src/components/ReviewForm.tsx:271:                  >
frontend/src/components/ReviewForm.tsx:272:                    ×
frontend/src/components/ReviewForm.tsx:273:                  </button>
frontend/src/components/ReviewForm.tsx:274:                </div>
frontend/src/components/ReviewForm.tsx:275:              ))}
frontend/src/components/ReviewForm.tsx:276:              {videoUrls.map((u) => (
frontend/src/components/ReviewForm.tsx:277:                <div key={u} className="thumb-wrap">
frontend/src/components/ReviewForm.tsx:278:                  <video src={u} muted playsInline />
frontend/src/components/ReviewForm.tsx:279:                  <button
frontend/src/components/ReviewForm.tsx:280:                    type="button"
frontend/src/components/ReviewForm.tsx:281:                    className="thumb-del"
frontend/src/components/ReviewForm.tsx:282:                    aria-label="Удалить видео"
frontend/src/components/ReviewForm.tsx:283:                    onClick={() => setVideoUrls((p) => p.filter((x) => x !== u))}
frontend/src/components/ReviewForm.tsx:284:                  >
frontend/src/components/ReviewForm.tsx:285:                    ×
frontend/src/components/ReviewForm.tsx:286:                  </button>
frontend/src/components/ReviewForm.tsx:287:                </div>
frontend/src/components/ReviewForm.tsx:288:              ))}
frontend/src/components/ReviewForm.tsx:289:            </div>
frontend/src/components/ReviewForm.tsx:290:          )}
frontend/src/components/ReviewForm.tsx:291:        </div>
frontend/src/components/ReviewForm.tsx:293:        <div className="field">
frontend/src/components/ReviewForm.tsx:294:          <label>Общая оценка</label>
frontend/src/components/ReviewForm.tsx:295:          <StarInput value={rating} onChange={setRating} />
frontend/src/components/ReviewForm.tsx:296:          <span style={{ marginLeft: 10, fontWeight: 700 }}>{rating.toFixed(1)}</span>
frontend/src/components/ReviewForm.tsx:297:        </div>
frontend/src/components/ReviewForm.tsx:299:        {/* expert select fields (grape variety, coffee kind, additives, cut…)
frontend/src/components/ReviewForm.tsx:300:            — skip a question the item already answers (e.g. it IS "Капучино") */}
frontend/src/components/ReviewForm.tsx:301:        {tpl.choices.filter((ch) => !autoChoice[ch.key]).map((ch) => (
frontend/src/components/ReviewForm.tsx:302:          <div className="field" key={ch.key}>
frontend/src/components/ReviewForm.tsx:303:            <label>
frontend/src/components/ReviewForm.tsx:304:              {ch.label}
frontend/src/components/ReviewForm.tsx:305:              {ch.multi ? ' (можно несколько)' : ''}
frontend/src/components/ReviewForm.tsx:306:            </label>
frontend/src/components/ReviewForm.tsx:307:            <div className="chips scroll-row">
frontend/src/components/ReviewForm.tsx:308:              {ch.options.map((opt) => {
frontend/src/components/ReviewForm.tsx:309:                const active = (choices[ch.key] ?? []).includes(opt);
frontend/src/components/ReviewForm.tsx:310:                return (
frontend/src/components/ReviewForm.tsx:311:                  <button
frontend/src/components/ReviewForm.tsx:312:                    key={opt}
frontend/src/components/ReviewForm.tsx:313:                    className={'chip' + (active ? ' active' : '')}
frontend/src/components/ReviewForm.tsx:314:                    onClick={() => pickChoice(ch.key, opt, ch.multi)}
frontend/src/components/ReviewForm.tsx:315:                  >
frontend/src/components/ReviewForm.tsx:316:                    {opt}
frontend/src/components/ReviewForm.tsx:317:                  </button>
frontend/src/components/ReviewForm.tsx:318:                );
frontend/src/components/ReviewForm.tsx:319:              })}
frontend/src/components/ReviewForm.tsx:320:            </div>
frontend/src/components/ReviewForm.tsx:321:          </div>
frontend/src/components/ReviewForm.tsx:322:        ))}
frontend/src/components/ReviewForm.tsx:324:        {/* tag friends you were with (people you follow) */}
frontend/src/components/ReviewForm.tsx:325:        {following.length > 0 && (
frontend/src/components/ReviewForm.tsx:326:          <div className="field">
frontend/src/components/ReviewForm.tsx:327:            <label>👥 Отметить друзей</label>
frontend/src/components/ReviewForm.tsx:328:            <div className="chips scroll-row">
frontend/src/components/ReviewForm.tsx:329:              {following.map((u) => {
frontend/src/components/ReviewForm.tsx:330:                const name = u.firstName ?? u.username ?? 'Гость';
frontend/src/components/ReviewForm.tsx:331:                const active = tagged.includes(u.id);
frontend/src/components/ReviewForm.tsx:332:                return (
frontend/src/components/ReviewForm.tsx:333:                  <button
frontend/src/components/ReviewForm.tsx:334:                    key={u.id}
frontend/src/components/ReviewForm.tsx:335:                    className={'chip friend-chip' + (active ? ' active' : '')}
frontend/src/components/ReviewForm.tsx:336:                    onClick={() => toggleTag(u.id)}
frontend/src/components/ReviewForm.tsx:337:                  >
frontend/src/components/ReviewForm.tsx:338:                    {u.photoUrl ? (
frontend/src/components/ReviewForm.tsx:339:                      <img className="friend-chip-ava" src={u.photoUrl} alt="" />
frontend/src/components/ReviewForm.tsx:340:                    ) : (
frontend/src/components/ReviewForm.tsx:341:                      <span className="friend-chip-ava ph">{name[0]?.toUpperCase() ?? '?'}</span>
frontend/src/components/ReviewForm.tsx:342:                    )}
frontend/src/components/ReviewForm.tsx:343:                    {name}
frontend/src/components/ReviewForm.tsx:344:                  </button>
frontend/src/components/ReviewForm.tsx:345:                );
frontend/src/components/ReviewForm.tsx:346:              })}
frontend/src/components/ReviewForm.tsx:347:            </div>
frontend/src/components/ReviewForm.tsx:348:          </div>
frontend/src/components/ReviewForm.tsx:349:        )}
frontend/src/components/ReviewForm.tsx:351:        {/* price already known for this item at this venue → don't ask again */}
frontend/src/components/ReviewForm.tsx:352:        {knownPrice == null && (
frontend/src/components/ReviewForm.tsx:353:          <div className="field">
frontend/src/components/ReviewForm.tsx:354:            <label>Чек, ₽ (необязательно)</label>
frontend/src/components/ReviewForm.tsx:355:            <input
frontend/src/components/ReviewForm.tsx:356:              type="number"
frontend/src/components/ReviewForm.tsx:357:              inputMode="numeric"
frontend/src/components/ReviewForm.tsx:358:              placeholder="напр. 350"
frontend/src/components/ReviewForm.tsx:359:              max={100000}
frontend/src/components/ReviewForm.tsx:360:              value={price}
frontend/src/components/ReviewForm.tsx:361:              onChange={(e) => {
frontend/src/components/ReviewForm.tsx:362:                // cap at 100 000 ₽ — no "1000000 ₽" typos in the catalog
frontend/src/components/ReviewForm.tsx:363:                const n = Math.min(100000, Math.max(0, Number(e.target.value) || 0));
frontend/src/components/ReviewForm.tsx:364:                setPrice(e.target.value === '' ? '' : String(n));
frontend/src/components/ReviewForm.tsx:365:              }}
frontend/src/components/ReviewForm.tsx:366:            />
frontend/src/components/ReviewForm.tsx:367:            <span className="meta" style={{ color: 'var(--hint)', fontSize: 12 }}>
frontend/src/components/ReviewForm.tsx:368:              Появится в меню заведения после проверки модератором.
frontend/src/components/ReviewForm.tsx:369:            </span>
frontend/src/components/ReviewForm.tsx:370:          </div>
frontend/src/components/ReviewForm.tsx:371:        )}
frontend/src/components/ReviewForm.tsx:373:        {showDate && (
frontend/src/components/ReviewForm.tsx:374:          <div className="field">
frontend/src/components/ReviewForm.tsx:375:            <label>Дата визита</label>
frontend/src/components/ReviewForm.tsx:376:            {/* tap anywhere on the field → open the native calendar (not just the icon) */}
frontend/src/components/ReviewForm.tsx:377:            <input
frontend/src/components/ReviewForm.tsx:378:              type="date"
frontend/src/components/ReviewForm.tsx:379:              className="date-input"
frontend/src/components/ReviewForm.tsx:380:              value={visitDate}
frontend/src/components/ReviewForm.tsx:381:              onChange={(e) => setVisitDate(e.target.value)}
frontend/src/components/ReviewForm.tsx:382:              onClick={(e) => {
frontend/src/components/ReviewForm.tsx:383:                const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
frontend/src/components/ReviewForm.tsx:384:                try { el.showPicker?.(); } catch { /* not supported → native focus */ }
frontend/src/components/ReviewForm.tsx:385:              }}
frontend/src/components/ReviewForm.tsx:386:            />
frontend/src/components/ReviewForm.tsx:387:          </div>
frontend/src/components/ReviewForm.tsx:388:        )}
frontend/src/components/ReviewForm.tsx:390:        {error && (
frontend/src/components/ReviewForm.tsx:391:          <div style={{ marginTop: 10 }}>
frontend/src/components/ReviewForm.tsx:392:            <p style={{ color: 'crimson', fontSize: 13, margin: '0 0 8px' }}>{error}</p>
frontend/src/components/ReviewForm.tsx:393:            {canRetrySave && (
frontend/src/components/ReviewForm.tsx:394:              <button className="btn secondary" type="button" onClick={save} disabled={busy}>
frontend/src/components/ReviewForm.tsx:395:                Повторить
frontend/src/components/ReviewForm.tsx:396:              </button>
frontend/src/components/ReviewForm.tsx:397:            )}
frontend/src/components/ReviewForm.tsx:398:          </div>
frontend/src/components/ReviewForm.tsx:399:        )}
frontend/src/components/ReviewForm.tsx:400:        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
frontend/src/components/ReviewForm.tsx:401:          <button className="btn secondary" onClick={requestClose} disabled={busy}>
frontend/src/components/ReviewForm.tsx:402:            Отмена
frontend/src/components/ReviewForm.tsx:403:          </button>
frontend/src/components/ReviewForm.tsx:404:          <button className="btn" onClick={save} disabled={busy}>
frontend/src/components/ReviewForm.tsx:405:            {busy ? 'Сохранение…' : 'Опубликовать'}
frontend/src/components/ReviewForm.tsx:406:          </button>
frontend/src/components/ReviewForm.tsx:407:        </div>
frontend/src/components/ReviewForm.tsx:408:      </div>
frontend/src/components/ReviewForm.tsx:409:    </div>
frontend/src/components/ReviewForm.tsx:410:  );
frontend/src/components/ReviewForm.tsx:411:}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/components/ReviewForm.tsx'; "'$c=Get-Content -Encoding utf8 $f; for($i=1;$i -le 220;$i++){"$i`:$($c[$i-1])"}; rg -n "." frontend/src/components/VenuePicker.tsx frontend/src/components/CommentsModal.tsx' in D:\Приложения\Yelp
 succeeded in 819ms:
1:import { useCallback, useEffect, useState, useRef } from 'react';
2:import { api } from '../api';
3:import { composeStoryImage } from '../storyImage';
4:import { useSwipeDismiss } from '../swipeDismiss';
5:import { useEscClose } from '../modalEsc';
6:import type { Listing, PublicUser, Review } from '../types';
7:import { StarInput } from './StarInput';
8:import { templateFor } from '../tasting';
9:
10:export type ReviewSavedMedia = {
11:  photo?: string;
12:  photos?: string[];
13:  video?: string;
14:  text?: string;
15:  slides?: Record<string, string>;
16:  review?: Review;
17:};
18:
19:type ReviewDraft = {
20:  rating: number;
21:  text: string;
22:  choices: Record<string, string[]>;
23:  ratings: Record<string, number>;
24:  price: string;
25:  visitDate: string;
26:  photoUrls: string[];
27:  videoUrls: string[];
28:  tagged: string[];
29:};
30:
31:function readDraft(key: string): Partial<ReviewDraft> | null {
32:  try {
33:    const value = JSON.parse(localStorage.getItem(key) || 'null');
34:    return value && typeof value === 'object' ? value : null;
35:  } catch {
36:    return null;
37:  }
38:}
39:
40:export function ReviewForm({
41:  listing,
42:  venue,
43:  existing,
44:  initialRating,
45:  initialPhotoUrls,
46:  knownPrice,
47:  onClose,
48:  onSaved,
49:}: {
50:  listing: Listing;
51:  venue?: { id?: string; name: string; pending?: boolean } | null;
52:  existing?: Review;
53:  initialRating?: number;
54:  initialPhotoUrls?: string[]; // e.g. the photo the user just scanned — prefilled
55:  knownPrice?: number | null; // item already has a price here → don't ask for it
56:  onClose: () => void;
57:  onSaved: (media?: ReviewSavedMedia) => void;
58:}) {
59:  const tpl = templateFor(listing);
60:  const prev = (existing?.attributes ?? {}) as Record<string, any>;
61:  const draftKey = `reviewDraft:v1:${listing.id}:${existing?.id ?? 'new'}`;
62:  const [restoredDraft] = useState(() => readDraft(draftKey));
63:
64:  // if the item already IS a specific option (e.g. "Капучино"), pre-fill that
65:  // choice and hide the question — no point asking the kind again.
66:  const normName = listing.name.toLowerCase().replace(/[\s-]/g, '');
67:  const autoChoice: Record<string, string> = {};
68:  for (const ch of tpl.choices) {
69:    const m = ch.options.find((o) => o.toLowerCase().replace(/[\s-]/g, '') === normName);
70:    if (m) autoChoice[ch.key] = m;
71:  }
72:
73:  const [rating, setRating] = useState(restoredDraft?.rating ?? existing?.rating ?? initialRating ?? 5);
74:  const [text, setText] = useState(restoredDraft?.text ?? existing?.text ?? '');
75:  const [choices, setChoices] = useState<Record<string, string[]>>(
76:    restoredDraft?.choices ?? prev.choices ?? Object.fromEntries(Object.entries(autoChoice).map(([k, v]) => [k, [v]])),
77:  );
78:  const [ratings] = useState<Record<string, number>>(restoredDraft?.ratings ?? prev.ratings ?? {});
79:  const [price, setPrice] = useState<string>(restoredDraft?.price ?? (prev.price ? String(prev.price) : ''));
80:  const [visitDate, setVisitDate] = useState(restoredDraft?.visitDate ?? prev.visitDate ?? new Date().toISOString().slice(0, 10));
81:  const [photoUrls, setPhotoUrls] = useState<string[]>(() => [
82:    ...new Set([
83:      ...(restoredDraft?.photoUrls ?? existing?.photoUrls ?? []),
84:      ...(initialPhotoUrls ?? []),
85:    ]),
86:  ]);
87:  const [videoUrls, setVideoUrls] = useState<string[]>(restoredDraft?.videoUrls ?? existing?.videoUrls ?? []);
88:  const [busy, setBusy] = useState(false);
89:  const busyRef = useRef(false); // sync re-entry guard: iOS ghost-taps beat setState
90:  // the form is a bottom sheet — pull-down closes it, same as feed posts
91:  const sheetRef = useRef<HTMLDivElement>(null);
92:  const onCloseRef = useRef(onClose);
93:  onCloseRef.current = onClose;
94:  const hasUnsavedTextRef = useRef(false);
95:  hasUnsavedTextRef.current = text.trim() !== (existing?.text ?? '').trim();
96:  const canClose = useCallback(() => {
97:    if (busyRef.current) return false;
98:    return !hasUnsavedTextRef.current || window.confirm('В отзыве есть несохранённый текст. Выйти? Черновик останется на этом устройстве.');
99:  }, []);
100:  const closeNow = useCallback(() => onCloseRef.current(), []);
101:  const requestClose = useCallback(() => {
102:    if (canClose()) closeNow();
103:  }, [canClose, closeNow]);
104:  useSwipeDismiss(sheetRef, closeNow, { canDismiss: canClose });
105:  // story slides pre-compose WHILE the user types — so the editor opens the
106:  // instant they hit «Опубликовать» instead of seconds later (or never)
107:  const slides = useRef(new Map<string, string>());
108:  const precompose = (url: string) => {
109:    composeStoryImage(url).then((s) => { if (s) slides.current.set(url, s); }).catch(() => {});
110:  };
111:  const [error, setError] = useState<string | null>(null);
112:  const [canRetrySave, setCanRetrySave] = useState(false);
113:
114:  // tag friends (Untappd-style) — people you follow
115:  const [following, setFollowing] = useState<PublicUser[]>([]);
116:  const [tagged, setTagged] = useState<string[]>(
117:    restoredDraft?.tagged ?? (prev.taggedUsers ?? []).map((u: any) => u.id),
118:  );
119:  useEffect(() => {
120:    api.myFollowing().then(setFollowing).catch(() => {});
121:  }, []);
122:  const toggleTag = (id: string) =>
123:    setTagged((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
124:
125:  const showDate = tpl.id === 'dish' || tpl.id === 'place' || tpl.id === 'steak';
126:  useEscClose(requestClose);
127:
128:  // Keep the user's work after every field change. Uploaded media are URLs, so
129:  // the complete draft is small enough for localStorage and can survive a WebView restart.
130:  useEffect(() => {
131:    try {
132:      const draft: ReviewDraft = { rating, text, choices, ratings, price, visitDate, photoUrls, videoUrls, tagged };
133:      localStorage.setItem(draftKey, JSON.stringify(draft));
134:    } catch {
135:      // Storage may be unavailable in a locked-down WebView; saving the review still works.
136:    }
137:  }, [draftKey, rating, text, choices, ratings, price, visitDate, photoUrls, videoUrls, tagged]);
138:
139:  const pickChoice = (key: string, opt: string, multi?: boolean) => {
140:    setChoices((c) => {
141:      const cur = c[key] ?? [];
142:      if (multi) {
143:        return { ...c, [key]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
144:      }
145:      return { ...c, [key]: cur[0] === opt ? [] : [opt] };
146:    });
147:  };
148:
149:  async function addPhotos(files: FileList | null) {
150:    if (!files) return;
151:    if (busyRef.current) return;
152:    busyRef.current = true;
153:    setBusy(true);
154:    setError(null);
155:    setCanRetrySave(false);
156:    try {
157:      const urls = await Promise.all(Array.from(files).map((f) => api.upload(f)));
158:      setPhotoUrls((p) => [...p, ...urls]);
159:      urls.slice(0, 2).forEach(precompose); // stories use the first two photos
160:    } catch {
161:      setError('Не удалось загрузить фото');
162:      setCanRetrySave(false);
163:    } finally {
164:      busyRef.current = false;
165:      setBusy(false);
166:    }
167:  }
168:  async function save() {
169:    // iOS can ghost-fire a second tap before the disabled state re-renders —
170:    // that double-ran the whole save (and opened the story editor twice)
171:    if (busyRef.current) return;
172:    busyRef.current = true;
173:    setBusy(true);
174:    setError(null);
175:    setCanRetrySave(false);
176:    let saved: Review;
177:    try {
178:      const venueId = venue?.id ?? (prev.venueId as string | undefined);
179:      // pending place (no id yet) → store its name so the card can show it now
180:      const venueName = !venueId ? (venue?.name ?? (prev.venueName as string | undefined)) : undefined;
181:      const priceNum = price ? Math.max(0, Math.round(Number(price))) : 0;
182:      const taggedUsers = following
183:        .filter((u) => tagged.includes(u.id))
184:        .map((u) => ({ id: u.id, name: u.firstName ?? u.username ?? 'Гость' }));
185:      const attributes: Record<string, any> = {
186:        template: tpl.id,
187:        choices,
188:        ratings,
189:        ...(venueId ? { venueId } : {}),
190:        ...(venueName ? { venueName } : {}),
191:        ...(priceNum ? { price: priceNum } : {}),
192:        ...(showDate ? { visitDate } : {}),
193:        ...(taggedUsers.length ? { taggedUsers } : {}),
194:      };
195:      saved = await api.createReview(listing.id, { rating, text, attributes, photoUrls, videoUrls });
196:    } catch (saveError) {
197:      setError(saveError instanceof Error && saveError.message
198:        ? saveError.message
199:        : 'Не удалось сохранить. Черновик сохранён — нажмите «Повторить».');
200:      setCanRetrySave(true);
201:      busyRef.current = false;
202:      setBusy(false);
203:      return;
204:    }
205:    // A response means the idempotent upsert is durable. Clear the draft before
206:    // invoking UI/story callbacks so an unrelated callback failure cannot cause a retry prompt.
207:    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
208:    busyRef.current = false;
209:    setBusy(false);
210:    try {
211:      onSaved({ photo: photoUrls[0], photos: photoUrls, video: videoUrls[0], text: text.trim() || undefined, slides: Object.fromEntries(slides.current), review: saved });
212:    } catch (callbackError) {
213:      // The review is already saved; never mislabel a story/UI callback failure as data loss.
214:      console.error('Post-save callback failed', callbackError);
215:      closeNow();
216:    }
217:  }
218:
219:  return (
220:    <div
frontend/src/components/VenuePicker.tsx:1:import { useEffect, useState } from 'react';
frontend/src/components/VenuePicker.tsx:2:import { api } from '../api';
frontend/src/components/VenuePicker.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src/components/VenuePicker.tsx:4:import type { Listing } from '../types';
frontend/src/components/VenuePicker.tsx:6:// collapse chain branches into one row ("Бургер Кинг" once, not 7×)
frontend/src/components/VenuePicker.tsx:7:function dedupeChains(list: Listing[]): (Listing & { branchCount?: number })[] {
frontend/src/components/VenuePicker.tsx:8:  const groups = new Map<string, Listing & { branchCount?: number }>();
frontend/src/components/VenuePicker.tsx:9:  for (const v of list) {
frontend/src/components/VenuePicker.tsx:10:    const key = (v.groupKey || v.name).toLowerCase().trim();
frontend/src/components/VenuePicker.tsx:11:    const existing = groups.get(key);
frontend/src/components/VenuePicker.tsx:12:    // keep the server's chain size if it already collapsed the chain into one card
frontend/src/components/VenuePicker.tsx:13:    if (existing) existing.branchCount = (existing.branchCount ?? 1) + 1;
frontend/src/components/VenuePicker.tsx:14:    else groups.set(key, { ...v, branchCount: v.branchCount && v.branchCount > 1 ? v.branchCount : 1 });
frontend/src/components/VenuePicker.tsx:15:  }
frontend/src/components/VenuePicker.tsx:16:  return [...groups.values()];
frontend/src/components/VenuePicker.tsx:17:}
frontend/src/components/VenuePicker.tsx:19:export function VenuePicker({
frontend/src/components/VenuePicker.tsx:20:  itemId,
frontend/src/components/VenuePicker.tsx:21:  onPick,
frontend/src/components/VenuePicker.tsx:22:  onAdded,
frontend/src/components/VenuePicker.tsx:23:  onClose,
frontend/src/components/VenuePicker.tsx:24:}: {
frontend/src/components/VenuePicker.tsx:25:  itemId?: string; // when set, the default list = venues that SERVE this item
frontend/src/components/VenuePicker.tsx:26:  onPick: (venue: Listing) => void;
frontend/src/components/VenuePicker.tsx:27:  // a new (pending-moderation) place was submitted → proceed to the review form
frontend/src/components/VenuePicker.tsx:28:  onAdded?: (name: string) => void;
frontend/src/components/VenuePicker.tsx:29:  onClose: () => void;
frontend/src/components/VenuePicker.tsx:30:}) {
frontend/src/components/VenuePicker.tsx:31:  const [q, setQ] = useState('');
frontend/src/components/VenuePicker.tsx:32:  const [results, setResults] = useState<Listing[]>([]);
frontend/src/components/VenuePicker.tsx:33:  const [addMode, setAddMode] = useState(false);
frontend/src/components/VenuePicker.tsx:34:  const [name, setName] = useState('');
frontend/src/components/VenuePicker.tsx:35:  const [city, setCity] = useState('Москва');
frontend/src/components/VenuePicker.tsx:36:  const [address, setAddress] = useState('');
frontend/src/components/VenuePicker.tsx:37:  const [busy, setBusy] = useState(false);
frontend/src/components/VenuePicker.tsx:38:  const [sent, setSent] = useState(false);
frontend/src/components/VenuePicker.tsx:39:  useEscClose(onClose);
frontend/src/components/VenuePicker.tsx:41:  useEffect(() => {
frontend/src/components/VenuePicker.tsx:42:    const query = q.trim();
frontend/src/components/VenuePicker.tsx:43:    const t = setTimeout(() => {
frontend/src/components/VenuePicker.tsx:44:      // no query → venues that already SERVE this item (the honest default);
frontend/src/components/VenuePicker.tsx:45:      // typing → translit-aware search across all venues
frontend/src/components/VenuePicker.tsx:46:      (query
frontend/src/components/VenuePicker.tsx:47:        ? api.searchVenues(query)
frontend/src/components/VenuePicker.tsx:48:        : itemId
frontend/src/components/VenuePicker.tsx:49:          ? api.placesForItem(itemId).then((v) => (v.length ? v : api.listings('RESTAURANT', undefined, { take: 25 })))
frontend/src/components/VenuePicker.tsx:50:          : api.listings('RESTAURANT', undefined, { take: 25 })
frontend/src/components/VenuePicker.tsx:51:      )
frontend/src/components/VenuePicker.tsx:52:        .then(setResults)
frontend/src/components/VenuePicker.tsx:53:        .catch(() => {});
frontend/src/components/VenuePicker.tsx:54:    }, 180);
frontend/src/components/VenuePicker.tsx:55:    return () => clearTimeout(t);
frontend/src/components/VenuePicker.tsx:56:  }, [q, itemId]);
frontend/src/components/VenuePicker.tsx:58:  const startAdd = () => {
frontend/src/components/VenuePicker.tsx:59:    setName(q.trim());
frontend/src/components/VenuePicker.tsx:60:    setAddress('');
frontend/src/components/VenuePicker.tsx:61:    setAddMode(true);
frontend/src/components/VenuePicker.tsx:62:  };
frontend/src/components/VenuePicker.tsx:64:  const submit = () => {
frontend/src/components/VenuePicker.tsx:65:    if (!name.trim() || !city.trim()) return;
frontend/src/components/VenuePicker.tsx:66:    setBusy(true);
frontend/src/components/VenuePicker.tsx:67:    const placeName = name.trim();
frontend/src/components/VenuePicker.tsx:68:    api
frontend/src/components/VenuePicker.tsx:69:      .submitBusiness({
frontend/src/components/VenuePicker.tsx:70:        relationship: 'customer',
frontend/src/components/VenuePicker.tsx:71:        name: placeName,
frontend/src/components/VenuePicker.tsx:72:        city: city.trim(),
frontend/src/components/VenuePicker.tsx:73:        address: address.trim() || undefined,
frontend/src/components/VenuePicker.tsx:74:        category: 'Ресторан',
frontend/src/components/VenuePicker.tsx:75:      })
frontend/src/components/VenuePicker.tsx:76:      .then(() => {
frontend/src/components/VenuePicker.tsx:77:        // go straight to the review form — the place is pending moderation but
frontend/src/components/VenuePicker.tsx:78:        // the user can rate it now; we attach the name and link once approved.
frontend/src/components/VenuePicker.tsx:79:        if (onAdded) onAdded(placeName);
frontend/src/components/VenuePicker.tsx:80:        else setSent(true);
frontend/src/components/VenuePicker.tsx:81:      })
frontend/src/components/VenuePicker.tsx:82:      .catch(() => setBusy(false));
frontend/src/components/VenuePicker.tsx:83:  };
frontend/src/components/VenuePicker.tsx:85:  return (
frontend/src/components/VenuePicker.tsx:86:    <div
frontend/src/components/VenuePicker.tsx:87:      className="modal-backdrop"
frontend/src/components/VenuePicker.tsx:88:      style={{ zIndex: 2700 }}
frontend/src/components/VenuePicker.tsx:89:      onClick={(e) => {
frontend/src/components/VenuePicker.tsx:90:        e.stopPropagation();
frontend/src/components/VenuePicker.tsx:91:        onClose();
frontend/src/components/VenuePicker.tsx:92:      }}
frontend/src/components/VenuePicker.tsx:93:    >
frontend/src/components/VenuePicker.tsx:94:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src/components/VenuePicker.tsx:95:        {sent ? (
frontend/src/components/VenuePicker.tsx:96:          <div style={{ textAlign: 'center', padding: '12px 0' }}>
frontend/src/components/VenuePicker.tsx:97:            <div style={{ fontSize: 40 }}>✅</div>
frontend/src/components/VenuePicker.tsx:98:            <h3>Заявка отправлена</h3>
frontend/src/components/VenuePicker.tsx:99:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, margin: '8px 0 16px' }}>
frontend/src/components/VenuePicker.tsx:100:              Заведение появится после проверки модератором.
frontend/src/components/VenuePicker.tsx:101:            </p>
frontend/src/components/VenuePicker.tsx:102:            <button className="btn" onClick={onClose}>
frontend/src/components/VenuePicker.tsx:103:              Готово
frontend/src/components/VenuePicker.tsx:104:            </button>
frontend/src/components/VenuePicker.tsx:105:          </div>
frontend/src/components/VenuePicker.tsx:106:        ) : addMode ? (
frontend/src/components/VenuePicker.tsx:107:          <>
frontend/src/components/VenuePicker.tsx:108:            <h3>Добавить заведение</h3>
frontend/src/components/VenuePicker.tsx:109:            <div className="field">
frontend/src/components/VenuePicker.tsx:110:              <label>Название</label>
frontend/src/components/VenuePicker.tsx:111:              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Север" />
frontend/src/components/VenuePicker.tsx:112:            </div>
frontend/src/components/VenuePicker.tsx:113:            <div className="field">
frontend/src/components/VenuePicker.tsx:114:              <label>Город</label>
frontend/src/components/VenuePicker.tsx:115:              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" />
frontend/src/components/VenuePicker.tsx:116:            </div>
frontend/src/components/VenuePicker.tsx:117:            <div className="field">
frontend/src/components/VenuePicker.tsx:118:              <label>Адрес (необязательно)</label>
frontend/src/components/VenuePicker.tsx:119:              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом" />
frontend/src/components/VenuePicker.tsx:120:            </div>
frontend/src/components/VenuePicker.tsx:121:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 12 }}>
frontend/src/components/VenuePicker.tsx:122:              Найдём заведение по карте. Если у сети много точек — добавим все.
frontend/src/components/VenuePicker.tsx:123:            </p>
frontend/src/components/VenuePicker.tsx:124:            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
frontend/src/components/VenuePicker.tsx:125:              <button className="btn secondary" onClick={() => setAddMode(false)} disabled={busy}>
frontend/src/components/VenuePicker.tsx:126:                Назад
frontend/src/components/VenuePicker.tsx:127:              </button>
frontend/src/components/VenuePicker.tsx:128:              <button className="btn" onClick={submit} disabled={busy || !name.trim() || !city.trim()}>
frontend/src/components/VenuePicker.tsx:129:                {busy ? 'Отправка…' : 'Отправить'}
frontend/src/components/VenuePicker.tsx:130:              </button>
frontend/src/components/VenuePicker.tsx:131:            </div>
frontend/src/components/VenuePicker.tsx:132:          </>
frontend/src/components/VenuePicker.tsx:133:        ) : (
frontend/src/components/VenuePicker.tsx:134:          <>
frontend/src/components/VenuePicker.tsx:135:            <h3>Где вы это пробовали?</h3>
frontend/src/components/VenuePicker.tsx:136:            <div className="pu-search">
frontend/src/components/VenuePicker.tsx:137:              <span className="search-ico">🔍</span>
frontend/src/components/VenuePicker.tsx:138:              <input
frontend/src/components/VenuePicker.tsx:139:                placeholder="Найти ресторан или бар…"
frontend/src/components/VenuePicker.tsx:140:                value={q}
frontend/src/components/VenuePicker.tsx:141:                onChange={(e) => setQ(e.target.value)}
frontend/src/components/VenuePicker.tsx:142:              />
frontend/src/components/VenuePicker.tsx:143:            </div>
frontend/src/components/VenuePicker.tsx:144:            <div className="pu-list">
frontend/src/components/VenuePicker.tsx:145:              {dedupeChains(results).map((v) => (
frontend/src/components/VenuePicker.tsx:146:                <button key={v.id} className="pick-row" onClick={() => onPick(v)}>
frontend/src/components/VenuePicker.tsx:147:                  <div className="pu-name">{v.name}</div>
frontend/src/components/VenuePicker.tsx:148:                  {v.branchCount && v.branchCount > 1 ? (
frontend/src/components/VenuePicker.tsx:149:                    <div className="pu-meta">Сеть · {v.branchCount} точек</div>
frontend/src/components/VenuePicker.tsx:150:                  ) : (
frontend/src/components/VenuePicker.tsx:151:                    v.address && <div className="pu-meta">{v.address}</div>
frontend/src/components/VenuePicker.tsx:152:                  )}
frontend/src/components/VenuePicker.tsx:153:                </button>
frontend/src/components/VenuePicker.tsx:154:              ))}
frontend/src/components/VenuePicker.tsx:155:              {q.trim().length >= 2 && (
frontend/src/components/VenuePicker.tsx:156:                <button className="pick-row add-row" onClick={startAdd}>
frontend/src/components/VenuePicker.tsx:157:                  <div className="pu-name" style={{ color: 'var(--accent)' }}>
frontend/src/components/VenuePicker.tsx:158:                    ➕ Нет в списке — добавить «{q.trim()}»
frontend/src/components/VenuePicker.tsx:159:                  </div>
frontend/src/components/VenuePicker.tsx:160:                  <div className="pu-meta">Добавим сразу, если адрес подтвердится</div>
frontend/src/components/VenuePicker.tsx:161:                </button>
frontend/src/components/VenuePicker.tsx:162:              )}
frontend/src/components/VenuePicker.tsx:163:            </div>
frontend/src/components/VenuePicker.tsx:164:            <button className="btn secondary" style={{ marginTop: 12 }} onClick={onClose}>
frontend/src/components/VenuePicker.tsx:165:              Отмена
frontend/src/components/VenuePicker.tsx:166:            </button>
frontend/src/components/VenuePicker.tsx:167:          </>
frontend/src/components/VenuePicker.tsx:168:        )}
frontend/src/components/VenuePicker.tsx:169:      </div>
frontend/src/components/VenuePicker.tsx:170:    </div>
frontend/src/components/VenuePicker.tsx:171:  );
frontend/src/components/VenuePicker.tsx:172:}
frontend/src/components/CommentsModal.tsx:1:import { useEffect, useMemo, useState, useRef} from 'react';
frontend/src/components/CommentsModal.tsx:2:import { api } from '../api';
frontend/src/components/CommentsModal.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src/components/CommentsModal.tsx:4:import { useSwipeDismiss } from '../swipeDismiss';
frontend/src/components/CommentsModal.tsx:5:import type { Comment } from '../types';
frontend/src/components/CommentsModal.tsx:7:type Node = Comment & { children: Node[] };
frontend/src/components/CommentsModal.tsx:9:function buildTree(list: Comment[]): Node[] {
frontend/src/components/CommentsModal.tsx:10:  const map = new Map<string, Node>();
frontend/src/components/CommentsModal.tsx:11:  list.forEach((c) => map.set(c.id, { ...c, children: [] }));
frontend/src/components/CommentsModal.tsx:12:  const roots: Node[] = [];
frontend/src/components/CommentsModal.tsx:13:  for (const c of list) {
frontend/src/components/CommentsModal.tsx:14:    const node = map.get(c.id)!;
frontend/src/components/CommentsModal.tsx:15:    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
frontend/src/components/CommentsModal.tsx:16:    else roots.push(node);
frontend/src/components/CommentsModal.tsx:17:  }
frontend/src/components/CommentsModal.tsx:18:  return roots;
frontend/src/components/CommentsModal.tsx:19:}
frontend/src/components/CommentsModal.tsx:21:function CommentNode({
frontend/src/components/CommentsModal.tsx:22:  node,
frontend/src/components/CommentsModal.tsx:23:  depth,
frontend/src/components/CommentsModal.tsx:24:  onReply,
frontend/src/components/CommentsModal.tsx:25:  onOpenUser,
frontend/src/components/CommentsModal.tsx:26:  meId,
frontend/src/components/CommentsModal.tsx:27:  isAdmin,
frontend/src/components/CommentsModal.tsx:28:  onDelete,
frontend/src/components/CommentsModal.tsx:29:}: {
frontend/src/components/CommentsModal.tsx:30:  node: Node;
frontend/src/components/CommentsModal.tsx:31:  depth: number;
frontend/src/components/CommentsModal.tsx:32:  onReply: (parentId: string, text: string) => Promise<void>;
frontend/src/components/CommentsModal.tsx:33:  onOpenUser?: (userId: string) => void;
frontend/src/components/CommentsModal.tsx:34:  meId?: string;
frontend/src/components/CommentsModal.tsx:35:  isAdmin?: boolean;
frontend/src/components/CommentsModal.tsx:36:  onDelete: (id: string) => void;
frontend/src/components/CommentsModal.tsx:37:}) {
frontend/src/components/CommentsModal.tsx:38:  const [replying, setReplying] = useState(false);
frontend/src/components/CommentsModal.tsx:39:  const [text, setText] = useState('');
frontend/src/components/CommentsModal.tsx:40:  const [busy, setBusy] = useState(false);
frontend/src/components/CommentsModal.tsx:41:  const name = node.user?.firstName ?? node.user?.username ?? 'Гость';
frontend/src/components/CommentsModal.tsx:42:  const canDelete = !!meId && (node.user?.id === meId || isAdmin);
frontend/src/components/CommentsModal.tsx:44:  const send = async () => {
frontend/src/components/CommentsModal.tsx:45:    if (!text.trim()) return;
frontend/src/components/CommentsModal.tsx:46:    setBusy(true);
frontend/src/components/CommentsModal.tsx:47:    await onReply(node.id, text.trim());
frontend/src/components/CommentsModal.tsx:48:    setText('');
frontend/src/components/CommentsModal.tsx:49:    setReplying(false);
frontend/src/components/CommentsModal.tsx:50:    setBusy(false);
frontend/src/components/CommentsModal.tsx:51:  };
frontend/src/components/CommentsModal.tsx:53:  return (
frontend/src/components/CommentsModal.tsx:54:    <div className="cmt" style={{ marginLeft: depth > 0 ? 14 : 0 }}>
frontend/src/components/CommentsModal.tsx:55:      <div
frontend/src/components/CommentsModal.tsx:56:        className="cmt-head"
frontend/src/components/CommentsModal.tsx:57:        onClick={() => node.user?.id && onOpenUser?.(node.user.id)}
frontend/src/components/CommentsModal.tsx:58:        style={{ cursor: node.user?.id && onOpenUser ? 'pointer' : 'default' }}
frontend/src/components/CommentsModal.tsx:59:      >
frontend/src/components/CommentsModal.tsx:60:        {node.user?.photoUrl ? (
frontend/src/components/CommentsModal.tsx:61:          <img className="cmt-avatar" src={node.user.photoUrl} alt="" />
frontend/src/components/CommentsModal.tsx:62:        ) : (
frontend/src/components/CommentsModal.tsx:63:          <div className="cmt-avatar ph">{name[0]?.toUpperCase() ?? '?'}</div>
frontend/src/components/CommentsModal.tsx:64:        )}
frontend/src/components/CommentsModal.tsx:65:        <b className="cmt-name">{name}</b>
frontend/src/components/CommentsModal.tsx:66:      </div>
frontend/src/components/CommentsModal.tsx:67:      <div className="cmt-text">{node.text}</div>
frontend/src/components/CommentsModal.tsx:68:      <button className="cmt-reply" onClick={() => setReplying((r) => !r)}>
frontend/src/components/CommentsModal.tsx:69:        Ответить
frontend/src/components/CommentsModal.tsx:70:      </button>
frontend/src/components/CommentsModal.tsx:71:      {canDelete && (
frontend/src/components/CommentsModal.tsx:72:        <button
frontend/src/components/CommentsModal.tsx:73:          className="cmt-reply"
frontend/src/components/CommentsModal.tsx:74:          style={{ color: 'var(--accent)' }}
frontend/src/components/CommentsModal.tsx:75:          onClick={() => onDelete(node.id)}
frontend/src/components/CommentsModal.tsx:76:        >
frontend/src/components/CommentsModal.tsx:77:          Удалить
frontend/src/components/CommentsModal.tsx:78:        </button>
frontend/src/components/CommentsModal.tsx:79:      )}
frontend/src/components/CommentsModal.tsx:80:      {replying && (
frontend/src/components/CommentsModal.tsx:81:        <div className="cmt-form">
frontend/src/components/CommentsModal.tsx:82:          <input
frontend/src/components/CommentsModal.tsx:83:            autoFocus
frontend/src/components/CommentsModal.tsx:84:            placeholder="Ваш ответ…"
frontend/src/components/CommentsModal.tsx:85:            value={text}
frontend/src/components/CommentsModal.tsx:86:            onChange={(e) => setText(e.target.value)}
frontend/src/components/CommentsModal.tsx:87:            onKeyDown={(e) => e.key === 'Enter' && send()}
frontend/src/components/CommentsModal.tsx:88:          />
frontend/src/components/CommentsModal.tsx:89:          <button className="btn cmt-send" disabled={busy || !text.trim()} onClick={send}>
frontend/src/components/CommentsModal.tsx:90:            Отправить
frontend/src/components/CommentsModal.tsx:91:          </button>
frontend/src/components/CommentsModal.tsx:92:        </div>
frontend/src/components/CommentsModal.tsx:93:      )}
frontend/src/components/CommentsModal.tsx:94:      {node.children.map((ch) => (
frontend/src/components/CommentsModal.tsx:95:        <CommentNode
frontend/src/components/CommentsModal.tsx:96:          key={ch.id}
frontend/src/components/CommentsModal.tsx:97:          node={ch}
frontend/src/components/CommentsModal.tsx:98:          depth={depth + 1}
frontend/src/components/CommentsModal.tsx:99:          onReply={onReply}
frontend/src/components/CommentsModal.tsx:100:          onOpenUser={onOpenUser}
frontend/src/components/CommentsModal.tsx:101:          meId={meId}
frontend/src/components/CommentsModal.tsx:102:          isAdmin={isAdmin}
frontend/src/components/CommentsModal.tsx:103:          onDelete={onDelete}
frontend/src/components/CommentsModal.tsx:104:        />
frontend/src/components/CommentsModal.tsx:105:      ))}
frontend/src/components/CommentsModal.tsx:106:    </div>
frontend/src/components/CommentsModal.tsx:107:  );
frontend/src/components/CommentsModal.tsx:108:}
frontend/src/components/CommentsModal.tsx:110:export function CommentsModal({
frontend/src/components/CommentsModal.tsx:111:  reviewId,
frontend/src/components/CommentsModal.tsx:112:  onClose,
frontend/src/components/CommentsModal.tsx:113:  onOpenUser,
frontend/src/components/CommentsModal.tsx:114:}: {
frontend/src/components/CommentsModal.tsx:115:  reviewId: string;
frontend/src/components/CommentsModal.tsx:116:  onClose: () => void;
frontend/src/components/CommentsModal.tsx:117:  onOpenUser?: (userId: string) => void;
frontend/src/components/CommentsModal.tsx:118:}) {
frontend/src/components/CommentsModal.tsx:119:  const [list, setList] = useState<Comment[]>([]);
frontend/src/components/CommentsModal.tsx:120:  const [text, setText] = useState('');
frontend/src/components/CommentsModal.tsx:121:  const [busy, setBusy] = useState(false);
frontend/src/components/CommentsModal.tsx:122:  const [closing, setClosing] = useState(false);
frontend/src/components/CommentsModal.tsx:123:  const [loading, setLoading] = useState(true);
frontend/src/components/CommentsModal.tsx:124:  const [error, setError] = useState(false);
frontend/src/components/CommentsModal.tsx:125:  const [modErr, setModErr] = useState('');
frontend/src/components/CommentsModal.tsx:126:  const [me, setMe] = useState<{ id: string; role?: string } | null>(null);
frontend/src/components/CommentsModal.tsx:128:  const load = () => {
frontend/src/components/CommentsModal.tsx:129:    setLoading(true);
frontend/src/components/CommentsModal.tsx:130:    setError(false);
frontend/src/components/CommentsModal.tsx:131:    return api
frontend/src/components/CommentsModal.tsx:132:      .comments(reviewId)
frontend/src/components/CommentsModal.tsx:133:      .then((c) => setList(c))
frontend/src/components/CommentsModal.tsx:134:      .catch(() => setError(true))
frontend/src/components/CommentsModal.tsx:135:      .finally(() => setLoading(false));
frontend/src/components/CommentsModal.tsx:136:  };
frontend/src/components/CommentsModal.tsx:137:  useEffect(() => {
frontend/src/components/CommentsModal.tsx:138:    load();
frontend/src/components/CommentsModal.tsx:139:    api.me().then((u) => setMe({ id: u.id, role: (u as any).role })).catch(() => {});
frontend/src/components/CommentsModal.tsx:140:    // eslint-disable-next-line react-hooks/exhaustive-deps
frontend/src/components/CommentsModal.tsx:141:  }, [reviewId]);
frontend/src/components/CommentsModal.tsx:143:  const tree = useMemo(() => buildTree(list), [list]);
frontend/src/components/CommentsModal.tsx:144:  const reqClose = () => {
frontend/src/components/CommentsModal.tsx:145:    setClosing(true);
frontend/src/components/CommentsModal.tsx:146:    setTimeout(onClose, 220);
frontend/src/components/CommentsModal.tsx:147:  };
frontend/src/components/CommentsModal.tsx:148:  useEscClose(reqClose);
frontend/src/components/CommentsModal.tsx:149:  // swipe-down from the top dismisses (shared app-wide pattern)
frontend/src/components/CommentsModal.tsx:150:  const sheetRef = useRef<HTMLDivElement>(null);
frontend/src/components/CommentsModal.tsx:151:  useSwipeDismiss(sheetRef, onClose);
frontend/src/components/CommentsModal.tsx:153:  const reply = async (parentId: string | undefined, t: string) => {
frontend/src/components/CommentsModal.tsx:154:    setModErr('');
frontend/src/components/CommentsModal.tsx:155:    try {
frontend/src/components/CommentsModal.tsx:156:      const created = await api.addComment(reviewId, t, parentId);
frontend/src/components/CommentsModal.tsx:157:      if (created) setList((prev) => [...prev, created]); // show instantly
frontend/src/components/CommentsModal.tsx:158:      load(); // …and sync with server
frontend/src/components/CommentsModal.tsx:159:    } catch (e: any) {
frontend/src/components/CommentsModal.tsx:160:      // surface the real reason (moderation vs. network) instead of always blaming moderation
frontend/src/components/CommentsModal.tsx:161:      setModErr(e?.message?.trim() || 'Не удалось отправить комментарий. Попробуйте ещё раз.');
frontend/src/components/CommentsModal.tsx:162:    }
frontend/src/components/CommentsModal.tsx:163:  };
frontend/src/components/CommentsModal.tsx:165:  const removeComment = (id: string) => {
frontend/src/components/CommentsModal.tsx:166:    api.deleteComment(id).then(load).catch(() => {});
frontend/src/components/CommentsModal.tsx:167:  };
frontend/src/components/CommentsModal.tsx:169:  const sendRoot = async () => {
frontend/src/components/CommentsModal.tsx:170:    if (!text.trim()) return;
frontend/src/components/CommentsModal.tsx:171:    setBusy(true);
frontend/src/components/CommentsModal.tsx:172:    await reply(undefined, text.trim());
frontend/src/components/CommentsModal.tsx:173:    setText('');
frontend/src/components/CommentsModal.tsx:174:    setBusy(false);
frontend/src/components/CommentsModal.tsx:175:  };
frontend/src/components/CommentsModal.tsx:177:  return (
frontend/src/components/CommentsModal.tsx:178:    <div
frontend/src/components/CommentsModal.tsx:179:      className="modal-backdrop"
frontend/src/components/CommentsModal.tsx:180:      style={{ zIndex: 3300 }}
frontend/src/components/CommentsModal.tsx:181:      onClick={(e) => {
frontend/src/components/CommentsModal.tsx:182:        e.stopPropagation();
frontend/src/components/CommentsModal.tsx:183:        reqClose();
frontend/src/components/CommentsModal.tsx:184:      }}
frontend/src/components/CommentsModal.tsx:185:    >
frontend/src/components/CommentsModal.tsx:186:      <div
frontend/src/components/CommentsModal.tsx:187:        ref={sheetRef}
frontend/src/components/CommentsModal.tsx:188:        className={'modal cmt-modal' + (closing ? ' closing' : '')}
frontend/src/components/CommentsModal.tsx:189:        onClick={(e) => e.stopPropagation()}
frontend/src/components/CommentsModal.tsx:190:      >
frontend/src/components/CommentsModal.tsx:191:        <h3>Обсуждение</h3>
frontend/src/components/CommentsModal.tsx:192:        <div className="cmt-list">
frontend/src/components/CommentsModal.tsx:193:          {loading ? (
frontend/src/components/CommentsModal.tsx:194:            <div className="meta" style={{ color: 'var(--hint)', padding: '8px 0' }}>
frontend/src/components/CommentsModal.tsx:195:              Загрузка…
frontend/src/components/CommentsModal.tsx:196:            </div>
frontend/src/components/CommentsModal.tsx:197:          ) : error ? (
frontend/src/components/CommentsModal.tsx:198:            <div className="meta" style={{ color: 'var(--hint)', padding: '8px 0' }}>
frontend/src/components/CommentsModal.tsx:199:              Не удалось загрузить комментарии.{' '}
frontend/src/components/CommentsModal.tsx:200:              <button
frontend/src/components/CommentsModal.tsx:201:                onClick={load}
frontend/src/components/CommentsModal.tsx:202:                style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
frontend/src/components/CommentsModal.tsx:203:              >
frontend/src/components/CommentsModal.tsx:204:                Повторить
frontend/src/components/CommentsModal.tsx:205:              </button>
frontend/src/components/CommentsModal.tsx:206:            </div>
frontend/src/components/CommentsModal.tsx:207:          ) : tree.length === 0 ? (
frontend/src/components/CommentsModal.tsx:208:            <div className="meta" style={{ color: 'var(--hint)', padding: '8px 0' }}>
frontend/src/components/CommentsModal.tsx:209:              Пока нет комментариев. Будьте первым!
frontend/src/components/CommentsModal.tsx:210:            </div>
frontend/src/components/CommentsModal.tsx:211:          ) : (
frontend/src/components/CommentsModal.tsx:212:            tree.map((n) => (
frontend/src/components/CommentsModal.tsx:213:              <CommentNode
frontend/src/components/CommentsModal.tsx:214:                key={n.id}
frontend/src/components/CommentsModal.tsx:215:                node={n}
frontend/src/components/CommentsModal.tsx:216:                depth={0}
frontend/src/components/CommentsModal.tsx:217:                onReply={(pid, t) => reply(pid, t)}
frontend/src/components/CommentsModal.tsx:218:                onOpenUser={onOpenUser}
frontend/src/components/CommentsModal.tsx:219:                meId={me?.id}
frontend/src/components/CommentsModal.tsx:220:                isAdmin={me?.role === 'ADMIN'}
frontend/src/components/CommentsModal.tsx:221:                onDelete={removeComment}
frontend/src/components/CommentsModal.tsx:222:              />
frontend/src/components/CommentsModal.tsx:223:            ))
frontend/src/components/CommentsModal.tsx:224:          )}
frontend/src/components/CommentsModal.tsx:225:        </div>
frontend/src/components/CommentsModal.tsx:226:        {modErr && (
frontend/src/components/CommentsModal.tsx:227:          <div className="meta" style={{ color: 'var(--accent)', padding: '4px 0' }}>{modErr}</div>
frontend/src/components/CommentsModal.tsx:228:        )}
frontend/src/components/CommentsModal.tsx:229:        <div className="cmt-form root">
frontend/src/components/CommentsModal.tsx:230:          <input
frontend/src/components/CommentsModal.tsx:231:            placeholder="Написать комментарий…"
frontend/src/components/CommentsModal.tsx:232:            value={text}
frontend/src/components/CommentsModal.tsx:233:            onChange={(e) => setText(e.target.value)}
frontend/src/components/CommentsModal.tsx:234:            onKeyDown={(e) => e.key === 'Enter' && sendRoot()}
frontend/src/components/CommentsModal.tsx:235:          />
frontend/src/components/CommentsModal.tsx:236:          <button className="btn cmt-send" disabled={busy || !text.trim()} onClick={sendRoot}>
frontend/src/components/CommentsModal.tsx:237:            Отправить
frontend/src/components/CommentsModal.tsx:238:          </button>
frontend/src/components/CommentsModal.tsx:239:        </div>
frontend/src/components/CommentsModal.tsx:240:      </div>
frontend/src/components/CommentsModal.tsx:241:    </div>
frontend/src/components/CommentsModal.tsx:242:  );
frontend/src/components/CommentsModal.tsx:243:}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "''^(export function|function |const [A-Z]|  const '"\\[|  const [a-zA-Z].*= use|  useEffect|  useEsc|  useSwipe|  return \\()|className=|onClick=|onSubmit=|onChange=|aria-|role=|disabled=|loading|error|setShow|setOpen|setActive|window\\.confirm|focus|scrollIntoView\" frontend/src/components/ListingDetail.tsx" in D:\Приложения\Yelp
 succeeded in 285ms:
26:const TYPE_LABEL: Record<Listing['type'], string> = {
32:function MiniRow({
39:  return (
40:    <div className="feed">
44:          <div key={l.id || l.name} className="mini" onClick={() => onPick(l)}>
45:            <VenuePhoto listing={l} className="mini-img" />
46:            <div className="mini-name">{l.name}</div>
48:              <div className="mini-price">{(l as any).menuPrice} ₽</div>
52:              <div className="mini-meta item-rating">
57:                <div className="mini-meta">★ {l.avgRating.toFixed(1)} ({l.reviewCount} {ratingsWord(l.reviewCount)})</div>
61:              <div className="mini-addr" style={{ color: 'var(--accent)', fontWeight: 600 }}>
66:                <div className="mini-addr">📍 {l.address || l.cityLabel}</div>
76:function AddItemModal({
87:  const [type, setType] = useState<'DISH' | 'DRINK'>('DISH');
88:  const [name, setName] = useState('');
89:  const [sugg, setSugg] = useState<string[]>([]);
90:  const [suggClosed, setSuggClosed] = useState(false); // user dismissed the list
91:  const [description, setDescription] = useState('');
92:  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
94:  useEffect(() => {
108:  const [uploading, setUploading] = useState(false);
109:  const [busy, setBusy] = useState(false);
113:    setUploading(true);
117:      setUploading(false);
135:  return (
137:      className="modal-backdrop"
139:      onClick={(e) => {
144:      <div className="modal" onClick={(e) => e.stopPropagation()}>
146:        <button className="addto" onClick={onClose}>
149:        <div className="field">
151:          <div className="chips">
153:              className={'chip' + (type === 'DISH' ? ' active' : '')}
154:              onClick={() => setType('DISH')}
159:              className={'chip' + (type === 'DRINK' ? ' active' : '')}
160:              onClick={() => setType('DRINK')}
166:        <div className="field">
170:            onChange={(e) => { setName(e.target.value); setSuggClosed(false); }}
174:            <div className="suggest">
175:              <button className="suggest-close" onClick={() => { setSugg([]); setSuggClosed(true); }} aria-label="Скрыть подсказки">
181:                  className="suggest-item"
182:                  onClick={() => {
194:        <div className="field">
196:          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
198:        <div className="field">
200:          <label className="upload-btn">
201:            <span className="up-ico">📷</span>
203:            <input type="file" accept="image/*" multiple hidden onChange={(e) => addPhoto(e.target.files)} />
205:          {uploading && <span className="meta"> Загрузка…</span>}
214:        <p className="meta" style={{ color: 'var(--hint)', fontSize: 13 }}>
218:          <button className="btn secondary" onClick={onClose} disabled={busy}>
221:          <button className="btn" onClick={submit} disabled={busy}>
230:export function ListingDetailModal({
243:  const [id, setId] = useState(initialId);
244:  const [data, setData] = useState<ListingDetail | null>(null);
246:  const [firstTaster, setFirstTaster] = useState<{ user: { id: string; firstName?: string | null; username?: string | null }; at: string } | null>(null);
248:  const [myAvatar, setMyAvatar] = useState<string | null>(() => {
251:  useEffect(() => {
261:  const [showReview, setShowReview] = useState(false);
262:  const [reviewRating, setReviewRating] = useState<number | undefined>(undefined);
263:  const [reviewTarget, setReviewTarget] = useState<Listing | null>(null);
264:  const [reviewVenue, setReviewVenue] = useState<{
271:  const [originVenue, setOriginVenue] = useState<{ id: string; name: string; price?: number | null } | null>(
275:  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
276:  useEffect(() => {
285:  const [likeProb, setLikeProb] = useState<{ probability: number | null; reason: string } | null>(null);
286:  useEffect(() => {
292:  const [tasteResult, setTasteResult] = useState<{
296:  const [votes, setVotes] = useState<Record<string, VoteState>>({});
297:  const [claimed, setClaimed] = useState(false);
298:  const [showAddItem, setShowAddItem] = useState(false);
299:  const [hoverRate, setHoverRate] = useState(0);
300:  const [fav, setFav] = useState(false);
301:  const [closing, setClosing] = useState(false);
302:  const [showCorrection, setShowCorrection] = useState(false);
303:  const [showVenuePicker, setShowVenuePicker] = useState(false);
304:  const [pendingRating, setPendingRating] = useState<number | undefined>(undefined);
309:  useEscClose(requestClose);
315:  const sheetRef = useRef<HTMLDivElement>(null);
318:  useSwipeDismiss(sheetRef, onClose);
320:  useSwipeBack(sheetRef, onClose);
321:  const mediaRef = useRef<HTMLDivElement>(null);
322:  const photoInputRef = useRef<HTMLInputElement>(null); // "Добавить фото" (no review)
323:  const [photoBusy, setPhotoBusy] = useState(false);
325:  const [rateToast, setRateToast] = useState('');
331:  const shareRef = useRef<{ photo?: string; text?: string }>({}); // last check-in's photo+note for "Отправить другу"
332:  const closeRef = useRef(requestClose);
337:  useEffect(() => {
379:  const [tab, setTab] = useState<'menu' | 'info' | 'reviews' | 'qa'>('menu');
380:  const menuRef = useRef<HTMLDivElement>(null);
381:  const infoRef = useRef<HTMLDivElement>(null);
382:  const reviewsRef = useRef<HTMLDivElement>(null);
383:  const qaRef = useRef<HTMLDivElement>(null);
387:    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
391:  useEffect(() => {
410:  const [questions, setQuestions] = useState<Question[] | null>(null);
411:  const [qDraft, setQDraft] = useState('');
412:  const [aDraft, setADraft] = useState<Record<string, string>>({});
416:  const freshReviews = useRef<any[]>([]);
417:  const load = useCallback(() => {
439:  useEffect(() => {
447:  useEffect(() => {
454:  const autoRatedRef = useRef(false);
455:  useEffect(() => {
463:  useEffect(() => {
496:      <div className="modal-backdrop" onClick={onClose}>
497:        <div className="modal" onClick={(e) => e.stopPropagation()}>
641:    setShowReview(true);
652:    <button key={it.id} className="menu-card" onClick={() => openItemFromVenue(it.id)}>
653:      <div className="menu-card-media">
654:        <VenuePhoto listing={it} className="menu-card-photo" />
655:        {it.price ? <span className="menu-card-price">{it.price} ₽</span> : null}
657:      <div className="menu-card-name">{it.name}</div>
658:      <div className="menu-card-meta">
685:    setShowVenuePicker(true);
703:        setShowReview(true);
720:  return (
722:      className={'modal-backdrop' + (closing ? ' closing' : '')}
724:      onClick={requestClose}
726:      <div className="modal" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
727:        <button className="card-back" onClick={requestClose} aria-label="Назад">
730:        <div className="detail-media" ref={mediaRef}>
732:            className="heart heart-lg"
733:            onClick={toggleFav}
734:            aria-label="В избранное"
740:            <span className="newdish-price detail-price-badge">{venuePrice} ₽</span>
744:            <div className="detail-rating-badge">
750:          <div className="carousel">
753:                <div key={i} className="carousel-slide">
755:                    <img className="detail-photo" src={thumbUrl(m.u)} alt="" loading={i > 0 ? 'lazy' : 'eager'} />
757:                    <video className="detail-photo" src={m.u} controls playsInline />
766:            <img className="detail-photo" src={media[0].u} alt={data.name} />
768:            <video className="detail-photo" src={media[0].u} controls playsInline />
772:          <div className={'stock-wrap' + (venuePrice != null ? ' has-price' : '')}>
773:            <VenuePhoto listing={data} className="detail-photo" allowVenuePhoto />
774:            <span className="stock-badge">📷 Фото иллюстративное · обновится после отзыва с фото</span>
778:          <div className={'stock-wrap' + (venuePrice != null ? ' has-price' : '')}>
779:            <img className="detail-photo" src={data.placeholderPhotos[0]} alt="" loading="lazy" />
780:            <span className="stock-badge">📷 Фото иллюстративное · обновится после отзыва с фото</span>
783:          <div className="gallery">
785:              <div key={i} className="stock-wrap">
786:                <img className="gallery-img" src={u} alt="" loading="lazy" />
787:                <span className="stock-badge">📷 Фото иллюстративное · обновится после отзыва с фото</span>
792:            <VenuePhoto listing={data} className="detail-photo" />
797:        <div className="rating-head">
804:            <span className="no-rating">Нет оценок</span>
806:          <span className="meta" style={{ color: 'var(--hint)' }}>
813:          <div className="meta" style={{ color: 'var(--hint)', marginTop: 4, fontSize: 13 }}>
819:        <div className="info-line">
845:          <div className="tags-row">
846:            {data.cityLabel && <span className="tag city">📍 {data.cityLabel}</span>}
852:                <span key={t} className="tag">
861:          <button className="btn rate-cta" onClick={() => startRate()}>
867:          <button className="btn rate-cta" onClick={() => setShowAddItem(true)}>
872:          <div className="like-prob">
873:            <div className="lp-row">
874:              <span className="lp-pct">🎯 {likeProb.probability}%</span>
875:              <span className="lp-label">вероятность, что вам понравится</span>
877:            {likeProb.reason && <div className="lp-reason">{likeProb.reason}</div>}
882:          <div className="best-venue">
887:          <div className="rank-locked">
897:            <div className="section-title big" style={{ marginTop: 8, marginBottom: 0 }}>🏆 Лучшие места</div>
898:            <div className="meta" style={{ color: 'var(--hint)', margin: '0 4px 6px' }}>
906:            <div className="section-title" style={{ marginTop: 8 }}>Новинки в заведениях</div>
907:            <div className="feed">
911:                  className="myrate-card"
912:                  onClick={() => ev.venue?.id && setId(ev.venue.id)}
914:                  <div className="newdish-media">
916:                      <img className="myrate-photo" src={ev.photoUrl} alt="" loading="lazy" />
918:                      <div className="myrate-photo ph" style={{ background: '#caa' }}>🍽</div>
920:                    {ev.price ? <span className="newdish-price">{ev.price} ₽</span> : null}
923:                  <div className="myrate-name">{ev.venue?.name}</div>
924:                  <div className="myrate-place">📍 {ev.venue?.address || ev.venue?.cityLabel || 'Москва'}</div>
931:          <div className="featured-review">
932:            <div className="fr-head">
936:            <div className="fr-text">«{data.featuredReview.text}»</div>
940:        <div className="actions-row">
944:              className="action"
946:              onClick={(e) => { e.preventDefault(); callPhone(data.phone!, data.name, `l_${data.id}`); }}
948:              <span className="ico">📞</span>
953:            <button className="action" onClick={openRoute}>
954:              <span className="ico">🧭</span>
959:            <button className="action" onClick={() => openExternal((data.links?.website || data.website) as string)}>
960:              <span className="ico">🌐</span>
965:            <button className="action" onClick={() => openExternal(data.links!.telegram as string)}>
966:              <span className="ico">✈️</span>
971:            <button className="action" onClick={() => openExternal(data.links!.vk as string)}>
972:              <span className="ico">🅥</span>
976:          <button className="action" onClick={share}>
977:            <span className="ico">↗</span>
980:          <button className="action" onClick={() => startRate()}>
981:            <span className="ico">✎</span>
988:            className="btn order-cta"
990:            onClick={(e) => { e.preventDefault(); callPhone(data.phone!, data.name, `l_${data.id}`); }}
997:          <div className="delivery-row">
998:            <span className="meta" style={{ color: 'var(--hint)' }}>Доставка:</span>
1000:              <button className="deliv-btn" onClick={() => openExternal(data.deliveryYandex as string)}>
1005:              <button className="deliv-btn" onClick={() => openExternal(data.deliverySamokat as string)}>
1010:              <button className="deliv-btn" onClick={() => openExternal(data.deliveryVk as string)}>
1018:          <div className="recommend">
1019:            <span className="rec-q">Советуете это место?</span>
1020:            <div className="rec-opts">
1021:              <button className="chip" onClick={() => startRate(5)}>Да</button>
1022:              <button className="chip" onClick={() => startRate(3)}>Возможно</button>
1023:              <button className="chip" onClick={() => startRate(2)}>Нет</button>
1028:        <div className="tabbar">
1039:              className={'tab' + (tab === k ? ' active' : '')}
1040:              onClick={() => goTab(k)}
1047:        <div ref={menuRef} className="feed-section">
1048:          <div className="tab-pane">
1053:                    <div className="section-title">Блюда</div>
1054:                    <div className="feed">{(data.topDishes as any[]).map(menuCard)}</div>
1059:                    <div className="section-title">Напитки</div>
1060:                    <div className="feed">{(data.topDrinks as any[]).map(menuCard)}</div>
1065:                    <div className="section-title">Предложено посетителями</div>
1072:                    <div className="meta" style={{ color: 'var(--hint)', padding: '8px 2px' }}>
1081:                    <div className="section-title">
1094:                    <div className="meta" style={{ color: 'var(--hint)', padding: '8px 2px' }}>
1104:        <div ref={infoRef} className="feed-section">
1105:          <div className="section-title big">Инфо</div>
1106:          <div className="tab-pane">
1111:            <div className="info-list">
1113:                <div className="info-row">
1114:                  <span className="ir-ico">🕒</span>
1115:                  <div className="ir-body">
1116:                    <div className="ir-title">Часы работы</div>
1117:                    <div className="ir-sub">
1131:                <button className="info-row" onClick={() => openExternal((data.links?.website || data.website) as string)}>
1132:                  <span className="ir-ico">🌐</span>
1133:                  <div className="ir-body">
1134:                    <div className="ir-title">Сайт</div>
1135:                    <div className="ir-sub">
1139:                  <span className="ir-chev">↗</span>
1144:                  className="info-row"
1146:                  onClick={(e) => { e.preventDefault(); callPhone(data.phone!, data.name, `l_${data.id}`); }}
1148:                  <span className="ir-ico">📞</span>
1149:                  <div className="ir-body">
1150:                    <div className="ir-title">Позвонить</div>
1151:                    <div className="ir-sub">{data.phone}</div>
1153:                  <span className="ir-chev">›</span>
1157:                <button className="info-row" onClick={openRoute}>
1158:                  <span className="ir-ico">📍</span>
1159:                  <div className="ir-body">
1160:                    <div className="ir-title">Адрес</div>
1161:                    <div className="ir-sub">{data.address}</div>
1163:                  <span className="ir-chev">›</span>
1183:                  <div key={key} className="amenity-group">
1184:                    <div className="section-title">{label}</div>
1185:                    <div className="tags-row">
1187:                        <span key={a} className="tag">
1215:              className="link-btn report-line"
1216:              onClick={() => setShowCorrection(true)}
1224:          <div className="feed-section">
1225:            <div className="section-title big">Новинки</div>
1226:            <div className="feed">
1230:                  <button key={ev.id} className="menu-card" onClick={() => rateNewDish(ev)}>
1231:                    <div className="menu-card-media">
1233:                        <img className="menu-card-photo" src={ev.photoUrl} alt="" loading="lazy" />
1235:                        <div className="menu-card-photo ph">🆕</div>
1237:                      {ev.price ? <span className="menu-card-price">{ev.price} ₽</span> : null}
1239:                    <div className="menu-card-name">{ev.title || 'Новинка'}</div>
1240:                    <div className="menu-card-meta">🆕 Новинка · оценить</div>
1247:          <div className="feed-section">
1248:            <div className="section-title big">Изменения в работе</div>
1249:            <div className="tab-pane">
1254:                  <div key={ev.id} className="sched-line">
1263:          <div className="feed-section">
1264:            <div className="section-title big">Точки сети ({data.branches.length + 1})</div>
1266:            <div className="feed">
1268:                <button key={b.id} className="myrate-card" onClick={() => setId(b.id)}>
1269:                  <div className="newdish-media">
1270:                    <VenuePhoto listing={b} className="myrate-photo" />
1272:                  <div className="myrate-name">{b.name}</div>
1273:                  <div className="myrate-place">📍 {b.address || b.cityLabel || 'Москва'}</div>
1283:        <div ref={reviewsRef} className="feed-section">
1284:          <div className="section-title big">Отзывы ({data.reviews.length})</div>
1285:          <div className="tab-pane">
1286:            <div className="rate-block">
1287:              <div className="rb-head">
1289:                  <img className="rb-avatar" src={myAvatar} alt="" style={{ objectFit: 'cover' }} />
1291:                  <div className="rb-avatar">👤</div>
1294:                  <div className="rb-name">Оцените {isRestaurant ? 'заведение' : 'позицию'}</div>
1295:                  <div className="rb-sub">Нажмите на звёзды или добавьте фото</div>
1298:              <div className="rate-stars" onMouseLeave={() => setHoverRate(0)}>
1302:                    className={'rate-star' + (n <= hoverRate ? ' on' : '')}
1304:                    onClick={() => startRate(n)}
1310:              <div className="rate-actions">
1311:                <button className="rate-act" onClick={() => photoInputRef.current?.click()} disabled={photoBusy}>
1314:                <button className="rate-act primary" onClick={() => startRate()}>
1325:                onChange={async (e) => {
1340:              <div className="histogram">
1345:                    <div key={star} className="hist-row">
1346:                      <span className="hist-label">{star}★</span>
1347:                      <div className="hist-bar">
1348:                        <div className="hist-fill" style={{ width: `${pct}%` }} />
1350:                      <span className="hist-count">{count}</span>
1357:              <div className="meta" style={{ padding: '6px 2px', color: 'var(--hint)' }}>
1375:                    <div className="photo-thumbs">
1384:                  <div className="vote-row">
1390:                          className={'vote-btn' + (vs.mine.includes(t) ? ' active' : '')}
1391:                          onClick={() => doVote(r.id, t)}
1400:                    <div className="owner-reply">
1408:              <div className="claim-line">
1414:                  <button className="link-btn" onClick={doClaim}>
1423:        <div ref={qaRef} className="feed-section">
1424:          <div className="section-title big">Вопросы</div>
1425:          <div className="tab-pane">
1426:            <div className="qa-ask">
1430:                onChange={(e) => setQDraft(e.target.value)}
1432:              <button className="btn" style={{ width: 'auto' }} onClick={askQuestion}>
1437:              <div className="meta" style={{ color: 'var(--hint)', padding: '8px 2px' }}>Загрузка…</div>
1439:              <div className="meta" style={{ color: 'var(--hint)', padding: '8px 2px' }}>
1444:                <div key={q.id} className="qa-item">
1445:                  <div className="qa-q">
1449:                    <div key={a.id} className="qa-a">
1453:                  <div className="qa-answer">
1457:                      onChange={(e) => setADraft((d) => ({ ...d, [q.id]: e.target.value }))}
1459:                    <button className="link-btn" onClick={() => answerQuestion(q.id)}>
1470:          <div className="feed-section">
1471:            <div className="section-title big">Похожие места</div>
1473:              <ListRow key={l.id} listing={l} onClick={() => setId(l.id)} />
1478:        <button className="btn secondary" style={{ marginTop: 16 }} onClick={requestClose}>
1491:            setShowReview(false);
1498:            setShowReview(false);
1538:      {rateToast && <div className="game-toast">{rateToast}</div>}
1564:          onClose={() => setShowCorrection(false)}
1570:          onClose={() => setShowVenuePicker(false)}
1574:            setShowVenuePicker(false);
1582:            setShowVenuePicker(false);
1592:          onClose={() => setShowAddItem(false)}
1596:            setShowAddItem(false);
1602:            setShowReview(true);

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/components/ListingDetail.tsx'; "'$c=Get-Content -Encoding utf8 $f; foreach($range in @(@(230,500),@(620,735),@(1470,1608))){$s=$range[0];$e=$range[1]; for($i=$s;$i -le $e;$i++){"$i`:$($c[$i-1])"}; ""}' in D:\Приложения\Yelp
 succeeded in 813ms:
230:export function ListingDetailModal({
231:  id: initialId,
232:  onClose,
233:  onChanged,
234:  autoRate,
235:  originVenue: initialOriginVenue,
236:}: {
237:  id: string;
238:  onClose: () => void;
239:  onChanged?: () => void;
240:  autoRate?: number; // when set, immediately start the rate flow (ask where → card)
241:  originVenue?: { id: string; name: string; price?: number | null } | null; // recommended place → check-in attaches here
242:}) {
243:  const [id, setId] = useState(initialId);
244:  const [data, setData] = useState<ListingDetail | null>(null);
245:  // «Первый дегустатор» — the card's history starts with this person
246:  const [firstTaster, setFirstTaster] = useState<{ user: { id: string; firstName?: string | null; username?: string | null }; at: string } | null>(null);
247:  // the viewer's own avatar for the "Оцените" block (cached per session)
248:  const [myAvatar, setMyAvatar] = useState<string | null>(() => {
249:    try { return sessionStorage.getItem('myAvatar'); } catch { return null; }
250:  });
251:  useEffect(() => {
252:    if (myAvatar) return;
253:    api.me().then((u) => {
254:      if (u?.photoUrl) {
255:        setMyAvatar(u.photoUrl);
256:        try { sessionStorage.setItem('myAvatar', u.photoUrl); } catch { /* private mode */ }
257:      }
258:    }).catch(() => {});
259:    // eslint-disable-next-line react-hooks/exhaustive-deps
260:  }, []);
261:  const [showReview, setShowReview] = useState(false);
262:  const [reviewRating, setReviewRating] = useState<number | undefined>(undefined);
263:  const [reviewTarget, setReviewTarget] = useState<Listing | null>(null);
264:  const [reviewVenue, setReviewVenue] = useState<{
265:    id?: string;
266:    name: string;
267:    pending?: boolean;
268:  } | null>(null);
269:  // when a dish/drink is opened FROM a restaurant menu (or a recommended place),
270:  // rating auto-attaches there — no "pick a venue" step.
271:  const [originVenue, setOriginVenue] = useState<{ id: string; name: string; price?: number | null } | null>(
272:    initialOriginVenue ?? null,
273:  );
274:  const { isUnlocked, countFor, threshold } = useCategoryProgress();
275:  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
276:  useEffect(() => {
277:    navigator.geolocation?.getCurrentPosition(
278:      (p) => setUserLoc([p.coords.latitude, p.coords.longitude]),
279:      () => {},
280:      { timeout: 8000, maximumAge: 120000 },
281:    );
282:  }, []);
283:
284:  // recommender signals: log OPEN now, VIEW if they linger >15s; fetch probability
285:  const [likeProb, setLikeProb] = useState<{ probability: number | null; reason: string } | null>(null);
286:  useEffect(() => {
287:    api.logEvent(id, 'OPEN');
288:    const t = setTimeout(() => api.logEvent(id, 'VIEW'), 15000);
289:    api.likeProbability(id).then(setLikeProb).catch(() => {});
290:    return () => clearTimeout(t);
291:  }, [id]);
292:  const [tasteResult, setTasteResult] = useState<{
293:    data: import('../types').TasteRanking;
294:    itemId: string;
295:  } | null>(null);
296:  const [votes, setVotes] = useState<Record<string, VoteState>>({});
297:  const [claimed, setClaimed] = useState(false);
298:  const [showAddItem, setShowAddItem] = useState(false);
299:  const [hoverRate, setHoverRate] = useState(0);
300:  const [fav, setFav] = useState(false);
301:  const [closing, setClosing] = useState(false);
302:  const [showCorrection, setShowCorrection] = useState(false);
303:  const [showVenuePicker, setShowVenuePicker] = useState(false);
304:  const [pendingRating, setPendingRating] = useState<number | undefined>(undefined);
305:  const requestClose = () => {
306:    setClosing(true);
307:    setTimeout(onClose, 200);
308:  };
309:  useEscClose(requestClose);
310:
311:  // pull-to-dismiss: from the top of the card, a strong drag down (anywhere)
312:  // closes it. Uses native non-passive touch events so we can preventDefault the
313:  // browser's overscroll and take over (pointer events get eaten by native scroll
314:  // in the iOS Telegram webview).
315:  const sheetRef = useRef<HTMLDivElement>(null);
316:  // app-wide pattern: swipe down anywhere on the sheet (from its scroll top) closes —
317:  // complements the photo-handle drag below (which stays for gallery-area gestures)
318:  useSwipeDismiss(sheetRef, onClose);
319:  // AND swipe left→right (edge) closes, same as the back arrow — app-wide (owner)
320:  useSwipeBack(sheetRef, onClose);
321:  const mediaRef = useRef<HTMLDivElement>(null);
322:  const photoInputRef = useRef<HTMLInputElement>(null); // "Добавить фото" (no review)
323:  const [photoBusy, setPhotoBusy] = useState(false);
324:  // human motivation after each rating — never "+10 XP" (gamification philosophy)
325:  const [rateToast, setRateToast] = useState('');
326:  const RATE_PHRASES = [
327:    '✨ Теперь приложение лучше понимает ваш вкус',
328:    '🎯 Ваш профиль стал точнее',
329:    '🤖 Точность рекомендаций увеличилась',
330:  ];
331:  const shareRef = useRef<{ photo?: string; text?: string }>({}); // last check-in's photo+note for "Отправить другу"
332:  const closeRef = useRef(requestClose);
333:  closeRef.current = requestClose;
334:  // pull the photo down to close the card. The handler lives ON the photo, which
335:  // has touch-action:none, so vertical gestures are fully ours (cancelable) and
336:  // don't get eaten by the card's native scroll — the only thing that works on iOS.
337:  useEffect(() => {
338:    const handle = mediaRef.current;
339:    const sheet = sheetRef.current;
340:    if (!handle || !sheet) return;
341:    let startX = 0;
342:    let startY = 0;
343:    let dy = 0;
344:    let active = false;
345:    const start = (e: TouchEvent) => {
346:      if (sheet.scrollTop > 0) { active = false; return; }
347:      startX = e.touches[0].clientX;
348:      startY = e.touches[0].clientY;
349:      dy = 0;
350:      active = true;
351:      sheet.style.transition = 'none';
352:    };
353:    const move = (e: TouchEvent) => {
354:      if (!active) return;
355:      const dx = e.touches[0].clientX - startX;
356:      dy = e.touches[0].clientY - startY;
357:      if (Math.abs(dx) > Math.abs(dy)) return; // horizontal → leave for gallery
358:      e.preventDefault();
359:      sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
360:    };
361:    const end = () => {
362:      if (!active) return;
363:      active = false;
364:      sheet.style.transition = 'transform 0.25s ease';
365:      if (dy > 100) closeRef.current();
366:      else sheet.style.transform = '';
367:    };
368:    handle.addEventListener('touchstart', start, { passive: true });
369:    handle.addEventListener('touchmove', move, { passive: false });
370:    handle.addEventListener('touchend', end, { passive: true });
371:    handle.addEventListener('touchcancel', end, { passive: true });
372:    return () => {
373:      handle.removeEventListener('touchstart', start);
374:      handle.removeEventListener('touchmove', move);
375:      handle.removeEventListener('touchend', end);
376:      handle.removeEventListener('touchcancel', end);
377:    };
378:  }, []);
379:  const [tab, setTab] = useState<'menu' | 'info' | 'reviews' | 'qa'>('menu');
380:  const menuRef = useRef<HTMLDivElement>(null);
381:  const infoRef = useRef<HTMLDivElement>(null);
382:  const reviewsRef = useRef<HTMLDivElement>(null);
383:  const qaRef = useRef<HTMLDivElement>(null);
384:  const goTab = (k: 'menu' | 'info' | 'reviews' | 'qa') => {
385:    setTab(k);
386:    const ref = { menu: menuRef, info: infoRef, reviews: reviewsRef, qa: qaRef }[k];
387:    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
388:  };
389:  // scroll-spy: highlight the tab of whichever section is currently under the header
390:  // as the user scrolls the card (root = the scrollable modal sheet).
391:  useEffect(() => {
392:    const root = sheetRef.current;
393:    if (!root) return;
394:    const sections: [React.RefObject<HTMLDivElement>, 'menu' | 'info' | 'reviews' | 'qa'][] = [
395:      [menuRef, 'menu'], [infoRef, 'info'], [reviewsRef, 'reviews'], [qaRef, 'qa'],
396:    ];
397:    const obs = new IntersectionObserver(
398:      (entries) => {
399:        const vis = entries
400:          .filter((e) => e.isIntersecting)
401:          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
402:        const hit = vis[0] && sections.find(([r]) => r.current === vis[0].target);
403:        if (hit) setTab(hit[1]);
404:      },
405:      { root, rootMargin: '-46% 0px -50% 0px', threshold: 0 },
406:    );
407:    sections.forEach(([r]) => r.current && obs.observe(r.current));
408:    return () => obs.disconnect();
409:  }, [data]);
410:  const [questions, setQuestions] = useState<Question[] | null>(null);
411:  const [qDraft, setQDraft] = useState('');
412:  const [aDraft, setADraft] = useState<Record<string, string>>({});
413:
414:  // reviews just posted from THIS session — re-merged after every refetch so the
415:  // user's own review never blinks away while server moderation catches up
416:  const freshReviews = useRef<any[]>([]);
417:  const load = useCallback(() => {
418:    api
419:      .listing(id)
420:      .then((d) => {
421:        if (freshReviews.current.length && d.type !== 'RESTAURANT') {
422:          const have = new Set((d.reviews ?? []).map((r: any) => r.id));
423:          const missing = freshReviews.current.filter((r) => !have.has(r.id));
424:          if (missing.length) {
425:            d = { ...d, reviews: [...missing, ...(d.reviews ?? [])], reviewCount: (d.reviewCount ?? 0) + missing.length };
426:          }
427:        }
428:        setData(d);
429:        pushRecent({ ...(d as Listing), placeholderPhoto: d.placeholderPhotos?.[0] ?? null });
430:        // the card's history: who tasted it first (only when reviews exist)
431:        setFirstTaster(null);
432:        if (d.reviewCount > 0 && d.type !== 'RESTAURANT') {
433:          api.firstTasterOf(id).then(setFirstTaster).catch(() => {});
434:        }
435:      })
436:      .catch(() => {});
437:  }, [id]);
438:
439:  useEffect(() => {
440:    setData(null);
441:    freshReviews.current = []; // fresh reviews belong to the previous card
442:    setQuestions(null);
443:    setTab('menu');
444:    load();
445:  }, [load]);
446:
447:  useEffect(() => {
448:    if (questions === null) {
449:      api.questions(id).then(setQuestions).catch(() => {});
450:    }
451:  }, [id, questions]);
452:
453:  // when opened in "rate now" mode, kick off the rate flow once data is in
454:  const autoRatedRef = useRef(false);
455:  useEffect(() => {
456:    if (autoRate == null || !data || autoRatedRef.current) return;
457:    autoRatedRef.current = true;
458:    startRate(autoRate || undefined); // 0 = open the flow without a preselected star
459:    // eslint-disable-next-line react-hooks/exhaustive-deps
460:  }, [data, autoRate]);
461:
462:  // reflect whether this venue is already in the user's favorites
463:  useEffect(() => {
464:    api
465:      .favorites()
466:      .then((list) => setFav(list.some((f) => f.listingId === id)))
467:      .catch(() => {});
468:  }, [id]);
469:  const toggleFav = () => {
470:    const next = !fav;
471:    setFav(next);
472:    (next ? api.addFavorite(id) : api.removeFavorite(id)).catch(() => setFav(!next));
473:    onChanged?.();
474:  };
475:
476:  const loadQuestions = () => api.questions(id).then(setQuestions).catch(() => {});
477:  const askQuestion = () => {
478:    const text = qDraft.trim();
479:    if (!text) return;
480:    api.askQuestion(id, text).then(() => {
481:      setQDraft('');
482:      loadQuestions();
483:    });
484:  };
485:  const answerQuestion = (qid: string) => {
486:    const text = aDraft[qid]?.trim();
487:    if (!text) return;
488:    api.answerQuestion(qid, text).then(() => {
489:      setADraft((d) => ({ ...d, [qid]: '' }));
490:      loadQuestions();
491:    });
492:  };
493:
494:  if (!data) {
495:    return (
496:      <div className="modal-backdrop" onClick={onClose}>
497:        <div className="modal" onClick={(e) => e.stopPropagation()}>
498:          Загрузка…
499:        </div>
500:      </div>

620:        ? `${data.address}, Москва`
621:        : '';
622:    if (!dest) return;
623:    const open = (origin: string) =>
624:      openExternal(
625:        `https://yandex.ru/maps/?rtext=${encodeURIComponent(`${origin}~${dest}`)}&rtt=auto`,
626:      );
627:    // Ask for the user's current location to pre-fill "Откуда".
628:    if (navigator.geolocation) {
629:      navigator.geolocation.getCurrentPosition(
630:        (p) => open(`${p.coords.latitude},${p.coords.longitude}`),
631:        () => open(''),
632:        { timeout: 5000, maximumAge: 60000 },
633:      );
634:    } else {
635:      open('');
636:    }
637:  }
638:
639:  function openReview(rating?: number) {
640:    setReviewRating(rating);
641:    setShowReview(true);
642:  }
643:
644:  // open a menu item from a restaurant — remember the venue so rating auto-attaches
645:  function openItemFromVenue(itemId: string) {
646:    if (data) setOriginVenue({ id: data.id, name: data.name });
647:    setId(itemId);
648:  }
649:
650:  // Yelp-style menu card: big photo + price overlay + name + rating count
651:  const menuCard = (it: any) => (
652:    <button key={it.id} className="menu-card" onClick={() => openItemFromVenue(it.id)}>
653:      <div className="menu-card-media">
654:        <VenuePhoto listing={it} className="menu-card-photo" />
655:        {it.price ? <span className="menu-card-price">{it.price} ₽</span> : null}
656:      </div>
657:      <div className="menu-card-name">{it.name}</div>
658:      <div className="menu-card-meta">
659:        {it.venueReviews > 0 ? (
660:          <>
661:            <Stars value={it.venueRating ?? 0} />{' '}
662:            {(it.venueRating ?? 0).toFixed(1)} ({it.venueReviews})
663:          </>
664:        ) : (
665:          'Нет оценок'
666:        )}
667:      </div>
668:    </button>
669:  );
670:
671:  // dishes/drinks are rated in the context of a venue → pick a restaurant first,
672:  // UNLESS we arrived from a specific restaurant's menu (then auto-attach there).
673:  function startRate(rating?: number) {
674:    if (isRestaurant) {
675:      openReview(rating);
676:      return;
677:    }
678:    if (originVenue) {
679:      api.linkItemToVenue(data.id, originVenue.id).catch(() => {});
680:      setReviewVenue(originVenue);
681:      openReview(rating);
682:      return;
683:    }
684:    setPendingRating(rating);
685:    setShowVenuePicker(true);
686:  }
687:
688:  // tap a venue's "Новинка" card → add it to the menu and open it to rate (here)
689:  function rateNewDish(ev: { title?: string | null; photoUrl?: string | null }) {
690:    api
691:      .addItem(data.id, {
692:        type: 'DISH',
693:        name: (ev.title || 'Новинка').slice(0, 60),
694:        photoUrl: ev.photoUrl ?? undefined,
695:      })
696:      .then((item) => {
697:        const venue = { id: data.id, name: data.name };
698:        setOriginVenue(venue);
699:        setReviewVenue(venue);
700:        setId(item.id);
701:        setReviewTarget(item);
702:        setReviewRating(undefined);
703:        setShowReview(true);
704:      })
705:      .catch(() => {});
706:  }
707:
708:  function share() {
709:    const link = 'https://t.me/togomoscow_bot';
710:    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
711:    if (nav.share) {
712:      nav.share({ title: data.name, url: link }).catch(() => {});
713:    } else {
714:      openExternal(
715:        `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(data.name)}`,
716:      );
717:    }
718:  }
719:
720:  return (
721:    <div
722:      className={'modal-backdrop' + (closing ? ' closing' : '')}
723:      style={{ zIndex: 2500 }}
724:      onClick={requestClose}
725:    >
726:      <div className="modal" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
727:        <button className="card-back" onClick={requestClose} aria-label="Назад">
728:          ←
729:        </button>
730:        <div className="detail-media" ref={mediaRef}>
731:          <button
732:            className="heart heart-lg"
733:            onClick={toggleFav}
734:            aria-label="В избранное"
735:          >

1470:          <div className="feed-section">
1471:            <div className="section-title big">Похожие места</div>
1472:            {data.similar.map((l) => (
1473:              <ListRow key={l.id} listing={l} onClick={() => setId(l.id)} />
1474:            ))}
1475:          </div>
1476:        )}
1477:
1478:        <button className="btn secondary" style={{ marginTop: 16 }} onClick={requestClose}>
1479:          Закрыть
1480:        </button>
1481:      </div>
1482:
1483:      {showReview && (
1484:        <ReviewForm
1485:          listing={reviewTarget ?? data}
1486:          venue={reviewVenue}
1487:          initialRating={reviewRating}
1488:          // item already has a price at this venue → don't ask for it again in the review
1489:          knownPrice={reviewTarget ? null : venuePrice}
1490:          onClose={() => {
1491:            setShowReview(false);
1492:            setReviewTarget(null);
1493:            setReviewVenue(null);
1494:          }}
1495:          onSaved={(media) => {
1496:            const ratedListing = reviewTarget ?? data;
1497:            const ratedId = ratedListing.id;
1498:            setShowReview(false);
1499:            // the fresh review appears on the card INSTANTLY (moderation may lag
1500:            // behind load() — the user must never need a page refresh to see it)
1501:            if (media?.review && ratedId === data.id) {
1502:              freshReviews.current = [media.review, ...freshReviews.current].slice(0, 5);
1503:              setData((d) => {
1504:                if (!d || d.reviews?.some((r: any) => r.id === (media.review as any).id)) return d;
1505:                const rv: any = { voteCounts: { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 }, ...media.review };
1506:                const count = (d.reviewCount ?? 0) + 1;
1507:                const avg = ((d.avgRating ?? 0) * (d.reviewCount ?? 0) + rv.rating) / count;
1508:                return { ...d, reviews: [rv, ...(d.reviews ?? [])], reviewCount: count, avgRating: avg };
1509:              });
1510:            }
1511:            // first review of the card → discovery phrase; else a rotating one
1512:            const phrase = data.reviewCount === 0
1513:              ? '🏅 Вы открыли это для сообщества — вы первый дегустатор!'
1514:              : RATE_PHRASES[Math.floor(Math.random() * RATE_PHRASES.length)];
1515:            setRateToast(phrase);
1516:            setTimeout(() => setRateToast(''), 3200);
1517:            setReviewTarget(null);
1518:            setReviewVenue(null);
1519:            load();
1520:            onChanged?.();
1521:            // remember this check-in's own photo + note so "Отправить другу" sends them
1522:            shareRef.current = { photo: media?.photo, text: media?.text };
1523:            // Use the actual rated item (not the parent restaurant) and the live
1524:            // Telegram WebApp instance. This also keeps story behavior shared with ScanFab.
1525:            void shareReviewToStory(ratedListing, media);
1526:            // instant meaning: where this lands in your personal ranking + what to taste next
1527:            if (ratedListing.type !== 'RESTAURANT') {
1528:              api
1529:                .tasteRanking(ratedId)
1530:                .then((r) => {
1531:                  if (r && r.total > 0) setTasteResult({ data: r, itemId: ratedId });
1532:                })
1533:                .catch(() => {});
1534:            }
1535:          }}
1536:        />
1537:      )}
1538:      {rateToast && <div className="game-toast">{rateToast}</div>}
1539:      {tasteResult && (
1540:        <TasteResult
1541:          data={tasteResult.data}
1542:          itemId={tasteResult.itemId}
1543:          onClose={() => setTasteResult(null)}
1544:          onCompareNext={(next) => {
1545:            setTasteResult(null);
1546:            setId(next.id); // open the next item to taste & compare
1547:          }}
1548:          onShareFriend={async () => {
1549:            const caption = shareRef.current.text?.trim() || `Зацени — ${data.name} в togomoscow 🍽`;
1550:            const photo = shareRef.current.photo;
1551:            try {
1552:              // rich message: photo + caption + "Open" button, no raw long link
1553:              const { id } = await api.preparePost({ listingId: data.id, text: caption, photoUrl: photo });
1554:              if (shareMessage(id)) return;
1555:            } catch { /* fall back below */ }
1556:            shareToChat(caption, `l_${data.id}`, photo);
1557:          }}
1558:        />
1559:      )}
1560:      {showCorrection && (
1561:        <CorrectionModal
1562:          listingId={data.id}
1563:          venueName={data.name}
1564:          onClose={() => setShowCorrection(false)}
1565:        />
1566:      )}
1567:      {showVenuePicker && (
1568:        <VenuePicker
1569:          itemId={data.id}
1570:          onClose={() => setShowVenuePicker(false)}
1571:          onPick={(venue) => {
1572:            api.linkItemToVenue(data.id, venue.id).catch(() => {});
1573:            setReviewVenue({ id: venue.id, name: venue.name });
1574:            setShowVenuePicker(false);
1575:            load(); // venue now appears in "Где попробовать"
1576:            openReview(pendingRating); // …and rate it (with the star you tapped, if any)
1577:            setPendingRating(undefined);
1578:          }}
1579:          onAdded={(placeName) => {
1580:            // place is pending moderation — rate now, attach the name, link later
1581:            setReviewVenue({ name: placeName, pending: true });
1582:            setShowVenuePicker(false);
1583:            openReview(pendingRating);
1584:            setPendingRating(undefined);
1585:          }}
1586:        />
1587:      )}
1588:      {showAddItem && (
1589:        <AddItemModal
1590:          venueId={data.id}
1591:          venueName={data.name}
1592:          onClose={() => setShowAddItem(false)}
1593:          onAdded={(item) => {
1594:            // capture the venue we're adding it AT before setId swaps `data`
1595:            const venue = { id: data.id, name: data.name };
1596:            setShowAddItem(false);
1597:            setOriginVenue(venue);
1598:            setReviewVenue(venue); // so the rating attaches to THIS venue, not another
1599:            setId(item.id); // jump to the new item
1600:            setReviewTarget(item); // …and open its review form right away
1601:            setReviewRating(undefined);
1602:            setShowReview(true);
1603:          }}
1604:        />
1605:      )}
1606:    </div>
1607:  );
1608:}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "." frontend/src/components/ScanFab.tsx frontend/src/components/PhotoPostModal.tsx frontend/src/components/People.tsx frontend/src/components/QuizModal.tsx frontend/src/components/Filters.tsx frontend/src/components/MapBrowse.tsx' in D:\Приложения\Yelp
 succeeded in 273ms:
frontend/src/components/QuizModal.tsx:1:import { useEffect, useState } from 'react';
frontend/src/components/QuizModal.tsx:2:import { api } from '../api';
frontend/src/components/QuizModal.tsx:4:// labels shown to the user → keyword stored (used to match catalog categories)
frontend/src/components/QuizModal.tsx:5:// only categories that are actually recommended (no alcohol/breakfast — those are
frontend/src/components/QuizModal.tsx:6:// excluded from the recommendation system, so don't offer them in onboarding)
frontend/src/components/QuizModal.tsx:7:const CATEGORIES: { label: string; key: string; icon: string }[] = [
frontend/src/components/QuizModal.tsx:8:  { label: 'Кофе', key: 'кофе', icon: '☕' },
frontend/src/components/QuizModal.tsx:9:  { label: 'Стейки', key: 'стейк', icon: '🥩' },
frontend/src/components/QuizModal.tsx:10:  { label: 'Бургеры', key: 'бургер', icon: '🍔' },
frontend/src/components/QuizModal.tsx:11:  { label: 'Пицца', key: 'пицц', icon: '🍕' },
frontend/src/components/QuizModal.tsx:12:  { label: 'Суши', key: 'японск', icon: '🍣' },
frontend/src/components/QuizModal.tsx:13:  { label: 'Грузинская', key: 'грузин', icon: '🫓' },
frontend/src/components/QuizModal.tsx:14:  { label: 'Десерты', key: 'десерт', icon: '🍰' },
frontend/src/components/QuizModal.tsx:15:  { label: 'Морепродукты', key: 'морепрод', icon: '🦐' },
frontend/src/components/QuizModal.tsx:16:];
frontend/src/components/QuizModal.tsx:17:const PRICES = [
frontend/src/components/QuizModal.tsx:18:  { label: '₽ доступно', value: 1 },
frontend/src/components/QuizModal.tsx:19:  { label: '₽₽ средне', value: 2 },
frontend/src/components/QuizModal.tsx:20:  { label: '₽₽₽ премиум', value: 3 },
frontend/src/components/QuizModal.tsx:21:];
frontend/src/components/QuizModal.tsx:23:export function QuizModal({ onDone }: { onDone: () => void }) {
frontend/src/components/QuizModal.tsx:24:  const [step, setStep] = useState(0);
frontend/src/components/QuizModal.tsx:25:  const [cats, setCats] = useState<string[]>([]);
frontend/src/components/QuizModal.tsx:26:  const [price, setPrice] = useState<number>(0);
frontend/src/components/QuizModal.tsx:27:  const [busy, setBusy] = useState(false);
frontend/src/components/QuizModal.tsx:29:  // pre-select what was chosen before, so "Изменить вкусы" shows the current picks
frontend/src/components/QuizModal.tsx:30:  useEffect(() => {
frontend/src/components/QuizModal.tsx:31:    api
frontend/src/components/QuizModal.tsx:32:      .onboarding()
frontend/src/components/QuizModal.tsx:33:      .then((o) => {
frontend/src/components/QuizModal.tsx:34:        if (o.preferences?.categories) setCats(o.preferences.categories);
frontend/src/components/QuizModal.tsx:35:        if (o.preferences?.price) setPrice(o.preferences.price);
frontend/src/components/QuizModal.tsx:36:      })
frontend/src/components/QuizModal.tsx:37:      .catch(() => {});
frontend/src/components/QuizModal.tsx:38:  }, []);
frontend/src/components/QuizModal.tsx:40:  const toggle = (k: string) =>
frontend/src/components/QuizModal.tsx:41:    setCats((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));
frontend/src/components/QuizModal.tsx:43:  const finish = () => {
frontend/src/components/QuizModal.tsx:44:    setBusy(true);
frontend/src/components/QuizModal.tsx:45:    api
frontend/src/components/QuizModal.tsx:46:      .setOnboarding({ categories: cats, price: price || undefined })
frontend/src/components/QuizModal.tsx:47:      .then(onDone)
frontend/src/components/QuizModal.tsx:48:      .catch(() => setBusy(false));
frontend/src/components/QuizModal.tsx:49:  };
frontend/src/components/QuizModal.tsx:51:  // mission greeting — once, only for genuinely new users (not «Изменить вкусы»)
frontend/src/components/QuizModal.tsx:52:  const [intro, setIntro] = useState(() => {
frontend/src/components/QuizModal.tsx:53:    try { return !localStorage.getItem('welcomeSeen'); } catch { return false; }
frontend/src/components/QuizModal.tsx:54:  });
frontend/src/components/QuizModal.tsx:55:  const closeIntro = () => {
frontend/src/components/QuizModal.tsx:56:    try { localStorage.setItem('welcomeSeen', '1'); } catch { /* private mode */ }
frontend/src/components/QuizModal.tsx:57:    setIntro(false);
frontend/src/components/QuizModal.tsx:58:  };
frontend/src/components/QuizModal.tsx:60:  if (intro) {
frontend/src/components/QuizModal.tsx:61:    return (
frontend/src/components/QuizModal.tsx:62:      <div className="quiz">
frontend/src/components/QuizModal.tsx:63:        <div className="quiz-inner">
frontend/src/components/QuizModal.tsx:64:          <div className="quiz-hero">🥂</div>
frontend/src/components/QuizModal.tsx:65:          <h2 className="quiz-h">Это клуб дегустаторов Москвы</h2>
frontend/src/components/QuizModal.tsx:66:          <p className="quiz-sub">
frontend/src/components/QuizModal.tsx:67:            Здесь не читают чужие обзоры — здесь пробуют сами.
frontend/src/components/QuizModal.tsx:68:          </p>
frontend/src/components/QuizModal.tsx:69:          <div className="welcome-points">
frontend/src/components/QuizModal.tsx:70:            <div className="wp"><span>⭐</span> Оценивайте блюда и напитки — каждая оценка обучает ваши личные рекомендации</div>
frontend/src/components/QuizModal.tsx:71:            <div className="wp"><span>🔓</span> Первые 5 оценок открывают рейтинги категории — вы видите лучшее по мнению клуба</div>
frontend/src/components/QuizModal.tsx:72:            <div className="wp"><span>🏅</span> Попробовали первым — ваше имя останется в истории карточки навсегда</div>
frontend/src/components/QuizModal.tsx:73:          </div>
frontend/src/components/QuizModal.tsx:74:          <button className="btn" onClick={closeIntro}>Стать дегустатором</button>
frontend/src/components/QuizModal.tsx:75:        </div>
frontend/src/components/QuizModal.tsx:76:      </div>
frontend/src/components/QuizModal.tsx:77:    );
frontend/src/components/QuizModal.tsx:78:  }
frontend/src/components/QuizModal.tsx:80:  return (
frontend/src/components/QuizModal.tsx:81:    <div className="quiz">
frontend/src/components/QuizModal.tsx:82:      <div className="quiz-inner">
frontend/src/components/QuizModal.tsx:83:        {step === 0 ? (
frontend/src/components/QuizModal.tsx:84:          <>
frontend/src/components/QuizModal.tsx:85:            <div className="quiz-hero">🍷☕🥩</div>
frontend/src/components/QuizModal.tsx:86:            <h2 className="quiz-h">Добро пожаловать в клуб дегустаторов!</h2>
frontend/src/components/QuizModal.tsx:87:            <p className="quiz-sub">Дегустатором чего вы хотите стать? Выберите, что вам интересно — под это подберём, что пробовать.</p>
frontend/src/components/QuizModal.tsx:88:            <div className="quiz-grid">
frontend/src/components/QuizModal.tsx:89:              {CATEGORIES.map((c) => (
frontend/src/components/QuizModal.tsx:90:                <button
frontend/src/components/QuizModal.tsx:91:                  key={c.key}
frontend/src/components/QuizModal.tsx:92:                  className={'quiz-cat' + (cats.includes(c.key) ? ' on' : '')}
frontend/src/components/QuizModal.tsx:93:                  onClick={() => toggle(c.key)}
frontend/src/components/QuizModal.tsx:94:                >
frontend/src/components/QuizModal.tsx:95:                  <span className="quiz-cat-ico">{c.icon}</span>
frontend/src/components/QuizModal.tsx:96:                  {c.label}
frontend/src/components/QuizModal.tsx:97:                </button>
frontend/src/components/QuizModal.tsx:98:              ))}
frontend/src/components/QuizModal.tsx:99:            </div>
frontend/src/components/QuizModal.tsx:100:            <button className="btn" disabled={cats.length === 0} onClick={() => setStep(1)}>
frontend/src/components/QuizModal.tsx:101:              Далее
frontend/src/components/QuizModal.tsx:102:            </button>
frontend/src/components/QuizModal.tsx:103:          </>
frontend/src/components/QuizModal.tsx:104:        ) : step === 1 ? (
frontend/src/components/QuizModal.tsx:105:          <>
frontend/src/components/QuizModal.tsx:106:            <h2 className="quiz-h">Ваш сегмент</h2>
frontend/src/components/QuizModal.tsx:107:            <p className="quiz-sub">Какие места вам ближе? (необязательно)</p>
frontend/src/components/QuizModal.tsx:108:            <div className="chips wrap" style={{ justifyContent: 'center' }}>
frontend/src/components/QuizModal.tsx:109:              {PRICES.map((p) => (
frontend/src/components/QuizModal.tsx:110:                <button
frontend/src/components/QuizModal.tsx:111:                  key={p.value}
frontend/src/components/QuizModal.tsx:112:                  className={'chip' + (price === p.value ? ' active' : '')}
frontend/src/components/QuizModal.tsx:113:                  onClick={() => setPrice(price === p.value ? 0 : p.value)}
frontend/src/components/QuizModal.tsx:114:                >
frontend/src/components/QuizModal.tsx:115:                  {p.label}
frontend/src/components/QuizModal.tsx:116:                </button>
frontend/src/components/QuizModal.tsx:117:              ))}
frontend/src/components/QuizModal.tsx:118:            </div>
frontend/src/components/QuizModal.tsx:119:            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
frontend/src/components/QuizModal.tsx:120:              <button className="btn secondary" onClick={() => setStep(0)} disabled={busy}>
frontend/src/components/QuizModal.tsx:121:                Назад
frontend/src/components/QuizModal.tsx:122:              </button>
frontend/src/components/QuizModal.tsx:123:              <button className="btn" onClick={() => setStep(2)} disabled={busy}>
frontend/src/components/QuizModal.tsx:124:                Далее
frontend/src/components/QuizModal.tsx:125:              </button>
frontend/src/components/QuizModal.tsx:126:            </div>
frontend/src/components/QuizModal.tsx:127:          </>
frontend/src/components/QuizModal.tsx:128:        ) : (
frontend/src/components/QuizModal.tsx:129:          <>
frontend/src/components/QuizModal.tsx:130:            <div className="quiz-hero">🎯</div>
frontend/src/components/QuizModal.tsx:131:            <h2 className="quiz-h">Как это работает</h2>
frontend/src/components/QuizModal.tsx:132:            <p className="quiz-sub">
frontend/src/components/QuizModal.tsx:133:              Каждая ваша оценка <b>обучает алгоритм вашему вкусу</b>. Чем больше блюд и напитков
frontend/src/components/QuizModal.tsx:134:              вы оцениваете, тем точнее мы понимаем, что вам зайдёт, и тем лучше подбираем похожее.
frontend/src/components/QuizModal.tsx:135:            </p>
frontend/src/components/QuizModal.tsx:136:            <ul className="quiz-how">
frontend/src/components/QuizModal.tsx:137:              <li>⭐ Оценивайте — система учится на ваших оценках</li>
frontend/src/components/QuizModal.tsx:138:              <li>🧠 Находит дегустаторов с похожим вкусом</li>
frontend/src/components/QuizModal.tsx:139:              <li>🍷 Показывает «вероятность, что вам понравится»</li>
frontend/src/components/QuizModal.tsx:140:            </ul>
frontend/src/components/QuizModal.tsx:141:            <p className="quiz-sub" style={{ marginTop: 4 }}>
frontend/src/components/QuizModal.tsx:142:              Уже после первых оценок рекомендации станут точнее.
frontend/src/components/QuizModal.tsx:143:            </p>
frontend/src/components/QuizModal.tsx:144:            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
frontend/src/components/QuizModal.tsx:145:              <button className="btn secondary" onClick={() => setStep(1)} disabled={busy}>
frontend/src/components/QuizModal.tsx:146:                Назад
frontend/src/components/QuizModal.tsx:147:              </button>
frontend/src/components/QuizModal.tsx:148:              <button className="btn" onClick={finish} disabled={busy}>
frontend/src/components/QuizModal.tsx:149:                {busy ? 'Сохранение…' : 'Начать дегустировать'}
frontend/src/components/QuizModal.tsx:150:              </button>
frontend/src/components/QuizModal.tsx:151:            </div>
frontend/src/components/QuizModal.tsx:152:          </>
frontend/src/components/QuizModal.tsx:153:        )}
frontend/src/components/QuizModal.tsx:154:      </div>
frontend/src/components/QuizModal.tsx:155:    </div>
frontend/src/components/QuizModal.tsx:156:  );
frontend/src/components/QuizModal.tsx:157:}
frontend/src/components/Filters.tsx:1:import { useState } from 'react';
frontend/src/components/Filters.tsx:2:import { useEscClose } from '../modalEsc';
frontend/src/components/Filters.tsx:4:export type SortKey = 'recommended' | 'rating' | 'reviews' | 'distance';
frontend/src/components/Filters.tsx:6:const SORTS: { value: SortKey; label: string }[] = [
frontend/src/components/Filters.tsx:7:  { value: 'recommended', label: 'Рекомендуемые' },
frontend/src/components/Filters.tsx:8:  { value: 'distance', label: 'По расстоянию' },
frontend/src/components/Filters.tsx:9:  { value: 'rating', label: 'По рейтингу' },
frontend/src/components/Filters.tsx:10:  { value: 'reviews', label: 'По отзывам' },
frontend/src/components/Filters.tsx:11:];
frontend/src/components/Filters.tsx:13:const PRICES: { value: number; label: string }[] = [
frontend/src/components/Filters.tsx:14:  { value: 0, label: 'Любая' },
frontend/src/components/Filters.tsx:15:  { value: 1, label: '₽' },
frontend/src/components/Filters.tsx:16:  { value: 2, label: '₽₽' },
frontend/src/components/Filters.tsx:17:  { value: 3, label: '₽₽₽' },
frontend/src/components/Filters.tsx:18:  { value: 4, label: '₽₽₽₽' },
frontend/src/components/Filters.tsx:19:];
frontend/src/components/Filters.tsx:21:const CUISINES: { value: string; label: string }[] = [
frontend/src/components/Filters.tsx:22:  { value: '', label: 'Любая' },
frontend/src/components/Filters.tsx:23:  { value: 'russian', label: 'Русская' },
frontend/src/components/Filters.tsx:24:  { value: 'georgian', label: 'Грузинская' },
frontend/src/components/Filters.tsx:25:  { value: 'italian', label: 'Итальянская' },
frontend/src/components/Filters.tsx:26:  { value: 'pizza', label: 'Пицца' },
frontend/src/components/Filters.tsx:27:  { value: 'sushi', label: 'Японская / суши' },
frontend/src/components/Filters.tsx:28:  { value: 'asian', label: 'Азиатская' },
frontend/src/components/Filters.tsx:29:  { value: 'chinese', label: 'Китайская' },
frontend/src/components/Filters.tsx:30:  { value: 'burger', label: 'Бургеры' },
frontend/src/components/Filters.tsx:31:  { value: 'coffee', label: 'Кофе' },
frontend/src/components/Filters.tsx:32:  { value: 'barbecue', label: 'Шашлык / гриль' },
frontend/src/components/Filters.tsx:33:  { value: 'fast_food', label: 'Фастфуд' },
frontend/src/components/Filters.tsx:34:];
frontend/src/components/Filters.tsx:36:export interface FilterState {
frontend/src/components/Filters.tsx:37:  sort: SortKey;
frontend/src/components/Filters.tsx:38:  price: number;
frontend/src/components/Filters.tsx:39:  openNow: boolean;
frontend/src/components/Filters.tsx:40:  cuisine: string;
frontend/src/components/Filters.tsx:41:}
frontend/src/components/Filters.tsx:43:const DEFAULTS: FilterState = { sort: 'recommended', price: 0, openNow: false, cuisine: '' };
frontend/src/components/Filters.tsx:45:function SlidersIcon() {
frontend/src/components/Filters.tsx:46:  return (
frontend/src/components/Filters.tsx:47:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
frontend/src/components/Filters.tsx:48:      <line x1="3" y1="7" x2="21" y2="7" />
frontend/src/components/Filters.tsx:49:      <line x1="3" y1="12" x2="21" y2="12" />
frontend/src/components/Filters.tsx:50:      <line x1="3" y1="17" x2="21" y2="17" />
frontend/src/components/Filters.tsx:51:      <circle cx="8" cy="7" r="2.4" fill="#fff" />
frontend/src/components/Filters.tsx:52:      <circle cx="16" cy="12" r="2.4" fill="#fff" />
frontend/src/components/Filters.tsx:53:      <circle cx="9" cy="17" r="2.4" fill="#fff" />
frontend/src/components/Filters.tsx:54:    </svg>
frontend/src/components/Filters.tsx:55:  );
frontend/src/components/Filters.tsx:56:}
frontend/src/components/Filters.tsx:58:type DropKey = 'sort' | 'price' | 'cuisine';
frontend/src/components/Filters.tsx:60:export function Filters({
frontend/src/components/Filters.tsx:61:  state,
frontend/src/components/Filters.tsx:62:  onChange,
frontend/src/components/Filters.tsx:63:  variant = 'venue',
frontend/src/components/Filters.tsx:64:}: {
frontend/src/components/Filters.tsx:65:  state: FilterState;
frontend/src/components/Filters.tsx:66:  onChange: (next: Partial<FilterState>) => void;
frontend/src/components/Filters.tsx:67:  variant?: 'venue' | 'item'; // items: sort only (price/openNow/cuisine don't apply)
frontend/src/components/Filters.tsx:68:}) {
frontend/src/components/Filters.tsx:69:  const isItem = variant === 'item';
frontend/src/components/Filters.tsx:70:  const [sheet, setSheet] = useState(false);
frontend/src/components/Filters.tsx:71:  const [open, setOpen] = useState<DropKey | null>(null);
frontend/src/components/Filters.tsx:72:  const toggle = (k: DropKey) => setOpen((o) => (o === k ? null : k));
frontend/src/components/Filters.tsx:73:  const pick = (patch: Partial<FilterState>) => {
frontend/src/components/Filters.tsx:74:    onChange(patch);
frontend/src/components/Filters.tsx:75:    setOpen(null);
frontend/src/components/Filters.tsx:76:  };
frontend/src/components/Filters.tsx:78:  const sortLabel = SORTS.find((s) => s.value === state.sort)!.label;
frontend/src/components/Filters.tsx:79:  const cuisineLabel = CUISINES.find((c) => c.value === state.cuisine)?.label;
frontend/src/components/Filters.tsx:81:  return (
frontend/src/components/Filters.tsx:82:    <div className="filters-wrap">
frontend/src/components/Filters.tsx:83:      <div className="filterbar">
frontend/src/components/Filters.tsx:84:        {!isItem && (
frontend/src/components/Filters.tsx:85:          <button className="fbtn-icon" onClick={() => setSheet(true)} aria-label="Все фильтры">
frontend/src/components/Filters.tsx:86:            <SlidersIcon />
frontend/src/components/Filters.tsx:87:          </button>
frontend/src/components/Filters.tsx:88:        )}
frontend/src/components/Filters.tsx:89:        <button
frontend/src/components/Filters.tsx:90:          className={'chip' + (state.sort !== 'recommended' ? ' active' : '') + (open === 'sort' ? ' open' : '')}
frontend/src/components/Filters.tsx:91:          onClick={() => toggle('sort')}
frontend/src/components/Filters.tsx:92:        >
frontend/src/components/Filters.tsx:93:          {state.sort === 'recommended' ? 'Сортировка' : sortLabel} ▾
frontend/src/components/Filters.tsx:94:        </button>
frontend/src/components/Filters.tsx:95:        {!isItem && (
frontend/src/components/Filters.tsx:96:          <>
frontend/src/components/Filters.tsx:97:            <button
frontend/src/components/Filters.tsx:98:              className={'chip' + (state.openNow ? ' active' : '')}
frontend/src/components/Filters.tsx:99:              onClick={() => onChange({ openNow: !state.openNow })}
frontend/src/components/Filters.tsx:100:            >
frontend/src/components/Filters.tsx:101:              Открыто сейчас
frontend/src/components/Filters.tsx:102:            </button>
frontend/src/components/Filters.tsx:103:            <button
frontend/src/components/Filters.tsx:104:              className={'chip' + (state.price > 0 ? ' active' : '') + (open === 'price' ? ' open' : '')}
frontend/src/components/Filters.tsx:105:              onClick={() => toggle('price')}
frontend/src/components/Filters.tsx:106:            >
frontend/src/components/Filters.tsx:107:              {state.price ? '₽'.repeat(state.price) : 'Цена'} ▾
frontend/src/components/Filters.tsx:108:            </button>
frontend/src/components/Filters.tsx:109:            <button
frontend/src/components/Filters.tsx:110:              className={'chip' + (state.cuisine ? ' active' : '') + (open === 'cuisine' ? ' open' : '')}
frontend/src/components/Filters.tsx:111:              onClick={() => toggle('cuisine')}
frontend/src/components/Filters.tsx:112:            >
frontend/src/components/Filters.tsx:113:              {state.cuisine ? cuisineLabel : 'Кухня'} ▾
frontend/src/components/Filters.tsx:114:            </button>
frontend/src/components/Filters.tsx:115:          </>
frontend/src/components/Filters.tsx:116:        )}
frontend/src/components/Filters.tsx:117:      </div>
frontend/src/components/Filters.tsx:119:      {open && (
frontend/src/components/Filters.tsx:120:        <>
frontend/src/components/Filters.tsx:121:          <div className="fdrop-backdrop" onClick={() => setOpen(null)} />
frontend/src/components/Filters.tsx:122:          <div className="fdrop">
frontend/src/components/Filters.tsx:123:            {open === 'sort' &&
frontend/src/components/Filters.tsx:124:              (isItem ? SORTS.filter((s) => s.value !== 'distance') : SORTS).map((s) => (
frontend/src/components/Filters.tsx:125:                <button
frontend/src/components/Filters.tsx:126:                  key={s.value}
frontend/src/components/Filters.tsx:127:                  className={'fdrop-item' + (state.sort === s.value ? ' active' : '')}
frontend/src/components/Filters.tsx:128:                  onClick={() => pick({ sort: s.value })}
frontend/src/components/Filters.tsx:129:                >
frontend/src/components/Filters.tsx:130:                  {s.label}
frontend/src/components/Filters.tsx:131:                </button>
frontend/src/components/Filters.tsx:132:              ))}
frontend/src/components/Filters.tsx:133:            {open === 'price' &&
frontend/src/components/Filters.tsx:134:              PRICES.map((p) => (
frontend/src/components/Filters.tsx:135:                <button
frontend/src/components/Filters.tsx:136:                  key={p.value}
frontend/src/components/Filters.tsx:137:                  className={'fdrop-item' + (state.price === p.value ? ' active' : '')}
frontend/src/components/Filters.tsx:138:                  onClick={() => pick({ price: p.value })}
frontend/src/components/Filters.tsx:139:                >
frontend/src/components/Filters.tsx:140:                  {p.label}
frontend/src/components/Filters.tsx:141:                </button>
frontend/src/components/Filters.tsx:142:              ))}
frontend/src/components/Filters.tsx:143:            {open === 'cuisine' &&
frontend/src/components/Filters.tsx:144:              CUISINES.map((c) => (
frontend/src/components/Filters.tsx:145:                <button
frontend/src/components/Filters.tsx:146:                  key={c.value}
frontend/src/components/Filters.tsx:147:                  className={'fdrop-item' + (state.cuisine === c.value ? ' active' : '')}
frontend/src/components/Filters.tsx:148:                  onClick={() => pick({ cuisine: c.value })}
frontend/src/components/Filters.tsx:149:                >
frontend/src/components/Filters.tsx:150:                  {c.label}
frontend/src/components/Filters.tsx:151:                </button>
frontend/src/components/Filters.tsx:152:              ))}
frontend/src/components/Filters.tsx:153:          </div>
frontend/src/components/Filters.tsx:154:        </>
frontend/src/components/Filters.tsx:155:      )}
frontend/src/components/Filters.tsx:157:      {sheet && (
frontend/src/components/Filters.tsx:158:        <FiltersSheet
frontend/src/components/Filters.tsx:159:          initial={state}
frontend/src/components/Filters.tsx:160:          onApply={(next) => {
frontend/src/components/Filters.tsx:161:            onChange(next);
frontend/src/components/Filters.tsx:162:            setSheet(false);
frontend/src/components/Filters.tsx:163:          }}
frontend/src/components/Filters.tsx:164:          onClose={() => setSheet(false)}
frontend/src/components/Filters.tsx:165:        />
frontend/src/components/Filters.tsx:166:      )}
frontend/src/components/Filters.tsx:167:    </div>
frontend/src/components/Filters.tsx:168:  );
frontend/src/components/Filters.tsx:169:}
frontend/src/components/Filters.tsx:171:function FiltersSheet({
frontend/src/components/Filters.tsx:172:  initial,
frontend/src/components/Filters.tsx:173:  onApply,
frontend/src/components/Filters.tsx:174:  onClose,
frontend/src/components/Filters.tsx:175:}: {
frontend/src/components/Filters.tsx:176:  initial: FilterState;
frontend/src/components/Filters.tsx:177:  onApply: (next: FilterState) => void;
frontend/src/components/Filters.tsx:178:  onClose: () => void;
frontend/src/components/Filters.tsx:179:}) {
frontend/src/components/Filters.tsx:180:  const [draft, setDraft] = useState<FilterState>(initial);
frontend/src/components/Filters.tsx:181:  const set = (p: Partial<FilterState>) => setDraft((d) => ({ ...d, ...p }));
frontend/src/components/Filters.tsx:182:  // Esc / Back / tap-outside closes ONLY this sheet (one step back), not the whole
frontend/src/components/Filters.tsx:183:  // map-browse behind it — the global stack pops the topmost layer first.
frontend/src/components/Filters.tsx:184:  useEscClose(onClose);
frontend/src/components/Filters.tsx:186:  return (
frontend/src/components/Filters.tsx:187:    <div className="modal-backdrop" style={{ zIndex: 80 }} onClick={onClose}>
frontend/src/components/Filters.tsx:188:      <div className="modal filters-modal" onClick={(e) => e.stopPropagation()}>
frontend/src/components/Filters.tsx:189:        <div className="sheet-head">
frontend/src/components/Filters.tsx:190:          <button className="link-btn" onClick={onClose}>Закрыть</button>
frontend/src/components/Filters.tsx:191:          <b>Фильтры</b>
frontend/src/components/Filters.tsx:192:          <button className="link-btn" onClick={() => setDraft(DEFAULTS)}>Сбросить</button>
frontend/src/components/Filters.tsx:193:        </div>
frontend/src/components/Filters.tsx:195:        <div className="filters-scroll">
frontend/src/components/Filters.tsx:196:        <div className="section-title">Цена</div>
frontend/src/components/Filters.tsx:197:        <div className="opt-chips">
frontend/src/components/Filters.tsx:198:          {PRICES.map((p) => (
frontend/src/components/Filters.tsx:199:            <button
frontend/src/components/Filters.tsx:200:              key={p.value}
frontend/src/components/Filters.tsx:201:              className={'chip' + (draft.price === p.value ? ' active' : '')}
frontend/src/components/Filters.tsx:202:              onClick={() => set({ price: p.value })}
frontend/src/components/Filters.tsx:203:            >
frontend/src/components/Filters.tsx:204:              {p.label}
frontend/src/components/Filters.tsx:205:            </button>
frontend/src/components/Filters.tsx:206:          ))}
frontend/src/components/Filters.tsx:207:        </div>
frontend/src/components/Filters.tsx:209:        <div className="section-title">Популярное</div>
frontend/src/components/Filters.tsx:210:        <label className="opt-row">
frontend/src/components/Filters.tsx:211:          <span>Открыто сейчас</span>
frontend/src/components/Filters.tsx:212:          <input type="checkbox" checked={draft.openNow} onChange={(e) => set({ openNow: e.target.checked })} />
frontend/src/components/Filters.tsx:213:        </label>
frontend/src/components/Filters.tsx:215:        <div className="section-title">Сортировка</div>
frontend/src/components/Filters.tsx:216:        {SORTS.map((s) => (
frontend/src/components/Filters.tsx:217:          <label key={s.value} className="opt-row">
frontend/src/components/Filters.tsx:218:            <span>{s.label}</span>
frontend/src/components/Filters.tsx:219:            <input
frontend/src/components/Filters.tsx:220:              type="radio"
frontend/src/components/Filters.tsx:221:              name="sort"
frontend/src/components/Filters.tsx:222:              checked={draft.sort === s.value}
frontend/src/components/Filters.tsx:223:              onChange={() => set({ sort: s.value })}
frontend/src/components/Filters.tsx:224:            />
frontend/src/components/Filters.tsx:225:          </label>
frontend/src/components/Filters.tsx:226:        ))}
frontend/src/components/Filters.tsx:228:        <div className="section-title">Кухня</div>
frontend/src/components/Filters.tsx:229:        <div className="opt-chips">
frontend/src/components/Filters.tsx:230:          {CUISINES.map((c) => (
frontend/src/components/Filters.tsx:231:            <button
frontend/src/components/Filters.tsx:232:              key={c.value}
frontend/src/components/Filters.tsx:233:              className={'chip' + (draft.cuisine === c.value ? ' active' : '')}
frontend/src/components/Filters.tsx:234:              onClick={() => set({ cuisine: c.value })}
frontend/src/components/Filters.tsx:235:            >
frontend/src/components/Filters.tsx:236:              {c.label}
frontend/src/components/Filters.tsx:237:            </button>
frontend/src/components/Filters.tsx:238:          ))}
frontend/src/components/Filters.tsx:239:        </div>
frontend/src/components/Filters.tsx:240:        </div>
frontend/src/components/Filters.tsx:242:        <div className="apply-sticky">
frontend/src/components/Filters.tsx:243:          <button className="btn" onClick={() => onApply(draft)}>
frontend/src/components/Filters.tsx:244:            Применить
frontend/src/components/Filters.tsx:245:          </button>
frontend/src/components/Filters.tsx:246:        </div>
frontend/src/components/Filters.tsx:247:      </div>
frontend/src/components/Filters.tsx:248:    </div>
frontend/src/components/Filters.tsx:249:  );
frontend/src/components/Filters.tsx:250:}
frontend/src/components/PhotoPostModal.tsx:1:import { useEffect, useRef, useState } from 'react';
frontend/src/components/PhotoPostModal.tsx:2:import { api } from '../api';
frontend/src/components/PhotoPostModal.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src/components/PhotoPostModal.tsx:4:import { useSwipeDismiss } from '../swipeDismiss';
frontend/src/components/PhotoPostModal.tsx:5:import { tg, openExternal } from '../telegram';
frontend/src/components/PhotoPostModal.tsx:6:import type { Comment, Review, VoteState, VoteType } from '../types';
frontend/src/components/PhotoPostModal.tsx:7:import { Stars } from './Stars';
frontend/src/components/PhotoPostModal.tsx:8:import { thumb } from '../img';
frontend/src/components/PhotoPostModal.tsx:10:const VOTE_LABEL: Record<VoteType, string> = {
frontend/src/components/PhotoPostModal.tsx:11:  USEFUL: '👍 Полезно',
frontend/src/components/PhotoPostModal.tsx:12:  FUNNY: '😄 Смешно',
frontend/src/components/PhotoPostModal.tsx:13:  COOL: '😎 Круто',
frontend/src/components/PhotoPostModal.tsx:14:  OHNO: '🙀 О нет',
frontend/src/components/PhotoPostModal.tsx:15:};
frontend/src/components/PhotoPostModal.tsx:17:// Full "Check-in Detail" view of a single photo review (our red/black/white style):
frontend/src/components/PhotoPostModal.tsx:18:// hero photo + author, item card, date, reactions, LOCATION, comments.
frontend/src/components/PhotoPostModal.tsx:19:export function PhotoPostModal({
frontend/src/components/PhotoPostModal.tsx:20:  review,
frontend/src/components/PhotoPostModal.tsx:21:  onClose,
frontend/src/components/PhotoPostModal.tsx:22:  onOpenUser,
frontend/src/components/PhotoPostModal.tsx:23:  onOpenListing,
frontend/src/components/PhotoPostModal.tsx:24:  onOpenVenue,
frontend/src/components/PhotoPostModal.tsx:25:  onEdit,
frontend/src/components/PhotoPostModal.tsx:26:  onDelete,
frontend/src/components/PhotoPostModal.tsx:27:}: {
frontend/src/components/PhotoPostModal.tsx:28:  review: Review;
frontend/src/components/PhotoPostModal.tsx:29:  onClose: () => void;
frontend/src/components/PhotoPostModal.tsx:30:  onOpenUser?: (userId: string) => void;
frontend/src/components/PhotoPostModal.tsx:31:  onOpenListing?: () => void;
frontend/src/components/PhotoPostModal.tsx:32:  onOpenVenue?: () => void;
frontend/src/components/PhotoPostModal.tsx:33:  onEdit?: () => void;
frontend/src/components/PhotoPostModal.tsx:34:  onDelete?: () => void;
frontend/src/components/PhotoPostModal.tsx:35:}) {
frontend/src/components/PhotoPostModal.tsx:36:  const photo = review.photoUrls?.[0] || review.listing?.photoUrl || undefined;
frontend/src/components/PhotoPostModal.tsx:37:  const u = review.user;
frontend/src/components/PhotoPostModal.tsx:38:  const initial = (u?.firstName ?? u?.username ?? '?').trim()[0]?.toUpperCase() ?? '?';
frontend/src/components/PhotoPostModal.tsx:39:  const [closing, setClosing] = useState(false);
frontend/src/components/PhotoPostModal.tsx:40:  // dead photo URL → hide the media instead of showing a broken-image icon
frontend/src/components/PhotoPostModal.tsx:41:  const [photoBroken, setPhotoBroken] = useState(false);
frontend/src/components/PhotoPostModal.tsx:42:  const [thumbBroken, setThumbBroken] = useState(false);
frontend/src/components/PhotoPostModal.tsx:43:  const [menu, setMenu] = useState(false);
frontend/src/components/PhotoPostModal.tsx:44:  const [toast, setToast] = useState('');
frontend/src/components/PhotoPostModal.tsx:45:  const [vote, setVote] = useState<VoteState>({
frontend/src/components/PhotoPostModal.tsx:46:    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
frontend/src/components/PhotoPostModal.tsx:47:    mine: [],
frontend/src/components/PhotoPostModal.tsx:48:  });
frontend/src/components/PhotoPostModal.tsx:49:  const [comments, setComments] = useState<Comment[]>([]);
frontend/src/components/PhotoPostModal.tsx:50:  const [text, setText] = useState('');
frontend/src/components/PhotoPostModal.tsx:51:  const [busy, setBusy] = useState(false);
frontend/src/components/PhotoPostModal.tsx:52:  const [err, setErr] = useState('');
frontend/src/components/PhotoPostModal.tsx:54:  const reqClose = () => {
frontend/src/components/PhotoPostModal.tsx:55:    setClosing(true);
frontend/src/components/PhotoPostModal.tsx:56:    setTimeout(onClose, 220);
frontend/src/components/PhotoPostModal.tsx:57:  };
frontend/src/components/PhotoPostModal.tsx:58:  useEscClose(reqClose);
frontend/src/components/PhotoPostModal.tsx:60:  // swipe-down anywhere (from the scroll top) dismisses — shared app-wide pattern
frontend/src/components/PhotoPostModal.tsx:61:  const sheetRef = useRef<HTMLDivElement>(null);
frontend/src/components/PhotoPostModal.tsx:62:  useSwipeDismiss(sheetRef, onClose);
frontend/src/components/PhotoPostModal.tsx:64:  useEffect(() => {
frontend/src/components/PhotoPostModal.tsx:65:    api.comments(review.id).then(setComments).catch(() => {});
frontend/src/components/PhotoPostModal.tsx:66:    api.voteState(review.id).then(setVote).catch(() => {});
frontend/src/components/PhotoPostModal.tsx:67:    // eslint-disable-next-line react-hooks/exhaustive-deps
frontend/src/components/PhotoPostModal.tsx:68:  }, [review.id]);
frontend/src/components/PhotoPostModal.tsx:70:  const doVote = (t: VoteType) => api.vote(review.id, t).then(setVote).catch(() => {});
frontend/src/components/PhotoPostModal.tsx:71:  const send = async () => {
frontend/src/components/PhotoPostModal.tsx:72:    if (!text.trim()) return;
frontend/src/components/PhotoPostModal.tsx:73:    setBusy(true);
frontend/src/components/PhotoPostModal.tsx:74:    setErr('');
frontend/src/components/PhotoPostModal.tsx:75:    try {
frontend/src/components/PhotoPostModal.tsx:76:      const c = await api.addComment(review.id, text.trim());
frontend/src/components/PhotoPostModal.tsx:77:      if (c) setComments((p) => [...p, c]);
frontend/src/components/PhotoPostModal.tsx:78:      setText('');
frontend/src/components/PhotoPostModal.tsx:79:    } catch (e: any) {
frontend/src/components/PhotoPostModal.tsx:80:      setErr(e?.message?.trim() || 'Не удалось отправить');
frontend/src/components/PhotoPostModal.tsx:81:    }
frontend/src/components/PhotoPostModal.tsx:82:    setBusy(false);
frontend/src/components/PhotoPostModal.tsx:83:  };
frontend/src/components/PhotoPostModal.tsx:85:  const shareLink = `https://t.me/togomoscow_bot?startapp=l_${review.listing?.id ?? ''}`;
frontend/src/components/PhotoPostModal.tsx:86:  const shareText = `${review.listing?.name ?? ''} — ${review.rating.toFixed(1)}★`;
frontend/src/components/PhotoPostModal.tsx:87:  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1600); };
frontend/src/components/PhotoPostModal.tsx:88:  const sendToFriend = () => {
frontend/src/components/PhotoPostModal.tsx:89:    setMenu(false);
frontend/src/components/PhotoPostModal.tsx:90:    const url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`;
frontend/src/components/PhotoPostModal.tsx:91:    if ((tg as any)?.openTelegramLink) (tg as any).openTelegramLink(url);
frontend/src/components/PhotoPostModal.tsx:92:    else openExternal(url);
frontend/src/components/PhotoPostModal.tsx:93:  };
frontend/src/components/PhotoPostModal.tsx:94:  const sharePhoto = () => { setMenu(false); if (photo) openExternal(photo); };
frontend/src/components/PhotoPostModal.tsx:95:  const copyLink = () => {
frontend/src/components/PhotoPostModal.tsx:96:    setMenu(false);
frontend/src/components/PhotoPostModal.tsx:97:    navigator.clipboard?.writeText(shareLink).then(() => showToast('Ссылка скопирована')).catch(() => showToast('Не удалось'));
frontend/src/components/PhotoPostModal.tsx:98:  };
frontend/src/components/PhotoPostModal.tsx:100:  const dateStr = (review as any).createdAt
frontend/src/components/PhotoPostModal.tsx:101:    ? new Date((review as any).createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
frontend/src/components/PhotoPostModal.tsx:102:    : '';
frontend/src/components/PhotoPostModal.tsx:104:  return (
frontend/src/components/PhotoPostModal.tsx:105:    <div className="modal-backdrop photo-post-backdrop" style={{ zIndex: 3400 }} onClick={reqClose}>
frontend/src/components/PhotoPostModal.tsx:106:      <div ref={sheetRef} className={'photo-post' + (closing ? ' closing' : '')} onClick={(e) => e.stopPropagation()}>
frontend/src/components/PhotoPostModal.tsx:107:        <button className="pp-dots" onClick={() => setMenu(true)} aria-label="Ещё">⋯</button>
frontend/src/components/PhotoPostModal.tsx:108:        <button className="pp-close" onClick={reqClose} aria-label="Закрыть">✕</button>
frontend/src/components/PhotoPostModal.tsx:110:        {/* HERO: full (uncropped) photo with the author + place overlaid on top */}
frontend/src/components/PhotoPostModal.tsx:111:        <div className="pp-hero">
frontend/src/components/PhotoPostModal.tsx:112:          {/* SAME 600px asset the list card already loaded → appears instantly from
frontend/src/components/PhotoPostModal.tsx:113:              the browser cache (900px was a different file = a visible re-fetch) */}
frontend/src/components/PhotoPostModal.tsx:114:          {photo && !photoBroken && <div className="ph-blur" style={{ backgroundImage: `url("${thumb(photo, 200)}")` }} />}
frontend/src/components/PhotoPostModal.tsx:115:          {photo && !photoBroken && <img className="pp-photo" src={thumb(photo, 600)} alt="" onError={() => setPhotoBroken(true)} />}
frontend/src/components/PhotoPostModal.tsx:116:          <button type="button" className="pp-head" onClick={() => u?.id && onOpenUser?.(u.id)}>
frontend/src/components/PhotoPostModal.tsx:117:            {u?.photoUrl ? (
frontend/src/components/PhotoPostModal.tsx:118:              <img className="pp-avatar" src={u.photoUrl} alt="" />
frontend/src/components/PhotoPostModal.tsx:119:            ) : (
frontend/src/components/PhotoPostModal.tsx:120:              <div className="pp-avatar ph">{initial}</div>
frontend/src/components/PhotoPostModal.tsx:121:            )}
frontend/src/components/PhotoPostModal.tsx:122:            <div className="pp-head-txt">
frontend/src/components/PhotoPostModal.tsx:123:              <b>{u?.firstName ?? u?.username ?? 'Гость'}</b>
frontend/src/components/PhotoPostModal.tsx:124:              {review.venue && (
frontend/src/components/PhotoPostModal.tsx:125:                <span
frontend/src/components/PhotoPostModal.tsx:126:                  className="pp-head-venue"
frontend/src/components/PhotoPostModal.tsx:127:                  onClick={(e) => { e.stopPropagation(); onOpenVenue?.(); }}
frontend/src/components/PhotoPostModal.tsx:128:                >
frontend/src/components/PhotoPostModal.tsx:129:                  {review.venue.name} ›
frontend/src/components/PhotoPostModal.tsx:130:                </span>
frontend/src/components/PhotoPostModal.tsx:131:              )}
frontend/src/components/PhotoPostModal.tsx:132:            </div>
frontend/src/components/PhotoPostModal.tsx:133:          </button>
frontend/src/components/PhotoPostModal.tsx:134:        </div>
frontend/src/components/PhotoPostModal.tsx:136:        {/* item card: thumb + name + place + style, then rating and caption */}
frontend/src/components/PhotoPostModal.tsx:137:        <div className="pp-card">
frontend/src/components/PhotoPostModal.tsx:138:          <button type="button" className="pp-card-main" onClick={onOpenListing}>
frontend/src/components/PhotoPostModal.tsx:139:            {review.listing?.photoUrl && !thumbBroken && (
frontend/src/components/PhotoPostModal.tsx:140:              <img className="pp-card-thumb" src={thumb(review.listing.photoUrl, 200)} alt="" onError={() => setThumbBroken(true)} />
frontend/src/components/PhotoPostModal.tsx:141:            )}
frontend/src/components/PhotoPostModal.tsx:142:            <div className="pp-card-info">
frontend/src/components/PhotoPostModal.tsx:143:              <b className="pp-card-name">{review.listing?.name}</b>
frontend/src/components/PhotoPostModal.tsx:144:              {review.venue && (
frontend/src/components/PhotoPostModal.tsx:145:                <span
frontend/src/components/PhotoPostModal.tsx:146:                  className="pp-card-sub"
frontend/src/components/PhotoPostModal.tsx:147:                  onClick={(e) => { e.stopPropagation(); onOpenVenue?.(); }}
frontend/src/components/PhotoPostModal.tsx:148:                >
frontend/src/components/PhotoPostModal.tsx:149:                  {review.venue.name}
frontend/src/components/PhotoPostModal.tsx:150:                </span>
frontend/src/components/PhotoPostModal.tsx:151:              )}
frontend/src/components/PhotoPostModal.tsx:152:              {review.listing?.category && !/^(блюдо|напиток)$/i.test(review.listing.category) && (
frontend/src/components/PhotoPostModal.tsx:153:                <span className="pp-card-style">{review.listing.category}</span>
frontend/src/components/PhotoPostModal.tsx:154:              )}
frontend/src/components/PhotoPostModal.tsx:155:            </div>
frontend/src/components/PhotoPostModal.tsx:156:          </button>
frontend/src/components/PhotoPostModal.tsx:157:          <div className="pp-card-rating">
frontend/src/components/PhotoPostModal.tsx:158:            <Stars value={review.rating} />
frontend/src/components/PhotoPostModal.tsx:159:            <span className="pp-card-score">{review.rating.toFixed(2)}</span>
frontend/src/components/PhotoPostModal.tsx:160:          </div>
frontend/src/components/PhotoPostModal.tsx:161:          {review.text && <div className="pp-card-text">{review.text}</div>}
frontend/src/components/PhotoPostModal.tsx:162:        </div>
frontend/src/components/PhotoPostModal.tsx:164:        <div className="pp-body">
frontend/src/components/PhotoPostModal.tsx:165:          {dateStr && <div className="pp-date">{dateStr}</div>}
frontend/src/components/PhotoPostModal.tsx:167:          <div className="pp-votes">
frontend/src/components/PhotoPostModal.tsx:168:            {(['USEFUL', 'FUNNY', 'COOL', 'OHNO'] as VoteType[]).map((t) => (
frontend/src/components/PhotoPostModal.tsx:169:              <button
frontend/src/components/PhotoPostModal.tsx:170:                key={t}
frontend/src/components/PhotoPostModal.tsx:171:                className={'pp-vote' + (vote.mine.includes(t) ? ' active' : '')}
frontend/src/components/PhotoPostModal.tsx:172:                onClick={() => doVote(t)}
frontend/src/components/PhotoPostModal.tsx:173:              >
frontend/src/components/PhotoPostModal.tsx:174:                {VOTE_LABEL[t]}
frontend/src/components/PhotoPostModal.tsx:175:                {vote.counts[t] ? ` ${vote.counts[t]}` : ''}
frontend/src/components/PhotoPostModal.tsx:176:              </button>
frontend/src/components/PhotoPostModal.tsx:177:            ))}
frontend/src/components/PhotoPostModal.tsx:178:          </div>
frontend/src/components/PhotoPostModal.tsx:180:          {review.venue && (
frontend/src/components/PhotoPostModal.tsx:181:            <button type="button" className="pp-location" onClick={onOpenVenue}>
frontend/src/components/PhotoPostModal.tsx:182:              <div className="pp-loc-head">МЕСТО</div>
frontend/src/components/PhotoPostModal.tsx:183:              <div className="pp-loc-row">
frontend/src/components/PhotoPostModal.tsx:184:                <span className="pp-loc-ico">📍</span>
frontend/src/components/PhotoPostModal.tsx:185:                <b>{review.venue.name}</b>
frontend/src/components/PhotoPostModal.tsx:186:                <span className="pp-loc-chev">›</span>
frontend/src/components/PhotoPostModal.tsx:187:              </div>
frontend/src/components/PhotoPostModal.tsx:188:            </button>
frontend/src/components/PhotoPostModal.tsx:189:          )}
frontend/src/components/PhotoPostModal.tsx:191:          <div className="pp-comments">
frontend/src/components/PhotoPostModal.tsx:192:            <div className="pp-comments-title">Комментарии</div>
frontend/src/components/PhotoPostModal.tsx:193:            {comments.length === 0 ? (
frontend/src/components/PhotoPostModal.tsx:194:              <div className="pp-empty">Пока нет комментариев. Будьте первым!</div>
frontend/src/components/PhotoPostModal.tsx:195:            ) : (
frontend/src/components/PhotoPostModal.tsx:196:              comments.map((c) => (
frontend/src/components/PhotoPostModal.tsx:197:                <div key={c.id} className="pp-cmt">
frontend/src/components/PhotoPostModal.tsx:198:                  <button
frontend/src/components/PhotoPostModal.tsx:199:                    type="button"
frontend/src/components/PhotoPostModal.tsx:200:                    className="pp-cmt-av"
frontend/src/components/PhotoPostModal.tsx:201:                    onClick={() => c.user?.id && onOpenUser?.(c.user.id)}
frontend/src/components/PhotoPostModal.tsx:202:                  >
frontend/src/components/PhotoPostModal.tsx:203:                    {c.user?.photoUrl ? (
frontend/src/components/PhotoPostModal.tsx:204:                      <img src={c.user.photoUrl} alt="" />
frontend/src/components/PhotoPostModal.tsx:205:                    ) : (
frontend/src/components/PhotoPostModal.tsx:206:                      <span className="ph">{(c.user?.firstName ?? '?')[0]?.toUpperCase() ?? '?'}</span>
frontend/src/components/PhotoPostModal.tsx:207:                    )}
frontend/src/components/PhotoPostModal.tsx:208:                  </button>
frontend/src/components/PhotoPostModal.tsx:209:                  <div className="pp-cmt-body">
frontend/src/components/PhotoPostModal.tsx:210:                    <b>{c.user?.firstName ?? c.user?.username ?? 'Гость'}</b> {c.text}
frontend/src/components/PhotoPostModal.tsx:211:                  </div>
frontend/src/components/PhotoPostModal.tsx:212:                </div>
frontend/src/components/PhotoPostModal.tsx:213:              ))
frontend/src/components/PhotoPostModal.tsx:214:            )}
frontend/src/components/PhotoPostModal.tsx:215:          </div>
frontend/src/components/PhotoPostModal.tsx:217:          {err && <div className="pp-err">{err}</div>}
frontend/src/components/PhotoPostModal.tsx:218:          <div className="pp-form">
frontend/src/components/PhotoPostModal.tsx:219:            <input
frontend/src/components/PhotoPostModal.tsx:220:              placeholder="Добавить комментарий…"
frontend/src/components/PhotoPostModal.tsx:221:              value={text}
frontend/src/components/PhotoPostModal.tsx:222:              onChange={(e) => setText(e.target.value)}
frontend/src/components/PhotoPostModal.tsx:223:              onKeyDown={(e) => e.key === 'Enter' && send()}
frontend/src/components/PhotoPostModal.tsx:224:            />
frontend/src/components/PhotoPostModal.tsx:225:            <button className="pp-send" disabled={busy || !text.trim()} onClick={send} aria-label="Отправить">
frontend/src/components/PhotoPostModal.tsx:226:              ➤
frontend/src/components/PhotoPostModal.tsx:227:            </button>
frontend/src/components/PhotoPostModal.tsx:228:          </div>
frontend/src/components/PhotoPostModal.tsx:229:        </div>
frontend/src/components/PhotoPostModal.tsx:230:      </div>
frontend/src/components/PhotoPostModal.tsx:232:      {/* action sheet from the ⋯ button */}
frontend/src/components/PhotoPostModal.tsx:233:      {menu && (
frontend/src/components/PhotoPostModal.tsx:234:        <div className="pp-sheet-back" onClick={(e) => { e.stopPropagation(); setMenu(false); }}>
frontend/src/components/PhotoPostModal.tsx:235:          <div className="pp-sheet" onClick={(e) => e.stopPropagation()}>
frontend/src/components/PhotoPostModal.tsx:236:            {onEdit && (
frontend/src/components/PhotoPostModal.tsx:237:              <button className="pp-sheet-item" onClick={() => { setMenu(false); onEdit(); }}>Изменить</button>
frontend/src/components/PhotoPostModal.tsx:238:            )}
frontend/src/components/PhotoPostModal.tsx:239:            <button className="pp-sheet-item" onClick={sendToFriend}>Отправить другу</button>
frontend/src/components/PhotoPostModal.tsx:240:            {photo && <button className="pp-sheet-item" onClick={sharePhoto}>Поделиться фото</button>}
frontend/src/components/PhotoPostModal.tsx:241:            <button className="pp-sheet-item" onClick={copyLink}>Поделиться ссылкой</button>
frontend/src/components/PhotoPostModal.tsx:242:            {onDelete && (
frontend/src/components/PhotoPostModal.tsx:243:              <button className="pp-sheet-item danger" onClick={() => { setMenu(false); onDelete(); }}>Удалить</button>
frontend/src/components/PhotoPostModal.tsx:244:            )}
frontend/src/components/PhotoPostModal.tsx:245:            <button className="pp-sheet-item cancel" onClick={() => setMenu(false)}>Отмена</button>
frontend/src/components/PhotoPostModal.tsx:246:          </div>
frontend/src/components/PhotoPostModal.tsx:247:        </div>
frontend/src/components/PhotoPostModal.tsx:248:      )}
frontend/src/components/PhotoPostModal.tsx:249:      {toast && <div className="pp-toast">{toast}</div>}
frontend/src/components/PhotoPostModal.tsx:250:    </div>
frontend/src/components/PhotoPostModal.tsx:251:  );
frontend/src/components/PhotoPostModal.tsx:252:}
frontend/src/components/MapBrowse.tsx:1:import { useEffect, useMemo, useRef, useState } from 'react';
frontend/src/components/MapBrowse.tsx:2:import { api } from '../api';
frontend/src/components/MapBrowse.tsx:3:import type { GeoPoint, Listing, ListingType } from '../types';
frontend/src/components/MapBrowse.tsx:4:import { Filters, type FilterState } from './Filters';
frontend/src/components/MapBrowse.tsx:5:import { ListRow } from './ListRow';
frontend/src/components/MapBrowse.tsx:6:import { ListingDetailModal } from './ListingDetail';
frontend/src/components/MapBrowse.tsx:7:import { MapView } from './MapView';
frontend/src/components/MapBrowse.tsx:8:import { useFavorites } from '../hooks/useFavorites';
frontend/src/components/MapBrowse.tsx:9:import { useEscClose } from '../modalEsc';
frontend/src/components/MapBrowse.tsx:10:import { useSwipeBack } from '../swipeBack';
frontend/src/components/MapBrowse.tsx:11:import { cuisineToken } from '../cuisine';
frontend/src/components/MapBrowse.tsx:13:export type BrowseCat = 'RESTAURANT' | 'BAR' | 'CAFE' | 'COFFEE' | 'DISH' | 'DRINK';
frontend/src/components/MapBrowse.tsx:15:const LABEL: Record<BrowseCat, string> = {
frontend/src/components/MapBrowse.tsx:16:  RESTAURANT: 'Рестораны',
frontend/src/components/MapBrowse.tsx:17:  BAR: 'Бары',
frontend/src/components/MapBrowse.tsx:18:  CAFE: 'Кафе',
frontend/src/components/MapBrowse.tsx:19:  COFFEE: 'Кофейни',
frontend/src/components/MapBrowse.tsx:20:  DISH: 'Блюда',
frontend/src/components/MapBrowse.tsx:21:  DRINK: 'Напитки',
frontend/src/components/MapBrowse.tsx:22:};
frontend/src/components/MapBrowse.tsx:24:const MOSCOW: [number, number] = [55.751, 37.618];
frontend/src/components/MapBrowse.tsx:26:function distanceKm(a: [number, number], b: [number, number]): number {
frontend/src/components/MapBrowse.tsx:27:  const R = 6371;
frontend/src/components/MapBrowse.tsx:28:  const toRad = (d: number) => (d * Math.PI) / 180;
frontend/src/components/MapBrowse.tsx:29:  const dLat = toRad(b[0] - a[0]);
frontend/src/components/MapBrowse.tsx:30:  const dLng = toRad(b[1] - a[1]);
frontend/src/components/MapBrowse.tsx:31:  const x =
frontend/src/components/MapBrowse.tsx:32:    Math.sin(dLat / 2) ** 2 +
frontend/src/components/MapBrowse.tsx:33:    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
frontend/src/components/MapBrowse.tsx:34:  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
frontend/src/components/MapBrowse.tsx:35:}
frontend/src/components/MapBrowse.tsx:37:export function MapBrowse({ cat, onClose }: { cat: BrowseCat; onClose: () => void }) {
frontend/src/components/MapBrowse.tsx:38:  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
frontend/src/components/MapBrowse.tsx:39:  const [results, setResults] = useState<Listing[]>([]);
frontend/src/components/MapBrowse.tsx:40:  const [activeId, setActiveId] = useState<string | null>(null);
frontend/src/components/MapBrowse.tsx:41:  const [expanded, setExpanded] = useState(false);
frontend/src/components/MapBrowse.tsx:42:  const [closing, setClosing] = useState(false);
frontend/src/components/MapBrowse.tsx:43:  const [query, setQuery] = useState('');
frontend/src/components/MapBrowse.tsx:44:  const [searching, setSearching] = useState(false);
frontend/src/components/MapBrowse.tsx:45:  const [filters, setFilters] = useState<FilterState>({
frontend/src/components/MapBrowse.tsx:46:    sort: 'distance',
frontend/src/components/MapBrowse.tsx:47:    price: 0,
frontend/src/components/MapBrowse.tsx:48:    openNow: false,
frontend/src/components/MapBrowse.tsx:49:    cuisine: '',
frontend/src/components/MapBrowse.tsx:50:  });
frontend/src/components/MapBrowse.tsx:51:  const [loaded, setLoaded] = useState(false);
frontend/src/components/MapBrowse.tsx:53:  const isItem = cat === 'DISH' || cat === 'DRINK';
frontend/src/components/MapBrowse.tsx:54:  const close = () => {
frontend/src/components/MapBrowse.tsx:55:    setClosing(true);
frontend/src/components/MapBrowse.tsx:56:    setTimeout(onClose, 260);
frontend/src/components/MapBrowse.tsx:57:  };
frontend/src/components/MapBrowse.tsx:58:  useEscClose(close);
frontend/src/components/MapBrowse.tsx:59:  const pageRef = useRef<HTMLDivElement>(null);
frontend/src/components/MapBrowse.tsx:60:  useSwipeBack(pageRef, close); // edge swipe → back to home
frontend/src/components/MapBrowse.tsx:61:  const { ids, toggle } = useFavorites();
frontend/src/components/MapBrowse.tsx:63:  // current location → blue dot + map centering
frontend/src/components/MapBrowse.tsx:64:  const locate = () => {
frontend/src/components/MapBrowse.tsx:65:    if (!navigator.geolocation) return;
frontend/src/components/MapBrowse.tsx:66:    navigator.geolocation.getCurrentPosition(
frontend/src/components/MapBrowse.tsx:67:      (p) => setUserLoc([p.coords.latitude, p.coords.longitude]),
frontend/src/components/MapBrowse.tsx:68:      () => {},
frontend/src/components/MapBrowse.tsx:69:      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
frontend/src/components/MapBrowse.tsx:70:    );
frontend/src/components/MapBrowse.tsx:71:  };
frontend/src/components/MapBrowse.tsx:72:  useEffect(locate, []);
frontend/src/components/MapBrowse.tsx:74:  // fetch results; for dishes/drinks we look up the VENUES that serve them
frontend/src/components/MapBrowse.tsx:75:  useEffect(() => {
frontend/src/components/MapBrowse.tsx:76:    const q = query.trim();
frontend/src/components/MapBrowse.tsx:77:    const sort = filters.sort;
frontend/src/components/MapBrowse.tsx:78:    const t = setTimeout(() => {
frontend/src/components/MapBrowse.tsx:79:      // a cuisine tag (e.g. "Бургеры") filters by cuisine instead of by name
frontend/src/components/MapBrowse.tsx:80:      const tagToken = cuisineToken(q);
frontend/src/components/MapBrowse.tsx:81:      // keep only venues that belong to the browsed category (COFFEE/CAFE/BAR)
frontend/src/components/MapBrowse.tsx:82:      const catFilter = (list: Listing[]) => {
frontend/src/components/MapBrowse.tsx:83:        if (cat === 'COFFEE') return list.filter((l) => /кофе|coffee/i.test(l.category ?? ''));
frontend/src/components/MapBrowse.tsx:84:        if (cat === 'CAFE')
frontend/src/components/MapBrowse.tsx:85:          return list.filter(
frontend/src/components/MapBrowse.tsx:86:            (l) =>
frontend/src/components/MapBrowse.tsx:87:              /кафе|фастфуд|шаурм|шаверм|мороженое|фуд.?корт/i.test(l.category ?? '') ||
frontend/src/components/MapBrowse.tsx:88:              /kebab|shawarma/i.test(l.cuisine ?? ''),
frontend/src/components/MapBrowse.tsx:89:          );
frontend/src/components/MapBrowse.tsx:90:        if (cat === 'BAR') return list.filter((l) => /бар|паб|pub/i.test(l.category ?? ''));
frontend/src/components/MapBrowse.tsx:91:        return list;
frontend/src/components/MapBrowse.tsx:92:      };
frontend/src/components/MapBrowse.tsx:93:      const req = isItem
frontend/src/components/MapBrowse.tsx:94:        ? api.venuesServing(cat as 'DISH' | 'DRINK', q || undefined)
frontend/src/components/MapBrowse.tsx:95:        : q && !tagToken
frontend/src/components/MapBrowse.tsx:96:          ? // free-text query in a venue category → match venue NAME *or* a dish/drink
frontend/src/components/MapBrowse.tsx:97:            // it serves (so "айс латте" in Кофейни finds coffee shops that pour it),
frontend/src/components/MapBrowse.tsx:98:            // then scope to the category being browsed.
frontend/src/components/MapBrowse.tsx:99:            api.searchVenues(q).then(catFilter)
frontend/src/components/MapBrowse.tsx:100:          : api.listings(
frontend/src/components/MapBrowse.tsx:101:              cat === 'BAR' || cat === 'CAFE' || cat === 'COFFEE' ? 'RESTAURANT' : (cat as ListingType),
frontend/src/components/MapBrowse.tsx:102:              tagToken ? undefined : q || undefined,
frontend/src/components/MapBrowse.tsx:103:              {
frontend/src/components/MapBrowse.tsx:104:                sort,
frontend/src/components/MapBrowse.tsx:105:                price: filters.price || undefined,
frontend/src/components/MapBrowse.tsx:106:                openNow: filters.openNow,
frontend/src/components/MapBrowse.tsx:107:                cuisine: tagToken ?? filters.cuisine ?? undefined,
frontend/src/components/MapBrowse.tsx:108:                category: cat === 'BAR' ? 'Бар' : cat === 'CAFE' ? 'Кафе' : cat === 'COFFEE' ? 'Кофейня' : undefined,
frontend/src/components/MapBrowse.tsx:109:                take: 150,
frontend/src/components/MapBrowse.tsx:110:              },
frontend/src/components/MapBrowse.tsx:111:            );
frontend/src/components/MapBrowse.tsx:112:      setLoaded(false);
frontend/src/components/MapBrowse.tsx:113:      req
frontend/src/components/MapBrowse.tsx:114:        .then((list) => {
frontend/src/components/MapBrowse.tsx:115:          setLoaded(true);
frontend/src/components/MapBrowse.tsx:116:          // distance sort (default for the map) — by distance to the user
frontend/src/components/MapBrowse.tsx:117:          if (sort === 'distance' || isItem) {
frontend/src/components/MapBrowse.tsx:118:            const origin = userLoc ?? MOSCOW;
frontend/src/components/MapBrowse.tsx:119:            list = [...list].sort((a, b) => {
frontend/src/components/MapBrowse.tsx:120:              const da = a.lat != null && a.lng != null ? distanceKm(origin, [a.lat, a.lng]) : 1e9;
frontend/src/components/MapBrowse.tsx:121:              const db = b.lat != null && b.lng != null ? distanceKm(origin, [b.lat, b.lng]) : 1e9;
frontend/src/components/MapBrowse.tsx:122:              return da - db;
frontend/src/components/MapBrowse.tsx:123:            });
frontend/src/components/MapBrowse.tsx:124:          }
frontend/src/components/MapBrowse.tsx:125:          setResults(list);
frontend/src/components/MapBrowse.tsx:126:        })
frontend/src/components/MapBrowse.tsx:127:        .catch(() => setLoaded(true));
frontend/src/components/MapBrowse.tsx:128:    }, 250);
frontend/src/components/MapBrowse.tsx:129:    return () => clearTimeout(t);
frontend/src/components/MapBrowse.tsx:130:  }, [cat, filters, userLoc, query, isItem]);
frontend/src/components/MapBrowse.tsx:132:  const points: GeoPoint[] = useMemo(
frontend/src/components/MapBrowse.tsx:133:    () =>
frontend/src/components/MapBrowse.tsx:134:      results
frontend/src/components/MapBrowse.tsx:135:        .filter((l) => l.lat != null && l.lng != null)
frontend/src/components/MapBrowse.tsx:136:        .slice(0, 80)
frontend/src/components/MapBrowse.tsx:137:        .map((l) => ({ id: l.id, name: l.name, lat: l.lat as number, lng: l.lng as number, type: l.type })),
frontend/src/components/MapBrowse.tsx:138:    [results],
frontend/src/components/MapBrowse.tsx:139:  );
frontend/src/components/MapBrowse.tsx:141:  // drag handle → follow the finger live (document-level listeners = robust in
frontend/src/components/MapBrowse.tsx:142:  // the Telegram webview), then snap open/closed on release.
frontend/src/components/MapBrowse.tsx:143:  const sheetRef = useRef<HTMLDivElement>(null);
frontend/src/components/MapBrowse.tsx:144:  const collapsedPx = () => window.innerHeight * 0.86 - 220;
frontend/src/components/MapBrowse.tsx:145:  // pull-down from INSIDE the list (feed-post logic): when the list is scrolled
frontend/src/components/MapBrowse.tsx:146:  // to the top, dragging down grabs the whole sheet and collapses it to the map;
frontend/src/components/MapBrowse.tsx:147:  // scrolled lists keep scrolling — the decision is made on the FIRST move.
frontend/src/components/MapBrowse.tsx:148:  const listRef = useRef<HTMLDivElement>(null);
frontend/src/components/MapBrowse.tsx:149:  const onListDown = (e: React.PointerEvent) => {
frontend/src/components/MapBrowse.tsx:150:    if (!expanded) return; // collapsed sheet: the handle already does this
frontend/src/components/MapBrowse.tsx:151:    const list = listRef.current;
frontend/src/components/MapBrowse.tsx:152:    if (list && list.scrollTop > 0) return; // mid-scroll → native scrolling
frontend/src/components/MapBrowse.tsx:153:    const startY = e.clientY;
frontend/src/components/MapBrowse.tsx:154:    const startX = e.clientX;
frontend/src/components/MapBrowse.tsx:155:    let decided = false;
frontend/src/components/MapBrowse.tsx:156:    const sheet = sheetRef.current;
frontend/src/components/MapBrowse.tsx:157:    const move = (ev: PointerEvent) => {
frontend/src/components/MapBrowse.tsx:158:      const dy = ev.clientY - startY;
frontend/src/components/MapBrowse.tsx:159:      const dx = ev.clientX - startX;
frontend/src/components/MapBrowse.tsx:160:      if (!decided) {
frontend/src/components/MapBrowse.tsx:161:        if (Math.abs(dy) < 4 && Math.abs(dx) < 4) return;
frontend/src/components/MapBrowse.tsx:162:        // downward pull wins only when clearly vertical
frontend/src/components/MapBrowse.tsx:163:        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { cleanup(); return; }
frontend/src/components/MapBrowse.tsx:164:        decided = true;
frontend/src/components/MapBrowse.tsx:165:        sheet?.classList.add('dragging');
frontend/src/components/MapBrowse.tsx:166:      }
frontend/src/components/MapBrowse.tsx:167:      ev.preventDefault();
frontend/src/components/MapBrowse.tsx:168:      const t = Math.max(0, Math.min(collapsedPx(), dy));
frontend/src/components/MapBrowse.tsx:169:      if (sheet) sheet.style.transform = `translateY(${t}px)`;
frontend/src/components/MapBrowse.tsx:170:    };
frontend/src/components/MapBrowse.tsx:171:    const up = (ev: PointerEvent) => {
frontend/src/components/MapBrowse.tsx:172:      cleanup();
frontend/src/components/MapBrowse.tsx:173:      if (!decided) return;
frontend/src/components/MapBrowse.tsx:174:      if (sheet) {
frontend/src/components/MapBrowse.tsx:175:        sheet.classList.remove('dragging');
frontend/src/components/MapBrowse.tsx:176:        sheet.style.transform = '';
frontend/src/components/MapBrowse.tsx:177:      }
frontend/src/components/MapBrowse.tsx:178:      const dy = ev.clientY - startY;
frontend/src/components/MapBrowse.tsx:179:      setExpanded(dy < collapsedPx() / 3); // a firm pull → the map
frontend/src/components/MapBrowse.tsx:180:    };
frontend/src/components/MapBrowse.tsx:181:    const cleanup = () => {
frontend/src/components/MapBrowse.tsx:182:      document.removeEventListener('pointermove', move);
frontend/src/components/MapBrowse.tsx:183:      document.removeEventListener('pointerup', up);
frontend/src/components/MapBrowse.tsx:184:      document.removeEventListener('pointercancel', up);
frontend/src/components/MapBrowse.tsx:185:      if (!decided && sheet) { sheet.classList.remove('dragging'); sheet.style.transform = ''; }
frontend/src/components/MapBrowse.tsx:186:    };
frontend/src/components/MapBrowse.tsx:187:    document.addEventListener('pointermove', move, { passive: false });
frontend/src/components/MapBrowse.tsx:188:    document.addEventListener('pointerup', up);
frontend/src/components/MapBrowse.tsx:189:    document.addEventListener('pointercancel', up);
frontend/src/components/MapBrowse.tsx:190:  };
frontend/src/components/MapBrowse.tsx:192:  const onDown = (e: React.PointerEvent) => {
frontend/src/components/MapBrowse.tsx:193:    if ((e.target as HTMLElement).closest('button, input, a')) return; // let controls work
frontend/src/components/MapBrowse.tsx:194:    const startY = e.clientY;
frontend/src/components/MapBrowse.tsx:195:    const base = expanded ? 0 : collapsedPx();
frontend/src/components/MapBrowse.tsx:196:    const sheet = sheetRef.current;
frontend/src/components/MapBrowse.tsx:197:    sheet?.classList.add('dragging');
frontend/src/components/MapBrowse.tsx:198:    const move = (ev: PointerEvent) => {
frontend/src/components/MapBrowse.tsx:199:      if (!sheet) return;
frontend/src/components/MapBrowse.tsx:200:      const t = Math.max(0, Math.min(collapsedPx(), base + (ev.clientY - startY)));
frontend/src/components/MapBrowse.tsx:201:      sheet.style.transform = `translateY(${t}px)`;
frontend/src/components/MapBrowse.tsx:202:    };
frontend/src/components/MapBrowse.tsx:203:    const up = (ev: PointerEvent) => {
frontend/src/components/MapBrowse.tsx:204:      document.removeEventListener('pointermove', move);
frontend/src/components/MapBrowse.tsx:205:      document.removeEventListener('pointerup', up);
frontend/src/components/MapBrowse.tsx:206:      document.removeEventListener('pointercancel', up);
frontend/src/components/MapBrowse.tsx:207:      if (sheet) {
frontend/src/components/MapBrowse.tsx:208:        sheet.classList.remove('dragging');
frontend/src/components/MapBrowse.tsx:209:        sheet.style.transform = '';
frontend/src/components/MapBrowse.tsx:210:      }
frontend/src/components/MapBrowse.tsx:211:      const dy = ev.clientY - startY;
frontend/src/components/MapBrowse.tsx:212:      if (Math.abs(dy) < 6) setExpanded((x) => !x);
frontend/src/components/MapBrowse.tsx:213:      else setExpanded(base + dy < collapsedPx() / 2);
frontend/src/components/MapBrowse.tsx:214:    };
frontend/src/components/MapBrowse.tsx:215:    document.addEventListener('pointermove', move);
frontend/src/components/MapBrowse.tsx:216:    document.addEventListener('pointerup', up);
frontend/src/components/MapBrowse.tsx:217:    document.addEventListener('pointercancel', up);
frontend/src/components/MapBrowse.tsx:218:  };
frontend/src/components/MapBrowse.tsx:220:  return (
frontend/src/components/MapBrowse.tsx:221:    <div ref={pageRef} className={'mapbrowse' + (closing ? ' closing' : '')}>
frontend/src/components/MapBrowse.tsx:222:      <div className="mb-header">
frontend/src/components/MapBrowse.tsx:223:        <button
frontend/src/components/MapBrowse.tsx:224:          className="mb-back"
frontend/src/components/MapBrowse.tsx:225:          onClick={() => {
frontend/src/components/MapBrowse.tsx:226:            // when searching, ← returns to the map; otherwise it closes
frontend/src/components/MapBrowse.tsx:227:            if (searching || query) {
frontend/src/components/MapBrowse.tsx:228:              setSearching(false);
frontend/src/components/MapBrowse.tsx:229:              setQuery('');
frontend/src/components/MapBrowse.tsx:230:            } else {
frontend/src/components/MapBrowse.tsx:231:              close();
frontend/src/components/MapBrowse.tsx:232:            }
frontend/src/components/MapBrowse.tsx:233:          }}
frontend/src/components/MapBrowse.tsx:234:        >
frontend/src/components/MapBrowse.tsx:235:          ←
frontend/src/components/MapBrowse.tsx:236:        </button>
frontend/src/components/MapBrowse.tsx:237:        {searching ? (
frontend/src/components/MapBrowse.tsx:238:          <>
frontend/src/components/MapBrowse.tsx:239:            <input
frontend/src/components/MapBrowse.tsx:240:              className="mb-header-input"
frontend/src/components/MapBrowse.tsx:241:              autoFocus
frontend/src/components/MapBrowse.tsx:242:              placeholder={
frontend/src/components/MapBrowse.tsx:243:                cat === 'DISH'
frontend/src/components/MapBrowse.tsx:244:                  ? 'Найти блюдо…'
frontend/src/components/MapBrowse.tsx:245:                  : cat === 'DRINK'
frontend/src/components/MapBrowse.tsx:246:                    ? 'Найти напиток…'
frontend/src/components/MapBrowse.tsx:247:                    : 'Найти заведение…'
frontend/src/components/MapBrowse.tsx:248:              }
frontend/src/components/MapBrowse.tsx:249:              value={query}
frontend/src/components/MapBrowse.tsx:250:              onChange={(e) => setQuery(e.target.value)}
frontend/src/components/MapBrowse.tsx:251:              onBlur={() => !query && setSearching(false)}
frontend/src/components/MapBrowse.tsx:252:            />
frontend/src/components/MapBrowse.tsx:253:            {query && (
frontend/src/components/MapBrowse.tsx:254:              <button
frontend/src/components/MapBrowse.tsx:255:                className="search-ico right"
frontend/src/components/MapBrowse.tsx:256:                onMouseDown={(e) => e.preventDefault()}
frontend/src/components/MapBrowse.tsx:257:                aria-label="Искать"
frontend/src/components/MapBrowse.tsx:258:              >
frontend/src/components/MapBrowse.tsx:259:                🔍
frontend/src/components/MapBrowse.tsx:260:              </button>
frontend/src/components/MapBrowse.tsx:261:            )}
frontend/src/components/MapBrowse.tsx:262:          </>
frontend/src/components/MapBrowse.tsx:263:        ) : (
frontend/src/components/MapBrowse.tsx:264:          <button className="mb-title" onClick={() => setSearching(true)}>
frontend/src/components/MapBrowse.tsx:265:            <b>{LABEL[cat]}</b>
frontend/src/components/MapBrowse.tsx:266:            <span className="mb-loc">
frontend/src/components/MapBrowse.tsx:267:              {query ? `«${query}»` : isItem ? 'Где попробовать' : userLoc ? 'Рядом с вами' : 'Москва'}
frontend/src/components/MapBrowse.tsx:268:            </span>
frontend/src/components/MapBrowse.tsx:269:          </button>
frontend/src/components/MapBrowse.tsx:270:        )}
frontend/src/components/MapBrowse.tsx:271:        <button
frontend/src/components/MapBrowse.tsx:272:          className="mb-locate-h"
frontend/src/components/MapBrowse.tsx:273:          onClick={() => setExpanded((x) => !x)}
frontend/src/components/MapBrowse.tsx:274:          title="Список"
frontend/src/components/MapBrowse.tsx:275:        >
frontend/src/components/MapBrowse.tsx:276:          {expanded ? '🗺' : '☰'}
frontend/src/components/MapBrowse.tsx:277:        </button>
frontend/src/components/MapBrowse.tsx:278:        <button className="mb-locate-h" onClick={locate} title="Моё местоположение">
frontend/src/components/MapBrowse.tsx:279:          📍
frontend/src/components/MapBrowse.tsx:280:        </button>
frontend/src/components/MapBrowse.tsx:281:      </div>
frontend/src/components/MapBrowse.tsx:283:      <div className="mb-map">
frontend/src/components/MapBrowse.tsx:284:        <MapView
frontend/src/components/MapBrowse.tsx:285:          points={points}
frontend/src/components/MapBrowse.tsx:286:          userLocation={userLoc}
frontend/src/components/MapBrowse.tsx:287:          cluster
frontend/src/components/MapBrowse.tsx:288:          height="100%"
frontend/src/components/MapBrowse.tsx:289:          onSelect={setActiveId}
frontend/src/components/MapBrowse.tsx:290:        />
frontend/src/components/MapBrowse.tsx:291:      </div>
frontend/src/components/MapBrowse.tsx:292:      {/* compass → jump the map to the user's current location */}
frontend/src/components/MapBrowse.tsx:293:      <button className="mb-compass" onClick={locate} title="Моё местоположение" aria-label="Моё местоположение">
frontend/src/components/MapBrowse.tsx:294:        🧭
frontend/src/components/MapBrowse.tsx:295:      </button>
frontend/src/components/MapBrowse.tsx:297:      <div ref={sheetRef} className={'mb-sheet' + (expanded ? ' exp' : '')}>
frontend/src/components/MapBrowse.tsx:298:        <div className="mb-handle" onPointerDown={onDown}>
frontend/src/components/MapBrowse.tsx:299:          <span className="mb-grip" />
frontend/src/components/MapBrowse.tsx:300:        </div>
frontend/src/components/MapBrowse.tsx:302:        {!isItem && (
frontend/src/components/MapBrowse.tsx:303:          <div className="mb-filters" onPointerDown={onDown}>
frontend/src/components/MapBrowse.tsx:304:            <Filters state={filters} onChange={(n) => setFilters((f) => ({ ...f, ...n }))} />
frontend/src/components/MapBrowse.tsx:305:          </div>
frontend/src/components/MapBrowse.tsx:306:        )}
frontend/src/components/MapBrowse.tsx:307:        <div className="mb-count" onPointerDown={onDown}>
frontend/src/components/MapBrowse.tsx:308:          {!loaded
frontend/src/components/MapBrowse.tsx:309:            ? 'Загрузка…'
frontend/src/components/MapBrowse.tsx:310:            : isItem
frontend/src/components/MapBrowse.tsx:311:              ? results.length > 0
frontend/src/components/MapBrowse.tsx:312:                ? `Подают в ${results.length} заведениях`
frontend/src/components/MapBrowse.tsx:313:                : query
frontend/src/components/MapBrowse.tsx:314:                  ? 'Не найдено — попробуйте другое название'
frontend/src/components/MapBrowse.tsx:315:                  : 'Введите название блюда'
frontend/src/components/MapBrowse.tsx:316:              : results.length > 0
frontend/src/components/MapBrowse.tsx:317:                ? `Найдено: ${results.length}`
frontend/src/components/MapBrowse.tsx:318:                : 'Ничего не найдено'}
frontend/src/components/MapBrowse.tsx:319:        </div>
frontend/src/components/MapBrowse.tsx:320:        <div className="mb-list" ref={listRef} onPointerDown={onListDown}>
frontend/src/components/MapBrowse.tsx:321:          {results.map((l) => (
frontend/src/components/MapBrowse.tsx:322:            <ListRow
frontend/src/components/MapBrowse.tsx:323:              key={l.id}
frontend/src/components/MapBrowse.tsx:324:              listing={l}
frontend/src/components/MapBrowse.tsx:325:              favorite={ids.has(l.id)}
frontend/src/components/MapBrowse.tsx:326:              onToggleFavorite={() => toggle(l.id)}
frontend/src/components/MapBrowse.tsx:327:              onClick={() => setActiveId(l.id)}
frontend/src/components/MapBrowse.tsx:328:              onTagClick={(tag) => {
frontend/src/components/MapBrowse.tsx:329:                setQuery(tag); // shows in the search bar; ← clears it
frontend/src/components/MapBrowse.tsx:330:                setSearching(true);
frontend/src/components/MapBrowse.tsx:331:              }}
frontend/src/components/MapBrowse.tsx:332:            />
frontend/src/components/MapBrowse.tsx:333:          ))}
frontend/src/components/MapBrowse.tsx:334:        </div>
frontend/src/components/MapBrowse.tsx:335:      </div>
frontend/src/components/MapBrowse.tsx:337:      {activeId && (
frontend/src/components/MapBrowse.tsx:338:        <ListingDetailModal id={activeId} onClose={() => setActiveId(null)} />
frontend/src/components/MapBrowse.tsx:339:      )}
frontend/src/components/MapBrowse.tsx:340:    </div>
frontend/src/components/MapBrowse.tsx:341:  );
frontend/src/components/MapBrowse.tsx:342:}
frontend/src/components/People.tsx:1:import { useEffect, useState, useRef} from 'react';
frontend/src/components/People.tsx:2:import { api } from '../api';
frontend/src/components/People.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src/components/People.tsx:4:import { useSwipeDismiss } from '../swipeDismiss';
frontend/src/components/People.tsx:5:import { useSwipeBack } from '../swipeBack';
frontend/src/components/People.tsx:6:import { ListingDetailModal } from './ListingDetail';
frontend/src/components/People.tsx:7:import { PhotoPostModal } from './PhotoPostModal';
frontend/src/components/People.tsx:8:import { ReviewCard, CategoryAverages } from './ReviewCard';
frontend/src/components/People.tsx:9:import { SmartImg } from './SmartImg';
frontend/src/components/People.tsx:10:import type { PublicProfile, PublicUser, Review } from '../types';
frontend/src/components/People.tsx:12:function Avatar({ user }: { user: { photoUrl?: string | null; firstName?: string | null } }) {
frontend/src/components/People.tsx:13:  return <SmartImg className="pu-avatar" src={user.photoUrl} width={200} loading="eager" monogram={user.firstName} />;
frontend/src/components/People.tsx:14:}
frontend/src/components/People.tsx:16:function FollowBtn({ u, onChange }: { u: PublicUser; onChange: (following: boolean) => void }) {
frontend/src/components/People.tsx:17:  const [following, setFollowing] = useState(u.isFollowing);
frontend/src/components/People.tsx:18:  const [busy, setBusy] = useState(false);
frontend/src/components/People.tsx:19:  if (u.isMe) return null;
frontend/src/components/People.tsx:20:  const toggle = (e: React.MouseEvent) => {
frontend/src/components/People.tsx:21:    e.stopPropagation();
frontend/src/components/People.tsx:22:    setBusy(true);
frontend/src/components/People.tsx:23:    const next = !following;
frontend/src/components/People.tsx:24:    setFollowing(next);
frontend/src/components/People.tsx:25:    (next ? api.followUser(u.id) : api.unfollowUser(u.id))
frontend/src/components/People.tsx:26:      .then(() => onChange(next))
frontend/src/components/People.tsx:27:      .catch(() => setFollowing(!next))
frontend/src/components/People.tsx:28:      .finally(() => setBusy(false));
frontend/src/components/People.tsx:29:  };
frontend/src/components/People.tsx:30:  return (
frontend/src/components/People.tsx:31:    <button className={'follow-btn' + (following ? ' on' : '')} onClick={toggle} disabled={busy}>
frontend/src/components/People.tsx:32:      {following ? 'Вы подписаны' : 'Подписаться'}
frontend/src/components/People.tsx:33:    </button>
frontend/src/components/People.tsx:34:  );
frontend/src/components/People.tsx:35:}
frontend/src/components/People.tsx:37:function UserRow({ u, onOpen }: { u: PublicUser; onOpen: (id: string) => void }) {
frontend/src/components/People.tsx:38:  return (
frontend/src/components/People.tsx:39:    <div className="pu-row" onClick={() => onOpen(u.id)}>
frontend/src/components/People.tsx:40:      <Avatar user={u} />
frontend/src/components/People.tsx:41:      <div style={{ flex: 1 }}>
frontend/src/components/People.tsx:42:        <div className="pu-name">{u.firstName ?? u.username ?? 'Гость'}</div>
frontend/src/components/People.tsx:43:        <div className="pu-meta">
frontend/src/components/People.tsx:44:          {u.reviews} отзывов · {u.followers} подписчиков
frontend/src/components/People.tsx:45:        </div>
frontend/src/components/People.tsx:46:      </div>
frontend/src/components/People.tsx:47:      <FollowBtn u={u} onChange={() => {}} />
frontend/src/components/People.tsx:48:    </div>
frontend/src/components/People.tsx:49:  );
frontend/src/components/People.tsx:50:}
frontend/src/components/People.tsx:52:export function PeopleModal({
frontend/src/components/People.tsx:53:  userId,
frontend/src/components/People.tsx:54:  initialTab,
frontend/src/components/People.tsx:55:  onClose,
frontend/src/components/People.tsx:56:  onOpenUser,
frontend/src/components/People.tsx:57:}: {
frontend/src/components/People.tsx:58:  userId: string;
frontend/src/components/People.tsx:59:  initialTab: 'followers' | 'following';
frontend/src/components/People.tsx:60:  onClose: () => void;
frontend/src/components/People.tsx:61:  onOpenUser: (id: string) => void;
frontend/src/components/People.tsx:62:}) {
frontend/src/components/People.tsx:63:  const [tab, setTab] = useState<'followers' | 'following'>(initialTab);
frontend/src/components/People.tsx:64:  const [followers, setFollowers] = useState<PublicUser[]>([]);
frontend/src/components/People.tsx:65:  const [following, setFollowing] = useState<PublicUser[]>([]);
frontend/src/components/People.tsx:66:  const [query, setQuery] = useState('');
frontend/src/components/People.tsx:67:  const [results, setResults] = useState<PublicUser[] | null>(null);
frontend/src/components/People.tsx:69:  useEffect(() => {
frontend/src/components/People.tsx:70:    api.userFollowers(userId).then(setFollowers).catch(() => {});
frontend/src/components/People.tsx:71:    api.userFollowing(userId).then(setFollowing).catch(() => {});
frontend/src/components/People.tsx:72:  }, [userId]);
frontend/src/components/People.tsx:74:  useEffect(() => {
frontend/src/components/People.tsx:75:    const q = query.trim();
frontend/src/components/People.tsx:76:    if (!q) {
frontend/src/components/People.tsx:77:      setResults(null);
frontend/src/components/People.tsx:78:      return;
frontend/src/components/People.tsx:79:    }
frontend/src/components/People.tsx:80:    const t = setTimeout(() => {
frontend/src/components/People.tsx:81:      api.searchUsers(q).then(setResults).catch(() => {});
frontend/src/components/People.tsx:82:    }, 250);
frontend/src/components/People.tsx:83:    return () => clearTimeout(t);
frontend/src/components/People.tsx:84:  }, [query]);
frontend/src/components/People.tsx:86:  const list = results ?? (tab === 'followers' ? followers : following);
frontend/src/components/People.tsx:88:  return (
frontend/src/components/People.tsx:89:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src/components/People.tsx:90:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src/components/People.tsx:91:        <div className="pu-search">
frontend/src/components/People.tsx:92:          <span className="search-ico">🔍</span>
frontend/src/components/People.tsx:93:          <input
frontend/src/components/People.tsx:94:            placeholder="Найти людей…"
frontend/src/components/People.tsx:95:            value={query}
frontend/src/components/People.tsx:96:            onChange={(e) => setQuery(e.target.value)}
frontend/src/components/People.tsx:97:          />
frontend/src/components/People.tsx:98:        </div>
frontend/src/components/People.tsx:100:        {!results && (
frontend/src/components/People.tsx:101:          <div className="tabbar" style={{ position: 'static' }}>
frontend/src/components/People.tsx:102:            <button
frontend/src/components/People.tsx:103:              className={'tab' + (tab === 'followers' ? ' active' : '')}
frontend/src/components/People.tsx:104:              onClick={() => setTab('followers')}
frontend/src/components/People.tsx:105:            >
frontend/src/components/People.tsx:106:              Подписчики ({followers.length})
frontend/src/components/People.tsx:107:            </button>
frontend/src/components/People.tsx:108:            <button
frontend/src/components/People.tsx:109:              className={'tab' + (tab === 'following' ? ' active' : '')}
frontend/src/components/People.tsx:110:              onClick={() => setTab('following')}
frontend/src/components/People.tsx:111:            >
frontend/src/components/People.tsx:112:              Подписки ({following.length})
frontend/src/components/People.tsx:113:            </button>
frontend/src/components/People.tsx:114:          </div>
frontend/src/components/People.tsx:115:        )}
frontend/src/components/People.tsx:117:        <div className="pu-list">
frontend/src/components/People.tsx:118:          {list.length === 0 ? (
frontend/src/components/People.tsx:119:            <div className="meta" style={{ color: 'var(--hint)', padding: '12px 2px' }}>
frontend/src/components/People.tsx:120:              {results ? 'Никого не найдено' : 'Пока пусто'}
frontend/src/components/People.tsx:121:            </div>
frontend/src/components/People.tsx:122:          ) : (
frontend/src/components/People.tsx:123:            list.map((u) => <UserRow key={u.id} u={u} onOpen={onOpenUser} />)
frontend/src/components/People.tsx:124:          )}
frontend/src/components/People.tsx:125:        </div>
frontend/src/components/People.tsx:127:        <button className="btn secondary" style={{ marginTop: 12 }} onClick={onClose}>
frontend/src/components/People.tsx:128:          Закрыть
frontend/src/components/People.tsx:129:        </button>
frontend/src/components/People.tsx:130:      </div>
frontend/src/components/People.tsx:131:    </div>
frontend/src/components/People.tsx:132:  );
frontend/src/components/People.tsx:133:}
frontend/src/components/People.tsx:135:export function UserProfileModal({ id, onClose }: { id: string; onClose: () => void }) {
frontend/src/components/People.tsx:136:  const [p, setP] = useState<PublicProfile | null>(null);
frontend/src/components/People.tsx:137:  const [openListing, setOpenListing] = useState<string | null>(null);
frontend/src/components/People.tsx:138:  const [photoReview, setPhotoReview] = useState<Review | null>(null); // Instagram-style photo view
frontend/src/components/People.tsx:139:  const [people, setPeople] = useState<'followers' | 'following' | null>(null);
frontend/src/components/People.tsx:140:  const [closing, setClosing] = useState(false);
frontend/src/components/People.tsx:141:  useEffect(() => {
frontend/src/components/People.tsx:142:    api.userProfile(id).then(setP).catch(() => {});
frontend/src/components/People.tsx:143:  }, [id]);
frontend/src/components/People.tsx:144:  const requestClose = () => {
frontend/src/components/People.tsx:145:    setClosing(true);
frontend/src/components/People.tsx:146:    setTimeout(onClose, 240);
frontend/src/components/People.tsx:147:  };
frontend/src/components/People.tsx:148:  useEscClose(requestClose);
frontend/src/components/People.tsx:149:  // swipe-down from the top closes the profile page too (app-wide pattern)
frontend/src/components/People.tsx:150:  const pageRef = useRef<HTMLDivElement>(null);
frontend/src/components/People.tsx:151:  useSwipeDismiss(pageRef, onClose, { fadeBackdrop: false });
frontend/src/components/People.tsx:152:  useSwipeBack(pageRef, onClose); // edge swipe → back, like iOS navigation
frontend/src/components/People.tsx:154:  return (
frontend/src/components/People.tsx:155:    <div ref={pageRef} className={'userprofile' + (closing ? ' closing' : '')}>
frontend/src/components/People.tsx:156:      <div className="up-top">
frontend/src/components/People.tsx:157:        <button className="back-btn" onClick={requestClose}>
frontend/src/components/People.tsx:158:          ←
frontend/src/components/People.tsx:159:        </button>
frontend/src/components/People.tsx:160:      </div>
frontend/src/components/People.tsx:161:      {!p ? (
frontend/src/components/People.tsx:162:        <div style={{ padding: 16 }}>Загрузка…</div>
frontend/src/components/People.tsx:163:      ) : (
frontend/src/components/People.tsx:164:        <>
frontend/src/components/People.tsx:165:          <div className="me-head">
frontend/src/components/People.tsx:166:            <Avatar user={p} />
frontend/src/components/People.tsx:167:            <div className="me-name">{p.firstName ?? p.username ?? 'Гость'}</div>
frontend/src/components/People.tsx:168:            {(p as any).level && (
frontend/src/components/People.tsx:169:              <div className="up-level">{(p as any).level.icon} {(p as any).level.title}</div>
frontend/src/components/People.tsx:170:            )}
frontend/src/components/People.tsx:171:            <div className="me-stats">
frontend/src/components/People.tsx:172:              <button className="stat-btn" onClick={() => setPeople('followers')}>
frontend/src/components/People.tsx:173:                <b>{p.followers}</b> подписчиков
frontend/src/components/People.tsx:174:              </button>
frontend/src/components/People.tsx:175:              <button className="stat-btn" onClick={() => setPeople('following')}>
frontend/src/components/People.tsx:176:                <b>{p.following}</b> подписок
frontend/src/components/People.tsx:177:              </button>
frontend/src/components/People.tsx:178:              <span>⭐ {p.reviews}</span>
frontend/src/components/People.tsx:179:            </div>
frontend/src/components/People.tsx:180:            {!p.isMe && (
frontend/src/components/People.tsx:181:              <div style={{ marginTop: 10 }}>
frontend/src/components/People.tsx:182:                <FollowBtn u={p} onChange={() => {}} />
frontend/src/components/People.tsx:183:              </div>
frontend/src/components/People.tsx:184:            )}
frontend/src/components/People.tsx:185:          </div>
frontend/src/components/People.tsx:187:          {/* Карта дегустатора — visible on ANY user's profile */}
frontend/src/components/People.tsx:188:          {Array.isArray((p as any).specializations) && (p as any).specializations.length > 0 && (
frontend/src/components/People.tsx:189:            <div className="me-section">
frontend/src/components/People.tsx:190:              <h2 className="me-h">🗺 Карта дегустатора</h2>
frontend/src/components/People.tsx:191:              <div className="spec-grid">
frontend/src/components/People.tsx:192:                {(p as any).specializations
frontend/src/components/People.tsx:193:                  .slice()
frontend/src/components/People.tsx:194:                  .sort((a: any, b: any) => b.count - a.count)
frontend/src/components/People.tsx:195:                  .map((s: any) => (
frontend/src/components/People.tsx:196:                    <div key={s.id} className={'spec-card' + (s.tier ? ' on' : '')}>
frontend/src/components/People.tsx:197:                      <span className="spec-ico">{s.icon}</span>
frontend/src/components/People.tsx:198:                      <div className="spec-body">
frontend/src/components/People.tsx:199:                        <div className="spec-label">{s.tier ? `${s.tier} · ${s.label}` : s.label}</div>
frontend/src/components/People.tsx:200:                        <div className="spec-meta">{s.count} дегустаций</div>
frontend/src/components/People.tsx:201:                      </div>
frontend/src/components/People.tsx:202:                    </div>
frontend/src/components/People.tsx:203:                  ))}
frontend/src/components/People.tsx:204:              </div>
frontend/src/components/People.tsx:205:            </div>
frontend/src/components/People.tsx:206:          )}
frontend/src/components/People.tsx:208:          {(() => {
frontend/src/components/People.tsx:209:            // fill the author from the profile owner (reviewList items carry no `user`)
frontend/src/components/People.tsx:210:            const withUser = (r: Review): Review =>
frontend/src/components/People.tsx:211:              ({ ...r, user: r.user ?? { id: p.id, firstName: p.firstName, username: p.username, photoUrl: p.photoUrl } } as Review);
frontend/src/components/People.tsx:212:            const open = (r: Review) => setPhotoReview(withUser(r));
frontend/src/components/People.tsx:213:            const withPhoto = p.reviewList.filter((r) => r.photoUrls?.[0] || r.listing?.photoUrl);
frontend/src/components/People.tsx:214:            // taste snapshot (computed from the reviews we have)
frontend/src/components/People.tsx:215:            const total = p.reviewList.length;
frontend/src/components/People.tsx:216:            const avg = total ? p.reviewList.reduce((s, r) => s + r.rating, 0) / total : 0;
frontend/src/components/People.tsx:217:            const catCount = new Set(
frontend/src/components/People.tsx:218:              p.reviewList
frontend/src/components/People.tsx:219:                .map((r) => r.listing?.category)
frontend/src/components/People.tsx:220:                .filter((c): c is string => !!c && !/^(блюдо|напиток)$/i.test(c)),
frontend/src/components/People.tsx:221:            ).size;
frontend/src/components/People.tsx:222:            const best = [...p.reviewList].sort((a, b) => b.rating - a.rating)[0];
frontend/src/components/People.tsx:223:            if (p.reviewList.length === 0) {
frontend/src/components/People.tsx:224:              return (
frontend/src/components/People.tsx:225:                <div className="me-section">
frontend/src/components/People.tsx:226:                  <h2 className="me-h">Отзывы</h2>
frontend/src/components/People.tsx:227:                  <div className="meta" style={{ color: 'var(--hint)' }}>Пока нет отзывов</div>
frontend/src/components/People.tsx:228:                </div>
frontend/src/components/People.tsx:229:              );
frontend/src/components/People.tsx:230:            }
frontend/src/components/People.tsx:231:            return (
frontend/src/components/People.tsx:232:              <>
frontend/src/components/People.tsx:233:                {/* 1) carousel of rating photos (tap → Untappd card) */}
frontend/src/components/People.tsx:234:                {withPhoto.length > 0 && (
frontend/src/components/People.tsx:235:                  <div className="me-section">
frontend/src/components/People.tsx:236:                    <h2 className="me-h">Оценки</h2>
frontend/src/components/People.tsx:237:                    <div className="rc-carousel">
frontend/src/components/People.tsx:238:                      {withPhoto.map((r) => (
frontend/src/components/People.tsx:239:                        <button key={r.id} onClick={() => open(r)}>
frontend/src/components/People.tsx:240:                          <SmartImg
frontend/src/components/People.tsx:241:                            className="rc-carousel-photo"
frontend/src/components/People.tsx:242:                            src={r.photoUrls?.[0] || r.listing?.photoUrl}
frontend/src/components/People.tsx:243:                            width={400}
frontend/src/components/People.tsx:244:                            stock={r.listing ? {
frontend/src/components/People.tsx:245:                              type: r.listing.type,
frontend/src/components/People.tsx:246:                              category: r.listing.category,
frontend/src/components/People.tsx:247:                              name: r.listing.name,
frontend/src/components/People.tsx:248:                              seed: r.listing.id,
frontend/src/components/People.tsx:249:                            } : undefined}
frontend/src/components/People.tsx:250:                            monogram={r.listing?.name}
frontend/src/components/People.tsx:251:                          />
frontend/src/components/People.tsx:252:                        </button>
frontend/src/components/People.tsx:253:                      ))}
frontend/src/components/People.tsx:254:                    </div>
frontend/src/components/People.tsx:255:                  </div>
frontend/src/components/People.tsx:256:                )}
frontend/src/components/People.tsx:257:                {/* 2) taste snapshot */}
frontend/src/components/People.tsx:258:                <div className="me-section">
frontend/src/components/People.tsx:259:                  <h2 className="me-h">О вкусе</h2>
frontend/src/components/People.tsx:260:                  <div className="taste-card">
frontend/src/components/People.tsx:261:                    <div className="taste-line">
frontend/src/components/People.tsx:262:                      <span className="taste-key">Средняя оценка</span>
frontend/src/components/People.tsx:263:                      <span className="taste-val">{avg.toFixed(1)}★</span>
frontend/src/components/People.tsx:264:                    </div>
frontend/src/components/People.tsx:265:                    <div className="taste-line">
frontend/src/components/People.tsx:266:                      <span className="taste-key">Оценок</span>
frontend/src/components/People.tsx:267:                      <span className="taste-val">{total}</span>
frontend/src/components/People.tsx:268:                    </div>
frontend/src/components/People.tsx:269:                    <div className="taste-line">
frontend/src/components/People.tsx:270:                      <span className="taste-key">Распробовал категорий</span>
frontend/src/components/People.tsx:271:                      <span className="taste-val">{catCount}</span>
frontend/src/components/People.tsx:272:                    </div>
frontend/src/components/People.tsx:273:                    {best?.listing && (
frontend/src/components/People.tsx:274:                      <div className="taste-line">
frontend/src/components/People.tsx:275:                        <span className="taste-key">🥇 Лучшая находка</span>
frontend/src/components/People.tsx:276:                        <span className="taste-val">{best.listing.name} · {best.rating.toFixed(1)}★</span>
frontend/src/components/People.tsx:277:                      </div>
frontend/src/components/People.tsx:278:                    )}
frontend/src/components/People.tsx:279:                  </div>
frontend/src/components/People.tsx:280:                </div>
frontend/src/components/People.tsx:281:                {/* 3) average rating per category */}
frontend/src/components/People.tsx:282:                <div className="me-section">
frontend/src/components/People.tsx:283:                  <h2 className="me-h">Оценки по категориям</h2>
frontend/src/components/People.tsx:284:                  <CategoryAverages reviews={p.reviewList} />
frontend/src/components/People.tsx:285:                </div>
frontend/src/components/People.tsx:286:                {/* 3) full Untappd-style cards */}
frontend/src/components/People.tsx:287:                <div className="me-section">
frontend/src/components/People.tsx:288:                  <h2 className="me-h">Отзывы</h2>
frontend/src/components/People.tsx:289:                  {p.reviewList.map((r) => (
frontend/src/components/People.tsx:290:                    <ReviewCard
frontend/src/components/People.tsx:291:                      key={r.id}
frontend/src/components/People.tsx:292:                      review={withUser(r)}
frontend/src/components/People.tsx:293:                      onOpen={() => open(r)}
frontend/src/components/People.tsx:294:                      onOpenVenue={() => r.venue?.id && setOpenListing(r.venue.id)}
frontend/src/components/People.tsx:295:                    />
frontend/src/components/People.tsx:296:                  ))}
frontend/src/components/People.tsx:297:                </div>
frontend/src/components/People.tsx:298:              </>
frontend/src/components/People.tsx:299:            );
frontend/src/components/People.tsx:300:          })()}
frontend/src/components/People.tsx:301:        </>
frontend/src/components/People.tsx:302:      )}
frontend/src/components/People.tsx:303:      {openListing && (
frontend/src/components/People.tsx:304:        <ListingDetailModal id={openListing} onClose={() => setOpenListing(null)} />
frontend/src/components/People.tsx:305:      )}
frontend/src/components/People.tsx:306:      {people && p && (
frontend/src/components/People.tsx:307:        <PeopleModal
frontend/src/components/People.tsx:308:          userId={p.id}
frontend/src/components/People.tsx:309:          initialTab={people}
frontend/src/components/People.tsx:310:          onClose={() => setPeople(null)}
frontend/src/components/People.tsx:311:          onOpenUser={() => setPeople(null)}
frontend/src/components/People.tsx:312:        />
frontend/src/components/People.tsx:313:      )}
frontend/src/components/People.tsx:314:      {photoReview && (
frontend/src/components/People.tsx:315:        <PhotoPostModal
frontend/src/components/People.tsx:316:          review={photoReview}
frontend/src/components/People.tsx:317:          onClose={() => setPhotoReview(null)}
frontend/src/components/People.tsx:318:          onOpenUser={() => setPhotoReview(null)}
frontend/src/components/People.tsx:319:          onOpenListing={() => {
frontend/src/components/People.tsx:320:            const lid = photoReview.listing?.id;
frontend/src/components/People.tsx:321:            setPhotoReview(null);
frontend/src/components/People.tsx:322:            if (lid) setOpenListing(lid);
frontend/src/components/People.tsx:323:          }}
frontend/src/components/People.tsx:324:          onOpenVenue={() => {
frontend/src/components/People.tsx:325:            const vid = photoReview.venue?.id;
frontend/src/components/People.tsx:326:            setPhotoReview(null);
frontend/src/components/People.tsx:327:            if (vid) setOpenListing(vid);
frontend/src/components/People.tsx:328:          }}
frontend/src/components/People.tsx:329:        />
frontend/src/components/People.tsx:330:      )}
frontend/src/components/People.tsx:331:    </div>
frontend/src/components/People.tsx:332:  );
frontend/src/components/People.tsx:333:}
frontend/src/components/ScanFab.tsx:1:import { useEffect, useRef, useState } from 'react';
frontend/src/components/ScanFab.tsx:2:import { api } from '../api';
frontend/src/components/ScanFab.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src/components/ScanFab.tsx:4:import { haptic } from '../telegram';
frontend/src/components/ScanFab.tsx:5:import { shareReviewToStory } from '../reviewStory';
frontend/src/components/ScanFab.tsx:6:import type { Listing, RecognizeResult } from '../types';
frontend/src/components/ScanFab.tsx:7:import { ReviewForm } from './ReviewForm';
frontend/src/components/ScanFab.tsx:8:import { VenuePicker } from './VenuePicker';
frontend/src/components/ScanFab.tsx:10:function CamIcon() {
frontend/src/components/ScanFab.tsx:11:  return (
frontend/src/components/ScanFab.tsx:12:    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
frontend/src/components/ScanFab.tsx:13:      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
frontend/src/components/ScanFab.tsx:14:      <circle cx="12" cy="13" r="4" />
frontend/src/components/ScanFab.tsx:15:    </svg>
frontend/src/components/ScanFab.tsx:16:  );
frontend/src/components/ScanFab.tsx:17:}
frontend/src/components/ScanFab.tsx:19:function BackIcon() {
frontend/src/components/ScanFab.tsx:20:  return (
frontend/src/components/ScanFab.tsx:21:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
frontend/src/components/ScanFab.tsx:22:      <path d="M19 12H5" />
frontend/src/components/ScanFab.tsx:23:      <path d="M12 19l-7-7 7-7" />
frontend/src/components/ScanFab.tsx:24:    </svg>
frontend/src/components/ScanFab.tsx:25:  );
frontend/src/components/ScanFab.tsx:26:}
frontend/src/components/ScanFab.tsx:28:// Search inside the recognition sheet: when the AI didn't guess it, the user finds
frontend/src/components/ScanFab.tsx:29:// the item manually — that correction is the strongest training signal we get.
frontend/src/components/ScanFab.tsx:30:function ScanSearch({ onPick, initial }: { onPick: (l: Listing) => void; initial?: string }) {
frontend/src/components/ScanFab.tsx:31:  const [q, setQ] = useState(initial ?? '');
frontend/src/components/ScanFab.tsx:32:  const [found, setFound] = useState<Listing[]>([]);
frontend/src/components/ScanFab.tsx:33:  useEffect(() => {
frontend/src/components/ScanFab.tsx:34:    const query = q.trim();
frontend/src/components/ScanFab.tsx:35:    if (query.length < 2) { setFound([]); return; }
frontend/src/components/ScanFab.tsx:36:    const t = setTimeout(() => {
frontend/src/components/ScanFab.tsx:37:      api.searchAll(query)
frontend/src/components/ScanFab.tsx:38:        .then((list) => setFound(list.filter((l) => l.type === 'DISH' || l.type === 'DRINK').slice(0, 5)))
frontend/src/components/ScanFab.tsx:39:        .catch(() => {});
frontend/src/components/ScanFab.tsx:40:    }, 250);
frontend/src/components/ScanFab.tsx:41:    return () => clearTimeout(t);
frontend/src/components/ScanFab.tsx:42:  }, [q]);
frontend/src/components/ScanFab.tsx:43:  return (
frontend/src/components/ScanFab.tsx:44:    <div className="scan-search">
frontend/src/components/ScanFab.tsx:45:      <input
frontend/src/components/ScanFab.tsx:46:        placeholder="Не то? Найдите вручную…"
frontend/src/components/ScanFab.tsx:47:        value={q}
frontend/src/components/ScanFab.tsx:48:        onChange={(e) => setQ(e.target.value)}
frontend/src/components/ScanFab.tsx:49:      />
frontend/src/components/ScanFab.tsx:50:      {found.length > 0 && (
frontend/src/components/ScanFab.tsx:51:        <div className="scan-list">
frontend/src/components/ScanFab.tsx:52:          {found.map((l) => (
frontend/src/components/ScanFab.tsx:53:            <button key={l.id} className="scan-cand" onClick={() => onPick(l)}>
frontend/src/components/ScanFab.tsx:54:              <div className="scan-cand-thumb">
frontend/src/components/ScanFab.tsx:55:                {l.photoUrl ? <img src={l.photoUrl} alt="" loading="lazy" /> : <span>🍽</span>}
frontend/src/components/ScanFab.tsx:56:              </div>
frontend/src/components/ScanFab.tsx:57:              <div className="scan-cand-body">
frontend/src/components/ScanFab.tsx:58:                <b>{l.name}</b>
frontend/src/components/ScanFab.tsx:59:                <span className="scan-cand-meta">{l.category ?? ''}</span>
frontend/src/components/ScanFab.tsx:60:              </div>
frontend/src/components/ScanFab.tsx:61:            </button>
frontend/src/components/ScanFab.tsx:62:          ))}
frontend/src/components/ScanFab.tsx:63:        </div>
frontend/src/components/ScanFab.tsx:64:      )}
frontend/src/components/ScanFab.tsx:65:    </div>
frontend/src/components/ScanFab.tsx:66:  );
frontend/src/components/ScanFab.tsx:67:}
frontend/src/components/ScanFab.tsx:69:function ScanDialog({
frontend/src/components/ScanFab.tsx:70:  busy,
frontend/src/components/ScanFab.tsx:71:  result,
frontend/src/components/ScanFab.tsx:72:  preview,
frontend/src/components/ScanFab.tsx:73:  onClose,
frontend/src/components/ScanFab.tsx:74:  onRetake,
frontend/src/components/ScanFab.tsx:75:  onRetryAnalysis,
frontend/src/components/ScanFab.tsx:76:  onPickCandidate,
frontend/src/components/ScanFab.tsx:77:  onPickSearch,
frontend/src/components/ScanFab.tsx:78:}: {
frontend/src/components/ScanFab.tsx:79:  busy: boolean;
frontend/src/components/ScanFab.tsx:80:  result: RecognizeResult | null;
frontend/src/components/ScanFab.tsx:81:  preview: string | null;
frontend/src/components/ScanFab.tsx:82:  onClose: () => void;
frontend/src/components/ScanFab.tsx:83:  onRetake: () => void;
frontend/src/components/ScanFab.tsx:84:  onRetryAnalysis: () => void;
frontend/src/components/ScanFab.tsx:85:  onPickCandidate: (id: string, result: RecognizeResult) => void;
frontend/src/components/ScanFab.tsx:86:  onPickSearch: (l: Listing) => void;
frontend/src/components/ScanFab.tsx:87:}) {
frontend/src/components/ScanFab.tsx:88:  useEscClose(onClose);
frontend/src/components/ScanFab.tsx:90:  return (
frontend/src/components/ScanFab.tsx:91:    <div className="modal-backdrop scan-backdrop" style={{ zIndex: 3600 }} onClick={() => !busy && onClose()}>
frontend/src/components/ScanFab.tsx:92:      <div className="scan-sheet" onClick={(e) => e.stopPropagation()}>
frontend/src/components/ScanFab.tsx:93:        <button className="scan-back" onClick={onClose} aria-label="Закрыть">
frontend/src/components/ScanFab.tsx:94:          <BackIcon />
frontend/src/components/ScanFab.tsx:95:        </button>
frontend/src/components/ScanFab.tsx:96:        {preview && <img className="scan-preview" src={preview} alt="" />}
frontend/src/components/ScanFab.tsx:97:        {busy ? (
frontend/src/components/ScanFab.tsx:98:          <div className="scan-loading">
frontend/src/components/ScanFab.tsx:99:            <span className="scan-spinner" />
frontend/src/components/ScanFab.tsx:100:            ИИ анализирует фото...
frontend/src/components/ScanFab.tsx:101:          </div>
frontend/src/components/ScanFab.tsx:102:        ) : result && result.candidates.length ? (
frontend/src/components/ScanFab.tsx:103:          <>
frontend/src/components/ScanFab.tsx:104:            {result.labelText && <div className="scan-label-badge">🍷 Этикетка: {result.labelText}</div>}
frontend/src/components/ScanFab.tsx:105:            <div className="scan-title">Что именно на фото? Подтвердите</div>
frontend/src/components/ScanFab.tsx:106:            <div className="scan-list">
frontend/src/components/ScanFab.tsx:107:              {result.candidates.map((c, i) => (
frontend/src/components/ScanFab.tsx:108:                <button
frontend/src/components/ScanFab.tsx:109:                  key={c.id}
frontend/src/components/ScanFab.tsx:110:                  className={'scan-cand' + (i === 0 && result.topConfident ? ' top' : '')}
frontend/src/components/ScanFab.tsx:111:                  onClick={() => onPickCandidate(c.id, result)}
frontend/src/components/ScanFab.tsx:112:                >
frontend/src/components/ScanFab.tsx:113:                  <div className="scan-cand-thumb">
frontend/src/components/ScanFab.tsx:114:                    {c.photoUrl ? <img src={c.photoUrl} alt="" /> : <span>🍽</span>}
frontend/src/components/ScanFab.tsx:115:                  </div>
frontend/src/components/ScanFab.tsx:116:                  <div className="scan-cand-body">
frontend/src/components/ScanFab.tsx:117:                    <b>{c.name}</b>
frontend/src/components/ScanFab.tsx:118:                    <span className="scan-cand-meta">
frontend/src/components/ScanFab.tsx:119:                      {i === 0 && result.topConfident ? '✓ скорее всего это' : c.reviewCount > 0 ? `★ ${c.avgRating.toFixed(1)} · ${c.reviewCount}` : 'Нет оценок'}
frontend/src/components/ScanFab.tsx:120:                    </span>
frontend/src/components/ScanFab.tsx:121:                  </div>
frontend/src/components/ScanFab.tsx:122:                  <span className="scan-conf">{Math.round(c.confidence * 100)}%</span>
frontend/src/components/ScanFab.tsx:123:                </button>
frontend/src/components/ScanFab.tsx:124:              ))}
frontend/src/components/ScanFab.tsx:125:            </div>
frontend/src/components/ScanFab.tsx:126:            <ScanSearch onPick={onPickSearch} initial={result.labelText} />
frontend/src/components/ScanFab.tsx:127:            <button className="scan-retry" onClick={onRetryAnalysis}>
frontend/src/components/ScanFab.tsx:128:              Попробовать еще раз
frontend/src/components/ScanFab.tsx:129:            </button>
frontend/src/components/ScanFab.tsx:130:            <button className="scan-retry scan-retake" onClick={onRetake}>
frontend/src/components/ScanFab.tsx:131:              Сделать фото заново
frontend/src/components/ScanFab.tsx:132:            </button>
frontend/src/components/ScanFab.tsx:133:          </>
frontend/src/components/ScanFab.tsx:134:        ) : (
frontend/src/components/ScanFab.tsx:135:          <div className="scan-empty">
frontend/src/components/ScanFab.tsx:136:            {result?.labelText ? (
frontend/src/components/ScanFab.tsx:137:              <div>🍷 Этикетка: <b>{result.labelText}</b></div>
frontend/src/components/ScanFab.tsx:138:            ) : (
frontend/src/components/ScanFab.tsx:139:              <div>Не удалось распознать 🤔</div>
frontend/src/components/ScanFab.tsx:140:            )}
frontend/src/components/ScanFab.tsx:141:            {result?.diagnostic && !result?.labelText && <small>{result.diagnostic}</small>}
frontend/src/components/ScanFab.tsx:142:            <ScanSearch onPick={onPickSearch} initial={result?.labelText} />
frontend/src/components/ScanFab.tsx:143:            <button className="scan-retry" onClick={onRetryAnalysis}>
frontend/src/components/ScanFab.tsx:144:              Попробовать еще раз
frontend/src/components/ScanFab.tsx:145:            </button>
frontend/src/components/ScanFab.tsx:146:            <button className="scan-retry scan-retake" onClick={onRetake}>
frontend/src/components/ScanFab.tsx:147:              Сделать фото заново
frontend/src/components/ScanFab.tsx:148:            </button>
frontend/src/components/ScanFab.tsx:149:          </div>
frontend/src/components/ScanFab.tsx:150:        )}
frontend/src/components/ScanFab.tsx:151:      </div>
frontend/src/components/ScanFab.tsx:152:    </div>
frontend/src/components/ScanFab.tsx:153:  );
frontend/src/components/ScanFab.tsx:154:}
frontend/src/components/ScanFab.tsx:156:export function ScanFab() {
frontend/src/components/ScanFab.tsx:157:  const cameraRef = useRef<HTMLInputElement>(null);
frontend/src/components/ScanFab.tsx:158:  const galleryRef = useRef<HTMLInputElement>(null);
frontend/src/components/ScanFab.tsx:159:  const [srcMenu, setSrcMenu] = useState(false);
frontend/src/components/ScanFab.tsx:160:  // one soft pulse per session draws the eye to the key action (UX Core: anchoring
frontend/src/components/ScanFab.tsx:161:  // attention with motion — once, not constantly)
frontend/src/components/ScanFab.tsx:162:  const [pulse, setPulse] = useState(false);
frontend/src/components/ScanFab.tsx:163:  useEffect(() => {
frontend/src/components/ScanFab.tsx:164:    if (sessionStorage.getItem('fabPulsed')) return;
frontend/src/components/ScanFab.tsx:165:    sessionStorage.setItem('fabPulsed', '1');
frontend/src/components/ScanFab.tsx:166:    setPulse(true);
frontend/src/components/ScanFab.tsx:167:    const t = setTimeout(() => setPulse(false), 3600);
frontend/src/components/ScanFab.tsx:168:    return () => clearTimeout(t);
frontend/src/components/ScanFab.tsx:169:  }, []);
frontend/src/components/ScanFab.tsx:170:  const [busy, setBusy] = useState(false);
frontend/src/components/ScanFab.tsx:171:  const [result, setResult] = useState<RecognizeResult | null>(null);
frontend/src/components/ScanFab.tsx:172:  const [preview, setPreview] = useState<string | null>(null);
frontend/src/components/ScanFab.tsx:173:  const [chosen, setChosen] = useState<Listing | null>(null);
frontend/src/components/ScanFab.tsx:174:  const [venue, setVenue] = useState<{ id?: string; name: string; pending?: boolean } | null>(null);
frontend/src/components/ScanFab.tsx:175:  const [stage, setStage] = useState<'idle' | 'pickVenue' | 'rate'>('idle');
frontend/src/components/ScanFab.tsx:176:  const uploadedUrl = useRef<string | undefined>(undefined);
frontend/src/components/ScanFab.tsx:177:  const lastFile = useRef<File | null>(null);
frontend/src/components/ScanFab.tsx:179:  const reset = () => {
frontend/src/components/ScanFab.tsx:180:    setResult(null);
frontend/src/components/ScanFab.tsx:181:    setBusy(false);
frontend/src/components/ScanFab.tsx:182:    setChosen(null);
frontend/src/components/ScanFab.tsx:183:    setVenue(null);
frontend/src/components/ScanFab.tsx:184:    setStage('idle');
frontend/src/components/ScanFab.tsx:185:    setPreview((p) => {
frontend/src/components/ScanFab.tsx:186:      if (p) URL.revokeObjectURL(p);
frontend/src/components/ScanFab.tsx:187:      return null;
frontend/src/components/ScanFab.tsx:188:    });
frontend/src/components/ScanFab.tsx:189:    uploadedUrl.current = undefined;
frontend/src/components/ScanFab.tsx:190:    lastFile.current = null;
frontend/src/components/ScanFab.tsx:191:  };
frontend/src/components/ScanFab.tsx:193:  const runRecognition = async (file: File) => {
frontend/src/components/ScanFab.tsx:194:    setBusy(true);
frontend/src/components/ScanFab.tsx:195:    setResult(null);
frontend/src/components/ScanFab.tsx:196:    try {
frontend/src/components/ScanFab.tsx:197:      const r = await api.recognize(file, 'auto');
frontend/src/components/ScanFab.tsx:198:      // NEVER auto-open (owner rule): always show the choices and let the user
frontend/src/components/ScanFab.tsx:199:      // confirm — even when the AI is 100% sure. The top match is pre-highlighted.
frontend/src/components/ScanFab.tsx:200:      setResult(r);
frontend/src/components/ScanFab.tsx:201:      setBusy(false);
frontend/src/components/ScanFab.tsx:202:    } catch (e) {
frontend/src/components/ScanFab.tsx:203:      setResult({
frontend/src/components/ScanFab.tsx:204:        caption: '',
frontend/src/components/ScanFab.tsx:205:        mode: 'auto',
frontend/src/components/ScanFab.tsx:206:        candidates: [],
frontend/src/components/ScanFab.tsx:207:        autoOpen: false,
frontend/src/components/ScanFab.tsx:208:        diagnostic: e instanceof Error ? e.message : 'recognize failed',
frontend/src/components/ScanFab.tsx:209:      });
frontend/src/components/ScanFab.tsx:210:      setBusy(false);
frontend/src/components/ScanFab.tsx:211:    }
frontend/src/components/ScanFab.tsx:212:  };
frontend/src/components/ScanFab.tsx:214:  const pickCandidate = async (id: string, r: RecognizeResult) => {
frontend/src/components/ScanFab.tsx:215:    api
frontend/src/components/ScanFab.tsx:216:      .visionFeedback({
frontend/src/components/ScanFab.tsx:217:        photoUrl: uploadedUrl.current,
frontend/src/components/ScanFab.tsx:218:        caption: r.caption,
frontend/src/components/ScanFab.tsx:219:        mode: r.mode,
frontend/src/components/ScanFab.tsx:220:        predictedIds: r.candidates.map((c) => c.id),
frontend/src/components/ScanFab.tsx:221:        topConfidence: r.candidates[0]?.confidence,
frontend/src/components/ScanFab.tsx:222:        chosenId: id,
frontend/src/components/ScanFab.tsx:223:      })
frontend/src/components/ScanFab.tsx:224:      .catch(() => {});
frontend/src/components/ScanFab.tsx:225:    haptic('medium');
frontend/src/components/ScanFab.tsx:226:    setResult(null);
frontend/src/components/ScanFab.tsx:227:    setBusy(false);
frontend/src/components/ScanFab.tsx:228:    try {
frontend/src/components/ScanFab.tsx:229:      const full = await api.listing(id);
frontend/src/components/ScanFab.tsx:230:      setChosen(full as unknown as Listing);
frontend/src/components/ScanFab.tsx:231:      setStage('pickVenue');
frontend/src/components/ScanFab.tsx:232:    } catch {
frontend/src/components/ScanFab.tsx:233:      reset();
frontend/src/components/ScanFab.tsx:234:    }
frontend/src/components/ScanFab.tsx:235:  };
frontend/src/components/ScanFab.tsx:237:  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
frontend/src/components/ScanFab.tsx:238:    const file = e.target.files?.[0];
frontend/src/components/ScanFab.tsx:239:    e.target.value = '';
frontend/src/components/ScanFab.tsx:240:    if (!file) return;
frontend/src/components/ScanFab.tsx:241:    lastFile.current = file;
frontend/src/components/ScanFab.tsx:242:    setPreview((old) => {
frontend/src/components/ScanFab.tsx:243:      if (old) URL.revokeObjectURL(old);
frontend/src/components/ScanFab.tsx:244:      return URL.createObjectURL(file);
frontend/src/components/ScanFab.tsx:245:    });
frontend/src/components/ScanFab.tsx:246:    uploadedUrl.current = undefined;
frontend/src/components/ScanFab.tsx:247:    api.upload(file).then((u) => (uploadedUrl.current = u)).catch(() => {});
frontend/src/components/ScanFab.tsx:248:    await runRecognition(file);
frontend/src/components/ScanFab.tsx:249:  };
frontend/src/components/ScanFab.tsx:251:  const retryAnalysis = () => {
frontend/src/components/ScanFab.tsx:252:    if (!lastFile.current || busy) return;
frontend/src/components/ScanFab.tsx:253:    void runRecognition(lastFile.current);
frontend/src/components/ScanFab.tsx:254:  };
frontend/src/components/ScanFab.tsx:256:  const retakePhoto = () => {
frontend/src/components/ScanFab.tsx:257:    if (busy) return;
frontend/src/components/ScanFab.tsx:258:    setResult(null);
frontend/src/components/ScanFab.tsx:259:    setSrcMenu(true);
frontend/src/components/ScanFab.tsx:260:  };
frontend/src/components/ScanFab.tsx:262:  // manual search pick = a CORRECTION: negative signal for the shown top-5,
frontend/src/components/ScanFab.tsx:263:  // positive for the chosen item — the strongest training example we get
frontend/src/components/ScanFab.tsx:264:  const pickFromSearch = (l: Listing) => {
frontend/src/components/ScanFab.tsx:265:    const r: RecognizeResult =
frontend/src/components/ScanFab.tsx:266:      result ?? { caption: '', mode: 'auto', candidates: [], autoOpen: false };
frontend/src/components/ScanFab.tsx:267:    void pickCandidate(l.id, r);
frontend/src/components/ScanFab.tsx:268:  };
frontend/src/components/ScanFab.tsx:270:  // "Скан" caption under the FAB for the first 2 sessions — after that the
frontend/src/components/ScanFab.tsx:271:  // camera icon is assumed learned (obviousness without permanent clutter)
frontend/src/components/ScanFab.tsx:272:  const [fabLabel] = useState(() => {
frontend/src/components/ScanFab.tsx:273:    try {
frontend/src/components/ScanFab.tsx:274:      const n = Number(localStorage.getItem('scanFabSeen') || '0');
frontend/src/components/ScanFab.tsx:275:      if (n < 2) { localStorage.setItem('scanFabSeen', String(n + 1)); return true; }
frontend/src/components/ScanFab.tsx:276:    } catch { /* private mode */ }
frontend/src/components/ScanFab.tsx:277:    return false;
frontend/src/components/ScanFab.tsx:278:  });
frontend/src/components/ScanFab.tsx:280:  return (
frontend/src/components/ScanFab.tsx:281:    <>
frontend/src/components/ScanFab.tsx:282:      <button className={'scan-fab' + (pulse ? ' pulse' : '')} onClick={() => galleryRef.current?.click()} aria-label="Сканировать блюдо или напиток">
frontend/src/components/ScanFab.tsx:283:        <CamIcon />
frontend/src/components/ScanFab.tsx:284:        {fabLabel && <span className="scan-fab-label">Скан</span>}
frontend/src/components/ScanFab.tsx:285:      </button>
frontend/src/components/ScanFab.tsx:286:      {/* camera input: straight to the native camera.
frontend/src/components/ScanFab.tsx:287:          gallery input: `multiple` makes iOS SKIP its source menu and open the photo
frontend/src/components/ScanFab.tsx:288:          picker directly (we still use only the first file) — no "Файлы" step. */}
frontend/src/components/ScanFab.tsx:289:      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
frontend/src/components/ScanFab.tsx:290:      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
frontend/src/components/ScanFab.tsx:292:      {srcMenu && (
frontend/src/components/ScanFab.tsx:293:        <div className="modal-backdrop" style={{ zIndex: 3590 }} onClick={() => setSrcMenu(false)}>
frontend/src/components/ScanFab.tsx:294:          <div className="scan-src" onClick={(e) => e.stopPropagation()}>
frontend/src/components/ScanFab.tsx:295:            <button className="scan-src-btn" onClick={() => { setSrcMenu(false); cameraRef.current?.click(); }}>
frontend/src/components/ScanFab.tsx:296:              📷 Сделать фото
frontend/src/components/ScanFab.tsx:297:            </button>
frontend/src/components/ScanFab.tsx:298:            <button className="scan-src-btn" onClick={() => { setSrcMenu(false); galleryRef.current?.click(); }}>
frontend/src/components/ScanFab.tsx:299:              🖼 Из галереи
frontend/src/components/ScanFab.tsx:300:            </button>
frontend/src/components/ScanFab.tsx:301:            <button className="scan-src-btn cancel" onClick={() => setSrcMenu(false)}>
frontend/src/components/ScanFab.tsx:302:              Отмена
frontend/src/components/ScanFab.tsx:303:            </button>
frontend/src/components/ScanFab.tsx:304:          </div>
frontend/src/components/ScanFab.tsx:305:        </div>
frontend/src/components/ScanFab.tsx:306:      )}
frontend/src/components/ScanFab.tsx:308:      {(busy || result) && (
frontend/src/components/ScanFab.tsx:309:        <ScanDialog
frontend/src/components/ScanFab.tsx:310:          busy={busy}
frontend/src/components/ScanFab.tsx:311:          result={result}
frontend/src/components/ScanFab.tsx:312:          preview={preview}
frontend/src/components/ScanFab.tsx:313:          onClose={reset}
frontend/src/components/ScanFab.tsx:314:          onRetake={retakePhoto}
frontend/src/components/ScanFab.tsx:315:          onRetryAnalysis={retryAnalysis}
frontend/src/components/ScanFab.tsx:316:          onPickCandidate={pickCandidate}
frontend/src/components/ScanFab.tsx:317:          onPickSearch={pickFromSearch}
frontend/src/components/ScanFab.tsx:318:        />
frontend/src/components/ScanFab.tsx:319:      )}
frontend/src/components/ScanFab.tsx:321:      {stage === 'pickVenue' && chosen && (
frontend/src/components/ScanFab.tsx:322:        <VenuePicker
frontend/src/components/ScanFab.tsx:323:          itemId={chosen.id}
frontend/src/components/ScanFab.tsx:324:          onPick={(v) => {
frontend/src/components/ScanFab.tsx:325:            setVenue({ id: v.id, name: v.name });
frontend/src/components/ScanFab.tsx:326:            setStage('rate');
frontend/src/components/ScanFab.tsx:327:          }}
frontend/src/components/ScanFab.tsx:328:          onAdded={(name) => {
frontend/src/components/ScanFab.tsx:329:            setVenue({ name, pending: true });
frontend/src/components/ScanFab.tsx:330:            setStage('rate');
frontend/src/components/ScanFab.tsx:331:          }}
frontend/src/components/ScanFab.tsx:332:          onClose={() => setStage('rate')}
frontend/src/components/ScanFab.tsx:333:        />
frontend/src/components/ScanFab.tsx:334:      )}
frontend/src/components/ScanFab.tsx:336:      {stage === 'rate' && chosen && (
frontend/src/components/ScanFab.tsx:337:        <ReviewForm
frontend/src/components/ScanFab.tsx:338:          listing={chosen}
frontend/src/components/ScanFab.tsx:339:          venue={venue}
frontend/src/components/ScanFab.tsx:340:          initialPhotoUrls={uploadedUrl.current ? [uploadedUrl.current] : []}
frontend/src/components/ScanFab.tsx:341:          onClose={reset}
frontend/src/components/ScanFab.tsx:342:          onSaved={(media) => {
frontend/src/components/ScanFab.tsx:343:            haptic('medium');
frontend/src/components/ScanFab.tsx:344:            void shareReviewToStory(chosen, media);
frontend/src/components/ScanFab.tsx:345:            reset();
frontend/src/components/ScanFab.tsx:346:          }}
frontend/src/components/ScanFab.tsx:347:        />
frontend/src/components/ScanFab.tsx:348:      )}
frontend/src/components/ScanFab.tsx:349:    </>
frontend/src/components/ScanFab.tsx:350:  );
frontend/src/components/ScanFab.tsx:351:}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/components/ScanFab.tsx'; "'$c=Get-Content -Encoding utf8 $f; for($i=1;$i -le 160;$i++){"$i`:$($c[$i-1])"}; $f='"'frontend/src/components/MapBrowse.tsx'; "'$c=Get-Content -Encoding utf8 $f; foreach($range in @(@(1,180),@(180,342))){$s=$range[0];$e=$range[1];for($i=$s;$i -le $e;$i++){"$i`:$($c[$i-1])"}}' in D:\Приложения\Yelp
 succeeded in 817ms:
1:import { useEffect, useRef, useState } from 'react';
2:import { api } from '../api';
3:import { useEscClose } from '../modalEsc';
4:import { haptic } from '../telegram';
5:import { shareReviewToStory } from '../reviewStory';
6:import type { Listing, RecognizeResult } from '../types';
7:import { ReviewForm } from './ReviewForm';
8:import { VenuePicker } from './VenuePicker';
9:
10:function CamIcon() {
11:  return (
12:    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
13:      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
14:      <circle cx="12" cy="13" r="4" />
15:    </svg>
16:  );
17:}
18:
19:function BackIcon() {
20:  return (
21:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
22:      <path d="M19 12H5" />
23:      <path d="M12 19l-7-7 7-7" />
24:    </svg>
25:  );
26:}
27:
28:// Search inside the recognition sheet: when the AI didn't guess it, the user finds
29:// the item manually — that correction is the strongest training signal we get.
30:function ScanSearch({ onPick, initial }: { onPick: (l: Listing) => void; initial?: string }) {
31:  const [q, setQ] = useState(initial ?? '');
32:  const [found, setFound] = useState<Listing[]>([]);
33:  useEffect(() => {
34:    const query = q.trim();
35:    if (query.length < 2) { setFound([]); return; }
36:    const t = setTimeout(() => {
37:      api.searchAll(query)
38:        .then((list) => setFound(list.filter((l) => l.type === 'DISH' || l.type === 'DRINK').slice(0, 5)))
39:        .catch(() => {});
40:    }, 250);
41:    return () => clearTimeout(t);
42:  }, [q]);
43:  return (
44:    <div className="scan-search">
45:      <input
46:        placeholder="Не то? Найдите вручную…"
47:        value={q}
48:        onChange={(e) => setQ(e.target.value)}
49:      />
50:      {found.length > 0 && (
51:        <div className="scan-list">
52:          {found.map((l) => (
53:            <button key={l.id} className="scan-cand" onClick={() => onPick(l)}>
54:              <div className="scan-cand-thumb">
55:                {l.photoUrl ? <img src={l.photoUrl} alt="" loading="lazy" /> : <span>🍽</span>}
56:              </div>
57:              <div className="scan-cand-body">
58:                <b>{l.name}</b>
59:                <span className="scan-cand-meta">{l.category ?? ''}</span>
60:              </div>
61:            </button>
62:          ))}
63:        </div>
64:      )}
65:    </div>
66:  );
67:}
68:
69:function ScanDialog({
70:  busy,
71:  result,
72:  preview,
73:  onClose,
74:  onRetake,
75:  onRetryAnalysis,
76:  onPickCandidate,
77:  onPickSearch,
78:}: {
79:  busy: boolean;
80:  result: RecognizeResult | null;
81:  preview: string | null;
82:  onClose: () => void;
83:  onRetake: () => void;
84:  onRetryAnalysis: () => void;
85:  onPickCandidate: (id: string, result: RecognizeResult) => void;
86:  onPickSearch: (l: Listing) => void;
87:}) {
88:  useEscClose(onClose);
89:
90:  return (
91:    <div className="modal-backdrop scan-backdrop" style={{ zIndex: 3600 }} onClick={() => !busy && onClose()}>
92:      <div className="scan-sheet" onClick={(e) => e.stopPropagation()}>
93:        <button className="scan-back" onClick={onClose} aria-label="Закрыть">
94:          <BackIcon />
95:        </button>
96:        {preview && <img className="scan-preview" src={preview} alt="" />}
97:        {busy ? (
98:          <div className="scan-loading">
99:            <span className="scan-spinner" />
100:            ИИ анализирует фото...
101:          </div>
102:        ) : result && result.candidates.length ? (
103:          <>
104:            {result.labelText && <div className="scan-label-badge">🍷 Этикетка: {result.labelText}</div>}
105:            <div className="scan-title">Что именно на фото? Подтвердите</div>
106:            <div className="scan-list">
107:              {result.candidates.map((c, i) => (
108:                <button
109:                  key={c.id}
110:                  className={'scan-cand' + (i === 0 && result.topConfident ? ' top' : '')}
111:                  onClick={() => onPickCandidate(c.id, result)}
112:                >
113:                  <div className="scan-cand-thumb">
114:                    {c.photoUrl ? <img src={c.photoUrl} alt="" /> : <span>🍽</span>}
115:                  </div>
116:                  <div className="scan-cand-body">
117:                    <b>{c.name}</b>
118:                    <span className="scan-cand-meta">
119:                      {i === 0 && result.topConfident ? '✓ скорее всего это' : c.reviewCount > 0 ? `★ ${c.avgRating.toFixed(1)} · ${c.reviewCount}` : 'Нет оценок'}
120:                    </span>
121:                  </div>
122:                  <span className="scan-conf">{Math.round(c.confidence * 100)}%</span>
123:                </button>
124:              ))}
125:            </div>
126:            <ScanSearch onPick={onPickSearch} initial={result.labelText} />
127:            <button className="scan-retry" onClick={onRetryAnalysis}>
128:              Попробовать еще раз
129:            </button>
130:            <button className="scan-retry scan-retake" onClick={onRetake}>
131:              Сделать фото заново
132:            </button>
133:          </>
134:        ) : (
135:          <div className="scan-empty">
136:            {result?.labelText ? (
137:              <div>🍷 Этикетка: <b>{result.labelText}</b></div>
138:            ) : (
139:              <div>Не удалось распознать 🤔</div>
140:            )}
141:            {result?.diagnostic && !result?.labelText && <small>{result.diagnostic}</small>}
142:            <ScanSearch onPick={onPickSearch} initial={result?.labelText} />
143:            <button className="scan-retry" onClick={onRetryAnalysis}>
144:              Попробовать еще раз
145:            </button>
146:            <button className="scan-retry scan-retake" onClick={onRetake}>
147:              Сделать фото заново
148:            </button>
149:          </div>
150:        )}
151:      </div>
152:    </div>
153:  );
154:}
155:
156:export function ScanFab() {
157:  const cameraRef = useRef<HTMLInputElement>(null);
158:  const galleryRef = useRef<HTMLInputElement>(null);
159:  const [srcMenu, setSrcMenu] = useState(false);
160:  // one soft pulse per session draws the eye to the key action (UX Core: anchoring
1:import { useEffect, useMemo, useRef, useState } from 'react';
2:import { api } from '../api';
3:import type { GeoPoint, Listing, ListingType } from '../types';
4:import { Filters, type FilterState } from './Filters';
5:import { ListRow } from './ListRow';
6:import { ListingDetailModal } from './ListingDetail';
7:import { MapView } from './MapView';
8:import { useFavorites } from '../hooks/useFavorites';
9:import { useEscClose } from '../modalEsc';
10:import { useSwipeBack } from '../swipeBack';
11:import { cuisineToken } from '../cuisine';
12:
13:export type BrowseCat = 'RESTAURANT' | 'BAR' | 'CAFE' | 'COFFEE' | 'DISH' | 'DRINK';
14:
15:const LABEL: Record<BrowseCat, string> = {
16:  RESTAURANT: 'Рестораны',
17:  BAR: 'Бары',
18:  CAFE: 'Кафе',
19:  COFFEE: 'Кофейни',
20:  DISH: 'Блюда',
21:  DRINK: 'Напитки',
22:};
23:
24:const MOSCOW: [number, number] = [55.751, 37.618];
25:
26:function distanceKm(a: [number, number], b: [number, number]): number {
27:  const R = 6371;
28:  const toRad = (d: number) => (d * Math.PI) / 180;
29:  const dLat = toRad(b[0] - a[0]);
30:  const dLng = toRad(b[1] - a[1]);
31:  const x =
32:    Math.sin(dLat / 2) ** 2 +
33:    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
34:  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
35:}
36:
37:export function MapBrowse({ cat, onClose }: { cat: BrowseCat; onClose: () => void }) {
38:  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
39:  const [results, setResults] = useState<Listing[]>([]);
40:  const [activeId, setActiveId] = useState<string | null>(null);
41:  const [expanded, setExpanded] = useState(false);
42:  const [closing, setClosing] = useState(false);
43:  const [query, setQuery] = useState('');
44:  const [searching, setSearching] = useState(false);
45:  const [filters, setFilters] = useState<FilterState>({
46:    sort: 'distance',
47:    price: 0,
48:    openNow: false,
49:    cuisine: '',
50:  });
51:  const [loaded, setLoaded] = useState(false);
52:
53:  const isItem = cat === 'DISH' || cat === 'DRINK';
54:  const close = () => {
55:    setClosing(true);
56:    setTimeout(onClose, 260);
57:  };
58:  useEscClose(close);
59:  const pageRef = useRef<HTMLDivElement>(null);
60:  useSwipeBack(pageRef, close); // edge swipe → back to home
61:  const { ids, toggle } = useFavorites();
62:
63:  // current location → blue dot + map centering
64:  const locate = () => {
65:    if (!navigator.geolocation) return;
66:    navigator.geolocation.getCurrentPosition(
67:      (p) => setUserLoc([p.coords.latitude, p.coords.longitude]),
68:      () => {},
69:      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
70:    );
71:  };
72:  useEffect(locate, []);
73:
74:  // fetch results; for dishes/drinks we look up the VENUES that serve them
75:  useEffect(() => {
76:    const q = query.trim();
77:    const sort = filters.sort;
78:    const t = setTimeout(() => {
79:      // a cuisine tag (e.g. "Бургеры") filters by cuisine instead of by name
80:      const tagToken = cuisineToken(q);
81:      // keep only venues that belong to the browsed category (COFFEE/CAFE/BAR)
82:      const catFilter = (list: Listing[]) => {
83:        if (cat === 'COFFEE') return list.filter((l) => /кофе|coffee/i.test(l.category ?? ''));
84:        if (cat === 'CAFE')
85:          return list.filter(
86:            (l) =>
87:              /кафе|фастфуд|шаурм|шаверм|мороженое|фуд.?корт/i.test(l.category ?? '') ||
88:              /kebab|shawarma/i.test(l.cuisine ?? ''),
89:          );
90:        if (cat === 'BAR') return list.filter((l) => /бар|паб|pub/i.test(l.category ?? ''));
91:        return list;
92:      };
93:      const req = isItem
94:        ? api.venuesServing(cat as 'DISH' | 'DRINK', q || undefined)
95:        : q && !tagToken
96:          ? // free-text query in a venue category → match venue NAME *or* a dish/drink
97:            // it serves (so "айс латте" in Кофейни finds coffee shops that pour it),
98:            // then scope to the category being browsed.
99:            api.searchVenues(q).then(catFilter)
100:          : api.listings(
101:              cat === 'BAR' || cat === 'CAFE' || cat === 'COFFEE' ? 'RESTAURANT' : (cat as ListingType),
102:              tagToken ? undefined : q || undefined,
103:              {
104:                sort,
105:                price: filters.price || undefined,
106:                openNow: filters.openNow,
107:                cuisine: tagToken ?? filters.cuisine ?? undefined,
108:                category: cat === 'BAR' ? 'Бар' : cat === 'CAFE' ? 'Кафе' : cat === 'COFFEE' ? 'Кофейня' : undefined,
109:                take: 150,
110:              },
111:            );
112:      setLoaded(false);
113:      req
114:        .then((list) => {
115:          setLoaded(true);
116:          // distance sort (default for the map) — by distance to the user
117:          if (sort === 'distance' || isItem) {
118:            const origin = userLoc ?? MOSCOW;
119:            list = [...list].sort((a, b) => {
120:              const da = a.lat != null && a.lng != null ? distanceKm(origin, [a.lat, a.lng]) : 1e9;
121:              const db = b.lat != null && b.lng != null ? distanceKm(origin, [b.lat, b.lng]) : 1e9;
122:              return da - db;
123:            });
124:          }
125:          setResults(list);
126:        })
127:        .catch(() => setLoaded(true));
128:    }, 250);
129:    return () => clearTimeout(t);
130:  }, [cat, filters, userLoc, query, isItem]);
131:
132:  const points: GeoPoint[] = useMemo(
133:    () =>
134:      results
135:        .filter((l) => l.lat != null && l.lng != null)
136:        .slice(0, 80)
137:        .map((l) => ({ id: l.id, name: l.name, lat: l.lat as number, lng: l.lng as number, type: l.type })),
138:    [results],
139:  );
140:
141:  // drag handle → follow the finger live (document-level listeners = robust in
142:  // the Telegram webview), then snap open/closed on release.
143:  const sheetRef = useRef<HTMLDivElement>(null);
144:  const collapsedPx = () => window.innerHeight * 0.86 - 220;
145:  // pull-down from INSIDE the list (feed-post logic): when the list is scrolled
146:  // to the top, dragging down grabs the whole sheet and collapses it to the map;
147:  // scrolled lists keep scrolling — the decision is made on the FIRST move.
148:  const listRef = useRef<HTMLDivElement>(null);
149:  const onListDown = (e: React.PointerEvent) => {
150:    if (!expanded) return; // collapsed sheet: the handle already does this
151:    const list = listRef.current;
152:    if (list && list.scrollTop > 0) return; // mid-scroll → native scrolling
153:    const startY = e.clientY;
154:    const startX = e.clientX;
155:    let decided = false;
156:    const sheet = sheetRef.current;
157:    const move = (ev: PointerEvent) => {
158:      const dy = ev.clientY - startY;
159:      const dx = ev.clientX - startX;
160:      if (!decided) {
161:        if (Math.abs(dy) < 4 && Math.abs(dx) < 4) return;
162:        // downward pull wins only when clearly vertical
163:        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { cleanup(); return; }
164:        decided = true;
165:        sheet?.classList.add('dragging');
166:      }
167:      ev.preventDefault();
168:      const t = Math.max(0, Math.min(collapsedPx(), dy));
169:      if (sheet) sheet.style.transform = `translateY(${t}px)`;
170:    };
171:    const up = (ev: PointerEvent) => {
172:      cleanup();
173:      if (!decided) return;
174:      if (sheet) {
175:        sheet.classList.remove('dragging');
176:        sheet.style.transform = '';
177:      }
178:      const dy = ev.clientY - startY;
179:      setExpanded(dy < collapsedPx() / 3); // a firm pull → the map
180:    };
180:    };
181:    const cleanup = () => {
182:      document.removeEventListener('pointermove', move);
183:      document.removeEventListener('pointerup', up);
184:      document.removeEventListener('pointercancel', up);
185:      if (!decided && sheet) { sheet.classList.remove('dragging'); sheet.style.transform = ''; }
186:    };
187:    document.addEventListener('pointermove', move, { passive: false });
188:    document.addEventListener('pointerup', up);
189:    document.addEventListener('pointercancel', up);
190:  };
191:
192:  const onDown = (e: React.PointerEvent) => {
193:    if ((e.target as HTMLElement).closest('button, input, a')) return; // let controls work
194:    const startY = e.clientY;
195:    const base = expanded ? 0 : collapsedPx();
196:    const sheet = sheetRef.current;
197:    sheet?.classList.add('dragging');
198:    const move = (ev: PointerEvent) => {
199:      if (!sheet) return;
200:      const t = Math.max(0, Math.min(collapsedPx(), base + (ev.clientY - startY)));
201:      sheet.style.transform = `translateY(${t}px)`;
202:    };
203:    const up = (ev: PointerEvent) => {
204:      document.removeEventListener('pointermove', move);
205:      document.removeEventListener('pointerup', up);
206:      document.removeEventListener('pointercancel', up);
207:      if (sheet) {
208:        sheet.classList.remove('dragging');
209:        sheet.style.transform = '';
210:      }
211:      const dy = ev.clientY - startY;
212:      if (Math.abs(dy) < 6) setExpanded((x) => !x);
213:      else setExpanded(base + dy < collapsedPx() / 2);
214:    };
215:    document.addEventListener('pointermove', move);
216:    document.addEventListener('pointerup', up);
217:    document.addEventListener('pointercancel', up);
218:  };
219:
220:  return (
221:    <div ref={pageRef} className={'mapbrowse' + (closing ? ' closing' : '')}>
222:      <div className="mb-header">
223:        <button
224:          className="mb-back"
225:          onClick={() => {
226:            // when searching, ← returns to the map; otherwise it closes
227:            if (searching || query) {
228:              setSearching(false);
229:              setQuery('');
230:            } else {
231:              close();
232:            }
233:          }}
234:        >
235:          ←
236:        </button>
237:        {searching ? (
238:          <>
239:            <input
240:              className="mb-header-input"
241:              autoFocus
242:              placeholder={
243:                cat === 'DISH'
244:                  ? 'Найти блюдо…'
245:                  : cat === 'DRINK'
246:                    ? 'Найти напиток…'
247:                    : 'Найти заведение…'
248:              }
249:              value={query}
250:              onChange={(e) => setQuery(e.target.value)}
251:              onBlur={() => !query && setSearching(false)}
252:            />
253:            {query && (
254:              <button
255:                className="search-ico right"
256:                onMouseDown={(e) => e.preventDefault()}
257:                aria-label="Искать"
258:              >
259:                🔍
260:              </button>
261:            )}
262:          </>
263:        ) : (
264:          <button className="mb-title" onClick={() => setSearching(true)}>
265:            <b>{LABEL[cat]}</b>
266:            <span className="mb-loc">
267:              {query ? `«${query}»` : isItem ? 'Где попробовать' : userLoc ? 'Рядом с вами' : 'Москва'}
268:            </span>
269:          </button>
270:        )}
271:        <button
272:          className="mb-locate-h"
273:          onClick={() => setExpanded((x) => !x)}
274:          title="Список"
275:        >
276:          {expanded ? '🗺' : '☰'}
277:        </button>
278:        <button className="mb-locate-h" onClick={locate} title="Моё местоположение">
279:          📍
280:        </button>
281:      </div>
282:
283:      <div className="mb-map">
284:        <MapView
285:          points={points}
286:          userLocation={userLoc}
287:          cluster
288:          height="100%"
289:          onSelect={setActiveId}
290:        />
291:      </div>
292:      {/* compass → jump the map to the user's current location */}
293:      <button className="mb-compass" onClick={locate} title="Моё местоположение" aria-label="Моё местоположение">
294:        🧭
295:      </button>
296:
297:      <div ref={sheetRef} className={'mb-sheet' + (expanded ? ' exp' : '')}>
298:        <div className="mb-handle" onPointerDown={onDown}>
299:          <span className="mb-grip" />
300:        </div>
301:
302:        {!isItem && (
303:          <div className="mb-filters" onPointerDown={onDown}>
304:            <Filters state={filters} onChange={(n) => setFilters((f) => ({ ...f, ...n }))} />
305:          </div>
306:        )}
307:        <div className="mb-count" onPointerDown={onDown}>
308:          {!loaded
309:            ? 'Загрузка…'
310:            : isItem
311:              ? results.length > 0
312:                ? `Подают в ${results.length} заведениях`
313:                : query
314:                  ? 'Не найдено — попробуйте другое название'
315:                  : 'Введите название блюда'
316:              : results.length > 0
317:                ? `Найдено: ${results.length}`
318:                : 'Ничего не найдено'}
319:        </div>
320:        <div className="mb-list" ref={listRef} onPointerDown={onListDown}>
321:          {results.map((l) => (
322:            <ListRow
323:              key={l.id}
324:              listing={l}
325:              favorite={ids.has(l.id)}
326:              onToggleFavorite={() => toggle(l.id)}
327:              onClick={() => setActiveId(l.id)}
328:              onTagClick={(tag) => {
329:                setQuery(tag); // shows in the search bar; ← clears it
330:                setSearching(true);
331:              }}
332:            />
333:          ))}
334:        </div>
335:      </div>
336:
337:      {activeId && (
338:        <ListingDetailModal id={activeId} onClose={() => setActiveId(null)} />
339:      )}
340:    </div>
341:  );
342:}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "''^:root|''^html|''^body|''^button|''^input|''^textarea|''^select|'"\\.app\\b|\\.nav\\b|safe-area|env\\(|100vh|100dvh|font-size|line-height|touch-action|overscroll|@media|prefers-color-scheme|prefers-reduced-motion|:focus|outline|\\.modal\\b|\\.modal-backdrop|\\.scan-fab|\\.cat-tile|\\.search-ico|\\.heart\\b|\\.qr-star|\\.rate-star|\\.vote-btn|\\.back-btn|\\.card-back|\\.mb-back|\\.scan-back|\\.thumb-del|\\.post-discuss|\\.alert-row|\\.tab\\b|\\.chip\\b|\\.btn\\b|\\.field input|\\.field textarea|\\.search-bar|\\.topbar|\\.me-topbar|\\.scroll-top-btn\" frontend/src/index.css" in D:\Приложения\Yelp
 succeeded in 263ms:
1::root {
18:html,
19:body,
25:body {
29:  font-size: 15px;
58:  font-size: 15px;
61:.app {
74:  font-size: 19px;
92:.cat-tile {
97:  outline: none; /* no black focus box on tap */
102:  font-size: 11px;
107:.cat-tile:focus,
108:.cat-tile:focus-visible {
109:  outline: none;
118:  font-size: 20px;
120:.cat-tile.active {
123:.cat-tile.active .cat-ico {
135:.search-bar {
144:.search-bar .search-ico {
147:.search-bar input {
152:  font-size: 16px;
153:  outline: none;
167:.chip {
174:  font-size: 14px;
177:.chip.active {
212:  font-size: 46px;
227:  font-size: 17px;
228:  line-height: 1.25;
244:  font-size: 15px;
267:  font-size: 15px;
299:  font-size: 30px;
309:  font-size: 16px;
310:  line-height: 1.25;
321:  font-size: 14px;
326:  font-size: 13px;
333:  font-size: 13px;
345:  font-size: 20px;
413:  font-size: 40px;
431:  font-size: 46px;
435:  font-size: 20px;
440:  font-size: 26px;
523:  font-size: 15px;
524:  line-height: 1.25;
528:  font-size: 12.5px;
536:  font-size: 13px;
540:  font-size: 11px;
547:.heart {
557:  font-size: 17px;
579:  font-size: calc(var(--star-size, 16px) * 0.72);
580:  line-height: 1;
596:  font-size: 13px;
597:  line-height: 1.4;
607:  font-size: 12px;
618:.nav {
626:  padding: 6px 0 max(6px, env(safe-area-inset-bottom));
629:.nav a {
634:  font-size: 11px;
641:.nav a .ico {
642:  font-size: 21px;
644:.nav a.active {
649:.btn {
653:  font-size: 16px;
659:.btn.secondary {
665:.modal-backdrop {
674:  overscroll-behavior: contain;
675:  touch-action: none; /* the backdrop itself doesn't scroll the page behind it */
677:.modal {
683:  padding: 16px 16px calc(88px + env(safe-area-inset-bottom));
686:  overscroll-behavior: contain; /* don't chain scroll to the background at the edges */
690:  touch-action: auto;
697:body.modal-open {
703:  overscroll-behavior: contain;
714:button,
715:.chip,
716:.cat-tile,
723:button:active,
724:.chip:active,
725:.cat-tile:active,
727:.rate-star:active {
730:.modal h3 {
731:  font-size: 18px;
739:  font-size: 13px;
744:.field input,
745:.field textarea,
753:  font-size: 15px;
754:  outline: none;
757:.field textarea {
765:  font-size: 34px;
796:  touch-action: none;
813:  font-size: 22px;
819:  font-size: 30px;
852:  font-size: 26px;
877:  font-size: 19px;
881:  font-size: 12px;
965:  font-size: 16px;
979:  font-size: 20px;
980:  line-height: 1;
986:  font-size: 13px;
1002:  font-size: 11px;
1012:  font-size: 15px;
1019:  font-size: 18px;
1036:  margin-bottom: calc(8px + env(safe-area-inset-bottom));
1048:  font-size: 16px;
1073:  font-size: 14px;
1090:  padding: 4px 14px calc(16px + env(safe-area-inset-bottom));
1111:  font-size: 15px;
1120:  font-size: 13px;
1163:  font-size: 18px;
1164:  line-height: 1.2;
1168:  font-size: 14px;
1172:  font-size: 13px;
1183:  font-size: 16px;
1187:  font-size: 14px;
1188:  line-height: 1.4;
1261:  font-size: 13px;
1266:  font-size: 14px;
1276:  font-size: 13px;
1304:  font-size: 17px;
1305:  line-height: 1.2;
1309:  font-size: 13.5px;
1313:  font-size: 12.5px;
1324:  font-size: 15px;
1328:  font-size: 14px;
1329:  line-height: 1.4;
1339:  font-size: 12.5px;
1407:  font-size: 14px;
1412:  font-size: 14px;
1443:  font-size: 16px;
1448:  font-size: 13px;
1456:  font-size: 13px;
1460:  font-size: 14px;
1462:  line-height: 1.4;
1477:  font-size: 11px;
1497:  font-size: 14px;
1515:  font-size: 13px;
1518:  font-size: 14px;
1519:  line-height: 1.35;
1523:  font-size: 13px;
1536:  font-size: 14px;
1546:  font-size: 18px;
1547:  line-height: 1;
1557:  font-size: 16px;
1560:  font-size: 14px;
1571:  font-size: 14px;
1580:  font-size: 13px;
1598:  font-size: 14px;
1605:  font-size: 14px;
1622:.topbar {
1628:.topbar h2 {
1629:  font-size: 20px;
1636:  font-size: 15px;
1647:  line-height: 1.3;
1676:.ir-ico { font-size: 19px; flex: 0 0 auto; }
1678:.ir-title { font-size: 13px; font-weight: 700; }
1679:.ir-sub { font-size: 13px; color: var(--hint); margin-top: 1px; word-break: break-word; }
1680:.ir-chev { color: var(--hint); font-size: 18px; flex: 0 0 auto; }
1693:  font-size: 34px;
1697:  font-size: 19px;
1701:  font-size: 14px;
1703:  line-height: 1.45;
1707:  font-size: 14px;
1712:  line-height: 1.5;
1716:  font-size: 12px;
1731:  font-size: 14px;
1747:  font-size: 12px;
1759:  font-size: 20px;
1763:  font-size: 14px;
1795:.vote-btn {
1800:  font-size: 13px;
1807:.vote-btn.active {
1819:.post .vote-btn {
1822:  font-size: 10.5px;
1835:  font-size: 13px;
1894:  font-size: 17px;
1907:  font-size: 15px;
1937:  font-size: 15px;
1969:  font-size: 22px;
1974:  font-size: 16px;
1977:  font-size: 13px;
1985:.rate-stars {
1990:.rate-star {
1993:  font-size: 36px;
1994:  line-height: 1;
1999:.rate-star:active,
2000:.rate-star.on {
2015:  font-size: 15px;
2038:.thumb-del {
2048:  font-size: 14px;
2049:  line-height: 1;
2065:  font-size: 12px;
2078:  font-size: 14px;
2079:  line-height: 1.45;
2102:  font-size: 14px;
2103:  line-height: 1.45;
2117:  font-size: 13px;
2143:  font-size: 15px;
2166:  font-size: 19px;
2170:  font-size: 13px;
2188:  font-size: 14px;
2196:  font-size: 18px;
2204:.tabbar .tab {
2209:  font-size: 15px;
2214:.tabbar .tab.active {
2218:.tab-pane {
2233:  font-size: 14px;
2240:  font-size: 14px;
2243:  font-size: 14px;
2259:  font-size: 13px;
2266:.chip.open {
2313:  font-size: 15px;
2326:.me-topbar {
2337:  font-size: 18px;
2356:  font-size: 30px;
2360:  font-size: 24px;
2370:  font-size: 14px;
2387:  font-size: 12px;
2399:  font-size: 22px;
2409:  font-size: 20px;
2423:  font-size: 16px;
2443:  font-size: 13px;
2447:  font-size: 24px;
2453:  font-size: 14px;
2478:  font-size: 15px;
2484:  font-size: 20px;
2502:  font-size: 14px;
2504:  line-height: 1.45;
2520:  font-size: 13px;
2527:  font-size: 11px;
2559:  font-size: 12px;
2570:  font-size: 12px;
2583:  font-size: 15px;
2593:  font-size: 16px;
2617:  font-size: 16px;
2626:  font-size: 13px;
2640:  font-size: 14px;
2648:.topbar.with-back {
2653:.back-btn {
2656:  font-size: 24px;
2657:  line-height: 1;
2668:  padding: 12px 16px calc(24px + env(safe-area-inset-bottom));
2680:.cat-tile.active {
2685:.cat-tile.active .cat-ico {
2691:  font-size: 14px;
2712:  font-size: 15px;
2727:  font-size: 13px;
2742:  line-height: 1.2;
2747:  font-size: 13px;
2764:  font-size: 15px;
2769:button {
2772:button:active {
2776:  font-size: 12px;
2788:  font-size: 13px;
2808:  font-size: 11px;
2828:  font-size: 14px;
2841:  font-size: 13px;
2861:  font-size: 12px;
2871:  font-size: 12px;
2905:  padding: 28px 20px calc(28px + env(safe-area-inset-bottom));
2909:  font-size: 40px;
2913:  font-size: 24px;
2919:  font-size: 15px;
2933:  font-size: 11px;
2944:  font-size: 15px;
2957:  font-size: 14px;
2989:  font-size: 11px;
3009:  font-size: 14px;
3017:  font-size: 12px;
3064:  font-size: 56px;
3065:  line-height: 1;
3069:  font-size: 22px;
3073:  font-size: 14px;
3085:  font-size: 15px;
3090:  font-size: 12.5px;
3091:  line-height: 1.35;
3102:  font-size: 13px;
3116:  font-size: 13px;
3136:  font-size: 12px;
3152:  font-size: 14px;
3169:  font-size: 13px;
3179:  font-size: 26px;
3198:  font-size: 14px;
3226:.topbar.with-back {
3259:  font-size: 18px;
3265:  font-size: 15px;
3267:  line-height: 1.2;
3270:  font-size: 13px;
3281:  font-size: 14px;
3284:  font-size: 26px;
3297:.card-back {
3307:  font-size: 20px;
3308:  line-height: 1;
3324:.search-ico.back {
3327:  font-size: 22px;
3340:  font-size: 15px;
3349:.search-ico.right {
3352:  font-size: 18px;
3359:  font-size: 15px;
3379:  font-size: 20px;
3384:  font-size: 13px;
3389:  font-size: 13px;
3393:  font-size: 12px;
3413:  font-size: 17px;
3425:  font-size: 13px;
3446:  font-size: 16px;
3456:  font-size: 16px;
3472:  font-size: 14px;
3481:  font-size: 13px;
3490:  font-size: 18px;
3500:  font-size: 14px;
3560:  font-size: 14px;
3571:  font-size: 13px;
3579:  font-size: 14px;
3597:  font-size: 15px;
3600:  font-size: 13px;
3605:  font-size: 14px;
3629:  font-size: 12px;
3640:  font-size: 14px;
3645:.post-discuss {
3651:  font-size: 13px;
3694:  font-size: 11px;
3698:  font-size: 13px;
3701:  font-size: 14px;
3709:  font-size: 12px;
3726:  font-size: 14px;
3728:.cmt-form .btn {
3747:  font-size: 13px;
3759:.post-cta-stars .qr-star {
3760:  font-size: 19px;
3791:  font-size: 40px;
3800:  font-size: 14px;
3802:  line-height: 1.2;
3826:  font-size: 13px;
3831:  font-size: 12px;
3844:  touch-action: pan-y;
3879:@media (prefers-reduced-motion: reduce) {
3895:  touch-action: pan-y;
3908:  font-size: 16px;
3943:  font-size: 17px;
3951:  font-size: 16px;
3972:  font-size: 22px;
3981:  font-size: 22px;
3986:  font-size: 14px;
3998:  font-size: 14px;
4014:  font-size: 15px;
4019:  font-size: 12px;
4031:  font-size: 13px;
4043:  font-size: 14px;
4052:  font-size: 13px;
4070:  font-size: 42px;
4071:  line-height: 1;
4089:  font-size: 14px;
4102:  font-size: 15px;
4125:  font-size: 14px;
4137:  font-size: 26px;
4142:  font-size: 14px;
4156:  font-size: 13px;
4179:.qr-star {
4182:  font-size: 22px;
4183:  line-height: 1;
4187:.qr-star.on {
4192:  font-size: 13px;
4203:  font-size: 12px;
4243:  font-size: 11px;
4246:  font-size: 22px;
4257:  font-size: 14px;
4280:  font-size: 15px;
4281:  outline: none;
4312:  font-size: 15px;
4315:  font-size: 13px;
4323:  font-size: 13px;
4398:.mb-back {
4401:  font-size: 22px;
4402:  line-height: 1;
4412:  font-size: 18px;
4417:  outline: none;
4419:  font-size: 16px;
4428:  font-size: 16px;
4432:  font-size: 14px;
4451:  font-size: 22px;
4491:  touch-action: none;
4519:  font-size: 18px;
4529:  font-size: 13px;
4535:  padding: 0 12px calc(16px + env(safe-area-inset-bottom));
4565:  font-size: 12.5px;
4580:  font-size: 14px;
4607:  /* the sheet (z-80) sits above the nav (z-10), so only the safe-area needs clearing —
4609:  padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
4613:.apply-sticky .btn {
4618:.modal-backdrop.closing {
4621:.modal-backdrop.closing .modal {
4639:  /* photo is the pull-to-close handle: touch-action:none → vertical gesture is
4641:  touch-action: none;
4643:.heart-lg {
4650:  font-size: 22px;
4671:  font-size: 10px;
4682:  font-size: 14px;
4702:  font-size: 15px;
4720:  font-size: 13px;
4730:  font-size: 12px;
4737:  font-size: 13px;
4740:  font-size: 14px;
4752:.scan-fab {
4755:  bottom: calc(80px + env(safe-area-inset-bottom));
4769:.scan-fab:active {
4772:.scan-backdrop {
4781:  padding: 14px 16px calc(20px + env(safe-area-inset-bottom));
4786:.scan-back {
4830:  font-size: 20px;
4863:  font-size: 22px;
4877:  font-size: 15px;
4880:  font-size: 13px;
4886:  font-size: 14px;
4905:  padding: 14px 14px calc(18px + env(safe-area-inset-bottom));
4916:  font-size: 16px;
4936:  font-size: 15px;
4953:  font-size: 12px;
4960:button,
4961:.chip,
4962:.cat-tile,
4963:.vote-btn,
4965:.heart {
4969:button:active,
4970:.chip:active,
4971:.cat-tile:active {
4986:  font-size: 10.5px;
4993:.scan-fab.pulse {
5003:  font-size: 12px;
5014:.game-level-ico { font-size: 34px; }
5015:.game-level-title { font-weight: 800; font-size: 17px; }
5016:.game-level-sub, .game-unlock-sub { color: var(--hint); font-size: 12.5px; margin-top: 3px; }
5019:.game-unlock-ico { font-size: 22px; width: 28px; text-align: center; }
5020:.game-unlock-title { font-weight: 700; font-size: 14.5px; }
5024:.game-ach { display: flex; align-items: center; gap: 6px; background: #f5f5f5; border-radius: 999px; padding: 7px 12px; font-size: 13px; font-weight: 600; }
5025:.game-ach-ico { font-size: 16px; }
5027:  position: fixed; left: 50%; bottom: calc(96px + env(safe-area-inset-bottom));
5029:  background: var(--accent); color: #fff; font-weight: 700; font-size: 14px;
5036:  background: rgba(211,35,35,0.92); color: #fff; font-weight: 800; font-size: 13px;
5040:.ft-sub { color: var(--hint); font-size: 12.5px; margin: -6px 2px 8px; }
5045:.modal::before,
5072:.scan-fab-label {
5078:  font-size: 9px;
5084:.scan-fab { flex-direction: column; }
5100:  font-size: 15px;
5118:  font-size: 13.5px;
5134:.spec-ico { font-size: 22px; }
5135:.spec-label { font-weight: 700; font-size: 13.5px; }
5136:.spec-meta { font-size: 12px; color: var(--hint); margin-top: 2px; }
5146:.rep-item b { display: block; font-size: 22px; color: var(--accent); }
5147:.rep-item span { font-size: 12px; color: var(--hint); line-height: 1.3; display: block; margin-top: 4px; }
5151:.wp { display: flex; gap: 10px; font-size: 14.5px; line-height: 1.45; align-items: flex-start; }
5152:.wp span { font-size: 20px; flex: 0 0 auto; }
5159:  font-size: 12.5px;
5186:  font-size: clamp(11px, 3.3vw, 13.5px);
5199:  font-size: 13.5px;
5207:  font-size: 12px;
5238:  position: relative; /* .heart anchors here */
5275:  line-height: 1;
5327:  font-size: 12.5px;
5341:  font-size: 12px;
5351:  font-size: 12px;
5359:.rec-name { font-size: 17px; font-weight: 800; }
5368:  font-size: 14px;
5372:.rec-rating-val { font-size: 13px; color: var(--hint); }
5376:  font-size: 14px;
5377:  line-height: 1.4;
5381:.rec-reason { margin-top: 8px; font-size: 13.5px; color: var(--hint); }
5386:  font-size: 30px;
5387:  line-height: 1;
5406:  font-size: 12px;
5415:.scroll-top-btn {
5419:  bottom: calc(80px + 60px + 12px + env(safe-area-inset-bottom));
5438:.scroll-top-btn:active { transform: scale(0.9); }
5446:.btn,
5451:.cat-tile,
5453:.qr-star,
5461:.btn:active,
5470:.cat-tile:active,
5477:.cat-tile.active .cat-ico svg { color: var(--accent); }
5478:.nav .ico svg { width: 24px; height: 24px; display: block; }
5479:.nav a.active .ico svg { color: var(--accent); }
5492:@media (prefers-color-scheme: dark) {
5506:.sk-line.btn { height: 40px; border-radius: 12px; margin-top: 4px; }
5509:.btn.show-more { min-height: 44px; display: flex; align-items: center; justify-content: center; }
5510:.btn.show-more:disabled { opacity: 0.85; }
5511:.btn-spinner {
5535:.vcard-media .heart, .card-wrap .heart { right: 46px; }
5563:  font-size: 14.5px; font-weight: 600;
5572:.nav-badge {
5582:  font-size: 10px;
5584:  line-height: 16px;
5588:.alert-row {
5600:.alert-row:active { transform: scale(0.985); }
5601:.alert-row.fresh { border-color: rgba(211, 35, 35, 0.35); background: #fff6f6; }
5602:.alert-ico { font-size: 20px; line-height: 1.2; }
5604:.alert-text { font-size: 14px; line-height: 1.35; }
5605:.alert-meta { font-size: 12px; color: var(--hint, #888); margin-top: 3px; }
5638:  font-size: clamp(14px, 4.2vw, 21px);
5639:  line-height: 1.22;
5657:.vcard-photo.venue-name-tile span, .mini-img.venue-name-tile span { font-size: 13px; }
5698:  font-size: 12px;
5725:  font-size: 18px; font-weight: 800;
5733:textarea, input[type="text"], input[type="search"], input[type="number"],
5734:input[inputmode="numeric"], input[type="date"], .rv-text, [contenteditable] {
5737:@media (prefers-color-scheme: dark) {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/index.css'; "'$c=Get-Content -Encoding utf8 $f; foreach($range in @(@(1,180),@(600,770),@(1785,1845),@(1978,2055),@(2190,2225),@(2640,2675),@(3288,3360),@(3628,3660),@(3868,3905),@(4168,4210),@(4388,4435),@(4598,4660),@(4745,4800),@(4950,5008),@(5038,5090),@(5408,5460),@(5485,5510),@(5568,5620),@(5725,5742))){$s=$range[0];$e=$range[1];for($i=$s;$i -le $e;$i++){"$i`:$($c[$i-1])"};""}' in D:\Приложения\Yelp
 succeeded in 904ms:
1::root {
2:  /* Yelp-style light theme (fixed — independent of Telegram dark mode) */
3:  --bg: #ffffff;
4:  --text: #2b2b2b;
5:  --hint: #6b6b6b;
6:  --card: #ffffff;
7:  --accent: #d32323; /* Yelp red */
8:  --accent-text: #ffffff;
9:  --star: #d32323;
10:  --border: #e6e6e6;
11:}
12:
13:* {
14:  box-sizing: border-box;
15:  -webkit-tap-highlight-color: transparent;
16:}
17:
18:html,
19:body,
20:#root {
21:  margin: 0;
22:  height: 100%;
23:}
24:
25:body {
26:  background: var(--bg);
27:  color: var(--text);
28:  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
29:  font-size: 15px;
30:}
31:
32:.boot-fallback {
33:  position: fixed;
34:  inset: 0;
35:  display: grid;
36:  place-items: center;
37:  padding: 24px;
38:  background: #fff;
39:  color: #111;
40:  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
41:  z-index: 9999;
42:}
43:
44:.boot-fallback-box {
45:  display: grid;
46:  gap: 14px;
47:  width: min(100%, 320px);
48:  text-align: center;
49:}
50:
51:.boot-fallback button {
52:  border: 0;
53:  border-radius: 12px;
54:  padding: 12px 18px;
55:  background: #d32323;
56:  color: #fff;
57:  font-weight: 700;
58:  font-size: 15px;
59:}
60:
61:.app {
62:  max-width: 560px;
63:  margin: 0 auto;
64:  padding: 12px 12px 76px;
65:}
66:
67:h1,
68:h2,
69:h3 {
70:  margin: 0;
71:}
72:
73:.section-title {
74:  font-size: 19px;
75:  font-weight: 700;
76:  margin: 18px 4px 10px;
77:}
78:
79:/* category icon row (above search) */
80:.cat-bar {
81:  display: flex;
82:  gap: 2px;
83:  overflow-x: hidden; /* all categories fit in one row — no horizontal scroll */
84:  scrollbar-width: none;
85:  background: var(--bg);
86:  margin: -12px -12px 0;
87:  padding: 10px 6px 4px;
88:}
89:.cat-bar::-webkit-scrollbar {
90:  display: none;
91:}
92:.cat-tile {
93:  flex: 1 1 0; /* equal share so every category fits without scrolling */
94:  min-width: 0;
95:  background: none;
96:  border: none;
97:  outline: none; /* no black focus box on tap */
98:  display: flex;
99:  flex-direction: column;
100:  align-items: center;
101:  gap: 5px;
102:  font-size: 11px;
103:  font-weight: 600;
104:  color: var(--text);
105:  cursor: pointer;
106:}
107:.cat-tile:focus,
108:.cat-tile:focus-visible {
109:  outline: none;
110:}
111:.cat-ico {
112:  width: 44px;
113:  height: 44px;
114:  border-radius: 13px;
115:  background: #f3f3f3;
116:  display: grid;
117:  place-items: center;
118:  font-size: 20px;
119:}
120:.cat-tile.active {
121:  color: var(--accent);
122:}
123:.cat-tile.active .cat-ico {
124:  background: rgba(211, 35, 35, 0.12);
125:}
126:
127:/* search — white, Yelp-style pill with red icon */
128:.search {
129:  position: sticky;
130:  top: 0;
131:  z-index: 5;
132:  background: var(--bg);
133:  margin: 0 -12px;
134:}
135:.search-bar {
136:  margin: 6px 12px 8px;
137:  background: #f0f0f0;
138:  border-radius: 12px;
139:  padding: 11px 14px;
140:  display: flex;
141:  align-items: center;
142:  gap: 8px;
143:}
144:.search-bar .search-ico {
145:  color: var(--accent);
146:}
147:.search-bar input {
148:  flex: 1;
149:  border: none;
150:  background: transparent;
151:  color: #2b2b2b;
152:  font-size: 16px;
153:  outline: none;
154:}
155:.chips {
156:  display: flex;
157:  gap: 8px;
158:  padding: 10px 12px;
159:  background: var(--bg);
160:  overflow-x: auto;
161:  scrollbar-width: none;
162:  border-bottom: 1px solid var(--border);
163:}
164:.chips::-webkit-scrollbar {
165:  display: none;
166:}
167:.chip {
168:  flex: 0 0 auto;
169:  padding: 7px 14px;
170:  border-radius: 20px;
171:  background: #f0f0f0;
172:  color: #2b2b2b;
173:  border: none;
174:  font-size: 14px;
175:  font-weight: 600;
176:}
177:.chip.active {
178:  background: var(--accent);
179:  color: var(--accent-text);
180:}

600:.card-tags {
601:  display: flex;
602:  flex-wrap: wrap;
603:  gap: 6px;
604:  margin-top: 8px;
605:}
606:.ctag {
607:  font-size: 12px;
608:  padding: 4px 10px;
609:  border: 1px solid var(--border);
610:  border-radius: 999px;
611:  color: var(--text);
612:  background: #fff;
613:  cursor: pointer;
614:  font-family: inherit;
615:}
616:
617:/* bottom nav */
618:.nav {
619:  position: fixed;
620:  bottom: 0;
621:  left: 0;
622:  right: 0;
623:  display: flex;
624:  background: var(--bg);
625:  border-top: 1px solid var(--border);
626:  padding: 6px 0 max(6px, env(safe-area-inset-bottom));
627:  z-index: 10;
628:}
629:.nav a {
630:  flex: 1;
631:  text-align: center;
632:  text-decoration: none;
633:  color: var(--hint);
634:  font-size: 11px;
635:  font-weight: 600;
636:  display: flex;
637:  flex-direction: column;
638:  align-items: center;
639:  gap: 2px;
640:}
641:.nav a .ico {
642:  font-size: 21px;
643:}
644:.nav a.active {
645:  color: var(--accent);
646:}
647:
648:/* buttons */
649:.btn {
650:  border: none;
651:  border-radius: 12px;
652:  padding: 13px 16px;
653:  font-size: 16px;
654:  font-weight: 700;
655:  background: var(--accent);
656:  color: var(--accent-text);
657:  width: 100%;
658:}
659:.btn.secondary {
660:  background: var(--card);
661:  color: var(--text);
662:}
663:
664:/* modal */
665:.modal-backdrop {
666:  position: fixed;
667:  inset: 0;
668:  background: rgba(0, 0, 0, 0.5);
669:  z-index: 20;
670:  display: flex;
671:  align-items: flex-end;
672:  justify-content: center;
673:  animation: fadeIn 0.28s ease;
674:  overscroll-behavior: contain;
675:  touch-action: none; /* the backdrop itself doesn't scroll the page behind it */
676:}
677:.modal {
678:  background: var(--bg);
679:  width: 100%;
680:  max-width: 560px;
681:  border-radius: 18px 18px 0 0;
682:  /* extra bottom padding so footer buttons clear the fixed bottom nav */
683:  padding: 16px 16px calc(88px + env(safe-area-inset-bottom));
684:  max-height: 92vh;
685:  overflow-y: auto;
686:  overscroll-behavior: contain; /* don't chain scroll to the background at the edges */
687:  /* NOT pan-y: with pan-y the browser owns vertical pans and touchmove becomes
688:     non-cancelable, so pull-to-dismiss can't preventDefault. auto keeps the first
689:     move cancelable so the drag handler can take over at the top. */
690:  touch-action: auto;
691:  animation: sheetUp 0.34s cubic-bezier(0.22, 0.61, 0.36, 1);
692:}
693:/* while any modal/overlay is open, the page behind it must not scroll.
694:   The lock itself is position:fixed + top compensation set in modalEsc.ts —
695:   NO height:100% here: clipping #root to the viewport blanked the page behind
696:   sheets (grey background instead of the darkened content). */
697:body.modal-open {
698:  overflow: hidden;
699:  width: 100%;
700:}
701:.mapbrowse,
702:.userprofile {
703:  overscroll-behavior: contain;
704:}
705:@keyframes fadeIn {
706:  from { opacity: 0; }
707:  to { opacity: 1; }
708:}
709:@keyframes sheetUp {
710:  from { transform: translateY(100%); }
711:  to { transform: translateY(0); }
712:}
713:/* tactile press feedback */
714:button,
715:.chip,
716:.cat-tile,
717:.vcard,
718:.post,
719:.mini,
720:.card {
721:  transition: transform 0.18s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.18s ease;
722:}
723:button:active,
724:.chip:active,
725:.cat-tile:active,
726:.mini:active,
727:.rate-star:active {
728:  transform: scale(0.96);
729:}
730:.modal h3 {
731:  font-size: 18px;
732:  margin-bottom: 4px;
733:}
734:.field {
735:  margin-top: 14px;
736:}
737:.field label {
738:  display: block;
739:  font-size: 13px;
740:  font-weight: 600;
741:  color: var(--hint);
742:  margin-bottom: 6px;
743:}
744:.field input,
745:.field textarea,
746:.field select {
747:  width: 100%;
748:  border: 1px solid var(--border);
749:  background: var(--card);
750:  color: var(--text);
751:  border-radius: 10px;
752:  padding: 11px 12px;
753:  font-size: 15px;
754:  outline: none;
755:  font-family: inherit;
756:}
757:.field textarea {
758:  min-height: 84px;
759:  resize: vertical;
760:}
761:
762:/* star input */
763:.star-input {
764:  display: inline-flex;
765:  font-size: 34px;
766:  color: var(--border);
767:  cursor: pointer;
768:}
769:.star-input .s {
770:  position: relative;

1785:  background: #eee;
1786:}
1787:
1788:/* review vote buttons */
1789:.vote-row {
1790:  display: flex;
1791:  gap: 8px;
1792:  margin-top: 8px;
1793:  flex-wrap: wrap;
1794:}
1795:.vote-btn {
1796:  background: #f3f3f3;
1797:  border: 1px solid var(--border);
1798:  border-radius: 16px;
1799:  padding: 5px 11px;
1800:  font-size: 13px;
1801:  font-weight: 600;
1802:  color: var(--text);
1803:  cursor: pointer;
1804:}
1805:/* MY reaction is lit BLUE (owner 18.07.2026) — instantly readable as "я нажал",
1806:   not just a count. Server hydrates myVotes so it's blue the moment the card opens. */
1807:.vote-btn.active {
1808:  background: rgba(0, 122, 255, 0.14);
1809:  border-color: #007aff;
1810:  color: #007aff;
1811:  font-weight: 800;
1812:}
1813:/* feed reactions: all four on one line, full labels, just smaller text */
1814:.post .vote-row {
1815:  flex-wrap: nowrap;
1816:  gap: 5px;
1817:  justify-content: space-between;
1818:}
1819:.post .vote-btn {
1820:  flex: 0 1 auto;
1821:  padding: 4px 7px;
1822:  font-size: 10.5px;
1823:  white-space: nowrap;
1824:}
1825:
1826:/* rating histogram (5★…1★ distribution) */
1827:.histogram {
1828:  margin: 8px 0 12px;
1829:}
1830:.hist-row {
1831:  display: flex;
1832:  align-items: center;
1833:  gap: 8px;
1834:  margin: 3px 0;
1835:  font-size: 13px;
1836:}
1837:.hist-label {
1838:  width: 26px;
1839:  color: var(--hint);
1840:}
1841:.hist-bar {
1842:  flex: 1;
1843:  height: 8px;
1844:  background: #eee;
1845:  border-radius: 4px;

1978:  color: var(--hint);
1979:}
1980:.rate-act.primary {
1981:  background: var(--accent);
1982:  color: #fff;
1983:  border-color: var(--accent);
1984:}
1985:.rate-stars {
1986:  display: flex;
1987:  justify-content: center;
1988:  gap: 10px;
1989:}
1990:.rate-star {
1991:  background: none;
1992:  border: none;
1993:  font-size: 36px;
1994:  line-height: 1;
1995:  color: #d0d0d0;
1996:  cursor: pointer;
1997:  padding: 0;
1998:}
1999:.rate-star:active,
2000:.rate-star.on {
2001:  color: var(--star);
2002:}
2003:.rate-actions {
2004:  display: flex;
2005:  gap: 10px;
2006:  margin-top: 14px;
2007:}
2008:.rate-act {
2009:  flex: 1;
2010:  background: none;
2011:  border: 1px solid var(--border);
2012:  border-radius: 12px;
2013:  padding: 12px;
2014:  font-weight: 700;
2015:  font-size: 15px;
2016:  color: var(--text);
2017:  cursor: pointer;
2018:}
2019:
2020:.photo-thumbs {
2021:  display: flex;
2022:  gap: 6px;
2023:  flex-wrap: wrap;
2024:  margin-top: 8px;
2025:}
2026:.photo-thumbs img,
2027:.photo-thumbs video {
2028:  width: 64px;
2029:  height: 64px;
2030:  object-fit: cover;
2031:  border-radius: 8px;
2032:}
2033:.thumb-wrap {
2034:  position: relative;
2035:  width: 64px;
2036:  height: 64px;
2037:}
2038:.thumb-del {
2039:  position: absolute;
2040:  top: -6px;
2041:  right: -6px;
2042:  width: 22px;
2043:  height: 22px;
2044:  border-radius: 50%;
2045:  border: 2px solid #fff;
2046:  background: var(--accent);
2047:  color: #fff;
2048:  font-size: 14px;
2049:  line-height: 1;
2050:  font-weight: 700;
2051:  padding: 0;
2052:  display: grid;
2053:  place-items: center;
2054:  cursor: pointer;
2055:}

2190:  background: #fff5f5;
2191:}
2192:.upload-btn:active {
2193:  transform: scale(0.97);
2194:}
2195:.upload-btn .up-ico {
2196:  font-size: 18px;
2197:}
2198:.photo-thumbs video {
2199:  width: 64px;
2200:  height: 64px;
2201:  object-fit: cover;
2202:  border-radius: 8px;
2203:}
2204:.tabbar .tab {
2205:  flex: 0 0 auto;
2206:  background: none;
2207:  border: none;
2208:  padding: 10px 14px;
2209:  font-size: 15px;
2210:  font-weight: 600;
2211:  color: var(--hint);
2212:  border-bottom: 2px solid transparent;
2213:}
2214:.tabbar .tab.active {
2215:  color: var(--text);
2216:  border-bottom-color: var(--accent);
2217:}
2218:.tab-pane {
2219:  padding-top: 12px;
2220:}
2221:
2222:/* Q&A (ask the community) */
2223:.qa-ask {
2224:  display: flex;
2225:  gap: 8px;

2640:  font-size: 14px;
2641:  margin-bottom: 12px;
2642:}
2643:.addto b {
2644:  color: var(--accent);
2645:}
2646:
2647:/* topbar with a back arrow */
2648:.topbar.with-back {
2649:  display: flex;
2650:  align-items: center;
2651:  gap: 8px;
2652:}
2653:.back-btn {
2654:  background: none;
2655:  border: none;
2656:  font-size: 24px;
2657:  line-height: 1;
2658:  padding: 0 4px;
2659:}
2660:
2661:/* full-screen public user profile */
2662:.userprofile {
2663:  position: fixed;
2664:  inset: 0;
2665:  z-index: 2650;
2666:  background: #fff;
2667:  overflow-y: auto;
2668:  padding: 12px 16px calc(24px + env(safe-area-inset-bottom));
2669:  animation: mbIn 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
2670:}
2671:.userprofile.closing {
2672:  animation: mbOut 0.3s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
2673:}
2674:.up-top {
2675:  display: flex;

3288:}
3289:.cs-call {
3290:  display: block;
3291:  text-decoration: none;
3292:  text-align: center;
3293:  margin-bottom: 10px;
3294:}
3295:
3296:/* back arrow inside the listing card */
3297:.card-back {
3298:  position: sticky;
3299:  top: 0;
3300:  z-index: 5;
3301:  align-self: flex-start;
3302:  background: rgba(255, 255, 255, 0.92);
3303:  border: 1px solid var(--border);
3304:  border-radius: 50%;
3305:  width: 36px;
3306:  height: 36px;
3307:  font-size: 20px;
3308:  line-height: 1;
3309:  margin: 0 0 4px;
3310:}
3311:/* phone/order actions are now <a> — keep them looking like buttons */
3312:a.action,
3313:a.order-cta {
3314:  text-decoration: none;
3315:  color: inherit;
3316:}
3317:a.order-cta {
3318:  color: #fff;
3319:  display: flex;
3320:  align-items: center;
3321:  justify-content: center;
3322:}
3323:
3324:.search-ico.back {
3325:  background: none;
3326:  border: none;
3327:  font-size: 22px;
3328:  color: var(--text);
3329:  cursor: pointer;
3330:  padding: 0;
3331:}
3332:/* "не нашли? добавьте" CTA spliced into search results */
3333:.add-cta {
3334:  width: 100%;
3335:  background: var(--accent);
3336:  color: #fff;
3337:  border: none;
3338:  border-radius: 14px;
3339:  padding: 14px 16px;
3340:  font-size: 15px;
3341:  font-weight: 700;
3342:  margin: 8px 0;
3343:  cursor: pointer;
3344:  box-shadow: 0 2px 10px rgba(211, 35, 35, 0.25);
3345:}
3346:.add-cta:active {
3347:  transform: scale(0.99);
3348:}
3349:.search-ico.right {
3350:  background: none;
3351:  border: none;
3352:  font-size: 18px;
3353:  cursor: pointer;
3354:  padding: 0;
3355:  flex: 0 0 auto;
3356:}
3357:.best-venue {
3358:  margin: 6px 0 4px;
3359:  font-size: 15px;
3360:  color: var(--text);

3628:.hero-head-sub {
3629:  font-size: 12px;
3630:  font-weight: 600;
3631:  color: var(--accent);
3632:}
3633:
3634:/* discuss link + threaded comments */
3635:.post-cmt {
3636:  margin-top: 8px;
3637:  padding: 8px 10px;
3638:  background: #f5f5f5;
3639:  border-radius: 10px;
3640:  font-size: 14px;
3641:}
3642:.post-cmt b {
3643:  font-weight: 700;
3644:}
3645:.post-discuss {
3646:  margin-top: 8px;
3647:  background: none;
3648:  border: none;
3649:  color: var(--accent);
3650:  font-weight: 600;
3651:  font-size: 13px;
3652:  padding: 0;
3653:}
3654:a.addr-line {
3655:  display: block;
3656:  text-decoration: none;
3657:  color: inherit;
3658:}
3659:.cmt-modal {
3660:  max-height: 80vh;

3868:  }
3869:}
3870:.vcard,
3871:.card-wrap,
3872:.myrate-card,
3873:.mini,
3874:.menu-card,
3875:.post,
3876:.section-title {
3877:  animation: fadeUp 0.32s cubic-bezier(0.22, 0.61, 0.36, 1) both;
3878:}
3879:@media (prefers-reduced-motion: reduce) {
3880:  .vcard,
3881:  .card-wrap,
3882:  .myrate-card,
3883:  .mini,
3884:  .menu-card,
3885:  .post,
3886:  .section-title,
3887:  .hero.swipeable {
3888:    animation: none;
3889:  }
3890:}
3891:.hero.swipeable .hero-media {
3892:  cursor: grab;
3893:  user-select: none;
3894:  -webkit-user-select: none;
3895:  touch-action: pan-y;
3896:}
3897:.hero.swipeable .hero-media img {
3898:  -webkit-user-drag: none;
3899:  user-select: none;
3900:  pointer-events: none;
3901:}
3902:.swipe-tag {
3903:  position: absolute;
3904:  top: 16px;
3905:  padding: 8px 14px;

4168:.streak-lvl {
4169:  margin-left: auto;
4170:  color: var(--text);
4171:}
4172:
4173:/* 1-tap quick rating on cards */
4174:.qr {
4175:  display: flex;
4176:  gap: 2px;
4177:  margin-top: 6px;
4178:}
4179:.qr-star {
4180:  background: none;
4181:  border: none;
4182:  font-size: 22px;
4183:  line-height: 1;
4184:  color: #d6d6d6;
4185:  padding: 0 1px;
4186:}
4187:.qr-star.on {
4188:  color: var(--accent);
4189:}
4190:.qr-done {
4191:  margin-top: 6px;
4192:  font-size: 13px;
4193:  color: #2e7d32;
4194:  font-weight: 600;
4195:  display: flex;
4196:  align-items: center;
4197:  gap: 8px;
4198:}
4199:.qr-add {
4200:  background: none;
4201:  border: none;
4202:  color: var(--accent);
4203:  font-size: 12px;
4204:  font-weight: 600;
4205:}
4206:
4207:/* profile progress */
4208:.prog-top {
4209:  display: flex;
4210:  justify-content: space-between;

4388:  z-index: 1100;
4389:  display: flex;
4390:  align-items: center;
4391:  gap: 10px;
4392:  padding: 14px 16px;
4393:  margin: 10px;
4394:  background: #fff;
4395:  border-radius: 12px;
4396:  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
4397:}
4398:.mb-back {
4399:  background: none;
4400:  border: none;
4401:  font-size: 22px;
4402:  line-height: 1;
4403:}
4404:.mb-title {
4405:  flex: 1;
4406:  display: flex;
4407:  align-items: baseline;
4408:  gap: 8px;
4409:  background: none;
4410:  border: none;
4411:  text-align: left;
4412:  font-size: 18px;
4413:}
4414:.mb-header-input {
4415:  flex: 1;
4416:  border: none;
4417:  outline: none;
4418:  background: none;
4419:  font-size: 16px;
4420:}
4421:.mb-locate-h {
4422:  flex: 0 0 auto;
4423:  width: 36px;
4424:  height: 36px;
4425:  border-radius: 50%;
4426:  border: 1px solid var(--border);
4427:  background: #fff;
4428:  font-size: 16px;
4429:}
4430:.mb-loc {
4431:  color: var(--hint);
4432:  font-size: 14px;
4433:}
4434:.mb-map {
4435:  position: absolute;

4598:}
4599:.filters-scroll {
4600:  flex: 1 1 auto;
4601:  min-height: 0;
4602:  overflow-y: auto;
4603:}
4604:.apply-sticky {
4605:  flex: 0 0 auto;
4606:  margin: 8px -16px 0;
4607:  /* the sheet (z-80) sits above the nav (z-10), so only the safe-area needs clearing —
4608:     no big empty gap under the button */
4609:  padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
4610:  background: #fff;
4611:  border-top: 1px solid var(--border);
4612:}
4613:.apply-sticky .btn {
4614:  width: 100%;
4615:}
4616:
4617:/* smooth modal close */
4618:.modal-backdrop.closing {
4619:  animation: fadeOut 0.28s ease forwards;
4620:}
4621:.modal-backdrop.closing .modal {
4622:  animation: sheetDown 0.3s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
4623:}
4624:@keyframes fadeOut {
4625:  to {
4626:    opacity: 0;
4627:  }
4628:}
4629:@keyframes sheetDown {
4630:  to {
4631:    transform: translateY(40px);
4632:    opacity: 0;
4633:  }
4634:}
4635:
4636:/* detail header media + favorite heart overlay */
4637:.detail-media {
4638:  position: relative;
4639:  /* photo is the pull-to-close handle: touch-action:none → vertical gesture is
4640:     fully ours (cancelable), guaranteed to work in the iOS Telegram webview */
4641:  touch-action: none;
4642:}
4643:.heart-lg {
4644:  position: absolute;
4645:  top: 12px;
4646:  left: 12px;
4647:  z-index: 3;
4648:  width: 40px;
4649:  height: 40px;
4650:  font-size: 22px;
4651:}
4652:
4653:/* illustrative stock placeholder badge */
4654:.stock-wrap {
4655:  position: relative;
4656:  flex: 0 0 auto;
4657:  display: inline-block;
4658:}
4659:/* the illustrative photo in the card header fills the whole header width */
4660:.detail-media > .stock-wrap {

4745:.card-price,
4746:.hero-price {
4747:  color: var(--accent);
4748:  font-weight: 800;
4749:}
4750:
4751:/* ── Photo-scan feature: floating camera button + recognition sheet ────────── */
4752:.scan-fab {
4753:  position: fixed;
4754:  right: 16px;
4755:  bottom: calc(80px + env(safe-area-inset-bottom));
4756:  z-index: 1500;
4757:  width: 60px;
4758:  height: 60px;
4759:  border-radius: 50%;
4760:  border: none;
4761:  background: var(--accent);
4762:  box-shadow: 0 6px 18px rgba(211, 35, 35, 0.45);
4763:  display: flex;
4764:  align-items: center;
4765:  justify-content: center;
4766:  cursor: pointer;
4767:  transition: transform 0.18s cubic-bezier(0.22, 0.61, 0.36, 1);
4768:}
4769:.scan-fab:active {
4770:  transform: scale(0.93);
4771:}
4772:.scan-backdrop {
4773:  align-items: flex-end;
4774:}
4775:.scan-sheet {
4776:  position: relative;
4777:  background: var(--bg);
4778:  width: 100%;
4779:  max-width: 560px;
4780:  border-radius: 18px 18px 0 0;
4781:  padding: 14px 16px calc(20px + env(safe-area-inset-bottom));
4782:  max-height: 90vh;
4783:  overflow-y: auto;
4784:  animation: sheetUp 0.34s cubic-bezier(0.22, 0.61, 0.36, 1);
4785:}
4786:.scan-back {
4787:  position: absolute;
4788:  top: 20px;
4789:  left: 22px;
4790:  z-index: 2;
4791:  width: 42px;
4792:  height: 42px;
4793:  border-radius: 50%;
4794:  border: 1px solid rgba(0, 0, 0, 0.08);
4795:  background: rgba(255, 255, 255, 0.92);
4796:  color: #111;
4797:  display: flex;
4798:  align-items: center;
4799:  justify-content: center;
4800:  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);

4950:.scan-empty small {
4951:  display: block;
4952:  margin-top: 8px;
4953:  font-size: 12px;
4954:  color: #999;
4955:  word-break: break-word;
4956:}
4957:
4958:/* global soft-press: every tap eases in/out instead of snapping. transform-only,
4959:   so layout is untouched; buttons that set their own transform still win (inline). */
4960:button,
4961:.chip,
4962:.cat-tile,
4963:.vote-btn,
4964:.rc-react,
4965:.heart {
4966:  -webkit-tap-highlight-color: transparent;
4967:  transition: transform 0.18s cubic-bezier(0.22, 0.61, 0.36, 1), background-color 0.22s ease, color 0.22s ease, border-color 0.22s ease, opacity 0.22s ease, filter 0.22s ease;
4968:}
4969:button:active,
4970:.chip:active,
4971:.cat-tile:active {
4972:  transform: scale(0.965);
4973:}
4974:
4975:/* disclaimer on every non-user photo (licensed stock / AI-generated): the catalog
4976:   image is informational, not the actual dish at the venue */
4977:.info-photo-badge {
4978:  position: absolute;
4979:  left: 8px;
4980:  top: 8px;
4981:  z-index: 2;
4982:  padding: 3px 8px;
4983:  border-radius: 8px;
4984:  background: rgba(0, 0, 0, 0.55);
4985:  color: #fff;
4986:  font-size: 10.5px;
4987:  font-weight: 600;
4988:  pointer-events: none;
4989:}
4990:.card-photo-wrap { position: relative; }
4991:
4992:/* one-time gentle FAB pulse on session start (3 cycles, then still) */
4993:.scan-fab.pulse {
4994:  animation: fabPulse 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) 3;
4995:}
4996:@keyframes fabPulse {
4997:  0%, 100% { transform: scale(1); box-shadow: 0 6px 18px rgba(211, 35, 35, 0.45); }
4998:  50% { transform: scale(1.08); box-shadow: 0 8px 26px rgba(211, 35, 35, 0.6); }
4999:}
5000:/* social-proof line under the training card */
5001:.train-social {
5002:  margin: 8px 0 0;
5003:  font-size: 12px;
5004:  color: var(--hint);
5005:}
5006:
5007:.show-more {
5008:  width: 100%;

5038:}
5039:
5040:.ft-sub { color: var(--hint); font-size: 12.5px; margin: -6px 2px 8px; }
5041:
5042:/* ---- premium polish pack (июль 2026) ---- */
5043:
5044:/* grabber bar: the universal "this sheet pulls down" affordance */
5045:.modal::before,
5046:.photo-post::before,
5047:.scan-sheet::before,
5048:.scan-src::before {
5049:  content: '';
5050:  display: block;
5051:  width: 40px;
5052:  height: 4px;
5053:  border-radius: 2px;
5054:  background: var(--border);
5055:  margin: 0 auto 10px;
5056:  flex-shrink: 0;
5057:}
5058:
5059:/* one-time Tinder-swipe hint on the discovery card (first 2 sessions) */
5060:@keyframes heroNudge {
5061:  0%, 100% { transform: translateX(0) rotate(0deg); }
5062:  16% { transform: translateX(26px) rotate(1.2deg); }
5063:  34% { transform: translateX(0) rotate(0deg); }
5064:  56% { transform: translateX(-26px) rotate(-1.2deg); }
5065:  76% { transform: translateX(0) rotate(0deg); }
5066:}
5067:.hero-hint {
5068:  animation: heroNudge 2.4s cubic-bezier(0.22, 0.61, 0.36, 1) 0.7s 1;
5069:}
5070:
5071:/* "Скан" caption inside the FAB for the first two sessions */
5072:.scan-fab-label {
5073:  position: absolute;
5074:  bottom: 6px;
5075:  left: 0;
5076:  right: 0;
5077:  text-align: center;
5078:  font-size: 9px;
5079:  font-weight: 800;
5080:  color: #fff;
5081:  letter-spacing: 0.4px;
5082:  pointer-events: none;
5083:}
5084:.scan-fab { flex-direction: column; }
5085:
5086:/* feed photo: ↗ badge says "this opens" */
5087:.post-photo-wrap {
5088:  position: relative;
5089:  cursor: pointer;
5090:}

5408:  color: var(--accent);
5409:  background: rgba(211, 35, 35, 0.08);
5410:  padding: 4px 10px;
5411:  border-radius: 999px;
5412:}
5413:
5414:/* floating "scroll to top" button (left side), appears after «показать ещё» */
5415:.scroll-top-btn {
5416:  /* sits right ABOVE the camera scan-fab (owner spec 16.07.2026) */
5417:  position: fixed;
5418:  right: 23px; /* centered over the 60px fab: 16 + (60-46)/2 */
5419:  bottom: calc(80px + 60px + 12px + env(safe-area-inset-bottom));
5420:  z-index: 1400;
5421:  width: 46px;
5422:  height: 46px;
5423:  border-radius: 50%;
5424:  border: 1px solid rgba(255, 255, 255, 0.18);
5425:  display: flex;
5426:  align-items: center;
5427:  justify-content: center;
5428:  color: #fff;
5429:  /* frosted glass — premium (iOS/Telegram style) */
5430:  background: rgba(20, 20, 22, 0.55);
5431:  -webkit-backdrop-filter: saturate(160%) blur(14px);
5432:  backdrop-filter: saturate(160%) blur(14px);
5433:  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
5434:  cursor: pointer;
5435:  animation: stbIn 0.32s cubic-bezier(0.34, 1.3, 0.64, 1);
5436:  transition: transform 0.12s cubic-bezier(0.22, 0.61, 0.36, 1);
5437:}
5438:.scroll-top-btn:active { transform: scale(0.9); }
5439:@keyframes stbIn {
5440:  from { opacity: 0; transform: scale(0.8) translateY(6px); }
5441:  to { opacity: 1; transform: scale(1) translateY(0); }
5442:}
5443:
5444:
5445:/* ---- premium press states (unified, subtle scale + interruptible curve) ---- */
5446:.btn,
5447:.fav-btn,
5448:.card,
5449:.vcard,
5450:.post,
5451:.cat-tile,
5452:.mini,
5453:.qr-star,
5454:.rec-star,
5455:.hero-btn,
5456:.rate-act {
5457:  transition: transform 0.11s cubic-bezier(0.22, 0.61, 0.36, 1),
5458:    filter 0.11s ease;
5459:  -webkit-tap-highlight-color: transparent;
5460:}

5485:}
5486:.sk {
5487:  background: linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.09) 37%, rgba(0,0,0,0.05) 63%);
5488:  background-size: 560px 100%;
5489:  animation: skShimmer 1.2s ease-in-out infinite;
5490:  border-radius: 10px;
5491:}
5492:@media (prefers-color-scheme: dark) {
5493:  .sk { background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.11) 37%, rgba(255,255,255,0.06) 63%); background-size: 560px 100%; }
5494:}
5495:.sk-card {
5496:  border: 1px solid var(--border);
5497:  border-radius: 16px;
5498:  overflow: hidden;
5499:  margin-bottom: 12px;
5500:}
5501:.sk-photo { width: 100%; height: 180px; border-radius: 0; }
5502:.sk-lines { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
5503:.sk-line { height: 14px; }
5504:.sk-line.w70 { width: 70%; }
5505:.sk-line.w40 { width: 40%; }
5506:.sk-line.btn { height: 40px; border-radius: 12px; margin-top: 4px; }
5507:
5508:/* «Показать ещё» premium loading: inline spinner in the button */
5509:.btn.show-more { min-height: 44px; display: flex; align-items: center; justify-content: center; }
5510:.btn.show-more:disabled { opacity: 0.85; }

5568:.ni-item:active { background: rgba(0,0,0,0.05); }
5569:
5570:/* ── notification center (bell) ── */
5571:.bell-wrap { position: relative; display: inline-flex; }
5572:.nav-badge {
5573:  position: absolute;
5574:  top: -5px;
5575:  right: -9px;
5576:  min-width: 16px;
5577:  height: 16px;
5578:  padding: 0 4px;
5579:  border-radius: 9px;
5580:  background: var(--accent);
5581:  color: #fff;
5582:  font-size: 10px;
5583:  font-weight: 800;
5584:  line-height: 16px;
5585:  text-align: center;
5586:  box-shadow: 0 1px 4px rgba(211, 35, 35, 0.4);
5587:}
5588:.alert-row {
5589:  display: flex;
5590:  align-items: flex-start;
5591:  gap: 10px;
5592:  padding: 12px 12px;
5593:  border-radius: 14px;
5594:  background: var(--card, #fff);
5595:  border: 1px solid rgba(0, 0, 0, 0.06);
5596:  margin-bottom: 8px;
5597:  cursor: pointer;
5598:  transition: transform 0.1s ease;
5599:}
5600:.alert-row:active { transform: scale(0.985); }
5601:.alert-row.fresh { border-color: rgba(211, 35, 35, 0.35); background: #fff6f6; }
5602:.alert-ico { font-size: 20px; line-height: 1.2; }
5603:.alert-body { flex: 1; min-width: 0; }
5604:.alert-text { font-size: 14px; line-height: 1.35; }
5605:.alert-meta { font-size: 12px; color: var(--hint, #888); margin-top: 3px; }
5606:.alert-user { color: var(--accent); font-weight: 700; }
5607:.alert-dot {
5608:  width: 8px;
5609:  height: 8px;
5610:  border-radius: 50%;
5611:  background: var(--accent);
5612:  margin-top: 6px;
5613:  flex-shrink: 0;
5614:}
5615:
5616:/* venue cards: no photos — white tile, black venue name, always fully inside
5617:   the card (owner 17.07.2026) */
5618:/* high specificity + !important: the generic .card .photo (gray bg, block)
5619:   must NEVER win over the tile — that looked like an unloaded photo */
5620:.photo.venue-name-tile, .vcard-photo.venue-name-tile, .mini-img.venue-name-tile,

5725:  font-size: 18px; font-weight: 800;
5726:  color: var(--accent);
5727:}
5728:.ptr-spinner.spin { animation: ptrSpin 0.7s linear infinite; }
5729:@keyframes ptrSpin { to { transform: rotate(360deg); } }
5730:
5731:/* visible dark blinking caret in every text field (owner 18.07.2026) — the user
5732:   must always see where the cursor blinks */
5733:textarea, input[type="text"], input[type="search"], input[type="number"],
5734:input[inputmode="numeric"], input[type="date"], .rv-text, [contenteditable] {
5735:  caret-color: #111;
5736:}
5737:@media (prefers-color-scheme: dark) {
5738:  textarea, input[type="text"], input[type="search"], input[type="number"],
5739:  input[inputmode="numeric"], input[type="date"], .rv-text, [contenteditable] {
5740:    caret-color: #f2f2f2;
5741:  }
5742:}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n \".\" frontend/index.html frontend/vite.config.mjs; rg -n \"safeArea|contentSafeArea|viewportHeight|viewportStableHeight|themeParams|setHeaderColor|setBackgroundColor|isVerticalSwipesEnabled|MainButton|SecondaryButton|BackButton|HapticFeedback|enableClosingConfirmation|requestFullscreen|expand\\(\" frontend/src frontend/index.html" in D:\Приложения\Yelp
 succeeded in 393ms:
frontend/vite.config.mjs:1:import { defineConfig } from 'vite';
frontend/vite.config.mjs:2:import react from '@vitejs/plugin-react';
frontend/vite.config.mjs:4:const proxy = {
frontend/vite.config.mjs:5:  '/api': {
frontend/vite.config.mjs:6:    target: 'http://localhost:3000',
frontend/vite.config.mjs:7:    changeOrigin: true,
frontend/vite.config.mjs:8:  },
frontend/vite.config.mjs:9:};
frontend/vite.config.mjs:11:const cacheHeaders = () => ({
frontend/vite.config.mjs:12:  name: 'preview-cache-headers',
frontend/vite.config.mjs:13:  configurePreviewServer(server) {
frontend/vite.config.mjs:14:    server.middlewares.use((req, res, next) => {
frontend/vite.config.mjs:15:      const url = req.url || '';
frontend/vite.config.mjs:16:      if (url === '/' || url.startsWith('/?') || url.endsWith('.html')) {
frontend/vite.config.mjs:17:        res.setHeader('Cache-Control', 'no-store, max-age=0');
frontend/vite.config.mjs:18:      } else if (url.startsWith('/assets/')) {
frontend/vite.config.mjs:19:        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
frontend/vite.config.mjs:20:      } else if (url === '/telegram-web-app.js') {
frontend/vite.config.mjs:21:        res.setHeader('Cache-Control', 'no-cache, max-age=0');
frontend/vite.config.mjs:22:      }
frontend/vite.config.mjs:23:      next();
frontend/vite.config.mjs:24:    });
frontend/vite.config.mjs:25:  },
frontend/vite.config.mjs:26:});
frontend/vite.config.mjs:28:export default defineConfig({
frontend/vite.config.mjs:29:  plugins: [react(), cacheHeaders()],
frontend/vite.config.mjs:30:  server: {
frontend/vite.config.mjs:31:    host: true,
frontend/vite.config.mjs:32:    port: 5173,
frontend/vite.config.mjs:33:    allowedHosts: true,
frontend/vite.config.mjs:34:    proxy,
frontend/vite.config.mjs:35:  },
frontend/vite.config.mjs:36:  preview: {
frontend/vite.config.mjs:37:    host: true,
frontend/vite.config.mjs:38:    port: 5173,
frontend/vite.config.mjs:39:    strictPort: true,
frontend/vite.config.mjs:40:    allowedHosts: true,
frontend/vite.config.mjs:41:    proxy,
frontend/vite.config.mjs:42:  },
frontend/vite.config.mjs:43:});
frontend/index.html:1:<!doctype html>
frontend/index.html:2:<html lang="ru">
frontend/index.html:3:  <head>
frontend/index.html:4:    <meta charset="UTF-8" />
frontend/index.html:5:    <meta
frontend/index.html:6:      name="viewport"
frontend/index.html:7:      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover"
frontend/index.html:8:    />
frontend/index.html:9:    <title>togomoscow</title>
frontend/index.html:10:    <meta http-equiv="Cache-Control" content="no-store, max-age=0" />
frontend/index.html:11:    <meta http-equiv="Pragma" content="no-cache" />
frontend/index.html:12:    <meta http-equiv="Expires" content="0" />
frontend/index.html:13:    <!-- SELF-HOSTED (same origin): the external https://telegram.org copy is throttled /
frontend/index.html:14:         unreachable on some RU mobile carriers, and as a synchronous <head> script it
frontend/index.html:15:         stalled the whole page → Telegram's loader hung forever with ZERO requests
frontend/index.html:16:         reaching us. Serving it from our origin removes that dependency entirely. -->
frontend/index.html:17:    <script src="/telegram-web-app.js" defer></script>
frontend/index.html:18:    <!-- boot watchdog: no dependency on the app bundle, so it works even when the
frontend/index.html:19:         bundle fails to load/parse (the exact failure mode we're debugging). -->
frontend/index.html:20:    <script>
frontend/index.html:21:      (function () {
frontend/index.html:22:        var API = '/api/health/client-error';
frontend/index.html:23:        function report(kind, detail) {
frontend/index.html:24:          try {
frontend/index.html:25:            var body = JSON.stringify({
frontend/index.html:26:              kind: kind,
frontend/index.html:27:              detail: String(detail).slice(0, 500),
frontend/index.html:28:              url: location.href,
frontend/index.html:29:              boot: true,
frontend/index.html:30:              tg: !!(window.Telegram && window.Telegram.WebApp),
frontend/index.html:31:              platform: window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp.platform : 'n/a',
frontend/index.html:32:              version: window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp.version : 'n/a',
frontend/index.html:33:              ua: navigator.userAgent,
frontend/index.html:34:              vw: window.innerWidth,
frontend/index.html:35:              vh: window.innerHeight,
frontend/index.html:36:            });
frontend/index.html:37:            if (navigator.sendBeacon) navigator.sendBeacon(API, new Blob([body], { type: 'application/json' }));
frontend/index.html:38:            else { var x = new XMLHttpRequest(); x.open('POST', API, true); x.setRequestHeader('Content-Type', 'application/json'); x.send(body); }
frontend/index.html:39:          } catch (e) {}
frontend/index.html:40:        }
frontend/index.html:41:        report('boot-open', 'html script executed');
frontend/index.html:42:        // catch EVERYTHING before/while the bundle boots (module load errors included)
frontend/index.html:43:        window.addEventListener('error', function (e) {
frontend/index.html:44:          report('boot-error', (e.message || 'res-error') + ' @ ' + (e.filename || (e.target && e.target.src) || '') + ':' + (e.lineno || 0));
frontend/index.html:45:        }, true);
frontend/index.html:46:        window.addEventListener('unhandledrejection', function (e) {
frontend/index.html:47:          report('boot-promise', (e.reason && (e.reason.stack || e.reason.message)) || e.reason);
frontend/index.html:48:        });
frontend/index.html:49:        // Telegram keeps its native dark loader until WebApp.ready() is called.
frontend/index.html:50:        // Call it before React boots so a slow bundle still reveals our HTML
frontend/index.html:51:        // loader/watchdog instead of leaving the user on Telegram's spinner.
frontend/index.html:52:        function telegramReadySoon() {
frontend/index.html:53:          try {
frontend/index.html:54:            var webApp = window.Telegram && window.Telegram.WebApp;
frontend/index.html:55:            if (webApp && webApp.ready) {
frontend/index.html:56:              webApp.ready();
frontend/index.html:57:              if (webApp.expand) webApp.expand();
frontend/index.html:58:              report('tg-ready-called', 'ready/expand called from html');
frontend/index.html:59:              return true;
frontend/index.html:60:            }
frontend/index.html:61:          } catch (e) {}
frontend/index.html:62:          return false;
frontend/index.html:63:        }
frontend/index.html:64:        if (!telegramReadySoon()) {
frontend/index.html:65:          var tries = 0;
frontend/index.html:66:          var readyTimer = setInterval(function () {
frontend/index.html:67:            tries += 1;
frontend/index.html:68:            if (telegramReadySoon() || tries > 300) clearInterval(readyTimer);
frontend/index.html:69:          }, 100);
frontend/index.html:70:        }
frontend/index.html:71:        // if React hasn't mounted in 12s → the page is wedged (stale cache / failed
frontend/index.html:72:        // asset / blocked script). Auto-recover ONCE with a cache-busting reload;
frontend/index.html:73:        // on a second failure show a manual retry so the user is never stuck.
frontend/index.html:74:        setTimeout(function () {
frontend/index.html:75:          if (window.__APP_BOOTED) return;
frontend/index.html:76:          report('boot-timeout', 'app not mounted in 12s');
frontend/index.html:77:          var u = new URL(location.href);
frontend/index.html:78:          if (!u.searchParams.get('rb')) {
frontend/index.html:79:            u.searchParams.set('rb', String(Date.now()));
frontend/index.html:80:            location.replace(u.toString());
frontend/index.html:81:          } else {
frontend/index.html:82:            var d = document.getElementById('boot-msg');
frontend/index.html:83:            if (d) {
frontend/index.html:84:              d.innerHTML = 'Не удалось загрузить 😕<br/><button onclick="location.reload()" ' +
frontend/index.html:85:                'style="margin-top:12px;padding:12px 22px;border:none;border-radius:12px;background:#d32323;color:#fff;font-weight:700;font-size:15px">Обновить</button>';
frontend/index.html:86:            }
frontend/index.html:87:          }
frontend/index.html:88:        }, 12000);
frontend/index.html:89:      })();
frontend/index.html:90:    </script>
frontend/index.html:91:    <style>
frontend/index.html:92:      /* minimal first-paint loader (replaced when React mounts) */
frontend/index.html:93:      #boot-msg { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: system-ui, sans-serif; color: #555; font-size: 15px; text-align: center; background: #fff; }
frontend/index.html:94:      #boot-msg .sp { width: 26px; height: 26px; border: 3px solid #eee; border-top-color: #d32323; border-radius: 50%; animation: bspin 0.8s linear infinite; margin-bottom: 12px; }
frontend/index.html:95:      @keyframes bspin { to { transform: rotate(360deg); } }
frontend/index.html:96:    </style>
frontend/index.html:97:  </head>
frontend/index.html:98:  <body>
frontend/index.html:99:    <img src="/api/health/ping?kind=html-img&v=225" alt="" width="1" height="1" style="position:absolute;left:-9999px;top:-9999px" />
frontend/index.html:100:    <div id="root"><div id="boot-msg"><div class="sp"></div>Загружаем togomoscow…</div></div>
frontend/index.html:101:    <script type="module" src="/src/main.tsx"></script>
frontend/index.html:102:  </body>
frontend/index.html:103:</html>
frontend/index.html:57:              if (webApp.expand) webApp.expand();
frontend/src\modalEsc.ts:13:// BackButton, popping two layers at once (e.g. filter sheet AND the map browse →
frontend/src\modalEsc.ts:30:// Telegram's native BackButton — the reliable "back" on desktop & mobile, where
frontend/src\modalEsc.ts:33:  return (window as any).Telegram?.WebApp?.BackButton ?? null;
frontend/src\modalEsc.ts:35:function syncBackButton() {
frontend/src\modalEsc.ts:82:    syncBackButton();
frontend/src\modalEsc.ts:87:      syncBackButton();
frontend/src\telegram.ts:17:    webApp?.expand();
frontend/src\telegram.ts:41:    telegramWebApp()?.HapticFeedback?.impactOccurred(style);
frontend/src\vite-env.d.ts:15:  themeParams?: Record<string, string>;
frontend/src\vite-env.d.ts:19:  HapticFeedback?: {

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n -A 12 "''^('"\\.heart \\{|\\.ni-dots \\{|\\.fav-btn \\{|\\.post-head \\{|\\.post-photo-wrap \\{|\\.post-venue-link \\{|\\.cmt-reply \\{|\\.me-icon \\{|\\.stat-btn \\{|\\.me-action \\{|\\.filterbar \\{|\\.fbtn-icon \\{|\\.pick-row \\{|\\.scan-retry \\{|\\.scan-src-btn \\{|\\.photo-box \\{|\\.rate-act \\{|\\.action \\{|\\.tabbar \\{|\\.nav a \\{|\\.ctag \\{|\\.search-sugg-item \\{|\\.ss-clear \\{|\\.alert-avatar \\{|\\.alert-user \\{|\\.thumb-del \\{|\\.scroll-top-btn \\{)\" frontend/src/index.css" in D:\Приложения\Yelp
 succeeded in 261ms:
259:.fav-btn {
260-  flex: 1 1 0;
261-  padding: 12px;
262-  border-radius: 12px;
263-  border: 1px solid var(--accent);
264-  background: var(--accent);
265-  color: #fff;
266-  font-weight: 700;
267-  font-size: 15px;
268-  text-align: center;
269-  cursor: pointer;
270-  white-space: nowrap;
271-}
--
547:.heart {
548-  position: absolute;
549-  top: 8px;
550-  right: 8px;
551-  width: 34px;
552-  height: 34px;
553-  border-radius: 50%;
554-  border: none;
555-  background: rgba(0, 0, 0, 0.45);
556-  color: #fff;
557-  font-size: 17px;
558-  display: grid;
559-  place-items: center;
--
606:.ctag {
607-  font-size: 12px;
608-  padding: 4px 10px;
609-  border: 1px solid var(--border);
610-  border-radius: 999px;
611-  color: var(--text);
612-  background: #fff;
613-  cursor: pointer;
614-  font-family: inherit;
615-}
616-
617-/* bottom nav */
618-.nav {
--
629:.nav a {
630-  flex: 1;
631-  text-align: center;
632-  text-decoration: none;
633-  color: var(--hint);
634-  font-size: 11px;
635-  font-weight: 600;
636-  display: flex;
637-  flex-direction: column;
638-  align-items: center;
639-  gap: 2px;
640-}
641-.nav a .ico {
--
898:.post-head {
899-  display: flex;
900-  align-items: center;
901-  gap: 10px;
902-  padding: 12px 12px 10px;
903-  width: 100%;
904-  background: none;
905-  border: none;
906-  font: inherit;
907-  cursor: pointer;
908-}
909-.post-avatar {
910-  width: 40px;
--
1859:.filterbar {
1860-  display: flex;
1861-  gap: 8px;
1862-  padding: 8px 12px;
1863-  background: var(--bg);
1864-  border-bottom: 1px solid var(--border);
1865-  overflow-x: auto;
1866-  scrollbar-width: none;
1867-  align-items: center;
1868-}
1869-.filterbar::-webkit-scrollbar {
1870-  display: none;
1871-}
1872:.fbtn-icon {
1873-  flex: 0 0 auto;
1874-  width: 38px;
1875-  height: 38px;
1876-  border-radius: 50%;
1877-  border: 1px solid var(--border);
1878-  background: #fff;
1879-  color: var(--text);
1880-  display: grid;
1881-  place-items: center;
1882-  cursor: pointer;
1883-}
1884-/* filters bottom sheet */
--
2008:.rate-act {
2009-  flex: 1;
2010-  background: none;
2011-  border: 1px solid var(--border);
2012-  border-radius: 12px;
2013-  padding: 12px;
2014-  font-weight: 700;
2015-  font-size: 15px;
2016-  color: var(--text);
2017-  cursor: pointer;
2018-}
2019-
2020-.photo-thumbs {
--
2038:.thumb-del {
2039-  position: absolute;
2040-  top: -6px;
2041-  right: -6px;
2042-  width: 22px;
2043-  height: 22px;
2044-  border-radius: 50%;
2045-  border: 2px solid #fff;
2046-  background: var(--accent);
2047-  color: #fff;
2048-  font-size: 14px;
2049-  line-height: 1;
2050-  font-weight: 700;
--
2151:.tabbar {
2152-  display: flex;
2153-  gap: 4px;
2154-  margin-top: 14px;
2155-  border-bottom: 1px solid var(--border);
2156-  overflow-x: auto;
2157-  position: sticky;
2158-  top: 0;
2159-  background: #fff;
2160-  z-index: 5;
2161-}
2162-.feed-section {
2163-  scroll-margin-top: 52px;
--
2331:.me-icon {
2332-  width: 38px;
2333-  height: 38px;
2334-  border-radius: 50%;
2335-  border: none;
2336-  background: #f1f1f1;
2337-  font-size: 18px;
2338-}
2339-.me-head {
2340-  display: flex;
2341-  flex-direction: column;
2342-  align-items: center;
2343-  gap: 6px;
--
2380:.me-action {
2381-  display: flex;
2382-  flex-direction: column;
2383-  align-items: center;
2384-  gap: 6px;
2385-  background: none;
2386-  border: none;
2387-  font-size: 12px;
2388-  color: var(--text);
2389-  flex: 1;
2390-}
2391-.ma-ico {
2392-  width: 52px;
--
2565:.ss-clear {
2566-  background: none;
2567-  border: none;
2568-  color: var(--accent);
2569-  font-weight: 700;
2570-  font-size: 12px;
2571-  cursor: pointer;
2572-}
2573:.search-sugg-item {
2574-  display: flex;
2575-  align-items: center;
2576-  gap: 10px;
2577-  width: 100%;
2578-  text-align: left;
2579-  padding: 11px 14px;
2580-  background: #fff;
2581-  border: none;
2582-  border-bottom: 1px solid var(--border);
2583-  font-size: 15px;
2584-  color: var(--text);
2585-}
--
2597:.pick-row {
2598-  display: block;
2599-  width: 100%;
2600-  text-align: left;
2601-  background: none;
2602-  border: none;
2603-  border-bottom: 1px solid var(--border);
2604-  padding: 11px 4px;
2605-}
2606-.pick-row:active {
2607-  background: #f5f5f5;
2608-}
2609-
--
2715:.photo-box {
2716-  flex: 0 0 104px;
2717-  display: flex;
2718-  flex-direction: column;
2719-  align-items: center;
2720-  justify-content: center;
2721-  gap: 8px;
2722-  width: 104px;
2723-  border: 1.5px dashed rgba(211, 35, 35, 0.5);
2724-  border-radius: 14px;
2725-  background: rgba(211, 35, 35, 0.06);
2726-  color: var(--accent);
2727-  font-size: 13px;
--
3704:.cmt-reply {
3705-  margin-left: 28px;
3706-  background: none;
3707-  border: none;
3708-  color: var(--hint);
3709-  font-size: 12px;
3710-  font-weight: 600;
3711-  padding: 0;
3712-}
3713-.cmt-form {
3714-  display: flex;
3715-  gap: 6px;
3716-  margin: 6px 0 0 28px;
--
4254:.stat-btn {
4255-  background: none;
4256-  border: none;
4257-  font-size: 14px;
4258-  font-weight: 600;
4259-  color: var(--text);
4260-  padding: 2px 4px;
4261-}
4262-.stat-btn:active {
4263-  color: var(--accent);
4264-}
4265-
4266-/* people list (followers / following / search) */
--
4889:.scan-retry {
4890-  margin-top: 12px;
4891-  width: 100%;
4892-  padding: 12px;
4893-  border-radius: 12px;
4894-  border: 1px solid var(--border);
4895-  background: #fff;
4896-  font-weight: 700;
4897-  cursor: pointer;
4898-}
4899-/* photo-source sheet: camera or gallery only (no file browser) */
4900-.scan-src {
4901-  background: var(--bg);
--
4908:.scan-src-btn {
4909-  display: block;
4910-  width: 100%;
4911-  padding: 15px;
4912-  margin-bottom: 8px;
4913-  border: 1px solid var(--border);
4914-  border-radius: 12px;
4915-  background: #fff;
4916-  font-size: 16px;
4917-  font-weight: 700;
4918-  cursor: pointer;
4919-}
4920-.scan-src-btn.cancel {
--
4965:.heart {
4966-  -webkit-tap-highlight-color: transparent;
4967-  transition: transform 0.18s cubic-bezier(0.22, 0.61, 0.36, 1), background-color 0.22s ease, color 0.22s ease, border-color 0.22s ease, opacity 0.22s ease, filter 0.22s ease;
4968-}
4969-button:active,
4970-.chip:active,
4971-.cat-tile:active {
4972-  transform: scale(0.965);
4973-}
4974-
4975-/* disclaimer on every non-user photo (licensed stock / AI-generated): the catalog
4976-   image is informational, not the actual dish at the venue */
4977-.info-photo-badge {
--
5087:.post-photo-wrap {
5088-  position: relative;
5089-  cursor: pointer;
5090-}
5091-.post-photo-open {
5092-  position: absolute;
5093-  top: 10px;
5094-  right: 10px;
5095-  width: 28px;
5096-  height: 28px;
5097-  border-radius: 50%;
5098-  background: rgba(0, 0, 0, 0.45);
5099-  color: #fff;
--
5415:.scroll-top-btn {
5416-  /* sits right ABOVE the camera scan-fab (owner spec 16.07.2026) */
5417-  position: fixed;
5418-  right: 23px; /* centered over the 60px fab: 16 + (60-46)/2 */
5419-  bottom: calc(80px + 60px + 12px + env(safe-area-inset-bottom));
5420-  z-index: 1400;
5421-  width: 46px;
5422-  height: 46px;
5423-  border-radius: 50%;
5424-  border: 1px solid rgba(255, 255, 255, 0.18);
5425-  display: flex;
5426-  align-items: center;
5427-  justify-content: center;
--
5456:.rate-act {
5457-  transition: transform 0.11s cubic-bezier(0.22, 0.61, 0.36, 1),
5458-    filter 0.11s ease;
5459-  -webkit-tap-highlight-color: transparent;
5460-}
5461-.btn:active,
5462-.fav-btn:active,
5463-.rate-act:active,
5464-.hero-btn:active {
5465-  transform: scale(0.97);
5466-  filter: brightness(0.96);
5467-}
5468-.card:active,
--
5537:.ni-dots {
5538-  width: 34px; height: 34px;
5539-  border-radius: 50%;
5540-  border: none;
5541-  display: grid; place-items: center;
5542-  color: #fff;
5543-  background: rgba(0, 0, 0, 0.42);
5544-  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
5545-  cursor: pointer;
5546-}
5547-.ni-dots:active { transform: scale(0.9); }
5548-.ni-pop {
5549-  position: absolute; top: 40px; right: 0;
--
5606:.alert-user { color: var(--accent); font-weight: 700; }
5607-.alert-dot {
5608-  width: 8px;
5609-  height: 8px;
5610-  border-radius: 50%;
5611-  background: var(--accent);
5612-  margin-top: 6px;
5613-  flex-shrink: 0;
5614-}
5615-
5616-/* venue cards: no photos — white tile, black venue name, always fully inside
5617-   the card (owner 17.07.2026) */
5618-/* high specificity + !important: the generic .card .photo (gray bg, block)
--
5668:.alert-avatar {
5669-  width: 38px; height: 38px;
5670-  border-radius: 50%;
5671-  object-fit: cover;
5672-  flex-shrink: 0;
5673-  border: 1.5px solid rgba(211, 35, 35, 0.25);
5674-}
5675-.alert-thumb {
5676-  width: 46px; height: 46px;
5677-  border-radius: 10px;
5678-  object-fit: cover;
5679-  flex-shrink: 0;
5680-}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/screens/MyRatings.tsx'; "'$c=Get-Content -Encoding utf8 $f; foreach($range in @(@(1,180),@(180,380),@(380,536))){$s=$range[0];$e=$range[1];for($i=$s;$i -le $e;$i++){"$i`:$($c[$i-1])"};""}' in D:\Приложения\Yelp
 succeeded in 786ms:
1:import { useEffect, useMemo, useRef, useState } from 'react';
2:import { useNavigate } from 'react-router-dom';
3:import { api } from '../api';
4:import { AddBusiness } from '../components/AddBusiness';
5:import { SupportModal } from '../components/SupportModal';
6:import { ListingDetailModal } from '../components/ListingDetail';
7:import { PeopleModal, UserProfileModal } from '../components/People';
8:import { ReviewForm } from '../components/ReviewForm';
9:import { ReviewCard, CategoryAverages } from '../components/ReviewCard';
10:import { GameProgress, GameCelebration, useGameState } from '../components/GameProgress';
11:import { PhotoPostModal } from '../components/PhotoPostModal';
12:import { Stars } from '../components/Stars';
13:import { VenuePhoto } from '../components/VenuePhoto';
14:import { getRecent } from '../recent';
15:import { openExternal } from '../telegram';
16:import type { Listing, Profile, Review, Specialization, TasteProfile, UserStats } from '../types';
17:
18:// cache the profile + reviews so a cold launch shows them INSTANTLY (no "Гость"/empty
19:// flash) while fresh data loads in the background.
20:const ME_CACHE = 'me_cache_v1';
21:const readCache = (): { profile?: Profile; reviews?: Review[]; taste?: TasteProfile } => {
22:  try { return JSON.parse(localStorage.getItem(ME_CACHE) || '{}'); } catch { return {}; }
23:};
24:const writeCache = (patch: Record<string, unknown>) => {
25:  try { localStorage.setItem(ME_CACHE, JSON.stringify({ ...readCache(), ...patch })); } catch { /* quota */ }
26:};
27:
28:export default function MyRatings() {
29:  const nav = useNavigate();
30:  const cached = readCache();
31:  // only trust a cached profile that has the expected shape (guards against a
32:  // malformed/old cache crashing the first render before any fetch — which on a
33:  // phone meant the screen never even tried to load)
34:  const [profile, setProfile] = useState<Profile | null>(cached.profile?.user ? cached.profile : null);
35:  const [reviews, setReviews] = useState<Review[]>(cached.reviews ?? []);
36:  const [stats, setStats] = useState<UserStats | null>(null);
37:  const [specs, setSpecs] = useState<Specialization[]>([]);
38:  const [owned, setOwned] = useState<Listing[]>([]);
39:  const [edit, setEdit] = useState<Review | null>(null);
40:  const [showAdd, setShowAdd] = useState(false);
41:  const [showSupport, setShowSupport] = useState(false);
42:  const [taste, setTaste] = useState<TasteProfile | null>(cached.taste ?? null);
43:  const [impactTab, setImpactTab] = useState<'taste' | 'photos'>('taste');
44:  const [people, setPeople] = useState<'followers' | 'following' | null>(null);
45:  const [openUser, setOpenUser] = useState<string | null>(null);
46:  const [openListing, setOpenListing] = useState<string | null>(null);
47:  const [recent, setRecent] = useState<Listing[]>([]);
48:  const [noStory, setNoStory] = useState(localStorage.getItem('noStoryOnReview') === '1');
49:  const [photoReview, setPhotoReview] = useState<Review | null>(null);
50:  const game = useGameState();
51:
52:  const load = () => {
53:    api.profile().then((p) => { setProfile(p); writeCache({ profile: p }); }).catch(() => {});
54:    api.myReviews().then((r) => { setReviews(r); writeCache({ reviews: r }); }).catch(() => {});
55:    api.tasteProfile().then((t) => { setTaste(t); writeCache({ taste: t }); }).catch(() => {});
56:    api.specializations().then(setSpecs).catch(() => {});
57:    api.ownerVenues().then(setOwned).catch(() => {});
58:    setRecent(getRecent());
59:  };
60:  // keep a live ref so the retry loop knows when the data has actually arrived:
61:  // profile is in, AND reviews match the count the profile reports (or it's genuinely 0)
62:  const loadedRef = useRef(false);
63:  loadedRef.current =
64:    !!profile?.user && (reviews.length > 0 || (profile.counts?.reviews ?? 0) === 0);
65:  useEffect(() => {
66:    let stop = false;
67:    let tries = 0;
68:    // Mobile through the tunnel is slow/flaky — keep retrying (with backoff) until the
69:    // profile actually loads, instead of giving up after one attempt.
70:    const attempt = () => {
71:      if (stop) return;
72:      load();
73:      tries += 1;
74:      if (tries < 8 && !loadedRef.current) setTimeout(attempt, Math.min(800 + tries * 600, 3500));
75:    };
76:    attempt();
77:    const onFocus = () => load();
78:    const onVis = () => { if (!document.hidden) load(); };
79:    window.addEventListener('focus', onFocus);
80:    document.addEventListener('visibilitychange', onVis);
81:    return () => {
82:      stop = true;
83:      window.removeEventListener('focus', onFocus);
84:      document.removeEventListener('visibilitychange', onVis);
85:    };
86:    // eslint-disable-next-line react-hooks/exhaustive-deps
87:  }, []);
88:
89:  const photos = useMemo(() => reviews.flatMap((r) => r.photoUrls ?? []), [reviews]);
90:
91:  // my own reviews carry no `user` — fill it from the profile so the author shows on cards
92:  const withMe = (r: Review): Review =>
93:    ({
94:      ...r,
95:      user:
96:        r.user ??
97:        (profile?.user
98:          ? {
99:              id: profile.user.id,
100:              firstName: profile.user.firstName,
101:              username: profile.user.username,
102:              photoUrl: profile.user.photoUrl,
103:            }
104:          : undefined),
105:    } as Review);
106:
107:  const name = profile?.user?.firstName ?? profile?.user?.username ?? 'Гость';
108:
109:  const share = () => {
110:    const link = 'https://t.me/togomoscow_bot';
111:    const n = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
112:    if (n.share) n.share({ title: name, url: link }).catch(() => {});
113:    else openExternal(`https://t.me/share/url?url=${encodeURIComponent(link)}`);
114:  };
115:
116:  return (
117:    <div className="me">
118:      <div className="me-topbar">
119:        <button className="me-icon" onClick={share} aria-label="Поделиться">
120:          ↗
121:        </button>
122:      </div>
123:
124:      <div className="me-head">
125:        {profile?.user?.photoUrl ? (
126:          <img className="me-avatar" src={profile.user.photoUrl} alt="" />
127:        ) : (
128:          <div className="me-avatar ph">📷</div>
129:        )}
130:        <div className="me-name">{name}</div>
131:        <div className="me-stats">
132:          <button className="stat-btn" onClick={() => setPeople('followers')}>
133:            <b>{profile?.counts.followers ?? 0}</b> подписчиков
134:          </button>
135:          <button className="stat-btn" onClick={() => setPeople('following')}>
136:            <b>{profile?.counts.following ?? 0}</b> подписок
137:          </button>
138:          <span>⭐ {profile?.counts.reviews ?? 0}</span>
139:          <span>🖼 {photos.length}</span>
140:        </div>
141:      </div>
142:
143:      <div className="me-actions">
144:        <button className="me-action" onClick={() => nav('/')}>
145:          <span className="ma-ico">⭐</span>
146:          Оценить
147:        </button>
148:        <button className="me-action" onClick={() => nav('/')}>
149:          <span className="ma-ico">📷</span>
150:          Добавить фото
151:        </button>
152:        <button className="me-action" onClick={() => setShowAdd(true)}>
153:          <span className="ma-ico">🏪</span>
154:          Добавить бизнес
155:        </button>
156:      </div>
157:
158:      {game && <GameCelebration game={game} />}
159:      {game && <GameProgress game={game} />}
160:
161:      {/* Карта дегустатора: specializations with live tiers (Знаток → Эксперт → Мастер) */}
162:      {specs.some((s) => s.count > 0) && (
163:        <div className="me-section">
164:          <h2 className="me-h">🗺 Карта дегустатора</h2>
165:          <div className="spec-grid">
166:            {specs
167:              .filter((s) => s.count > 0)
168:              .sort((a, b) => b.count - a.count)
169:              .map((s) => (
170:                <div key={s.id} className={'spec-card' + (s.tier ? ' on' : '')}>
171:                  <span className="spec-ico">{s.icon}</span>
172:                  <div className="spec-body">
173:                    <div className="spec-label">{s.tier ? `${s.tier} · ${s.label}` : s.label}</div>
174:                    <div className="spec-meta">
175:                      {s.count} дегустаций
176:                      {s.next != null && ` · ещё ${s.next - s.count} до ${s.tier ? 'следующего звания' : 'звания «Знаток»'}`}
177:                    </div>
178:                  </div>
179:                </div>
180:              ))}

180:              ))}
181:          </div>
182:        </div>
183:      )}
184:
185:      {/* Репутация: как сообщество ценит ваши отзывы */}
186:      {game && ((game.counters.useful ?? 0) > 0 || (game.counters.discoveries ?? 0) > 0 || game.achievements.some((a) => a.earned)) && (
187:        <div className="me-section">
188:          <h2 className="me-h">🏆 Репутация</h2>
189:          <div className="rep-grid">
190:            <div className="rep-item">
191:              <b>{game.counters.useful ?? 0}</b>
192:              <span>раз ваши отзывы отметили «полезно»</span>
193:            </div>
194:            <div className="rep-item">
195:              <b>{game.counters.discoveries ?? 0}</b>
196:              <span>первооткрытий — вы попробовали это первым</span>
197:            </div>
198:            <div className="rep-item">
199:              <b>{game.achievements.filter((a) => a.earned).length}/{game.achievements.length}</b>
200:              <span>достижений собрано</span>
201:            </div>
202:            <div className="rep-item">
203:              <b>{game.counters.streak ?? 0}</b>
204:              <span>дней подряд с дегустациями</span>
205:            </div>
206:          </div>
207:        </div>
208:      )}
209:
210:      {taste && taste.topCategories && taste.topCategories.length > 0 && (
211:        <div className="me-section">
212:          <h2 className="me-h">🎯 Обучение рекомендаций</h2>
213:          <p className="me-hint" style={{ marginTop: -4 }}>
214:            Чем больше вы оцениваете, тем точнее система понимает ваш вкус. Каждый
215:            отзыв — <b>+10%</b> к точности в категории.
216:          </p>
217:          <div className="accuracy-block">
218:            {taste.topCategories.map((c) => {
219:              const acc = Math.min(95, c.count * 10);
220:              return (
221:                <div key={c.name} className="acc-row">
222:                  <span className="acc-name">{c.name}</span>
223:                  <div className="acc-track">
224:                    <div className="acc-fill" style={{ width: `${acc}%` }} />
225:                  </div>
226:                  <span className="acc-val">{acc}%</span>
227:                </div>
228:              );
229:            })}
230:          </div>
231:        </div>
232:      )}
233:
234:      {game && !game.unlocks.find((u) => u.key === 'tasteProfile')?.unlocked ? (
235:        <div className="me-section">
236:          <h2 className="me-h">🔒 Вкусовой профиль</h2>
237:          {(() => {
238:            const u = game.unlocks.find((x) => x.key === 'tasteProfile')!;
239:            return (
240:              <div className="game-unlock">
241:                <span className="game-unlock-ico">🔒</span>
242:                <div style={{ flex: 1 }}>
243:                  <div className="acc-track" style={{ marginTop: 4 }}>
244:                    <div className="acc-fill" style={{ width: `${Math.min(100, (u.have / u.need) * 100)}%` }} />
245:                  </div>
246:                  <div className="game-unlock-sub">
247:                    {Math.min(u.have, u.need)}/{u.need} — оцените первые {u.need} блюд или напитков, и мы покажем: {u.teaser}
248:                  </div>
249:                </div>
250:              </div>
251:            );
252:          })()}
253:        </div>
254:      ) : (
255:      <div
256:        className="me-section"
257:        onPointerDown={(e) => {
258:          // horizontal swipe flips the «О вкусе» tabs (Профиль ⇄ Фото)
259:          const x0 = e.clientX;
260:          const y0 = e.clientY;
261:          let decided = false;
262:          const move = (ev: PointerEvent) => {
263:            const dx = ev.clientX - x0;
264:            const dy = ev.clientY - y0;
265:            if (!decided) {
266:              if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
267:              if (Math.abs(dx) <= Math.abs(dy)) { cleanup(); return; } // vertical → scroll
268:              decided = true;
269:            }
270:          };
271:          const up = (ev: PointerEvent) => {
272:            const dx = ev.clientX - x0;
273:            cleanup();
274:            if (!decided || Math.abs(dx) < 48) return;
275:            setImpactTab(dx < 0 ? 'photos' : 'taste');
276:          };
277:          const cleanup = () => {
278:            document.removeEventListener('pointermove', move);
279:            document.removeEventListener('pointerup', up);
280:            document.removeEventListener('pointercancel', up);
281:          };
282:          document.addEventListener('pointermove', move);
283:          document.addEventListener('pointerup', up);
284:          document.addEventListener('pointercancel', up);
285:        }}
286:      >
287:        <h2 className="me-h">О вкусе</h2>
288:        <div className="impact-tabs">
289:          <button
290:            className={'impact-tab' + (impactTab === 'taste' ? ' active' : '')}
291:            onClick={() => setImpactTab('taste')}
292:          >
293:            Профиль
294:          </button>
295:          <button
296:            className={'impact-tab' + (impactTab === 'photos' ? ' active' : '')}
297:            onClick={() => setImpactTab('photos')}
298:          >
299:            Фото
300:          </button>
301:        </div>
302:
303:        <div key={impactTab} className="impact-pane">
304:        {impactTab === 'taste' ? (
305:          !taste || taste.total === 0 ? (
306:            <>
307:              <p className="me-hint">
308:                Оцените пару блюд или напитков — и здесь появится ваш вкусовой профиль: что любите,
309:                что чаще пробуете, насколько строго оцениваете.
310:              </p>
311:              <button className="btn secondary" onClick={() => nav('/')}>
312:                Поставить первую оценку
313:              </button>
314:            </>
315:          ) : (
316:            <div className="taste-card">
317:              {taste.best && (
318:                <div className="taste-line">
319:                  <span className="taste-key">🥇 Лучшая находка</span>
320:                  <span className="taste-val">{taste.best.name} · {taste.best.rating.toFixed(1)}★</span>
321:                </div>
322:              )}
323:              {taste.favorite && (
324:                <div className="taste-line">
325:                  <span className="taste-key">Чаще всего пробует</span>
326:                  <span className="taste-val">{taste.favorite.name} ({taste.favorite.count})</span>
327:                </div>
328:              )}
329:              {taste.loves && taste.loves.length > 0 && (
330:                <div className="taste-line">
331:                  <span className="taste-key">Любит</span>
332:                  <span className="taste-val">{taste.loves.join(' · ')}</span>
333:                </div>
334:              )}
335:              <div className="taste-line">
336:                <span className="taste-key">Средняя оценка</span>
337:                <span className="taste-val">{taste.avg?.toFixed(1)}★</span>
338:              </div>
339:              <div className="taste-line">
340:                <span className="taste-key">Распробовал категорий</span>
341:                <span className="taste-val">{taste.categoriesTried}</span>
342:              </div>
343:              {/* per-category breakdown lives in its own «Оценки по категориям» section */}
344:            </div>
345:          )
346:        ) : photos.length === 0 ? (
347:          <p className="me-hint">Пока нет фото. Прикрепите фото к отзыву.</p>
348:        ) : (
349:          <div className="me-photo-grid">
350:            {photos.map((u) => (
351:              <img key={u} src={u} alt="" />
352:            ))}
353:          </div>
354:        )}
355:        </div>
356:      </div>
357:
358:      )}
359:
360:      {reviews.length > 0 && (
361:        <div className="me-section">
362:          <h2 className="me-h">Оценки по категориям</h2>
363:          <CategoryAverages reviews={reviews} />
364:        </div>
365:      )}
366:
367:      {recent.length > 0 && (
368:        <div className="me-section">
369:          <h2 className="me-h">Недавно смотрели</h2>
370:          {recent.map((l) => (
371:            <button key={l.id} className="recent-row" onClick={() => setOpenListing(l.id)}>
372:              <VenuePhoto listing={l} className="recent-img" />
373:              <div style={{ flex: 1, textAlign: 'left' }}>
374:                <div className="name">{l.name}</div>
375:                {l.address && <div className="meta">{l.address}</div>}
376:              </div>
377:            </button>
378:          ))}
379:        </div>
380:      )}

380:      )}
381:
382:      <div className="me-section">
383:        <h2 className="me-h">Вклад</h2>
384:        <div className="contrib-row">
385:          <span>⭐ Отзывы</span>
386:          <b>{reviews.length}</b>
387:        </div>
388:        <button className="contrib-row link" onClick={() => nav('/business')}>
389:          <span>🏪 Добавленные заведения</span>
390:          <b>{owned.length}</b>
391:        </button>
392:      </div>
393:
394:      {/* «Подписки» скрыты пока — вернём, когда будем парсить обновления заведений */}
395:
396:      <div className="me-section">
397:        <h2 className="me-h">Ещё</h2>
398:        <button className="contrib-row link" onClick={() => nav('/business')}>
399:          <span>💼 Бизнес-кабинет</span>
400:          <span className="chev">›</span>
401:        </button>
402:        <button className="contrib-row link" onClick={() => nav('/favorites?from=profile')}>
403:          <span>🔖 Хочу попробовать</span>
404:          <span className="chev">›</span>
405:        </button>
406:        <button
407:          className="contrib-row link"
408:          onClick={() => {
409:            localStorage.setItem('force_quiz', '1');
410:            window.location.reload();
411:          }}
412:        >
413:          <span>🎯 Изменить вкусы</span>
414:          <span className="chev">›</span>
415:        </button>
416:        <button className="contrib-row link" onClick={() => setShowSupport(true)}>
417:          <span>🛟 Поддержка</span>
418:          <span className="chev">›</span>
419:        </button>
420:        {/* setting: skip auto-creating a story when you rate */}
421:        <button
422:          className="contrib-row link"
423:          onClick={() => {
424:            const v = !noStory;
425:            setNoStory(v);
426:            localStorage.setItem('noStoryOnReview', v ? '1' : '0');
427:          }}
428:        >
429:          <span>🎬 Не выставлять оценки в сторис</span>
430:          <span className={'toggle' + (noStory ? ' on' : '')}>{noStory ? 'Вкл' : 'Выкл'}</span>
431:        </button>
432:      </div>
433:
434:      {/* your reviews — same layout as another user's profile (Untappd style) */}
435:      {reviews.length === 0 ? (
436:        <div className="me-section">
437:          <h2 className="me-h">Мои отзывы</h2>
438:          <div className="empty">
439:            Вы ещё не оставили отзывов.
440:            <br />
441:            Оцените что-нибудь на главной или в свайпе!
442:          </div>
443:        </div>
444:      ) : (
445:        (() => {
446:          const withPhoto = reviews.filter((r) => r.photoUrls?.[0] || r.listing?.photoUrl);
447:          return (
448:            <>
449:              {withPhoto.length > 0 && (
450:                <div className="me-section">
451:                  <h2 className="me-h">Оценки</h2>
452:                  <div className="rc-carousel">
453:                    {withPhoto.map((r) => (
454:                      <button key={r.id} onClick={() => setPhotoReview(withMe(r))}>
455:                        <img src={(r.photoUrls?.[0] || r.listing?.photoUrl) as string} alt="" />
456:                      </button>
457:                    ))}
458:                  </div>
459:                </div>
460:              )}
461:              <div className="me-section">
462:                <h2 className="me-h">Мои отзывы</h2>
463:                {reviews.map((r) => (
464:                  <ReviewCard
465:                    key={r.id}
466:                    review={withMe(r)}
467:                    onOpen={() => setPhotoReview(withMe(r))}
468:                    onOpenUser={(id) => setOpenUser(id)}
469:                    onOpenVenue={() => r.venue?.id && setOpenListing(r.venue.id)}
470:                  >
471:                    {r.status === 'PENDING' && (
472:                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>На модерации</span>
473:                    )}
474:                  </ReviewCard>
475:                ))}
476:              </div>
477:            </>
478:          );
479:        })()
480:      )}
481:
482:      {showAdd && <AddBusiness onClose={() => setShowAdd(false)} />}
483:      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
484:      {people && profile?.user && (
485:        <PeopleModal
486:          userId={profile.user.id}
487:          initialTab={people}
488:          onClose={() => setPeople(null)}
489:          onOpenUser={(id) => {
490:            setPeople(null);
491:            setOpenUser(id);
492:          }}
493:        />
494:      )}
495:      {openUser && <UserProfileModal id={openUser} onClose={() => setOpenUser(null)} />}
496:      {openListing && (
497:        <ListingDetailModal id={openListing} onClose={() => setOpenListing(null)} />
498:      )}
499:      {photoReview && (
500:        <PhotoPostModal
501:          review={photoReview}
502:          onClose={() => setPhotoReview(null)}
503:          onOpenUser={(id) => { setPhotoReview(null); setOpenUser(id); }}
504:          onOpenListing={() => {
505:            const lid = photoReview.listing?.id;
506:            setPhotoReview(null);
507:            if (lid) setOpenListing(lid);
508:          }}
509:          onOpenVenue={() => {
510:            const vid = photoReview.venue?.id;
511:            setPhotoReview(null);
512:            if (vid) setOpenListing(vid);
513:          }}
514:          onEdit={() => { const r = photoReview; setPhotoReview(null); setEdit(r); }}
515:          onDelete={() => {
516:            const id = photoReview.id;
517:            setPhotoReview(null);
518:            if (confirm('Удалить отзыв?')) api.deleteReview(id).then(load).catch(() => {});
519:          }}
520:        />
521:      )}
522:
523:      {edit && edit.listing && (
524:        <ReviewForm
525:          listing={edit.listing}
526:          existing={edit}
527:          onClose={() => setEdit(null)}
528:          onSaved={() => {
529:            setEdit(null);
530:            load();
531:          }}
532:        />
533:      )}
534:    </div>
535:  );
536:}


exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "useEscClose|useSwipeBack|useSwipeDismiss|modal-backdrop|userprofile|onClose|onClick|role=|aria-|autoFocus|loading|error|catch|setId|setOpen" frontend/src/components/People.tsx frontend/src/components/PhotoPostModal.tsx frontend/src/components/Filters.tsx' in D:\Приложения\Yelp
 succeeded in 263ms:
frontend/src/components/PhotoPostModal.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src/components/PhotoPostModal.tsx:4:import { useSwipeDismiss } from '../swipeDismiss';
frontend/src/components/PhotoPostModal.tsx:21:  onClose,
frontend/src/components/PhotoPostModal.tsx:29:  onClose: () => void;
frontend/src/components/PhotoPostModal.tsx:56:    setTimeout(onClose, 220);
frontend/src/components/PhotoPostModal.tsx:58:  useEscClose(reqClose);
frontend/src/components/PhotoPostModal.tsx:62:  useSwipeDismiss(sheetRef, onClose);
frontend/src/components/PhotoPostModal.tsx:65:    api.comments(review.id).then(setComments).catch(() => {});
frontend/src/components/PhotoPostModal.tsx:66:    api.voteState(review.id).then(setVote).catch(() => {});
frontend/src/components/PhotoPostModal.tsx:70:  const doVote = (t: VoteType) => api.vote(review.id, t).then(setVote).catch(() => {});
frontend/src/components/PhotoPostModal.tsx:79:    } catch (e: any) {
frontend/src/components/PhotoPostModal.tsx:97:    navigator.clipboard?.writeText(shareLink).then(() => showToast('Ссылка скопирована')).catch(() => showToast('Не удалось'));
frontend/src/components/PhotoPostModal.tsx:105:    <div className="modal-backdrop photo-post-backdrop" style={{ zIndex: 3400 }} onClick={reqClose}>
frontend/src/components/PhotoPostModal.tsx:106:      <div ref={sheetRef} className={'photo-post' + (closing ? ' closing' : '')} onClick={(e) => e.stopPropagation()}>
frontend/src/components/PhotoPostModal.tsx:107:        <button className="pp-dots" onClick={() => setMenu(true)} aria-label="Ещё">⋯</button>
frontend/src/components/PhotoPostModal.tsx:108:        <button className="pp-close" onClick={reqClose} aria-label="Закрыть">✕</button>
frontend/src/components/PhotoPostModal.tsx:116:          <button type="button" className="pp-head" onClick={() => u?.id && onOpenUser?.(u.id)}>
frontend/src/components/PhotoPostModal.tsx:127:                  onClick={(e) => { e.stopPropagation(); onOpenVenue?.(); }}
frontend/src/components/PhotoPostModal.tsx:138:          <button type="button" className="pp-card-main" onClick={onOpenListing}>
frontend/src/components/PhotoPostModal.tsx:147:                  onClick={(e) => { e.stopPropagation(); onOpenVenue?.(); }}
frontend/src/components/PhotoPostModal.tsx:172:                onClick={() => doVote(t)}
frontend/src/components/PhotoPostModal.tsx:181:            <button type="button" className="pp-location" onClick={onOpenVenue}>
frontend/src/components/PhotoPostModal.tsx:201:                    onClick={() => c.user?.id && onOpenUser?.(c.user.id)}
frontend/src/components/PhotoPostModal.tsx:225:            <button className="pp-send" disabled={busy || !text.trim()} onClick={send} aria-label="Отправить">
frontend/src/components/PhotoPostModal.tsx:234:        <div className="pp-sheet-back" onClick={(e) => { e.stopPropagation(); setMenu(false); }}>
frontend/src/components/PhotoPostModal.tsx:235:          <div className="pp-sheet" onClick={(e) => e.stopPropagation()}>
frontend/src/components/PhotoPostModal.tsx:237:              <button className="pp-sheet-item" onClick={() => { setMenu(false); onEdit(); }}>Изменить</button>
frontend/src/components/PhotoPostModal.tsx:239:            <button className="pp-sheet-item" onClick={sendToFriend}>Отправить другу</button>
frontend/src/components/PhotoPostModal.tsx:240:            {photo && <button className="pp-sheet-item" onClick={sharePhoto}>Поделиться фото</button>}
frontend/src/components/PhotoPostModal.tsx:241:            <button className="pp-sheet-item" onClick={copyLink}>Поделиться ссылкой</button>
frontend/src/components/PhotoPostModal.tsx:243:              <button className="pp-sheet-item danger" onClick={() => { setMenu(false); onDelete(); }}>Удалить</button>
frontend/src/components/PhotoPostModal.tsx:245:            <button className="pp-sheet-item cancel" onClick={() => setMenu(false)}>Отмена</button>
frontend/src/components/People.tsx:3:import { useEscClose } from '../modalEsc';
frontend/src/components/People.tsx:4:import { useSwipeDismiss } from '../swipeDismiss';
frontend/src/components/People.tsx:5:import { useSwipeBack } from '../swipeBack';
frontend/src/components/People.tsx:13:  return <SmartImg className="pu-avatar" src={user.photoUrl} width={200} loading="eager" monogram={user.firstName} />;
frontend/src/components/People.tsx:27:      .catch(() => setFollowing(!next))
frontend/src/components/People.tsx:31:    <button className={'follow-btn' + (following ? ' on' : '')} onClick={toggle} disabled={busy}>
frontend/src/components/People.tsx:39:    <div className="pu-row" onClick={() => onOpen(u.id)}>
frontend/src/components/People.tsx:55:  onClose,
frontend/src/components/People.tsx:60:  onClose: () => void;
frontend/src/components/People.tsx:70:    api.userFollowers(userId).then(setFollowers).catch(() => {});
frontend/src/components/People.tsx:71:    api.userFollowing(userId).then(setFollowing).catch(() => {});
frontend/src/components/People.tsx:81:      api.searchUsers(q).then(setResults).catch(() => {});
frontend/src/components/People.tsx:89:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src/components/People.tsx:90:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src/components/People.tsx:104:              onClick={() => setTab('followers')}
frontend/src/components/People.tsx:110:              onClick={() => setTab('following')}
frontend/src/components/People.tsx:127:        <button className="btn secondary" style={{ marginTop: 12 }} onClick={onClose}>
frontend/src/components/People.tsx:135:export function UserProfileModal({ id, onClose }: { id: string; onClose: () => void }) {
frontend/src/components/People.tsx:137:  const [openListing, setOpenListing] = useState<string | null>(null);
frontend/src/components/People.tsx:142:    api.userProfile(id).then(setP).catch(() => {});
frontend/src/components/People.tsx:146:    setTimeout(onClose, 240);
frontend/src/components/People.tsx:148:  useEscClose(requestClose);
frontend/src/components/People.tsx:151:  useSwipeDismiss(pageRef, onClose, { fadeBackdrop: false });
frontend/src/components/People.tsx:152:  useSwipeBack(pageRef, onClose); // edge swipe → back, like iOS navigation
frontend/src/components/People.tsx:155:    <div ref={pageRef} className={'userprofile' + (closing ? ' closing' : '')}>
frontend/src/components/People.tsx:157:        <button className="back-btn" onClick={requestClose}>
frontend/src/components/People.tsx:172:              <button className="stat-btn" onClick={() => setPeople('followers')}>
frontend/src/components/People.tsx:175:              <button className="stat-btn" onClick={() => setPeople('following')}>
frontend/src/components/People.tsx:239:                        <button key={r.id} onClick={() => open(r)}>
frontend/src/components/People.tsx:294:                      onOpenVenue={() => r.venue?.id && setOpenListing(r.venue.id)}
frontend/src/components/People.tsx:304:        <ListingDetailModal id={openListing} onClose={() => setOpenListing(null)} />
frontend/src/components/People.tsx:310:          onClose={() => setPeople(null)}
frontend/src/components/People.tsx:317:          onClose={() => setPhotoReview(null)}
frontend/src/components/People.tsx:322:            if (lid) setOpenListing(lid);
frontend/src/components/People.tsx:327:            if (vid) setOpenListing(vid);
frontend/src/components/Filters.tsx:2:import { useEscClose } from '../modalEsc';
frontend/src/components/Filters.tsx:71:  const [open, setOpen] = useState<DropKey | null>(null);
frontend/src/components/Filters.tsx:72:  const toggle = (k: DropKey) => setOpen((o) => (o === k ? null : k));
frontend/src/components/Filters.tsx:75:    setOpen(null);
frontend/src/components/Filters.tsx:85:          <button className="fbtn-icon" onClick={() => setSheet(true)} aria-label="Все фильтры">
frontend/src/components/Filters.tsx:91:          onClick={() => toggle('sort')}
frontend/src/components/Filters.tsx:99:              onClick={() => onChange({ openNow: !state.openNow })}
frontend/src/components/Filters.tsx:105:              onClick={() => toggle('price')}
frontend/src/components/Filters.tsx:111:              onClick={() => toggle('cuisine')}
frontend/src/components/Filters.tsx:121:          <div className="fdrop-backdrop" onClick={() => setOpen(null)} />
frontend/src/components/Filters.tsx:128:                  onClick={() => pick({ sort: s.value })}
frontend/src/components/Filters.tsx:138:                  onClick={() => pick({ price: p.value })}
frontend/src/components/Filters.tsx:148:                  onClick={() => pick({ cuisine: c.value })}
frontend/src/components/Filters.tsx:164:          onClose={() => setSheet(false)}
frontend/src/components/Filters.tsx:174:  onClose,
frontend/src/components/Filters.tsx:178:  onClose: () => void;
frontend/src/components/Filters.tsx:184:  useEscClose(onClose);
frontend/src/components/Filters.tsx:187:    <div className="modal-backdrop" style={{ zIndex: 80 }} onClick={onClose}>
frontend/src/components/Filters.tsx:188:      <div className="modal filters-modal" onClick={(e) => e.stopPropagation()}>
frontend/src/components/Filters.tsx:190:          <button className="link-btn" onClick={onClose}>Закрыть</button>
frontend/src/components/Filters.tsx:192:          <button className="link-btn" onClick={() => setDraft(DEFAULTS)}>Сбросить</button>
frontend/src/components/Filters.tsx:202:              onClick={() => set({ price: p.value })}
frontend/src/components/Filters.tsx:234:              onClick={() => set({ cuisine: c.value })}
frontend/src/components/Filters.tsx:243:          <button className="btn" onClick={() => onApply(draft)}>

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/components/People.tsx'; "'$c=Get-Content -Encoding utf8 $f; for($i=1;$i -le 180;$i++){"$i`:$($c[$i-1])"}; $f='"'frontend/src/components/PhotoPostModal.tsx';"'$c=Get-Content -Encoding utf8 $f; for($i=1;$i -le 252;$i++){"$i`:$($c[$i-1])"}' in D:\Приложения\Yelp
 succeeded in 807ms:
1:import { useEffect, useState, useRef} from 'react';
2:import { api } from '../api';
3:import { useEscClose } from '../modalEsc';
4:import { useSwipeDismiss } from '../swipeDismiss';
5:import { useSwipeBack } from '../swipeBack';
6:import { ListingDetailModal } from './ListingDetail';
7:import { PhotoPostModal } from './PhotoPostModal';
8:import { ReviewCard, CategoryAverages } from './ReviewCard';
9:import { SmartImg } from './SmartImg';
10:import type { PublicProfile, PublicUser, Review } from '../types';
11:
12:function Avatar({ user }: { user: { photoUrl?: string | null; firstName?: string | null } }) {
13:  return <SmartImg className="pu-avatar" src={user.photoUrl} width={200} loading="eager" monogram={user.firstName} />;
14:}
15:
16:function FollowBtn({ u, onChange }: { u: PublicUser; onChange: (following: boolean) => void }) {
17:  const [following, setFollowing] = useState(u.isFollowing);
18:  const [busy, setBusy] = useState(false);
19:  if (u.isMe) return null;
20:  const toggle = (e: React.MouseEvent) => {
21:    e.stopPropagation();
22:    setBusy(true);
23:    const next = !following;
24:    setFollowing(next);
25:    (next ? api.followUser(u.id) : api.unfollowUser(u.id))
26:      .then(() => onChange(next))
27:      .catch(() => setFollowing(!next))
28:      .finally(() => setBusy(false));
29:  };
30:  return (
31:    <button className={'follow-btn' + (following ? ' on' : '')} onClick={toggle} disabled={busy}>
32:      {following ? 'Вы подписаны' : 'Подписаться'}
33:    </button>
34:  );
35:}
36:
37:function UserRow({ u, onOpen }: { u: PublicUser; onOpen: (id: string) => void }) {
38:  return (
39:    <div className="pu-row" onClick={() => onOpen(u.id)}>
40:      <Avatar user={u} />
41:      <div style={{ flex: 1 }}>
42:        <div className="pu-name">{u.firstName ?? u.username ?? 'Гость'}</div>
43:        <div className="pu-meta">
44:          {u.reviews} отзывов · {u.followers} подписчиков
45:        </div>
46:      </div>
47:      <FollowBtn u={u} onChange={() => {}} />
48:    </div>
49:  );
50:}
51:
52:export function PeopleModal({
53:  userId,
54:  initialTab,
55:  onClose,
56:  onOpenUser,
57:}: {
58:  userId: string;
59:  initialTab: 'followers' | 'following';
60:  onClose: () => void;
61:  onOpenUser: (id: string) => void;
62:}) {
63:  const [tab, setTab] = useState<'followers' | 'following'>(initialTab);
64:  const [followers, setFollowers] = useState<PublicUser[]>([]);
65:  const [following, setFollowing] = useState<PublicUser[]>([]);
66:  const [query, setQuery] = useState('');
67:  const [results, setResults] = useState<PublicUser[] | null>(null);
68:
69:  useEffect(() => {
70:    api.userFollowers(userId).then(setFollowers).catch(() => {});
71:    api.userFollowing(userId).then(setFollowing).catch(() => {});
72:  }, [userId]);
73:
74:  useEffect(() => {
75:    const q = query.trim();
76:    if (!q) {
77:      setResults(null);
78:      return;
79:    }
80:    const t = setTimeout(() => {
81:      api.searchUsers(q).then(setResults).catch(() => {});
82:    }, 250);
83:    return () => clearTimeout(t);
84:  }, [query]);
85:
86:  const list = results ?? (tab === 'followers' ? followers : following);
87:
88:  return (
89:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
90:      <div className="modal" onClick={(e) => e.stopPropagation()}>
91:        <div className="pu-search">
92:          <span className="search-ico">🔍</span>
93:          <input
94:            placeholder="Найти людей…"
95:            value={query}
96:            onChange={(e) => setQuery(e.target.value)}
97:          />
98:        </div>
99:
100:        {!results && (
101:          <div className="tabbar" style={{ position: 'static' }}>
102:            <button
103:              className={'tab' + (tab === 'followers' ? ' active' : '')}
104:              onClick={() => setTab('followers')}
105:            >
106:              Подписчики ({followers.length})
107:            </button>
108:            <button
109:              className={'tab' + (tab === 'following' ? ' active' : '')}
110:              onClick={() => setTab('following')}
111:            >
112:              Подписки ({following.length})
113:            </button>
114:          </div>
115:        )}
116:
117:        <div className="pu-list">
118:          {list.length === 0 ? (
119:            <div className="meta" style={{ color: 'var(--hint)', padding: '12px 2px' }}>
120:              {results ? 'Никого не найдено' : 'Пока пусто'}
121:            </div>
122:          ) : (
123:            list.map((u) => <UserRow key={u.id} u={u} onOpen={onOpenUser} />)
124:          )}
125:        </div>
126:
127:        <button className="btn secondary" style={{ marginTop: 12 }} onClick={onClose}>
128:          Закрыть
129:        </button>
130:      </div>
131:    </div>
132:  );
133:}
134:
135:export function UserProfileModal({ id, onClose }: { id: string; onClose: () => void }) {
136:  const [p, setP] = useState<PublicProfile | null>(null);
137:  const [openListing, setOpenListing] = useState<string | null>(null);
138:  const [photoReview, setPhotoReview] = useState<Review | null>(null); // Instagram-style photo view
139:  const [people, setPeople] = useState<'followers' | 'following' | null>(null);
140:  const [closing, setClosing] = useState(false);
141:  useEffect(() => {
142:    api.userProfile(id).then(setP).catch(() => {});
143:  }, [id]);
144:  const requestClose = () => {
145:    setClosing(true);
146:    setTimeout(onClose, 240);
147:  };
148:  useEscClose(requestClose);
149:  // swipe-down from the top closes the profile page too (app-wide pattern)
150:  const pageRef = useRef<HTMLDivElement>(null);
151:  useSwipeDismiss(pageRef, onClose, { fadeBackdrop: false });
152:  useSwipeBack(pageRef, onClose); // edge swipe → back, like iOS navigation
153:
154:  return (
155:    <div ref={pageRef} className={'userprofile' + (closing ? ' closing' : '')}>
156:      <div className="up-top">
157:        <button className="back-btn" onClick={requestClose}>
158:          ←
159:        </button>
160:      </div>
161:      {!p ? (
162:        <div style={{ padding: 16 }}>Загрузка…</div>
163:      ) : (
164:        <>
165:          <div className="me-head">
166:            <Avatar user={p} />
167:            <div className="me-name">{p.firstName ?? p.username ?? 'Гость'}</div>
168:            {(p as any).level && (
169:              <div className="up-level">{(p as any).level.icon} {(p as any).level.title}</div>
170:            )}
171:            <div className="me-stats">
172:              <button className="stat-btn" onClick={() => setPeople('followers')}>
173:                <b>{p.followers}</b> подписчиков
174:              </button>
175:              <button className="stat-btn" onClick={() => setPeople('following')}>
176:                <b>{p.following}</b> подписок
177:              </button>
178:              <span>⭐ {p.reviews}</span>
179:            </div>
180:            {!p.isMe && (
1:import { useEffect, useRef, useState } from 'react';
2:import { api } from '../api';
3:import { useEscClose } from '../modalEsc';
4:import { useSwipeDismiss } from '../swipeDismiss';
5:import { tg, openExternal } from '../telegram';
6:import type { Comment, Review, VoteState, VoteType } from '../types';
7:import { Stars } from './Stars';
8:import { thumb } from '../img';
9:
10:const VOTE_LABEL: Record<VoteType, string> = {
11:  USEFUL: '👍 Полезно',
12:  FUNNY: '😄 Смешно',
13:  COOL: '😎 Круто',
14:  OHNO: '🙀 О нет',
15:};
16:
17:// Full "Check-in Detail" view of a single photo review (our red/black/white style):
18:// hero photo + author, item card, date, reactions, LOCATION, comments.
19:export function PhotoPostModal({
20:  review,
21:  onClose,
22:  onOpenUser,
23:  onOpenListing,
24:  onOpenVenue,
25:  onEdit,
26:  onDelete,
27:}: {
28:  review: Review;
29:  onClose: () => void;
30:  onOpenUser?: (userId: string) => void;
31:  onOpenListing?: () => void;
32:  onOpenVenue?: () => void;
33:  onEdit?: () => void;
34:  onDelete?: () => void;
35:}) {
36:  const photo = review.photoUrls?.[0] || review.listing?.photoUrl || undefined;
37:  const u = review.user;
38:  const initial = (u?.firstName ?? u?.username ?? '?').trim()[0]?.toUpperCase() ?? '?';
39:  const [closing, setClosing] = useState(false);
40:  // dead photo URL → hide the media instead of showing a broken-image icon
41:  const [photoBroken, setPhotoBroken] = useState(false);
42:  const [thumbBroken, setThumbBroken] = useState(false);
43:  const [menu, setMenu] = useState(false);
44:  const [toast, setToast] = useState('');
45:  const [vote, setVote] = useState<VoteState>({
46:    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
47:    mine: [],
48:  });
49:  const [comments, setComments] = useState<Comment[]>([]);
50:  const [text, setText] = useState('');
51:  const [busy, setBusy] = useState(false);
52:  const [err, setErr] = useState('');
53:
54:  const reqClose = () => {
55:    setClosing(true);
56:    setTimeout(onClose, 220);
57:  };
58:  useEscClose(reqClose);
59:
60:  // swipe-down anywhere (from the scroll top) dismisses — shared app-wide pattern
61:  const sheetRef = useRef<HTMLDivElement>(null);
62:  useSwipeDismiss(sheetRef, onClose);
63:
64:  useEffect(() => {
65:    api.comments(review.id).then(setComments).catch(() => {});
66:    api.voteState(review.id).then(setVote).catch(() => {});
67:    // eslint-disable-next-line react-hooks/exhaustive-deps
68:  }, [review.id]);
69:
70:  const doVote = (t: VoteType) => api.vote(review.id, t).then(setVote).catch(() => {});
71:  const send = async () => {
72:    if (!text.trim()) return;
73:    setBusy(true);
74:    setErr('');
75:    try {
76:      const c = await api.addComment(review.id, text.trim());
77:      if (c) setComments((p) => [...p, c]);
78:      setText('');
79:    } catch (e: any) {
80:      setErr(e?.message?.trim() || 'Не удалось отправить');
81:    }
82:    setBusy(false);
83:  };
84:
85:  const shareLink = `https://t.me/togomoscow_bot?startapp=l_${review.listing?.id ?? ''}`;
86:  const shareText = `${review.listing?.name ?? ''} — ${review.rating.toFixed(1)}★`;
87:  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1600); };
88:  const sendToFriend = () => {
89:    setMenu(false);
90:    const url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`;
91:    if ((tg as any)?.openTelegramLink) (tg as any).openTelegramLink(url);
92:    else openExternal(url);
93:  };
94:  const sharePhoto = () => { setMenu(false); if (photo) openExternal(photo); };
95:  const copyLink = () => {
96:    setMenu(false);
97:    navigator.clipboard?.writeText(shareLink).then(() => showToast('Ссылка скопирована')).catch(() => showToast('Не удалось'));
98:  };
99:
100:  const dateStr = (review as any).createdAt
101:    ? new Date((review as any).createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
102:    : '';
103:
104:  return (
105:    <div className="modal-backdrop photo-post-backdrop" style={{ zIndex: 3400 }} onClick={reqClose}>
106:      <div ref={sheetRef} className={'photo-post' + (closing ? ' closing' : '')} onClick={(e) => e.stopPropagation()}>
107:        <button className="pp-dots" onClick={() => setMenu(true)} aria-label="Ещё">⋯</button>
108:        <button className="pp-close" onClick={reqClose} aria-label="Закрыть">✕</button>
109:
110:        {/* HERO: full (uncropped) photo with the author + place overlaid on top */}
111:        <div className="pp-hero">
112:          {/* SAME 600px asset the list card already loaded → appears instantly from
113:              the browser cache (900px was a different file = a visible re-fetch) */}
114:          {photo && !photoBroken && <div className="ph-blur" style={{ backgroundImage: `url("${thumb(photo, 200)}")` }} />}
115:          {photo && !photoBroken && <img className="pp-photo" src={thumb(photo, 600)} alt="" onError={() => setPhotoBroken(true)} />}
116:          <button type="button" className="pp-head" onClick={() => u?.id && onOpenUser?.(u.id)}>
117:            {u?.photoUrl ? (
118:              <img className="pp-avatar" src={u.photoUrl} alt="" />
119:            ) : (
120:              <div className="pp-avatar ph">{initial}</div>
121:            )}
122:            <div className="pp-head-txt">
123:              <b>{u?.firstName ?? u?.username ?? 'Гость'}</b>
124:              {review.venue && (
125:                <span
126:                  className="pp-head-venue"
127:                  onClick={(e) => { e.stopPropagation(); onOpenVenue?.(); }}
128:                >
129:                  {review.venue.name} ›
130:                </span>
131:              )}
132:            </div>
133:          </button>
134:        </div>
135:
136:        {/* item card: thumb + name + place + style, then rating and caption */}
137:        <div className="pp-card">
138:          <button type="button" className="pp-card-main" onClick={onOpenListing}>
139:            {review.listing?.photoUrl && !thumbBroken && (
140:              <img className="pp-card-thumb" src={thumb(review.listing.photoUrl, 200)} alt="" onError={() => setThumbBroken(true)} />
141:            )}
142:            <div className="pp-card-info">
143:              <b className="pp-card-name">{review.listing?.name}</b>
144:              {review.venue && (
145:                <span
146:                  className="pp-card-sub"
147:                  onClick={(e) => { e.stopPropagation(); onOpenVenue?.(); }}
148:                >
149:                  {review.venue.name}
150:                </span>
151:              )}
152:              {review.listing?.category && !/^(блюдо|напиток)$/i.test(review.listing.category) && (
153:                <span className="pp-card-style">{review.listing.category}</span>
154:              )}
155:            </div>
156:          </button>
157:          <div className="pp-card-rating">
158:            <Stars value={review.rating} />
159:            <span className="pp-card-score">{review.rating.toFixed(2)}</span>
160:          </div>
161:          {review.text && <div className="pp-card-text">{review.text}</div>}
162:        </div>
163:
164:        <div className="pp-body">
165:          {dateStr && <div className="pp-date">{dateStr}</div>}
166:
167:          <div className="pp-votes">
168:            {(['USEFUL', 'FUNNY', 'COOL', 'OHNO'] as VoteType[]).map((t) => (
169:              <button
170:                key={t}
171:                className={'pp-vote' + (vote.mine.includes(t) ? ' active' : '')}
172:                onClick={() => doVote(t)}
173:              >
174:                {VOTE_LABEL[t]}
175:                {vote.counts[t] ? ` ${vote.counts[t]}` : ''}
176:              </button>
177:            ))}
178:          </div>
179:
180:          {review.venue && (
181:            <button type="button" className="pp-location" onClick={onOpenVenue}>
182:              <div className="pp-loc-head">МЕСТО</div>
183:              <div className="pp-loc-row">
184:                <span className="pp-loc-ico">📍</span>
185:                <b>{review.venue.name}</b>
186:                <span className="pp-loc-chev">›</span>
187:              </div>
188:            </button>
189:          )}
190:
191:          <div className="pp-comments">
192:            <div className="pp-comments-title">Комментарии</div>
193:            {comments.length === 0 ? (
194:              <div className="pp-empty">Пока нет комментариев. Будьте первым!</div>
195:            ) : (
196:              comments.map((c) => (
197:                <div key={c.id} className="pp-cmt">
198:                  <button
199:                    type="button"
200:                    className="pp-cmt-av"
201:                    onClick={() => c.user?.id && onOpenUser?.(c.user.id)}
202:                  >
203:                    {c.user?.photoUrl ? (
204:                      <img src={c.user.photoUrl} alt="" />
205:                    ) : (
206:                      <span className="ph">{(c.user?.firstName ?? '?')[0]?.toUpperCase() ?? '?'}</span>
207:                    )}
208:                  </button>
209:                  <div className="pp-cmt-body">
210:                    <b>{c.user?.firstName ?? c.user?.username ?? 'Гость'}</b> {c.text}
211:                  </div>
212:                </div>
213:              ))
214:            )}
215:          </div>
216:
217:          {err && <div className="pp-err">{err}</div>}
218:          <div className="pp-form">
219:            <input
220:              placeholder="Добавить комментарий…"
221:              value={text}
222:              onChange={(e) => setText(e.target.value)}
223:              onKeyDown={(e) => e.key === 'Enter' && send()}
224:            />
225:            <button className="pp-send" disabled={busy || !text.trim()} onClick={send} aria-label="Отправить">
226:              ➤
227:            </button>
228:          </div>
229:        </div>
230:      </div>
231:
232:      {/* action sheet from the ⋯ button */}
233:      {menu && (
234:        <div className="pp-sheet-back" onClick={(e) => { e.stopPropagation(); setMenu(false); }}>
235:          <div className="pp-sheet" onClick={(e) => e.stopPropagation()}>
236:            {onEdit && (
237:              <button className="pp-sheet-item" onClick={() => { setMenu(false); onEdit(); }}>Изменить</button>
238:            )}
239:            <button className="pp-sheet-item" onClick={sendToFriend}>Отправить другу</button>
240:            {photo && <button className="pp-sheet-item" onClick={sharePhoto}>Поделиться фото</button>}
241:            <button className="pp-sheet-item" onClick={copyLink}>Поделиться ссылкой</button>
242:            {onDelete && (
243:              <button className="pp-sheet-item danger" onClick={() => { setMenu(false); onDelete(); }}>Удалить</button>
244:            )}
245:            <button className="pp-sheet-item cancel" onClick={() => setMenu(false)}>Отмена</button>
246:          </div>
247:        </div>
248:      )}
249:      {toast && <div className="pp-toast">{toast}</div>}
250:    </div>
251:  );
252:}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem frontend/dist/assets -File | Sort-Object Length -Descending | Select-Object Name,@{N='KB';E={[math]::Round("'$_.Length/1KB,1)}} | Format-Table -AutoSize; rg -n "from '"'leaflet|import\\('leaflet|MapBrowse|ListingDetail\" frontend/src/components frontend/src/screens frontend/src/main.tsx" in D:\Приложения\Yelp
 succeeded in 852ms:

Name                       KB
----                       --
index-Dnm7uTdG.js       593,8
index-275ae6-W.css       94,6
Business-CW569ehy.js       22
MyRatings-xbNLS9al.js    17,7
MapBrowse-C1fD-6jD.js     5,8
AddBusiness-B5tZ10lw.js   4,8
Alerts-38v8p1Jb.js        2,5
Favorites-BbqCrSYL.js     1,4


frontend/src/screens\MyRatings.tsx:6:import { ListingDetailModal } from '../components/ListingDetail';
frontend/src/screens\MyRatings.tsx:497:        <ListingDetailModal id={openListing} onClose={() => setOpenListing(null)} />
frontend/src/screens\Favorites.tsx:5:import { ListingDetailModal } from '../components/ListingDetail';
frontend/src/screens\Favorites.tsx:72:        <ListingDetailModal id={active.id} onClose={() => setActive(null)} />
frontend/src/screens\MapScreen.tsx:4:import { ListingDetailModal } from '../components/ListingDetail';
frontend/src/screens\MapScreen.tsx:22:      {sel && <ListingDetailModal id={sel} onClose={() => setSel(null)} />}
frontend/src/screens\Business.tsx:4:import { ListingDetailModal } from '../components/ListingDetail';
frontend/src/screens\Business.tsx:532:        <ListingDetailModal id={openListing} onClose={() => setOpenListing(null)} />
frontend/src/screens\Home.tsx:13:const ListingDetailModal = lazy(() => import('../components/ListingDetail').then((m) => ({ default: m.ListingDetailModal })));
frontend/src/screens\Home.tsx:15:import type { BrowseCat } from '../components/MapBrowse';
frontend/src/screens\Home.tsx:16:const MapBrowse = lazy(() => import('../components/MapBrowse').then((m) => ({ default: m.MapBrowse })));
frontend/src/screens\Home.tsx:939:        <MapBrowse
frontend/src/screens\Home.tsx:993:        <ListingDetailModal
frontend/src/screens\Home.tsx:1011:        <ListingDetailModal
frontend/src/screens\Alerts.tsx:5:const ListingDetailModal = lazy(() => import('../components/ListingDetail').then((m) => ({ default: m.ListingDetailModal })));
frontend/src/screens\Alerts.tsx:95:          <ListingDetailModal id={openListingId} onClose={() => setOpenListingId(null)} />
frontend/src/components\GroupModal.tsx:6:import { ListingDetailModal } from './ListingDetail';
frontend/src/components\GroupModal.tsx:100:      {sel && <ListingDetailModal id={sel} onClose={() => setSel(null)} />}
frontend/src/components\ListingDetail.tsx:3:import type { Listing, ListingDetail, Question, Review, VoteState, VoteType } from '../types';
frontend/src/components\ListingDetail.tsx:230:export function ListingDetailModal({
frontend/src/components\ListingDetail.tsx:244:  const [data, setData] = useState<ListingDetail | null>(null);
frontend/src/components\MapBrowse.tsx:6:import { ListingDetailModal } from './ListingDetail';
frontend/src/components\MapBrowse.tsx:37:export function MapBrowse({ cat, onClose }: { cat: BrowseCat; onClose: () => void }) {
frontend/src/components\MapBrowse.tsx:338:        <ListingDetailModal id={activeId} onClose={() => setActiveId(null)} />
frontend/src/components\MapView.tsx:2:import L from 'leaflet';
frontend/src/components\People.tsx:6:import { ListingDetailModal } from './ListingDetail';
frontend/src/components\People.tsx:304:        <ListingDetailModal id={openListing} onClose={() => setOpenListing(null)} />

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path frontend/dist/assets/index-Dnm7uTdG.js -Pattern 'Leaflet|ListingDetailModal|leaflet' | Select-Object -First 5 | ForEach-Object { \"found index at "'$($_.LineNumber) len=$($_.Line.Length)" }; Select-String -Path frontend/dist/assets/MapBrowse-C1fD-6jD.js -Pattern '"'Leaflet|leaflet' | Select-Object -First 5 | ForEach-Object { \"found map at "'$($_.LineNumber) len=$($_.Line.Length)" }; Get-Content frontend/dist/assets/MapBrowse-C1fD-6jD.js -TotalCount 1 | ForEach-Object { $_.Substring(0,[Math]::Min(500,$_.Length)) }' in D:\Приложения\Yelp
 succeeded in 1935ms:
found index at 55 len=34462
found index at 56 len=74
found index at 58 len=258638
import{r as a,f as z,h as G,i as J,k as Z,c as I,j as t,M as _,F as ee,l as te,b as se}from"./index-Dnm7uTdG.js";const ne={RESTAURANT:"Р РµСЃС‚РѕСЂР°РЅС‹",BAR:"Р‘Р°СЂС‹",CAFE:"РљР°С„Рµ",COFFEE:"РљРѕС„РµР№РЅРё",DISH:"Р‘Р»СЋРґР°",DRINK:"РќР°РїРёС‚РєРё"},oe=[55.751,37.618];function O(s,b){const p=j=>j*Math.PI/180,u=p(b[0]-s[0]),S=p(b[1]-s[1]),L=Math.sin(u/2)**2+Math.cos(p(s[0]))*Math.cos(p(b[0]))*Math.sin(S/2)**2;return 6371*2*Math.atan2(Math.sqrt(L),Math.sqrt(1-L))}function ae({cat:s,onClose:b}){c

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const fs=require('fs'),z=require('zlib'),p='frontend/dist/assets';
for(const f of fs.readdirSync(p)){const b=fs.readFileSync(p+'/'+f); console.log(f, (b.length/1024).toFixed(1)+'KB', (z.gzipSync(b).length/1024).toFixed(1)+'KB gzip')}
'@ | node -" in D:\Приложения\Yelp
 succeeded in 974ms:
AddBusiness-B5tZ10lw.js 4.8KB 1.7KB gzip
Alerts-38v8p1Jb.js 2.5KB 1.3KB gzip
Business-CW569ehy.js 22.0KB 5.9KB gzip
Favorites-BbqCrSYL.js 1.4KB 0.8KB gzip
index-275ae6-W.css 94.6KB 21.5KB gzip
index-Dnm7uTdG.js 593.8KB 183.7KB gzip
MapBrowse-C1fD-6jD.js 5.8KB 2.6KB gzip
MyRatings-xbNLS9al.js 17.7KB 5.2KB gzip

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n -A 18 "''^('"\\.note-row|\\.note-area|\\.photo-box|\\.cmt-form|\\.cmt-modal|\\.pp-form|\\.pp-body|\\.photo-post|\\.filters-modal|\\.scan-sheet|\\.qa-ask|\\.qa-answer|\\.pu-search|\\.modal \\{|\\.mapbrowse \\{|\\.mb-header \\{|\\.me \\{|\\.topbar \\{)\" frontend/src/index.css" in D:\Приложения\Yelp
 succeeded in 266ms:
677:.modal {
678-  background: var(--bg);
679-  width: 100%;
680-  max-width: 560px;
681-  border-radius: 18px 18px 0 0;
682-  /* extra bottom padding so footer buttons clear the fixed bottom nav */
683-  padding: 16px 16px calc(88px + env(safe-area-inset-bottom));
684-  max-height: 92vh;
685-  overflow-y: auto;
686-  overscroll-behavior: contain; /* don't chain scroll to the background at the edges */
687-  /* NOT pan-y: with pan-y the browser owns vertical pans and touchmove becomes
688-     non-cancelable, so pull-to-dismiss can't preventDefault. auto keeps the first
689-     move cancelable so the drag handler can take over at the top. */
690-  touch-action: auto;
691-  animation: sheetUp 0.34s cubic-bezier(0.22, 0.61, 0.36, 1);
692-}
693-/* while any modal/overlay is open, the page behind it must not scroll.
694-   The lock itself is position:fixed + top compensation set in modalEsc.ts —
695-   NO height:100% here: clipping #root to the viewport blanked the page behind
--
934:.photo-post-backdrop {
935-  align-items: flex-end;
936-}
937:.photo-post {
938-  background: var(--bg);
939-  width: 100%;
940-  max-width: 560px;
941-  max-height: 94vh;
942-  border-radius: 18px 18px 0 0;
943-  overflow-y: auto;
944-  position: relative;
945-  animation: sheetUp 0.34s cubic-bezier(0.22, 0.61, 0.36, 1);
946-}
947:.photo-post.closing {
948-  animation: sheetDown 0.3s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
949-}
950-@keyframes sheetUp {
951-  from { transform: translateY(40px); opacity: 0.6; }
952-  to { transform: translateY(0); opacity: 1; }
953-}
954-.pp-close {
955-  position: absolute;
956-  top: 10px;
957-  right: 10px;
958-  z-index: 3;
959-  width: 34px;
960-  height: 34px;
961-  border-radius: 50%;
962-  border: none;
963-  background: rgba(0, 0, 0, 0.55);
964-  color: #fff;
965-  font-size: 16px;
--
1089:.pp-body {
1090-  padding: 4px 14px calc(16px + env(safe-area-inset-bottom));
1091-}
1092-/* author + place overlaid on the top of the photo (Untappd-style) */
1093-.pp-head {
1094-  position: absolute;
1095-  top: 0;
1096-  left: 0;
1097-  right: 0;
1098-  z-index: 2;
1099-  display: flex;
1100-  align-items: center;
1101-  gap: 10px;
1102-  padding: 12px 14px 22px;
1103-  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0));
1104-  border: none;
1105-  cursor: pointer;
1106-  text-align: left;
1107-}
--
1526:.pp-form {
1527-  display: flex;
1528-  gap: 8px;
1529-  margin-top: 12px;
1530-}
1531:.pp-form input {
1532-  flex: 1;
1533-  padding: 10px 12px;
1534-  border: 1px solid var(--border);
1535-  border-radius: 10px;
1536-  font-size: 14px;
1537-}
1538-.pp-send {
1539-  flex: 0 0 auto;
1540-  width: 46px;
1541-  height: 46px;
1542-  border-radius: 12px;
1543-  border: none;
1544-  background: var(--accent);
1545-  color: #fff;
1546-  font-size: 18px;
1547-  line-height: 1;
1548-  cursor: pointer;
1549-}
--
1622:.topbar {
1623-  display: flex;
1624-  align-items: center;
1625-  justify-content: space-between;
1626-  padding: 4px 4px 8px;
1627-}
1628-.topbar h2 {
1629-  font-size: 20px;
1630-}
1631-.link-btn {
1632-  background: none;
1633-  border: none;
1634-  color: var(--accent);
1635-  font-weight: 700;
1636-  font-size: 15px;
1637-}
1638-/* «Сообщить о неточности» row — equal gap above (Инфо) and below (Отзывы) */
1639-.report-line {
1640-  display: flex;
--
2223:.qa-ask {
2224-  display: flex;
2225-  gap: 8px;
2226-  margin-bottom: 12px;
2227-}
2228:.qa-ask input {
2229-  flex: 1;
2230-  padding: 10px 12px;
2231-  border: 1px solid var(--border);
2232-  border-radius: 8px;
2233-  font-size: 14px;
2234-}
2235-.qa-item {
2236-  padding: 10px 0;
2237-  border-bottom: 1px solid var(--border);
2238-}
2239-.qa-q {
2240-  font-size: 14px;
2241-}
2242-.qa-a {
2243-  font-size: 14px;
2244-  color: var(--hint);
2245-  margin-top: 4px;
2246-  padding-left: 8px;
--
2248:.qa-answer {
2249-  display: flex;
2250-  gap: 8px;
2251-  align-items: center;
2252-  margin-top: 6px;
2253-}
2254:.qa-answer input {
2255-  flex: 1;
2256-  padding: 6px 10px;
2257-  border: 1px solid var(--border);
2258-  border-radius: 8px;
2259-  font-size: 13px;
2260-}
2261-
2262-/* per-criterion filter dropdowns */
2263-.filters-wrap {
2264-  position: relative;
2265-}
2266-.chip.open {
2267-  background: var(--accent);
2268-  color: #fff;
2269-}
2270-.fdrop-backdrop {
2271-  position: fixed;
2272-  inset: 0;
--
2323:.me {
2324-  padding-bottom: 24px;
2325-}
2326-.me-topbar {
2327-  display: flex;
2328-  justify-content: flex-end;
2329-  padding: 8px 4px;
2330-}
2331-.me-icon {
2332-  width: 38px;
2333-  height: 38px;
2334-  border-radius: 50%;
2335-  border: none;
2336-  background: #f1f1f1;
2337-  font-size: 18px;
2338-}
2339-.me-head {
2340-  display: flex;
2341-  flex-direction: column;
--
2705:.note-area {
2706-  flex: 1 1 auto;
2707-  min-height: 92px;
2708-  resize: vertical;
2709-  border: 1px solid var(--border);
2710-  border-radius: 12px;
2711-  padding: 10px 12px;
2712-  font-size: 15px;
2713-  font-family: inherit;
2714-}
2715:.photo-box {
2716-  flex: 0 0 104px;
2717-  display: flex;
2718-  flex-direction: column;
2719-  align-items: center;
2720-  justify-content: center;
2721-  gap: 8px;
2722-  width: 104px;
2723-  border: 1.5px dashed rgba(211, 35, 35, 0.5);
2724-  border-radius: 14px;
2725-  background: rgba(211, 35, 35, 0.06);
2726-  color: var(--accent);
2727-  font-size: 13px;
2728-  font-weight: 600;
2729-  text-align: center;
2730-  cursor: pointer;
2731-  transition: background 0.15s, border-color 0.15s, transform 0.1s;
2732-}
2733:.photo-box:active {
2734-  transform: scale(0.97);
2735-  background: rgba(211, 35, 35, 0.12);
2736-}
2737:.photo-box-ico {
2738-  width: 34px;
2739-  height: 34px;
2740-}
2741:.photo-box-label {
2742-  line-height: 1.2;
2743-}
2744-.upload-btn.small {
2745-  display: inline-flex;
2746-  padding: 7px 12px;
2747-  font-size: 13px;
2748-}
2749-.best-on-card {
2750-  color: var(--accent);
2751-  font-weight: 600;
2752-}
2753-.detail-media {
2754-  position: relative;
2755-}
2756-.detail-rating-badge {
2757-  position: absolute;
2758-  right: 12px;
2759-  top: 12px;
--
3659:.cmt-modal {
3660-  max-height: 80vh;
3661-  display: flex;
3662-  flex-direction: column;
3663-}
3664-.cmt-list {
3665-  flex: 1;
3666-  overflow-y: auto;
3667-  margin: 8px 0;
3668-}
3669-.cmt {
3670-  padding: 8px 0 0;
3671-  border-left: 2px solid transparent;
3672-}
3673-.cmt .cmt {
3674-  border-left: 2px solid var(--border);
3675-  padding-left: 8px;
3676-  margin-top: 6px;
3677-}
--
3713:.cmt-form {
3714-  display: flex;
3715-  gap: 6px;
3716-  margin: 6px 0 0 28px;
3717-}
3718:.cmt-form.root {
3719-  margin: 8px 0 0;
3720-}
3721:.cmt-form input {
3722-  flex: 1;
3723-  border: 1px solid var(--border);
3724-  border-radius: 10px;
3725-  padding: 8px 12px;
3726-  font-size: 14px;
3727-}
3728:.cmt-form .btn {
3729-  flex: 0 0 auto;
3730-  width: auto;
3731-  white-space: nowrap;
3732-  padding: 8px 16px;
3733-}
3734-
3735-/* feed post CTA — nudge the viewer to rate it too (must fit the card width) */
3736-.post-cta {
3737-  display: flex;
3738-  align-items: center;
3739-  justify-content: space-between;
3740-  gap: 8px;
3741-  margin: 0 12px;
3742-  padding: 10px 0;
3743-  border-top: 1px solid var(--border);
3744-}
3745-.post-cta-q {
3746-  font-weight: 700;
--
4267:.pu-search {
4268-  display: flex;
4269-  align-items: center;
4270-  gap: 8px;
4271-  background: #f1f1f1;
4272-  border-radius: 999px;
4273-  padding: 8px 14px;
4274-  margin-bottom: 12px;
4275-}
4276:.pu-search input {
4277-  flex: 1;
4278-  border: none;
4279-  background: none;
4280-  font-size: 15px;
4281-  outline: none;
4282-}
4283-.pu-list {
4284-  max-height: 60vh;
4285-  overflow-y: auto;
4286-}
4287-.pu-row {
4288-  display: flex;
4289-  align-items: center;
4290-  gap: 12px;
4291-  padding: 10px 0;
4292-  border-bottom: 1px solid var(--border);
4293-}
4294-.pu-avatar {
--
4353:.mapbrowse {
4354-  position: fixed;
4355-  inset: 0;
4356-  z-index: 2400;
4357-  background: #e8e8e8;
4358-  animation: mbIn 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
4359-}
4360-.mapbrowse.closing {
4361-  animation: mbOut 0.3s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
4362-}
4363-@keyframes mbIn {
4364-  from {
4365-    opacity: 0;
4366-    transform: translateY(24px);
4367-  }
4368-  to {
4369-    opacity: 1;
4370-    transform: none;
4371-  }
--
4383:.mb-header {
4384-  position: absolute;
4385-  top: 0;
4386-  left: 0;
4387-  right: 0;
4388-  z-index: 1100;
4389-  display: flex;
4390-  align-items: center;
4391-  gap: 10px;
4392-  padding: 14px 16px;
4393-  margin: 10px;
4394-  background: #fff;
4395-  border-radius: 12px;
4396-  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
4397-}
4398-.mb-back {
4399-  background: none;
4400-  border: none;
4401-  font-size: 22px;
--
4592:.filters-modal {
4593-  display: flex;
4594-  flex-direction: column;
4595-  max-height: 88vh;
4596-  padding-bottom: 0;
4597-  overflow: hidden; /* only .filters-scroll scrolls; footer stays pinned */
4598-}
4599-.filters-scroll {
4600-  flex: 1 1 auto;
4601-  min-height: 0;
4602-  overflow-y: auto;
4603-}
4604-.apply-sticky {
4605-  flex: 0 0 auto;
4606-  margin: 8px -16px 0;
4607-  /* the sheet (z-80) sits above the nav (z-10), so only the safe-area needs clearing —
4608-     no big empty gap under the button */
4609-  padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
4610-  background: #fff;
--
4775:.scan-sheet {
4776-  position: relative;
4777-  background: var(--bg);
4778-  width: 100%;
4779-  max-width: 560px;
4780-  border-radius: 18px 18px 0 0;
4781-  padding: 14px 16px calc(20px + env(safe-area-inset-bottom));
4782-  max-height: 90vh;
4783-  overflow-y: auto;
4784-  animation: sheetUp 0.34s cubic-bezier(0.22, 0.61, 0.36, 1);
4785-}
4786-.scan-back {
4787-  position: absolute;
4788-  top: 20px;
4789-  left: 22px;
4790-  z-index: 2;
4791-  width: 42px;
4792-  height: 42px;
4793-  border-radius: 50%;
--
5046:.photo-post::before,
5047:.scan-sheet::before,
5048-.scan-src::before {
5049-  content: '';
5050-  display: block;
5051-  width: 40px;
5052-  height: 4px;
5053-  border-radius: 2px;
5054-  background: var(--border);
5055-  margin: 0 auto 10px;
5056-  flex-shrink: 0;
5057-}
5058-
5059-/* one-time Tinder-swipe hint on the discovery card (first 2 sessions) */
5060-@keyframes heroNudge {
5061-  0%, 100% { transform: translateX(0) rotate(0deg); }
5062-  16% { transform: translateX(26px) rotate(1.2deg); }
5063-  34% { transform: translateX(0) rotate(0deg); }
5064-  56% { transform: translateX(-26px) rotate(-1.2deg); }
5065-  76% { transform: translateX(0) rotate(0deg); }
--
5295:.photo-post::before {
5296-  position: absolute;
5297-  top: 8px;
5298-  left: 50%;
5299-  transform: translateX(-50%);
5300-  margin: 0;
5301-  z-index: 3;
5302-  background: rgba(255, 255, 255, 0.75);
5303-}
5304-
5305-/* photo CAROUSEL on the shared dish card: swipe between review photos */
5306-.carousel {
5307-  display: flex;
5308-  overflow-x: auto;
5309-  scroll-snap-type: x mandatory;
5310-  border-radius: 14px;
5311-  scrollbar-width: none;
5312-  -webkit-overflow-scrolling: touch;
5313-}

web search: 
web search: site:developer.apple.com/design/human-interface-guidelines touch targets 44 points buttons navigation tab bars sheets accessibility motion iOS ...
web search: 
web search: site:developer.apple.com/design/human-interface-guidelines "44 x 44 pt" ...
web search: 
web search: 'viewportStableHeight'
web search: 
web search: site:apps.apple.com Instagram app iPhone App Store ...
web search: 
web search: site:apps.apple.com/us/app/yelp-food-services-reviews/id284910350 ...
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "<(div|span|img)[''^>]*onClick|<button[''^>]*>$|<button[''^>]*className=.*(heart|back|icon|dots|close|send)|className='"\\\"modal-backdrop|className=\\{'modal-backdrop|role=\\\"dialog\\\"|aria-modal|aria-live|aria-busy|aria-selected|aria-current|aria-expanded|aria-controls\" frontend/src --glob \"*.tsx\"" in D:\Приложения\Yelp
2026-07-19T17:57:54.754800Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.6 seconds
Output:
В строке отсутствует завершающий символ: '.
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : TerminatorExpectedAtEndOfString
 

 exited 1 in 608ms:
В строке отсутствует завершающий символ: '.
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : TerminatorExpectedAtEndOfString
 

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n '<(div|span|img)["'^>]*onClick|<button[''^>]*>$|<button[''^>]*className=.*(heart|back|icon|dots|close|send)|className="modal-backdrop|role="dialog"|aria-modal|aria-live|aria-busy|aria-selected|aria-current|aria-expanded|aria-controls'"' frontend/src --glob '*.tsx'" in D:\Приложения\Yelp
2026-07-19T17:58:14.390261Z ERROR codex_core::tools::router: error=Exit code: 124
Wall time: 14 seconds
Output:
command timed out after 14030 milliseconds

 exited 124 in 14030ms:
exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n 'onClick=' frontend/src --glob '*.tsx' | Select-String '<div|<span|<img'; rg -n 'role=\"dialog\"|aria-modal|aria-live|aria-busy|aria-selected|aria-current|aria-expanded|aria-controls' frontend/src --glob '*.tsx'" in D:\Приложения\Yelp
2026-07-19T17:58:24.470556Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.9 seconds
Output:

frontend/src\screens\Business.tsx:696:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src\screens\Business.tsx:697:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\screens\Business.tsx:776:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src\screens\Business.tsx:777:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\screens\Business.tsx:846:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src\screens\Business.tsx:847:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\screens\Alerts.tsx:60:          <div key={n.id} className={`alert-row${freshIds.has(n.id) ? ' fresh' : ''}
`} onClick={() => open(n)}>
frontend/src\screens\Home.tsx:955:        <div className="modal-backdrop" style={{ zIndex: 3200 }} onClick={() => setSh
owAdd(false)}>
frontend/src\screens\Home.tsx:956:          <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\screens\Home.tsx:978:        <div className="modal-backdrop" style={{ zIndex: 3200 }} onClick={() => setSh
owAddBiz(false)}>
frontend/src\screens\Home.tsx:979:          <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\CorrectionModal.tsx:35:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\FeedRecCard.tsx:29:    <div className="post rec-post" onClick={onOpen}>
frontend/src\components\FeedRecCard.tsx:63:        <div className="rec-stars" onClick={(e) => e.stopPropagation()}>
frontend/src\components\CategoryCelebration.tsx:18:    <div className="celebrate-backdrop" onClick={() => setCategory(n
ull)}>
frontend/src\components\CategoryCelebration.tsx:19:      <div className="celebrate-card" onClick={(e) => e.stopPropagat
ion()}>
frontend/src\components\FeedPost.tsx:54:    <div className="post" onClick={onOpen}>
frontend/src\components\FeedPost.tsx:118:        <div className="vote-row" onClick={(e) => e.stopPropagation()}>
frontend/src\components\AddBusiness.tsx:60:    <div className="modal-backdrop" style={{ zIndex: 3000 }} onClick={onClos
e}>
frontend/src\components\AddBusiness.tsx:61:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\GroupModal.tsx:46:      <div className="modal-backdrop" onClick={onClose}>
frontend/src\components\GroupModal.tsx:47:        <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\GroupModal.tsx:59:    <div className="modal-backdrop" onClick={onClose}>
frontend/src\components\GroupModal.tsx:60:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\GroupModal.tsx:84:            <div key={b.id} className="yelp-row" onClick={() => setSel(b.id)}
>
frontend/src\components\ListingCard.tsx:32:      <div className="card" onClick={onClick}>
frontend/src\components\ListingCard.tsx:110:              <div className="qr" onMouseLeave={() => setHover(0)} onClick=
{(e) => e.stopPropagation()}>
frontend/src\components\ListingDetail.tsx:44:          <div key={l.id || l.name} className="mini" onClick={() => onPick
(l)}>
frontend/src\components\ListingDetail.tsx:144:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\ListingDetail.tsx:496:      <div className="modal-backdrop" onClick={onClose}>
frontend/src\components\ListingDetail.tsx:497:        <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\ListingDetail.tsx:726:      <div className="modal" ref={sheetRef} onClick={(e) => e.stopPropaga
tion()}>
frontend/src\components\Filters.tsx:121:          <div className="fdrop-backdrop" onClick={() => setOpen(null)} />
frontend/src\components\Filters.tsx:187:    <div className="modal-backdrop" style={{ zIndex: 80 }} onClick={onClose}>
frontend/src\components\Filters.tsx:188:      <div className="modal filters-modal" onClick={(e) => e.stopPropagation()}
>
frontend/src\components\ListRow.tsx:46:    <div className="vcard" onClick={onClick}>
frontend/src\components\PhotoPostModal.tsx:105:    <div className="modal-backdrop photo-post-backdrop" style={{ zIndex:
 3400 }} onClick={reqClose}>
frontend/src\components\PhotoPostModal.tsx:106:      <div ref={sheetRef} className={'photo-post' + (closing ? ' closing
' : '')} onClick={(e) => e.stopPropagation()}>
frontend/src\components\PhotoPostModal.tsx:234:        <div className="pp-sheet-back" onClick={(e) => { e.stopPropagati
on(); setMenu(false); }}>
frontend/src\components\PhotoPostModal.tsx:235:          <div className="pp-sheet" onClick={(e) => e.stopPropagation()}
>
frontend/src\components\NotInterested.tsx:17:    <div className="ni-wrap" ref={ref} onClick={(e) => e.stopPropagation()
}>
frontend/src\components\VenuePicker.tsx:94:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\ReviewCard.tsx:44:      <div className="rc-tap" onClick={onOpen}>
frontend/src\components\People.tsx:39:    <div className="pu-row" onClick={() => onOpen(u.id)}>
frontend/src\components\People.tsx:89:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src\components\People.tsx:90:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\TasteResult.tsx:56:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\QuickRate.tsx:26:      <div className="qr-done" onClick={(e) => e.stopPropagation()}>
frontend/src\components\QuickRate.tsx:38:    <div className="qr" onMouseLeave={() => setHover(0)} onClick={(e) => e.sto
pPropagation()}>
frontend/src\components\ScanFab.tsx:91:    <div className="modal-backdrop scan-backdrop" style={{ zIndex: 3600 }} onCli
ck={() => !busy && onClose()}>
frontend/src\components\ScanFab.tsx:92:      <div className="scan-sheet" onClick={(e) => e.stopPropagation()}>
frontend/src\components\ScanFab.tsx:293:        <div className="modal-backdrop" style={{ zIndex: 3590 }} onClick={() =>
 setSrcMenu(false)}>
frontend/src\components\ScanFab.tsx:294:          <div className="scan-src" onClick={(e) => e.stopPropagation()}>
frontend/src\components\SupportModal.tsx:19:    <div className="modal-backdrop" style={{ zIndex: 3000 }} onClick={onClo
se}>
frontend/src\components\SupportModal.tsx:20:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\ReviewForm.tsx:228:      <div className="modal" ref={sheetRef} onClick={(e) => e.stopPropagatio
n()}>
frontend/src\components\TasteHero.tsx:162:            <div className="qr" onClick={(e) => e.stopPropagation()}>



 exited 1 in 871ms:

frontend/src\screens\Business.tsx:696:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src\screens\Business.tsx:697:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\screens\Business.tsx:776:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src\screens\Business.tsx:777:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\screens\Business.tsx:846:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src\screens\Business.tsx:847:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\screens\Alerts.tsx:60:          <div key={n.id} className={`alert-row${freshIds.has(n.id) ? ' fresh' : ''}
`} onClick={() => open(n)}>
frontend/src\screens\Home.tsx:955:        <div className="modal-backdrop" style={{ zIndex: 3200 }} onClick={() => setSh
owAdd(false)}>
frontend/src\screens\Home.tsx:956:          <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\screens\Home.tsx:978:        <div className="modal-backdrop" style={{ zIndex: 3200 }} onClick={() => setSh
owAddBiz(false)}>
frontend/src\screens\Home.tsx:979:          <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\CorrectionModal.tsx:35:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\FeedRecCard.tsx:29:    <div className="post rec-post" onClick={onOpen}>
frontend/src\components\FeedRecCard.tsx:63:        <div className="rec-stars" onClick={(e) => e.stopPropagation()}>
frontend/src\components\CategoryCelebration.tsx:18:    <div className="celebrate-backdrop" onClick={() => setCategory(n
ull)}>
frontend/src\components\CategoryCelebration.tsx:19:      <div className="celebrate-card" onClick={(e) => e.stopPropagat
ion()}>
frontend/src\components\FeedPost.tsx:54:    <div className="post" onClick={onOpen}>
frontend/src\components\FeedPost.tsx:118:        <div className="vote-row" onClick={(e) => e.stopPropagation()}>
frontend/src\components\AddBusiness.tsx:60:    <div className="modal-backdrop" style={{ zIndex: 3000 }} onClick={onClos
e}>
frontend/src\components\AddBusiness.tsx:61:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\GroupModal.tsx:46:      <div className="modal-backdrop" onClick={onClose}>
frontend/src\components\GroupModal.tsx:47:        <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\GroupModal.tsx:59:    <div className="modal-backdrop" onClick={onClose}>
frontend/src\components\GroupModal.tsx:60:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\GroupModal.tsx:84:            <div key={b.id} className="yelp-row" onClick={() => setSel(b.id)}
>
frontend/src\components\ListingCard.tsx:32:      <div className="card" onClick={onClick}>
frontend/src\components\ListingCard.tsx:110:              <div className="qr" onMouseLeave={() => setHover(0)} onClick=
{(e) => e.stopPropagation()}>
frontend/src\components\ListingDetail.tsx:44:          <div key={l.id || l.name} className="mini" onClick={() => onPick
(l)}>
frontend/src\components\ListingDetail.tsx:144:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\ListingDetail.tsx:496:      <div className="modal-backdrop" onClick={onClose}>
frontend/src\components\ListingDetail.tsx:497:        <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\ListingDetail.tsx:726:      <div className="modal" ref={sheetRef} onClick={(e) => e.stopPropaga
tion()}>
frontend/src\components\Filters.tsx:121:          <div className="fdrop-backdrop" onClick={() => setOpen(null)} />
frontend/src\components\Filters.tsx:187:    <div className="modal-backdrop" style={{ zIndex: 80 }} onClick={onClose}>
frontend/src\components\Filters.tsx:188:      <div className="modal filters-modal" onClick={(e) => e.stopPropagation()}
>
frontend/src\components\ListRow.tsx:46:    <div className="vcard" onClick={onClick}>
frontend/src\components\PhotoPostModal.tsx:105:    <div className="modal-backdrop photo-post-backdrop" style={{ zIndex:
 3400 }} onClick={reqClose}>
frontend/src\components\PhotoPostModal.tsx:106:      <div ref={sheetRef} className={'photo-post' + (closing ? ' closing
' : '')} onClick={(e) => e.stopPropagation()}>
frontend/src\components\PhotoPostModal.tsx:234:        <div className="pp-sheet-back" onClick={(e) => { e.stopPropagati
on(); setMenu(false); }}>
frontend/src\components\PhotoPostModal.tsx:235:          <div className="pp-sheet" onClick={(e) => e.stopPropagation()}
>
frontend/src\components\NotInterested.tsx:17:    <div className="ni-wrap" ref={ref} onClick={(e) => e.stopPropagation()
}>
frontend/src\components\VenuePicker.tsx:94:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\ReviewCard.tsx:44:      <div className="rc-tap" onClick={onOpen}>
frontend/src\components\People.tsx:39:    <div className="pu-row" onClick={() => onOpen(u.id)}>
frontend/src\components\People.tsx:89:    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
frontend/src\components\People.tsx:90:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\TasteResult.tsx:56:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\QuickRate.tsx:26:      <div className="qr-done" onClick={(e) => e.stopPropagation()}>
frontend/src\components\QuickRate.tsx:38:    <div className="qr" onMouseLeave={() => setHover(0)} onClick={(e) => e.sto
pPropagation()}>
frontend/src\components\ScanFab.tsx:91:    <div className="modal-backdrop scan-backdrop" style={{ zIndex: 3600 }} onCli
ck={() => !busy && onClose()}>
frontend/src\components\ScanFab.tsx:92:      <div className="scan-sheet" onClick={(e) => e.stopPropagation()}>
frontend/src\components\ScanFab.tsx:293:        <div className="modal-backdrop" style={{ zIndex: 3590 }} onClick={() =>
 setSrcMenu(false)}>
frontend/src\components\ScanFab.tsx:294:          <div className="scan-src" onClick={(e) => e.stopPropagation()}>
frontend/src\components\SupportModal.tsx:19:    <div className="modal-backdrop" style={{ zIndex: 3000 }} onClick={onClo
se}>
frontend/src\components\SupportModal.tsx:20:      <div className="modal" onClick={(e) => e.stopPropagation()}>
frontend/src\components\ReviewForm.tsx:228:      <div className="modal" ref={sheetRef} onClick={(e) => e.stopPropagatio
n()}>
frontend/src\components\TasteHero.tsx:162:            <div className="qr" onClick={(e) => e.stopPropagation()}>



exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n ':focus|focus-visible|outline:' frontend/src/index.css; rg -n 'autoFocus|\\.focus\\(|focus\\(' frontend/src --glob '*.tsx'" in D:\Приложения\Yelp
 succeeded in 308ms:
97:  outline: none; /* no black focus box on tap */
107:.cat-tile:focus,
108:.cat-tile:focus-visible {
109:  outline: none;
153:  outline: none;
754:  outline: none;
4281:  outline: none;
4417:  outline: none;
frontend/src\components\CommentsModal.tsx:83:            autoFocus
frontend/src\components\MapBrowse.tsx:241:              autoFocus

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n 'height:\\s*(100vh|[0-9]+vh)|max-height:\\s*[0-9]+vh|min-height:\\s*100vh|100dvh|svh|lvh|--tg-viewport|tg-content-safe|tg-safe-area|safe-area-inset-top|safe-area-inset-left|safe-area-inset-right' frontend/src frontend/index.html" in D:\Приложения\Yelp
 succeeded in 264ms:
frontend/src\index.css:684:  max-height: 92vh;
frontend/src\index.css:785:  height: 54vh;
frontend/src\index.css:941:  max-height: 94vh;
frontend/src\index.css:1085:  max-height: 60vh;
frontend/src\index.css:3660:  max-height: 80vh;
frontend/src\index.css:4284:  max-height: 60vh;
frontend/src\index.css:4470:  height: 86vh;
frontend/src\index.css:4595:  max-height: 88vh;
frontend/src\index.css:4782:  max-height: 90vh;

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/index.css';"'$c=Get-Content -Encoding utf8 $f;for($i=4440;$i -le 4540;$i++){"$i`:$($c[$i-1])"}' in D:\Приложения\Yelp
 succeeded in 761ms:
4440:.mb-compass {
4441:  position: absolute;
4442:  right: 14px;
4443:  bottom: 232px;
4444:  z-index: 3;
4445:  width: 46px;
4446:  height: 46px;
4447:  border-radius: 50%;
4448:  border: 1px solid var(--border);
4449:  background: #fff;
4450:  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
4451:  font-size: 22px;
4452:  display: flex;
4453:  align-items: center;
4454:  justify-content: center;
4455:  cursor: pointer;
4456:}
4457:.mb-compass:active {
4458:  background: #f2f2f2;
4459:  transform: scale(0.95);
4460:}
4461:.mb-map > div {
4462:  height: 100% !important;
4463:  border-radius: 0 !important;
4464:}
4465:.mb-sheet {
4466:  position: absolute;
4467:  left: 0;
4468:  right: 0;
4469:  bottom: 0;
4470:  height: 86vh;
4471:  background: #fff;
4472:  border-radius: 18px 18px 0 0;
4473:  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.18);
4474:  transform: translateY(calc(86vh - 220px));
4475:  transition: transform 0.34s cubic-bezier(0.4, 0, 0.2, 1);
4476:  display: flex;
4477:  flex-direction: column;
4478:  z-index: 1200;
4479:}
4480:.mb-sheet.exp {
4481:  transform: translateY(0);
4482:}
4483:.mb-sheet.dragging {
4484:  transition: none; /* follow the finger 1:1 while dragging */
4485:}
4486:.mb-handle {
4487:  padding: 14px 0 10px;
4488:  display: flex;
4489:  justify-content: center;
4490:  cursor: grab;
4491:  touch-action: none;
4492:}
4493:.mb-handle:active {
4494:  cursor: grabbing;
4495:}
4496:.mb-grip {
4497:  width: 48px;
4498:  height: 6px;
4499:  border-radius: 3px;
4500:  background: #cfcfcf;
4501:  transition: background 0.15s ease;
4502:}
4503:.mb-handle:active .mb-grip {
4504:  background: var(--accent);
4505:}
4506:.mb-searchrow {
4507:  display: flex;
4508:  align-items: center;
4509:  gap: 8px;
4510:  padding: 4px 12px 8px;
4511:}
4512:.mb-locate {
4513:  flex: 0 0 auto;
4514:  width: 42px;
4515:  height: 42px;
4516:  border-radius: 50%;
4517:  border: 1px solid var(--border);
4518:  background: #fff;
4519:  font-size: 18px;
4520:}
4521:.mb-locate:active {
4522:  background: #f1f1f1;
4523:}
4524:.mb-filters {
4525:  padding: 4px 12px 8px;
4526:}
4527:.mb-count {
4528:  padding: 0 16px 6px;
4529:  font-size: 13px;
4530:  color: var(--hint);
4531:}
4532:.mb-list {
4533:  flex: 1;
4534:  overflow-y: auto;
4535:  padding: 0 12px calc(16px + env(safe-area-inset-bottom));
4536:}
4537:
4538:/* current-location blue dot on the map */
4539:.user-dot-inner {
4540:  display: block;

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n 'QuickRate' frontend/src; rg -n 'onRate=' frontend/src; rg -n 'api\\.createReview' frontend/src" in D:\Приложения\Yelp
 succeeded in 320ms:
frontend/src\components\QuickRate.tsx:6:export function QuickRate({
frontend/src\screens\Home.tsx:571:      onRate={(n) => {
frontend/src\screens\Home.tsx:808:                onRate={(n) => {
frontend/src\components\QuickRate.tsx:21:    api.createReview(listingId, { rating: n }).then(() => onRated?.()).catch(() => {});
frontend/src\components\ReviewForm.tsx:195:      saved = await api.createReview(listing.id, { rating, text, attributes, photoUrls, videoUrls });

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "onRate|onPointer|onTouch|onClick|role=|aria-|className=|setDrag|haptic" frontend/src/components/TasteHero.tsx' in D:\Приложения\Yelp
 succeeded in 268ms:
16:  onRate,
24:  onRate?: (rating: number) => void; // tap a star → rate flow with it preselected
28:  const [dragging, setDragging] = useState(false);
64:      setDragging(false);
105:  const onPointerDown = (e: React.PointerEvent) => {
116:    setDragging(true);
125:      className={'hero swipeable' + (hinting && !dragging ? ' hero-hint' : '')}
126:      onPointerDown={onPointerDown}
135:        className="hero-media"
136:        onClick={() => {
140:        <VenuePhoto listing={item} className="hero-photo" draggable={false} />
142:          <span className="match-pct">🤖 {(item as any).matchPct}% совпадение</span>
145:          <span className="newdish-price hero-price-badge">{(item.recVenue as any).price} ₽</span>
147:        {hint === 'right' && <div className="swipe-tag like">♥ Хочу попробовать</div>}
148:        {hint === 'left' && <div className="swipe-tag nope">Не люблю</div>}
149:        {hint === 'down' && <div className="swipe-tag nope">Скрыть ↓</div>}
151:      <div className="hero-body">
152:        <div className="hero-name">{item.name}</div>
154:          <div className="hero-cat">📍 {item.recVenue.name}</div>
156:          item.category && <div className="hero-cat">{item.category}</div>
158:        {/* rating row. With onRate the stars are TAPPABLE (tap = start rating with
160:        <div className="hero-rating">
161:          {onRate ? (
162:            <div className="qr" onClick={(e) => e.stopPropagation()}>
166:                  className="qr-star"
167:                  onClick={(e) => {
169:                    onRate(n);
180:            <span className="hero-rating-val">
184:            <span className="hero-rating-val no">{onRate ? 'Оцените первым' : 'Нет оценок'}</span>
187:        <div className="hero-rate-hint">← не люблю · хочу попробовать →</div>
188:        <div className="hero-actions">
189:          <button className="hero-btn fav" onClick={onFavorite}>

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/components/TasteHero.tsx';"'$c=Get-Content -Encoding utf8 $f;for($i=25;$i -le 130;$i++){"$i`:$($c[$i-1])"}' in D:\Приложения\Yelp
 succeeded in 752ms:
25:}) {
26:  const [dx, setDx] = useState(0);
27:  const [dy, setDy] = useState(0);
28:  const [dragging, setDragging] = useState(false);
29:  // one-time swipe hint: the card nudges left-right on the first 2 visits so the
30:  // Tinder gesture is discoverable without any tutorial overlay
31:  const [hinting, setHinting] = useState(false);
32:  useEffect(() => {
33:    try {
34:      const n = Number(localStorage.getItem('heroSwipeHint') || '0');
35:      if (n >= 2) return;
36:      localStorage.setItem('heroSwipeHint', String(n + 1));
37:      setHinting(true);
38:      const t = setTimeout(() => setHinting(false), 3200);
39:      return () => clearTimeout(t);
40:    } catch { /* private mode */ }
41:  }, []);
42:  const [leaving, setLeaving] = useState<'left' | 'right' | 'down' | null>(null);
43:  const [instant, setInstant] = useState(false); // snap back with no animation after a swipe
44:  const startX = useRef(0);
45:  const startY = useRef(0);
46:  const dxRef = useRef(0);
47:  const dyRef = useRef(0);
48:  const movedRef = useRef(false);
49:  const THRESHOLD = 90;
50:  const DOWN_THRESHOLD = 130; // strong pull down → dismiss the card
51:
52:  useEffect(() => {
53:    if (!dragging) return;
54:    const move = (e: PointerEvent) => {
55:      const d = e.clientX - startX.current;
56:      const v = e.clientY - startY.current;
57:      if (Math.abs(d) > 4 || Math.abs(v) > 4) movedRef.current = true;
58:      dxRef.current = d;
59:      dyRef.current = v;
60:      setDx(d);
61:      setDy(v);
62:    };
63:    const finish = () => {
64:      setDragging(false);
65:      const d = dxRef.current;
66:      const v = dyRef.current;
67:      const swapAndReset = (cb: () => void) => {
68:        setInstant(true); // reset to centre without sliding, so the next card just appears
69:        setLeaving(null);
70:        setDx(0);
71:        setDy(0);
72:        dxRef.current = 0;
73:        dyRef.current = 0;
74:        cb();
75:        requestAnimationFrame(() => setInstant(false));
76:      };
77:      if (v > DOWN_THRESHOLD && v > Math.abs(d)) {
78:        // strong pull down → next card (no taste signal)
79:        setLeaving('down');
80:        setTimeout(() => swapAndReset(onShuffle), 220);
81:      } else if (d > THRESHOLD) {
82:        setLeaving('right');
83:        setTimeout(() => swapAndReset(onFavorite), 220);
84:      } else if (d < -THRESHOLD) {
85:        setLeaving('left');
86:        setTimeout(() => swapAndReset(onSkip), 220);
87:      } else {
88:        setDx(0);
89:        setDy(0);
90:        dxRef.current = 0;
91:        dyRef.current = 0;
92:      }
93:    };
94:    window.addEventListener('pointermove', move);
95:    window.addEventListener('pointerup', finish);
96:    window.addEventListener('pointercancel', finish);
97:    return () => {
98:      window.removeEventListener('pointermove', move);
99:      window.removeEventListener('pointerup', finish);
100:      window.removeEventListener('pointercancel', finish);
101:    };
102:    // eslint-disable-next-line react-hooks/exhaustive-deps
103:  }, [dragging]);
104:
105:  const onPointerDown = (e: React.PointerEvent) => {
106:    setHinting(false); // user touched the card → the hint served its purpose
107:    // let taps on buttons work normally — drag only on the rest of the card
108:    if ((e.target as HTMLElement).closest('button, a, input')) return;
109:    startX.current = e.clientX;
110:    startY.current = e.clientY;
111:    dxRef.current = 0;
112:    dyRef.current = 0;
113:    movedRef.current = false;
114:    setDx(0);
115:    setDy(0);
116:    setDragging(true);
117:  };
118:
119:  const offsetX = leaving === 'right' ? 700 : leaving === 'left' ? -700 : leaving === 'down' ? 0 : dx;
120:  const offsetY = leaving === 'down' ? 1000 : leaving ? 0 : dy;
121:  const hint = dy > 60 && dy > Math.abs(dx) ? 'down' : dx > 40 ? 'right' : dx < -40 ? 'left' : null;
122:
123:  return (
124:    <div
125:      className={'hero swipeable' + (hinting && !dragging ? ' hero-hint' : '')}
126:      onPointerDown={onPointerDown}
127:      onDragStart={(e) => e.preventDefault()}
128:      style={{
129:        transform: `translate(${offsetX}px, ${offsetY}px) rotate(${offsetX * 0.03}deg)`,
130:        transition: dragging || instant ? 'none' : 'transform 0.25s ease',

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n 'userLoc' frontend/src/components/ListingDetail.tsx; rg -n 'navigator\\.geolocation' frontend/src; rg -n 'permission|permissions' frontend/src" in D:\Приложения\Yelp
2026-07-19T18:00:22.674460Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.3 seconds
Output:
275:  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
541:    if (!userLoc) return b.reviewCount - a.reviewCount;
544:      const dx = x.lat - userLoc[0];
545:      const dy = x.lng - userLoc[1];
frontend/src\components\ListingDetail.tsx:277:    navigator.geolocation?.getCurrentPosition(
frontend/src\components\ListingDetail.tsx:628:    if (navigator.geolocation) {
frontend/src\components\ListingDetail.tsx:629:      navigator.geolocation.getCurrentPosition(
frontend/src\components\MapBrowse.tsx:65:    if (!navigator.geolocation) return;
frontend/src\components\MapBrowse.tsx:66:    navigator.geolocation.getCurrentPosition(

 exited 1 in 304ms:
275:  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
541:    if (!userLoc) return b.reviewCount - a.reviewCount;
544:      const dx = x.lat - userLoc[0];
545:      const dy = x.lng - userLoc[1];
frontend/src\components\ListingDetail.tsx:277:    navigator.geolocation?.getCurrentPosition(
frontend/src\components\ListingDetail.tsx:628:    if (navigator.geolocation) {
frontend/src\components\ListingDetail.tsx:629:      navigator.geolocation.getCurrentPosition(
frontend/src\components\MapBrowse.tsx:65:    if (!navigator.geolocation) return;
frontend/src\components\MapBrowse.tsx:66:    navigator.geolocation.getCurrentPosition(

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/screens/Home.tsx';"'$c=Get-Content -Encoding utf8 $f;for($i=108;$i -le 125;$i++){"$i`:$($c[$i-1])"}; rg -n '"'export function TrainingScale|return \\(|className=|onClick' frontend/src/components/TrainingScale.tsx frontend/src/components/GameProgress.tsx" in D:\Приложения\Yelp
 succeeded in 780ms:
108:  try { localStorage.setItem(FEEDQ_KEY, JSON.stringify(q.slice(0, 60))); } catch { /* quota */ }
109:}
110:
111:const TILE_ICON: Record<string, JSX.Element> = {
112:  RESTAURANT: <IcRestaurant />, COFFEE: <IcCoffee />, CAFE: <IcCake />,
113:  BAR: <IcBar />, DISH: <IcDish />, DRINK: <IcWine />,
114:};
115:const TILES: { key: Cat; icon: string; label: string }[] = [
116:  // dishes & drinks lead — that's the core "что попробовать" loop
117:  { key: 'DISH', icon: '🍝', label: 'Блюда' },
118:  { key: 'DRINK', icon: '🍷', label: 'Напитки' },
119:  { key: 'RESTAURANT', icon: '🍽️', label: 'Рестораны' },
120:  { key: 'COFFEE', icon: '☕', label: 'Кофейни' },
121:  { key: 'CAFE', icon: '🍰', label: 'Кафе' },
122:  { key: 'BAR', icon: '🍸', label: 'Бары' },
123:];
124:
125:export default function Home() {
frontend/src/components/TrainingScale.tsx:13:export function TrainingScale() {
frontend/src/components/TrainingScale.tsx:37:  return (
frontend/src/components/TrainingScale.tsx:38:    <div className="train-scale">
frontend/src/components/TrainingScale.tsx:39:      <div className="train-title">🎯 Обучение рекомендаций</div>
frontend/src/components/TrainingScale.tsx:40:      <p className="train-desc">
frontend/src/components/TrainingScale.tsx:43:      <p className="train-desc train-tip">
frontend/src/components/TrainingScale.tsx:48:      <div className="acc-row">
frontend/src/components/TrainingScale.tsx:49:        <span className="acc-name">{shown.name}</span>
frontend/src/components/TrainingScale.tsx:50:        <div className="acc-track">
frontend/src/components/TrainingScale.tsx:51:          <div className="acc-fill" style={{ width: `${pct}%` }} />
frontend/src/components/TrainingScale.tsx:53:        <span className="acc-val">
frontend/src/components/TrainingScale.tsx:58:        <p className="train-social">
frontend/src/components/GameProgress.tsx:31:    return () => clearTimeout(t);
frontend/src/components/GameProgress.tsx:34:  return <div className="game-toast">{show}</div>;
frontend/src/components/GameProgress.tsx:43:  return (
frontend/src/components/GameProgress.tsx:45:      <div className="me-section">
frontend/src/components/GameProgress.tsx:46:        <h2 className="me-h">Дегустатор</h2>
frontend/src/components/GameProgress.tsx:47:        <div className="game-level">
frontend/src/components/GameProgress.tsx:48:          <span className="game-level-ico">{lvl.icon}</span>
frontend/src/components/GameProgress.tsx:50:            <div className="game-level-title">{lvl.title}</div>
frontend/src/components/GameProgress.tsx:53:                <div className="acc-track" style={{ marginTop: 4 }}>
frontend/src/components/GameProgress.tsx:54:                  <div className="acc-fill" style={{ width: `${lvlPct}%` }} />
frontend/src/components/GameProgress.tsx:56:                <div className="game-level-sub">
frontend/src/components/GameProgress.tsx:65:      <div className="me-section">
frontend/src/components/GameProgress.tsx:66:        <h2 className="me-h">Открытия</h2>
frontend/src/components/GameProgress.tsx:68:          <div key={u.key} className={'game-unlock' + (u.unlocked ? ' open' : '')}>
frontend/src/components/GameProgress.tsx:69:            <span className="game-unlock-ico">{u.unlocked ? u.icon : '🔒'}</span>
frontend/src/components/GameProgress.tsx:71:              <div className="game-unlock-title">{u.title}</div>
frontend/src/components/GameProgress.tsx:73:                <div className="game-unlock-sub open">Открыто ✓</div>
frontend/src/components/GameProgress.tsx:76:                  <div className="acc-track" style={{ marginTop: 4 }}>
frontend/src/components/GameProgress.tsx:77:                    <div className="acc-fill" style={{ width: `${Math.min(100, (u.have / u.need) * 100)}%` }} />
frontend/src/components/GameProgress.tsx:79:                  <div className="game-unlock-sub">
frontend/src/components/GameProgress.tsx:90:        <div className="me-section">
frontend/src/components/GameProgress.tsx:91:          <h2 className="me-h">Достижения</h2>
frontend/src/components/GameProgress.tsx:92:          <div className="game-achievements">
frontend/src/components/GameProgress.tsx:94:              <div key={a.key} className="game-ach">
frontend/src/components/GameProgress.tsx:95:                <span className="game-ach-ico">{a.icon}</span>
frontend/src/components/GameProgress.tsx:96:                <span className="game-ach-title">{a.title}</span>

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "." frontend/src/components/TrainingScale.tsx frontend/src/categoryGate.ts' in D:\Приложения\Yelp
 succeeded in 270ms:
frontend/src/categoryGate.ts:1:import { useEffect, useState } from 'react';
frontend/src/categoryGate.ts:2:import { api } from './api';
frontend/src/categoryGate.ts:4:// Per-category review progress, shared across the app via a tiny module cache so
frontend/src/categoryGate.ts:5:// the gate ("рейтинг категории откроется после N отзывов") is consistent on the
frontend/src/categoryGate.ts:6:// home scale, list cards and detail cards — with a single network fetch.
frontend/src/categoryGate.ts:7:export type CategoryProgress = {
frontend/src/categoryGate.ts:8:  threshold: number;
frontend/src/categoryGate.ts:9:  total: number;
frontend/src/categoryGate.ts:10:  categories: { name: string; count: number; unlocked: boolean }[];
frontend/src/categoryGate.ts:11:};
frontend/src/categoryGate.ts:13:let cache: CategoryProgress | null = null;
frontend/src/categoryGate.ts:14:let inflight: Promise<CategoryProgress | null> | null = null;
frontend/src/categoryGate.ts:15:const listeners = new Set<() => void>();
frontend/src/categoryGate.ts:16:const unlockListeners = new Set<(category: string) => void>();
frontend/src/categoryGate.ts:18:function notify() {
frontend/src/categoryGate.ts:19:  for (const l of listeners) l();
frontend/src/categoryGate.ts:20:}
frontend/src/categoryGate.ts:22:/** Subscribe to "category just hit the threshold" events (for the celebration). */
frontend/src/categoryGate.ts:23:export function onCategoryUnlock(fn: (category: string) => void) {
frontend/src/categoryGate.ts:24:  unlockListeners.add(fn);
frontend/src/categoryGate.ts:25:  return () => unlockListeners.delete(fn);
frontend/src/categoryGate.ts:26:}
frontend/src/categoryGate.ts:28:export function loadCategoryProgress(force = false): Promise<CategoryProgress | null> {
frontend/src/categoryGate.ts:29:  if (cache && !force) return Promise.resolve(cache);
frontend/src/categoryGate.ts:30:  if (inflight && !force) return inflight;
frontend/src/categoryGate.ts:31:  inflight = api
frontend/src/categoryGate.ts:32:    .categoryProgress()
frontend/src/categoryGate.ts:33:    .then((d) => {
frontend/src/categoryGate.ts:34:      // detect categories that became unlocked since the last snapshot. Skip the
frontend/src/categoryGate.ts:35:      // very first load (no prior cache) so we don't celebrate on app open.
frontend/src/categoryGate.ts:36:      const hadCache = cache !== null;
frontend/src/categoryGate.ts:37:      const prevUnlocked = new Set(
frontend/src/categoryGate.ts:38:        (cache?.categories ?? []).filter((c) => c.unlocked).map((c) => c.name),
frontend/src/categoryGate.ts:39:      );
frontend/src/categoryGate.ts:40:      cache = d;
frontend/src/categoryGate.ts:41:      inflight = null;
frontend/src/categoryGate.ts:42:      if (hadCache) {
frontend/src/categoryGate.ts:43:        for (const c of d.categories) {
frontend/src/categoryGate.ts:44:          if (c.unlocked && !prevUnlocked.has(c.name)) {
frontend/src/categoryGate.ts:45:            for (const l of unlockListeners) l(c.name);
frontend/src/categoryGate.ts:46:          }
frontend/src/categoryGate.ts:47:        }
frontend/src/categoryGate.ts:48:      }
frontend/src/categoryGate.ts:49:      notify();
frontend/src/categoryGate.ts:50:      return d;
frontend/src/categoryGate.ts:51:    })
frontend/src/categoryGate.ts:52:    .catch(() => {
frontend/src/categoryGate.ts:53:      inflight = null;
frontend/src/categoryGate.ts:54:      return cache;
frontend/src/categoryGate.ts:55:    });
frontend/src/categoryGate.ts:56:  return inflight;
frontend/src/categoryGate.ts:57:}
frontend/src/categoryGate.ts:59:export function useCategoryProgress() {
frontend/src/categoryGate.ts:60:  const [, bump] = useState(0);
frontend/src/categoryGate.ts:61:  useEffect(() => {
frontend/src/categoryGate.ts:62:    const l = () => bump((n) => n + 1);
frontend/src/categoryGate.ts:63:    listeners.add(l);
frontend/src/categoryGate.ts:64:    if (!cache) loadCategoryProgress();
frontend/src/categoryGate.ts:65:    return () => {
frontend/src/categoryGate.ts:66:      listeners.delete(l);
frontend/src/categoryGate.ts:67:    };
frontend/src/categoryGate.ts:68:  }, []);
frontend/src/categoryGate.ts:70:  const threshold = cache?.threshold ?? 5;
frontend/src/categoryGate.ts:71:  const countFor = (cat?: string | null) =>
frontend/src/categoryGate.ts:72:    cache?.categories.find((c) => c.name === cat)?.count ?? 0;
frontend/src/categoryGate.ts:73:  const isUnlocked = (cat?: string | null) => !cat || countFor(cat) >= threshold;
frontend/src/categoryGate.ts:75:  return {
frontend/src/categoryGate.ts:76:    data: cache,
frontend/src/categoryGate.ts:77:    threshold,
frontend/src/categoryGate.ts:78:    countFor,
frontend/src/categoryGate.ts:79:    isUnlocked,
frontend/src/categoryGate.ts:80:    reload: () => loadCategoryProgress(true),
frontend/src/categoryGate.ts:81:  };
frontend/src/categoryGate.ts:82:}
frontend/src/components/TrainingScale.tsx:1:import { useEffect, useState } from 'react';
frontend/src/components/TrainingScale.tsx:2:import { useCategoryProgress } from '../categoryGate';
frontend/src/components/TrainingScale.tsx:3:import { pluralRu } from '../plural';
frontend/src/components/TrainingScale.tsx:5:// A few appetising categories to suggest when the user hasn't rated anything yet.
frontend/src/components/TrainingScale.tsx:6:const SEED_CATS = ['Фастфуд', 'Бургеры', 'Пицца', 'Кофе', 'Пиво', 'Вино', 'Суши', 'Десерты', 'Завтраки', 'Стейки'];
frontend/src/components/TrainingScale.tsx:8:// Compact top-of-home "training" card: short pitch + ONE category line that changes
frontend/src/components/TrainingScale.tsx:9:// on every visit. UX Core applied:
frontend/src/components/TrainingScale.tsx:10://  • goal-gradient: mid-progress copy switches to "осталось N" — the closer the
frontend/src/components/TrainingScale.tsx:11://    goal, the stronger the pull (loss framing beats neutral counting);
frontend/src/components/TrainingScale.tsx:12://  • social proof: a live community counter ("в клубе уже N оценок").
frontend/src/components/TrainingScale.tsx:13:export function TrainingScale() {
frontend/src/components/TrainingScale.tsx:14:  const { data, threshold } = useCategoryProgress();
frontend/src/components/TrainingScale.tsx:15:  const inProgress = (data?.categories ?? []).filter((c) => !c.unlocked);
frontend/src/components/TrainingScale.tsx:16:  const hasAny = (data?.categories?.length ?? 0) > 0;
frontend/src/components/TrainingScale.tsx:18:  // community counter for social proof (cached server-side, cheap)
frontend/src/components/TrainingScale.tsx:19:  const [community, setCommunity] = useState<{ reviews: number; tasters: number } | null>(null);
frontend/src/components/TrainingScale.tsx:20:  useEffect(() => {
frontend/src/components/TrainingScale.tsx:21:    fetch('/api/health/community')
frontend/src/components/TrainingScale.tsx:22:      .then((r) => r.json())
frontend/src/components/TrainingScale.tsx:23:      .then(setCommunity)
frontend/src/components/TrainingScale.tsx:24:      .catch(() => {});
frontend/src/components/TrainingScale.tsx:25:  }, []);
frontend/src/components/TrainingScale.tsx:27:  // pick ONE category to show, re-rolled each time the component mounts (each home open)
frontend/src/components/TrainingScale.tsx:28:  const [roll] = useState(() => Math.random());
frontend/src/components/TrainingScale.tsx:29:  if (hasAny && inProgress.length === 0) return null; // everything trained → hide
frontend/src/components/TrainingScale.tsx:31:  const shown = inProgress.length
frontend/src/components/TrainingScale.tsx:32:    ? inProgress[Math.floor(roll * inProgress.length) % inProgress.length]
frontend/src/components/TrainingScale.tsx:33:    : { name: SEED_CATS[Math.floor(roll * SEED_CATS.length) % SEED_CATS.length], count: 0 };
frontend/src/components/TrainingScale.tsx:34:  const pct = Math.min(100, (shown.count / threshold) * 100);
frontend/src/components/TrainingScale.tsx:35:  const left = Math.max(1, threshold - shown.count);
frontend/src/components/TrainingScale.tsx:37:  return (
frontend/src/components/TrainingScale.tsx:38:    <div className="train-scale">
frontend/src/components/TrainingScale.tsx:39:      <div className="train-title">🎯 Обучение рекомендаций</div>
frontend/src/components/TrainingScale.tsx:40:      <p className="train-desc">
frontend/src/components/TrainingScale.tsx:41:        Оценивайте блюда и напитки — боритесь за право считаться лучшим дегустатором Москвы!
frontend/src/components/TrainingScale.tsx:42:      </p>
frontend/src/components/TrainingScale.tsx:43:      <p className="train-desc train-tip">
frontend/src/components/TrainingScale.tsx:44:        {shown.count > 0
frontend/src/components/TrainingScale.tsx:45:          ? `🔥 Осталось ${left} ${pluralRu(left, ['оценка', 'оценки', 'оценок'])} — и откроются рейтинги категории «${shown.name}»!`
frontend/src/components/TrainingScale.tsx:46:          : `💡 Для начала оцените ${threshold} блюд или напитков категории.`}
frontend/src/components/TrainingScale.tsx:47:      </p>
frontend/src/components/TrainingScale.tsx:48:      <div className="acc-row">
frontend/src/components/TrainingScale.tsx:49:        <span className="acc-name">{shown.name}</span>
frontend/src/components/TrainingScale.tsx:50:        <div className="acc-track">
frontend/src/components/TrainingScale.tsx:51:          <div className="acc-fill" style={{ width: `${pct}%` }} />
frontend/src/components/TrainingScale.tsx:52:        </div>
frontend/src/components/TrainingScale.tsx:53:        <span className="acc-val">
frontend/src/components/TrainingScale.tsx:54:          {Math.min(shown.count, threshold)}/{threshold}
frontend/src/components/TrainingScale.tsx:55:        </span>
frontend/src/components/TrainingScale.tsx:56:      </div>
frontend/src/components/TrainingScale.tsx:57:      {community && community.reviews > 10 && (
frontend/src/components/TrainingScale.tsx:58:        <p className="train-social">
frontend/src/components/TrainingScale.tsx:59:          В клубе уже {community.reviews} {pluralRu(community.reviews, ['оценка', 'оценки', 'оценок'])} от{' '}
frontend/src/components/TrainingScale.tsx:60:          {community.tasters} {pluralRu(community.tasters, ['дегустатора', 'дегустаторов', 'дегустаторов'])}
frontend/src/components/TrainingScale.tsx:61:        </p>
frontend/src/components/TrainingScale.tsx:62:      )}
frontend/src/components/TrainingScale.tsx:63:    </div>
frontend/src/components/TrainingScale.tsx:64:  );
frontend/src/components/TrainingScale.tsx:65:}

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/components/AddBusiness.tsx';"'$c=Get-Content -Encoding utf8 $f;for($i=95;$i -le 172;$i++){"$i`:$($c[$i-1])"}; $f='"'frontend/src/components/VenuePicker.tsx';"'$c=Get-Content -Encoding utf8 $f;for($i=106;$i -le 170;$i++){"$i`:$($c[$i-1])"}' in D:\Приложения\Yelp
 succeeded in 744ms:
95:            <div className="section-title">Обязательная информация</div>
96:            <div className="field">
97:              <label>Название</label>
98:              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Кофемания" />
99:            </div>
100:            <div className="field">
101:              <label>Город</label>
102:              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" />
103:            </div>
104:            <div className="field">
105:              <label>Адрес (необязательно)</label>
106:              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом" />
107:            </div>
108:            <div className="field">
109:              <label>Категория</label>
110:              <select value={category} onChange={(e) => setCategory(e.target.value)}>
111:                <option value="">Выберите…</option>
112:                {CATEGORIES.map((c) => (
113:                  <option key={c} value={c}>
114:                    {c}
115:                  </option>
116:                ))}
117:              </select>
118:            </div>
119:            {phoneRequired && (
120:              <div className="field">
121:                <label>Телефон</label>
122:                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7…" />
123:              </div>
124:            )}
125:
126:            <div className="section-title">Дополнительно</div>
127:            {!phoneRequired && (
128:              <div className="field">
129:                <label>Телефон</label>
130:                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7…" />
131:              </div>
132:            )}
133:            <div className="field">
134:              <label>Сайт</label>
135:              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
136:            </div>
137:            {!isOwner && (
138:              <div className="field">
139:                <label>Заметка для команды</label>
140:                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
141:              </div>
142:            )}
143:
144:            {error && <p style={{ color: 'crimson', fontSize: 13 }}>{error}</p>}
145:            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
146:              <button className="btn secondary" onClick={() => setStep('choice')} disabled={busy}>
147:                Назад
148:              </button>
149:              <button className="btn" onClick={submit} disabled={busy}>
150:                {busy ? 'Отправка…' : 'Отправить'}
151:              </button>
152:            </div>
153:          </>
154:        )}
155:
156:        {step === 'done' && (
157:          <div style={{ textAlign: 'center', padding: '12px 0' }}>
158:            <div style={{ fontSize: 40 }}>✅</div>
159:            <h3>Заявка отправлена</h3>
160:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, margin: '8px 0 16px' }}>
161:              Мы проверим заведение и добавим его на платформу.
162:              {isOwner ? ' После одобрения оно появится в вашем кабинете.' : ''}
163:            </p>
164:            <button className="btn" onClick={onClose}>
165:              Готово
166:            </button>
167:          </div>
168:        )}
169:      </div>
170:    </div>
171:  );
172:}
106:        ) : addMode ? (
107:          <>
108:            <h3>Добавить заведение</h3>
109:            <div className="field">
110:              <label>Название</label>
111:              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Север" />
112:            </div>
113:            <div className="field">
114:              <label>Город</label>
115:              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" />
116:            </div>
117:            <div className="field">
118:              <label>Адрес (необязательно)</label>
119:              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом" />
120:            </div>
121:            <p className="meta" style={{ color: 'var(--hint)', fontSize: 12 }}>
122:              Найдём заведение по карте. Если у сети много точек — добавим все.
123:            </p>
124:            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
125:              <button className="btn secondary" onClick={() => setAddMode(false)} disabled={busy}>
126:                Назад
127:              </button>
128:              <button className="btn" onClick={submit} disabled={busy || !name.trim() || !city.trim()}>
129:                {busy ? 'Отправка…' : 'Отправить'}
130:              </button>
131:            </div>
132:          </>
133:        ) : (
134:          <>
135:            <h3>Где вы это пробовали?</h3>
136:            <div className="pu-search">
137:              <span className="search-ico">🔍</span>
138:              <input
139:                placeholder="Найти ресторан или бар…"
140:                value={q}
141:                onChange={(e) => setQ(e.target.value)}
142:              />
143:            </div>
144:            <div className="pu-list">
145:              {dedupeChains(results).map((v) => (
146:                <button key={v.id} className="pick-row" onClick={() => onPick(v)}>
147:                  <div className="pu-name">{v.name}</div>
148:                  {v.branchCount && v.branchCount > 1 ? (
149:                    <div className="pu-meta">Сеть · {v.branchCount} точек</div>
150:                  ) : (
151:                    v.address && <div className="pu-meta">{v.address}</div>
152:                  )}
153:                </button>
154:              ))}
155:              {q.trim().length >= 2 && (
156:                <button className="pick-row add-row" onClick={startAdd}>
157:                  <div className="pu-name" style={{ color: 'var(--accent)' }}>
158:                    ➕ Нет в списке — добавить «{q.trim()}»
159:                  </div>
160:                  <div className="pu-meta">Добавим сразу, если адрес подтвердится</div>
161:                </button>
162:              )}
163:            </div>
164:            <button className="btn secondary" style={{ marginTop: 12 }} onClick={onClose}>
165:              Отмена
166:            </button>
167:          </>
168:        )}
169:      </div>
170:    </div>

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$f='"'frontend/src/screens/Business.tsx';"'$c=Get-Content -Encoding utf8 $f;for($i=1;$i -le 180;$i++){"$i`:$($c[$i-1])"};for($i=520;$i -le 540;$i++){"$i`:$($c[$i-1])"}' in D:\Приложения\Yelp
 succeeded in 767ms:
1:import { useEffect, useState, type ReactNode } from 'react';
2:import { useNavigate } from 'react-router-dom';
3:import { api } from '../api';
4:import { ListingDetailModal } from '../components/ListingDetail';
5:import { UserProfileModal } from '../components/People';
6:import { Stars } from '../components/Stars';
7:import type {
8:  AdminChallenge,
9:  AdminUser,
10:  BusinessSubmission,
11:  Claim,
12:  ClaimStatus,
13:  Correction,
14:  Listing,
15:  PendingMenuLink,
16:  Profile,
17:  Review,
18:  SupportMsg,
19:} from '../types';
20:
21:const STATUS_LABEL: Record<ClaimStatus, string> = {
22:  PENDING: 'На проверке',
23:  APPROVED: 'Подтверждено',
24:  REJECTED: 'Отклонено',
25:};
26:
27:export default function Business() {
28:  const nav = useNavigate();
29:  const [me, setMe] = useState<Profile['user'] | null>(null);
30:  const [claims, setClaims] = useState<Claim[]>([]);
31:  const [venues, setVenues] = useState<Listing[]>([]);
32:  const [adminClaims, setAdminClaims] = useState<Claim[]>([]);
33:  const [adminBiz, setAdminBiz] = useState<BusinessSubmission[]>([]);
34:  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
35:  const [adminItems, setAdminItems] = useState<PendingMenuLink[]>([]);
36:  const [adminCorr, setAdminCorr] = useState<Correction[]>([]);
37:  const [adminSupport, setAdminSupport] = useState<SupportMsg[]>([]);
38:  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
39:  const [adminChal, setAdminChal] = useState<AdminChallenge[]>([]);
40:  // live gamification config: key → JSON text being edited
41:  const [ux, setUx] = useState<Awaited<ReturnType<typeof api.uxInsights>> | null>(null);
42:  const [gameCfg, setGameCfg] = useState<Record<string, unknown> | null>(null);
43:  const [cfgDraft, setCfgDraft] = useState<Record<string, string>>({});
44:  const [cfgStatus, setCfgStatus] = useState<Record<string, string>>({});
45:  const [chForm, setChForm] = useState({ title: '', category: '', target: '5', days: '14' });
46:  const [openSec, setOpenSec] = useState<string | null>(null);
47:  const [mySubs, setMySubs] = useState<BusinessSubmission[]>([]);
48:  const [edit, setEdit] = useState<Listing | null>(null);
49:  const [reviewsFor, setReviewsFor] = useState<Listing | null>(null);
50:  const [pendingFor, setPendingFor] = useState<Listing | null>(null);
51:  const [openListing, setOpenListing] = useState<string | null>(null);
52:  const [openUser, setOpenUser] = useState<string | null>(null);
53:
54:  const load = () => {
55:    api.me().then(setMe).catch(() => {});
56:    api.myClaims().then(setClaims).catch(() => {});
57:    api.ownerVenues().then(setVenues).catch(() => {});
58:    api.mySubmissions().then(setMySubs).catch(() => {});
59:  };
60:  useEffect(() => {
61:    let stop = false;
62:    let tries = 0;
63:    const attempt = () => {
64:      if (stop) return;
65:      load();
66:      tries += 1;
67:      if (tries < 8 && !me) setTimeout(attempt, Math.min(800 + tries * 550, 3200));
68:    };
69:    attempt();
70:    return () => {
71:      stop = true;
72:    };
73:    // eslint-disable-next-line react-hooks/exhaustive-deps
74:  }, []);
75:
76:  const isAdmin = me?.role === 'ADMIN';
77:  const loadAdmin = () => {
78:    api.adminClaims().then(setAdminClaims).catch(() => {});
79:    api.adminBusiness().then(setAdminBiz).catch(() => {});
80:    api.adminReviews().then(setAdminReviews).catch(() => {});
81:    api.adminPendingItems().then(setAdminItems).catch(() => {});
82:    api.adminCorrections().then(setAdminCorr).catch(() => {});
83:    api.adminSupport().then(setAdminSupport).catch(() => {});
84:    api.adminUsers().then(setAdminUsers).catch(() => {});
85:    api.adminChallenges().then(setAdminChal).catch(() => {});
86:    api.adminGameConfig().then((c) => setGameCfg(c.current)).catch(() => {});
87:    api.uxInsights().then(setUx).catch(() => {});
88:  };
89:
90:  const saveCfg = (key: string) => {
91:    let value: unknown;
92:    try {
93:      value = JSON.parse(cfgDraft[key]);
94:    } catch {
95:      setCfgStatus((s) => ({ ...s, [key]: '⚠️ невалидный JSON' }));
96:      return;
97:    }
98:    api
99:      .adminGameConfigSet(key, value)
100:      .then(() => {
101:        setCfgStatus((s) => ({ ...s, [key]: '✓ сохранено, применится сразу' }));
102:        setGameCfg((g) => (g ? { ...g, [key]: value } : g));
103:      })
104:      .catch(() => setCfgStatus((s) => ({ ...s, [key]: '⚠️ ошибка сохранения' })));
105:  };
106:
107:  const createChallenge = () => {
108:    if (!chForm.title.trim()) return;
109:    api
110:      .createChallenge({
111:        title: chForm.title.trim(),
112:        category: chForm.category.trim() || undefined,
113:        target: Number(chForm.target) || 1,
114:        days: Number(chForm.days) || 7,
115:      })
116:      .then(() => {
117:        setChForm({ title: '', category: '', target: '5', days: '14' });
118:        loadAdmin();
119:      });
120:  };
121:  const deactivateChallenge = (id: string) => api.deactivateChallenge(id).then(loadAdmin);
122:  useEffect(() => {
123:    if (isAdmin) loadAdmin();
124:  }, [isAdmin]);
125:
126:  const decide = (id: string, approve: boolean) => {
127:    (approve ? api.approveClaim(id) : api.rejectClaim(id)).then(() => {
128:      loadAdmin();
129:      api.ownerVenues().then(setVenues).catch(() => {});
130:    });
131:  };
132:
133:  const decideBiz = (
134:    id: string,
135:    approve: boolean,
136:    overrides?: { name?: string; address?: string; phone?: string; category?: string },
137:  ) => {
138:    api.setBusiness(id, approve ? 'approve' : 'reject', overrides).then(() => {
139:      loadAdmin();
140:      api.ownerVenues().then(setVenues).catch(() => {});
141:    });
142:  };
143:
144:  const decideReview = (id: string, approve: boolean, price?: number) => {
145:    api.moderateReview(id, approve ? 'approve' : 'reject', price).then(loadAdmin);
146:  };
147:
148:  const decideItem = (venueId: string, itemId: string, approve: boolean) => {
149:    api
150:      .adminSetItem(venueId, itemId, { status: approve ? 'APPROVED' : 'REJECTED' })
151:      .then(loadAdmin);
152:  };
153:
154:  const resolveCorr = (id: string) => {
155:    api.resolveCorrection(id).then(loadAdmin);
156:  };
157:
158:  return (
159:    <div>
160:      <div className="topbar with-back">
161:        <button className="back-btn" onClick={() => nav('/me')} aria-label="Назад">
162:          ←
163:        </button>
164:        <h2>Кабинет</h2>
165:      </div>
166:
167:      {me && (
168:        <div className="biz-note">
169:          Ваш Telegram ID: <b>{me.telegramId}</b>
170:          {!isAdmin && (
171:            <div className="meta" style={{ color: 'var(--hint)', marginTop: 4 }}>
172:              Чтобы подтверждать заявки как админ — добавьте этот ID в ADMIN_TELEGRAM_IDS на сервере.
173:            </div>
174:          )}
175:        </div>
176:      )}
177:
178:      {isAdmin && (
179:        <>
180:          <Acc id="claims" title="Заявки на права" count={adminClaims.length} openSec={openSec} setOpenSec={setOpenSec}>
520:            setEdit(null);
521:            api.ownerVenues().then(setVenues).catch(() => {});
522:          }}
523:        />
524:      )}
525:      {reviewsFor && (
526:        <VenueReviewsModal venue={reviewsFor} onClose={() => setReviewsFor(null)} />
527:      )}
528:      {pendingFor && (
529:        <PendingItemsModal venue={pendingFor} onClose={() => setPendingFor(null)} />
530:      )}
531:      {openListing && (
532:        <ListingDetailModal id={openListing} onClose={() => setOpenListing(null)} />
533:      )}
534:      {openUser && <UserProfileModal id={openUser} onClose={() => setOpenUser(null)} />}
535:    </div>
536:  );
537:}
538:
539:// Collapsible cabinet section with a count badge — open one list at a time.
540:function Acc({

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n 'trackScreen\\(' frontend/src; rg -n 'trackTap|initAnalytics|sendTaps' frontend/src/analytics.ts frontend/src" in D:\Приложения\Yelp
 succeeded in 290ms:
frontend/src\analytics.ts:47:export function trackScreen(name: string) {
frontend/src\App.tsx:19:    trackScreen(name);
frontend/src/analytics.ts:26:function sendTaps(force = false) {
frontend/src/analytics.ts:82:export function initAnalytics() {
frontend/src/analytics.ts:89:      if (taps.length >= 25) sendTaps(); // flush in batches so nothing is lost
frontend/src/analytics.ts:94:  setInterval(() => sendTaps(), 15000);
frontend/src/analytics.ts:96:  window.addEventListener('pagehide', () => { sendTaps(true); sendSummary(); });
frontend/src/analytics.ts:97:  document.addEventListener('visibilitychange', () => { if (document.hidden) { sendTaps(true); sendSummary(); } });
frontend/src\analytics.ts:26:function sendTaps(force = false) {
frontend/src\analytics.ts:82:export function initAnalytics() {
frontend/src\analytics.ts:89:      if (taps.length >= 25) sendTaps(); // flush in batches so nothing is lost
frontend/src\analytics.ts:94:  setInterval(() => sendTaps(), 15000);
frontend/src\analytics.ts:96:  window.addEventListener('pagehide', () => { sendTaps(true); sendSummary(); });
frontend/src\analytics.ts:97:  document.addEventListener('visibilitychange', () => { if (document.hidden) { sendTaps(true); sendSummary(); } });
frontend/src\main.tsx:13:import { initAnalytics } from './analytics';
frontend/src\main.tsx:17:initAnalytics();

exec
"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Encoding utf8 frontend/src/screens/Home.tsx -TotalCount 30; rg -n \"from './components/|from '../components/\" frontend/src/App.tsx frontend/src/screens/Home.tsx | Select-Object -First 80" in D:\Приложения\Yelp
 succeeded in 799ms:
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { ListingCard } from '../components/ListingCard';
import { TasteHero } from '../components/TasteHero';
import { ListRow } from '../components/ListRow';
import { Stars } from '../components/Stars';
import { preloadListingPhotos, VenuePhoto } from '../components/VenuePhoto';
import { FeedPost } from '../components/FeedPost';
import { PhotoPostModal } from '../components/PhotoPostModal';
import { CommentsModal } from '../components/CommentsModal';
import { hasOpenModal } from '../modalEsc';
import { UserProfileModal } from '../components/People';
const ListingDetailModal = lazy(() => import('../components/ListingDetail').then((m) => ({ default: m.ListingDetailModal })));
import { Filters, type FilterState } from '../components/Filters';
import type { BrowseCat } from '../components/MapBrowse';
const MapBrowse = lazy(() => import('../components/MapBrowse').then((m) => ({ default: m.MapBrowse })));
const AddBusiness = lazy(() => import('../components/AddBusiness').then((m) => ({ default: m.AddBusiness })));
import { VenuePicker } from '../components/VenuePicker';
import { useFavorites } from '../hooks/useFavorites';
import { getRecent } from '../recent';
import { TrainingScale } from '../components/TrainingScale';
import { loadCategoryProgress } from '../categoryGate';
import { haptic } from '../telegram';
import { useSwipeBack } from '../swipeBack';
import { IcRestaurant, IcCoffee, IcCake, IcBar, IcDish, IcWine } from '../components/Icons';
import type { Listing, ListingType, Review, VenueEvent } from '../types';

type Cat = ListingType | 'ALL' | 'BAR' | 'CAFE' | 'COFFEE';

// non-standalone add-ons (sauces/bread/honey…) — the backend bans them
frontend/src/screens/Home.tsx:3:import { ListingCard } from '../components/ListingCard';
frontend/src/screens/Home.tsx:4:import { TasteHero } from '../components/TasteHero';
frontend/src/screens/Home.tsx:5:import { ListRow } from '../components/ListRow';
frontend/src/screens/Home.tsx:6:import { Stars } from '../components/Stars';
frontend/src/screens/Home.tsx:7:import { preloadListingPhotos, VenuePhoto } from '../components/VenuePhoto';
frontend/src/screens/Home.tsx:8:import { FeedPost } from '../components/FeedPost';
frontend/src/screens/Home.tsx:9:import { PhotoPostModal } from '../components/PhotoPostModal';
frontend/src/screens/Home.tsx:10:import { CommentsModal } from '../components/CommentsModal';
frontend/src/screens/Home.tsx:12:import { UserProfileModal } from '../components/People';
frontend/src/screens/Home.tsx:14:import { Filters, type FilterState } from '../components/Filters';
frontend/src/screens/Home.tsx:15:import type { BrowseCat } from '../components/MapBrowse';
frontend/src/screens/Home.tsx:18:import { VenuePicker } from '../components/VenuePicker';
frontend/src/screens/Home.tsx:21:import { TrainingScale } from '../components/TrainingScale';
frontend/src/screens/Home.tsx:25:import { IcRestaurant, IcCoffee, IcCake, IcBar, IcDish, IcWine } from '../components/Icons';
frontend/src/App.tsx:5:import { IcHome, IcBookmark, IcBell, IcUser, IcTools } from './components/Icons';
frontend/src/App.tsx:6:import { QuizModal } from './components/QuizModal';
frontend/src/App.tsx:7:import { CategoryCelebration } from './components/CategoryCelebration';
frontend/src/App.tsx:8:import { ScanFab } from './components/ScanFab';

context compacted
codex
Я закончил трассировку ключевых сценариев. Помимо ожидаемых проблем с навигацией и доступностью нашлись несколько конкретных дефектов высокого риска: конфликт pull-to-refresh с модальными свайпами, бесконечный loading/RAF-цикл в карточке при ошибке API и две гонки в scan-flow, способные потерять фото или пропустить выбор заведения. Сейчас свожу их в приоритетный отчёт с точными ссылками.
Аудит исходного кода, CSS, собранных артефактов и актуальных платформенных рекомендаций завершён; код проекта не изменялся.
  ✓ Составить карту UI, навигации, жестов и интеграции Telegram Mini App
  ✓ Проверить экраны, формы, состояния, CSS, производительность и доступность
  ✓ Сверить выводы с Apple HIG, Telegram Mini Apps и продуктовым бенчмарком
  ✓ Сформировать приоритизированный отчёт и TOP-15
codex
# UX-аудит togomoscow

## Резюме

В приложении уже есть хорошие продуктовые решения: единый визуальный язык, skeleton первого экрана, черновики отзывов, optimistic UI в отдельных сценариях, попытка унифицировать Telegram BackButton, самостоятельный boot-watchdog и понятный scan-flow.

Главная проблема — модель взаимодействия пока ощущается как набор web-модалок с конкурирующими жестами, а не как предсказуемый iOS navigation stack. Найдены шесть критичных зон:

- pull-to-refresh может перезагрузить приложение во время жеста внутри модалки;
- часть модалок не участвует в общем BackButton/scroll-lock стеке;
- ошибка загрузки ListingDetail приводит к бесконечному экрану «Загрузка…»;
- внутренние переходы ListingDetail не имеют истории;
- scan-flow может пропустить выбор заведения или потерять прикреплённое фото из-за гонки;
- отключены системное масштабирование и доступное управление рейтингом.

Это статический аудит реального исходного кода и текущих артефактов `dist`, не тест на физическом iPhone. Риски, зависящие от клавиатуры и конкретной версии Telegram WebView, отмечены как такие.

Оценка трудозатрат:

- XS — до 2 часов
- S — 0,5–1 день
- M — 2–3 дня
- L — 4–7 дней
- XL — больше недели

Приоритет: P0 — ломает критический сценарий, может потерять данные или запереть пользователя; P1 — заметная регулярная проблема; P2 — полировка.

Бенчмарк основан на Apple HIG: tab bar должен представлять верхнеуровневые разделы и сохранять состояние каждого раздела; интерактивная область — не меньше 44×44 pt; модальные задачи должны иметь очевидное закрытие и защиту введённых данных; текст — поддерживать Dynamic Type; haptics должны быть содержательными и умеренными. См. [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Modality](https://developer.apple.com/design/human-interface-guidelines/modality), [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics).

В продуктовом сравнении я ориентировался на поиск и карточки заведений Yelp, check-in/taste profile Untappd, социальную фото-ленту Instagram и списки/карту/персональные рейтинги Beli: [Yelp](https://apps.apple.com/us/app/yelp-food-services-reviews/id284910350), [Untappd](https://apps.apple.com/us/app/untappd-find-drinks-you-love/id449141888), [Instagram](https://apps.apple.com/us/app/instagram/id389801252), [Beli](https://beliapp.com/Beli).

---

## 1. Навигация и иерархия

### 1.1. Состояние вкладок не сохраняется

**P1 · M** — [App.tsx:116](/D:/Приложения/Yelp/frontend/src/App.tsx:116), [main.tsx:127](/D:/Приложения/Yelp/frontend/src/main.tsx:127), [Home.tsx:142](/D:/Приложения/Yelp/frontend/src/screens/Home.tsx:142)

При переключении маршрута экран вкладки размонтируется. Возврат на главную запускает загрузку и перемешивание рекомендаций заново, теряя позицию ленты, поиск и часть локального состояния.

В нативном iOS каждая tab bar-вкладка обычно владеет отдельным navigation stack и восстанавливается на прежнем месте. Это особенно важно для каталогов вроде Yelp/Beli.

Рекомендация: сохранять scroll position и state по вкладкам либо держать верхнеуровневые экраны смонтированными. Повторный тап активной вкладки можно использовать для scroll-to-top, но обычный возврат не должен перетасовывать ленту.

### 1.2. Tab bar меняет геометрию после старта

**P1 · S** — [App.tsx:22](/D:/Приложения/Yelp/frontend/src/App.tsx:22), [App.tsx:45](/D:/Приложения/Yelp/frontend/src/App.tsx:45), [App.tsx:141](/D:/Приложения/Yelp/frontend/src/App.tsx:141)

`isAdmin` сначала `false`, затем определяется асинхронно. После загрузки в tab bar появляется пятый пункт, а существующие кнопки сдвигаются. Пользователь может нажать туда, где мгновение назад была другая вкладка.

В iOS состав и положение tab bar стабильны в течение сессии.

Рекомендация: определить роль до показа навигации либо с первого кадра резервировать одинаковую структуру. Названия «Хочу попробовать» и «Уведомления» стоит сократить до однословных или проверить на реальных узких экранах.

### 1.3. ListingDetail подменяет содержимое вместо navigation stack

**P0 · L** — [ListingDetail.tsx:243](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:243), [ListingDetail.tsx:645](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:645), [ListingDetail.tsx:1268](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:1268), [ListingDetail.tsx:1473](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:1473)

Переход из заведения в блюдо, похожую позицию или филиал делается через `setId`. Кнопка назад после этого закрывает всю карточку, а не возвращает на предыдущую сущность. История и scroll position отсутствуют.

Дополнительно при смене `id` не сбрасывается scroll контейнера: [ListingDetail.tsx:439](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:439). Новая карточка может открыться посередине.

В iOS push-переход создаёт новый элемент navigation stack; back возвращает к предыдущей карточке в прежней позиции.

Рекомендация: хранить стек `{id, scrollTop, activeTab, origin}`. Внутренние переходы должны быть push, BackButton/swipe — pop, и только пустой стек должен закрывать sheet.

### 1.4. `originVenue` может пережить переход к другой позиции

**P0 · S** — [ListingDetail.tsx:271](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:271), [ListingDetail.tsx:678](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:678)

После перехода через `setId` значение исходного заведения не очищается. При оценке другой позиции отзыв потенциально может привязаться к устаревшему `originVenue`.

В iOS контекст действия должен однозначно соответствовать экрану, на котором находится пользователь.

Рекомендация: хранить venue context как часть конкретного элемента detail-stack; очищать или пересчитывать его при каждом переходе.

### 1.5. Часть модалок отсутствует в общем стеке закрытия

**P0 · L** — [modalEsc.ts:30](/D:/Приложения/Yelp/frontend/src/lib/modalEsc.ts:30), [SupportModal.tsx:18](/D:/Приложения/Yelp/frontend/src/components/SupportModal.tsx:18), [CorrectionModal.tsx:26](/D:/Приложения/Yelp/frontend/src/components/CorrectionModal.tsx:26), [AddBusiness.tsx:59](/D:/Приложения/Yelp/frontend/src/components/AddBusiness.tsx:59), [People.tsx:88](/D:/Приложения/Yelp/frontend/src/components/People.tsx:88), [Business.tsx:696](/D:/Приложения/Yelp/frontend/src/screens/Business.tsx:696)

`useEscClose` одновременно регистрирует Telegram BackButton и блокирует фон. Несколько модалок его не используют. Вложенная форма коррекции, например, может не перехватить BackButton, поэтому закроется родительский ListingDetail. Фон некоторых sheet остаётся прокручиваемым.

В iOS верхняя модалка всегда владеет закрытием; переход назад не должен перескакивать через текущую задачу.

Рекомендация: единый `ModalStackProvider`. Любой sheet/dialog обязан регистрироваться, блокировать фон, получать BackButton первым и восстанавливать focus/scroll после закрытия.

### 1.6. Back реализован неодинаково

**P1 · S** — [Business.tsx:161](/D:/Приложения/Yelp/frontend/src/screens/Business.tsx:161), [Favorites.tsx:50](/D:/Приложения/Yelp/frontend/src/screens/Favorites.tsx:50), [MyRatings.tsx:144](/D:/Приложения/Yelp/frontend/src/screens/MyRatings.tsx:144)

Favorites использует `nav(-1)`, а Business — `nav('/me')`, добавляя новый history entry. Это может сформировать цикл «Профиль → Business → Профиль». В профиле действия «Оценить» и «Добавить фото» обе ведут просто на `/`, хотя обещают разные сценарии.

В iOS back делает pop, а action-кнопка приводит непосредственно к заявленному действию.

Рекомендация: отделить tab selection от history push; Business закрывать через pop с безопасным fallback. «Добавить фото» должно открывать ScanFab/file picker, «Оценить» — поиск позиции или review-flow.

---

## 2. Жесты и touch targets

### 2.1. Pull-to-refresh конфликтует со sheet-dismiss и может перезагрузить приложение

**P0 · M** — [pullToRefresh.ts:16](/D:/Приложения/Yelp/frontend/src/hooks/pullToRefresh.ts:16), [pullToRefresh.ts:39](/D:/Приложения/Yelp/frontend/src/hooks/pullToRefresh.ts:39), [App.tsx:88](/D:/Приложения/Yelp/frontend/src/App.tsx:88)

Глобальный обработчик смотрит на `document.scrollTop`, не проверяет открытые модалки и по умолчанию выполняет `window.location.reload()`. Жест вниз внутри sheet может одновременно закрывать sheet и активировать полную перезагрузку, теряя контекст или введённые данные.

Он также конфликтует с жестом TasteHero: [TasteHero.tsx:49](/D:/Приложения/Yelp/frontend/src/components/TasteHero.tsx:49).

В iOS refresh работает в конкретном scroll view, а не глобально поверх всех экранов, и обновляет модель без перезапуска приложения.

Рекомендация: привязать PTR к активному scroll container; отключать при открытой модалке, карте, горизонтальном или sheet-жесте; вместо reload вызывать refresh текущего экрана.

### 2.2. Swipe-back начинается с любой точки экрана

**P1 · M** — [swipeBack.ts:42](/D:/Приложения/Yelp/frontend/src/hooks/swipeBack.ts:42), [swipeBack.ts:78](/D:/Приложения/Yelp/frontend/src/hooks/swipeBack.ts:78)

Жест активируется не только от левого края. Исключения перечислены вручную, при этом в них нет `.carousel` и detail `.tabbar`: [ListingDetail.tsx:750](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:750), [ListingDetail.tsx:1028](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:1028).

В iOS interactive pop начинается у левого края и уступает приоритет горизонтальному контенту.

Рекомендация: arm только в первых 20–24 pt экрана; определять направление после небольшого slop; отменять распознавание при горизонтальной карусели, карте, табах и range-контролах.

### 2.3. На одной поверхности одновременно работают несколько recognizer

**P1 · M** — [ListingDetail.tsx:315](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:315), [ListingDetail.tsx:337](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:337), [People.tsx:149](/D:/Приложения/Yelp/frontend/src/components/People.tsx:149)

ListingDetail одновременно подключает swipe-dismiss, swipe-back и собственный pull жест медиаблока. UserProfile также совмещает dismiss и back. Это создаёт скачки transform и неоднозначное закрытие.

В UIKit/SwiftUI взаимоисключающие жесты имеют явный приоритет и failure requirements.

Рекомендация: один координатор жестов на surface с состояниями `idle / horizontal / vertical / native-scroll`; после определения оси остальные recognizer должны прекращать работу.

### 2.4. Много touch targets меньше 44 pt

**P1 · M** — [index.css:547](/D:/Приложения/Yelp/frontend/src/index.css:547), [index.css:954](/D:/Приложения/Yelp/frontend/src/index.css:954), [index.css:2038](/D:/Приложения/Yelp/frontend/src/index.css:2038), [index.css:3297](/D:/Приложения/Yelp/frontend/src/index.css:3297), [index.css:5537](/D:/Приложения/Yelp/frontend/src/index.css:5537)

Примеры: heart и overflow — 34×34 px, back — 36×36, scan close — 42×42, удаление фото — 22×22. Chips и голосование имеют лишь несколько пикселей вертикального padding.

В iOS рекомендуемая hit area — минимум 44×44 pt, даже если визуальная иконка меньше.

Рекомендация: добавить `min-width/min-height:44px`; для маленьких визуальных кнопок расширять hitbox псевдоэлементом или wrapper. Разнести соседние опасные действия минимум на 8 pt.

### 2.5. Один тап может вызвать несколько haptic impacts

**P1 · S** — [telegram.ts:20](/D:/Приложения/Yelp/frontend/src/lib/telegram.ts:20), [main.tsx:115](/D:/Приложения/Yelp/frontend/src/main.tsx:115), [NotInterested.tsx:21](/D:/Приложения/Yelp/frontend/src/components/NotInterested.tsx:21)

Глобальный `pointerdown`, глобальный `click` и локальные обработчики вызывают feedback повторно. Используется почти исключительно `impactOccurred('light')`, без различения выбора, успеха и ошибки.

В iOS haptic подтверждает конкретный результат, а не каждый технический event.

Рекомендация: оставить одну семантическую функцию. Для рейтинга/chips — `selectionChanged`, публикации — `notificationOccurred('success')`, ошибки — `error`; обычные ссылки и скролл не вибрируют.

---

## 3. Обратная связь и состояния

### 3.1. ListingDetail при ошибке остаётся в бесконечной загрузке

**P0 · S** — [ListingDetail.tsx:417](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:417), [ListingDetail.tsx:494](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:494), [swipeDismiss.ts:17](/D:/Приложения/Yelp/frontend/src/hooks/swipeDismiss.ts:17)

Ошибка API проглатывается, `data` остаётся `null`, пользователь навсегда видит «Загрузка…». Loader не содержит element с `sheetRef`, а swipe hook продолжает искать его через `requestAnimationFrame`, создавая постоянную работу CPU.

В iOS после ошибки показывается устойчивое error state с Retry и доступным Back.

Рекомендация: явная state machine `idle/loading/success/error`; прекратить RAF после unmount/таймаута; loader и error surface должны иметь тот же ref и кнопку закрытия.

### 3.2. Сетевые ошибки выглядят как пустые списки

**P1 · M** — [Favorites.tsx:15](/D:/Приложения/Yelp/frontend/src/screens/Favorites.tsx:15), [Alerts.tsx:28](/D:/Приложения/Yelp/frontend/src/screens/Alerts.tsx:28), [MapBrowse.tsx:112](/D:/Приложения/Yelp/frontend/src/components/MapBrowse.tsx:112), [Business.tsx:29](/D:/Приложения/Yelp/frontend/src/screens/Business.tsx:29)

Favorites сначала показывает пустое состояние до окончания запроса. Alerts и MapBrowse превращают ошибку в пустой массив, поэтому пользователь видит «Пока тихо» или «Ничего не найдено».

В нативных приложениях loading, genuine empty и unavailable — разные состояния.

Рекомендация: общий `AsyncState`; сохранять last-known-good данные, показывать компактный offline/error banner и Retry. Empty state допустим только после успешного ответа.

### 3.3. Поисковые ответы могут приходить не по порядку

**P1 · M** — [Home.tsx:332](/D:/Приложения/Yelp/frontend/src/screens/Home.tsx:332), [Home.tsx:511](/D:/Приложения/Yelp/frontend/src/screens/Home.tsx:511), [VenuePicker.tsx:41](/D:/Приложения/Yelp/frontend/src/components/VenuePicker.tsx:41), [ScanFab.tsx:33](/D:/Приложения/Yelp/frontend/src/components/ScanFab.tsx:33), [People.tsx:74](/D:/Приложения/Yelp/frontend/src/components/People.tsx:74)

Нет AbortController или номера запроса. Медленный ответ на старую строку может перезаписать результаты более нового запроса.

В iOS search controller отменяет предыдущую задачу при изменении query.

Рекомендация: debounce 200–300 мс, AbortController и request generation token; отдельно показывать initial loading и background refresh.

### 3.4. Optimistic UI реализован непоследовательно

**P1 · S** — [useFavorites.ts:18](/D:/Приложения/Yelp/frontend/src/hooks/useFavorites.ts:18), [ListingDetail.tsx:469](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:469), [FeedPost.tsx:45](/D:/Приложения/Yelp/frontend/src/components/FeedPost.tsx:45)

Глобальный favorites hook не откатывает изменение при ошибке, хотя ListingDetail делает rollback. Голосование ждёт сервер, проглатывает ошибку и не блокирует повторные нажатия.

В iOS мгновенное изменение допускается, но оно должно либо подтвердиться, либо откатиться с понятной ошибкой.

Рекомендация: единый mutation helper: optimistic patch, dedupe, disabled pending state, rollback и toast с Retry.

### 3.5. Lazy-экраны иногда дают пустой кадр

**P1 · S** — [main.tsx:129](/D:/Приложения/Yelp/frontend/src/main.tsx:129), [Home.tsx:938](/D:/Приложения/Yelp/frontend/src/screens/Home.tsx:938), [Alerts.tsx:94](/D:/Приложения/Yelp/frontend/src/screens/Alerts.tsx:94)

`Suspense fallback={null}` означает, что первый тап по лениво загружаемой функции визуально ничего не делает.

В iOS нажатие немедленно меняет состояние кнопки или начинает transition с placeholder.

Рекомендация: короткий skeleton соответствующей геометрии; при открытии модалки сразу показывать shell, а данные подгружать внутри.

### 3.6. Scan-flow содержит две гонки и неверную семантику Cancel

**P0 · M** — [ScanFab.tsx:214](/D:/Приложения/Yelp/frontend/src/components/ScanFab.tsx:214), [ScanFab.tsx:247](/D:/Приложения/Yelp/frontend/src/components/ScanFab.tsx:247), [ScanFab.tsx:321](/D:/Приложения/Yelp/frontend/src/components/ScanFab.tsx:321)

После выбора кандидата результат распознавания очищается до загрузки полной карточки — возможен визуально «мёртвый» тап. Распознавание и загрузка фото идут параллельно; ReviewForm может открыться до получения `photoUrl`, и фото не попадёт в отзыв. Закрытие VenuePicker переводит пользователя на этап оценки с `venue=null`, хотя по смыслу Cancel должен вернуть назад.

В нативном пошаговом flow каждый переход атомарен, Cancel возвращает на предыдущий шаг, а обязательный attachment не теряется.

Рекомендация: конечный автомат scan-flow; ждать завершения upload перед открытием формы либо передавать локальный pending attachment; `VenuePicker.onClose` возвращает к candidates; между candidate и picker показывать progress; запросы отменять после закрытия.

---

## 4. Формы и ввод

### 4.1. Новый отзыв автоматически получает рейтинг 5

**P0 · S** — [ReviewForm.tsx:73](/D:/Приложения/Yelp/frontend/src/components/ReviewForm.tsx:73), [ReviewForm.tsx:404](/D:/Приложения/Yelp/frontend/src/components/ReviewForm.tsx:404)

Форма стартует с пятью баллами, а Publish доступен без осознанного выбора. Это создаёт случайные максимальные оценки и искажает рейтинг продукта.

В Untappd/Yelp оценка считается вводом пользователя, а не предзаполненным согласием.

Рекомендация: начальное значение `null/0`; Publish недоступен до выбора; после первой попытки публикации — inline validation и перевод focus к рейтингу.

### 4.2. Компонент рейтинга недоступен с клавиатуры и VoiceOver

**P0 · M** — [StarInput.tsx:15](/D:/Приложения/Yelp/frontend/src/components/StarInput.tsx:15)

Звёзды — кликабельные `span`; нет button/radiogroup/slider, клавиатурного управления, названий и текущего значения.

В iOS VoiceOver должен произнести «Оценка, 4 из 5» и позволить изменить её свайпом или кнопками.

Рекомендация: `fieldset` + radio buttons либо slider с `aria-valuemin/max/now`; визуальные звёзды сделать декоративными; hit area каждой оценки — 44 pt.

### 4.3. Черновики спасают текст, но сценарий закрытия неполный

**P1 · S** — [ReviewForm.tsx:61](/D:/Приложения/Yelp/frontend/src/components/ReviewForm.tsx:61), [ReviewForm.tsx:94](/D:/Приложения/Yelp/frontend/src/components/ReviewForm.tsx:94), [ReviewForm.tsx:128](/D:/Приложения/Yelp/frontend/src/components/ReviewForm.tsx:128)

Наличие черновика — сильная сторона. Но предупреждение учитывает только текст: изменения рейтинга, фото, цены, даты и характеристик могут быть закрыты без предупреждения. Восстановление старого черновика происходит молча и без срока жизни.

В iOS форма либо сохраняет весь draft автоматически, либо предлагает «Сохранить / Удалить / Продолжить».

Рекомендация: dirty state по всей модели, timestamp и версия черновика; banner «Черновик восстановлен» с Undo/Clear; вместо `window.confirm` — нативно выглядящий action sheet.

### 4.4. Поля не имеют устойчивой form-семантики

**P1 · M** — [ReviewForm.tsx:293](/D:/Приложения/Yelp/frontend/src/components/ReviewForm.tsx:293), [AddBusiness.tsx:95](/D:/Приложения/Yelp/frontend/src/components/AddBusiness.tsx:95), [VenuePicker.tsx:109](/D:/Приложения/Yelp/frontend/src/components/VenuePicker.tsx:109)

`label` не связан с полем через `htmlFor`, формы не используют нормальный submit, а телефон/URL не задают `type`, `inputMode` и autocomplete. Return на клавиатуре не гарантирует ожидаемого действия.

В iOS правильный тип поля вызывает подходящую клавиатуру и AutoFill.

Рекомендация: `<form onSubmit>`, уникальные id, `htmlFor`, `type=tel/url/search`, `inputMode`, `enterKeyHint`, `autocomplete`; ошибки связывать через `aria-describedby`.

### 4.5. Клавиатура может закрыть CTA и нижние поля

**P1 · L** — [index.css:677](/D:/Приложения/Yelp/frontend/src/index.css:677), [index.css:3659](/D:/Приложения/Yelp/frontend/src/index.css:3659), [index.css:4775](/D:/Приложения/Yelp/frontend/src/index.css:4775), [ReviewForm.tsx:390](/D:/Приложения/Yelp/frontend/src/components/ReviewForm.tsx:390)

Модалки используют `vh`, форма длинная, Publish находится в самом низу. Нет работы с Telegram stable viewport/VisualViewport, поэтому в iOS WebView клавиатура с высокой вероятностью перекроет часть формы или кнопку.

В нативном iOS scroll view автоматически доводит активное поле над клавиатурой; primary action остаётся доступным.

Рекомендация: `100dvh` плюс Telegram stable-height variable; `scrollIntoView` при focus; sticky footer внутри формы или Telegram MainButton; учитывать keyboard inset.

### 4.6. Добавление нескольких фото имеет all-or-nothing поведение

**P1 · M** — [ReviewForm.tsx:149](/D:/Приложения/Yelp/frontend/src/components/ReviewForm.tsx:149)

`Promise.all` делает одну ошибку общей ошибкой всей партии, хотя часть файлов могла уже загрузиться. Нет прогресса, отмены и статуса конкретного фото.

В iOS каждый attachment имеет отдельный progress/retry/remove.

Рекомендация: очередь файлов с состояниями `queued/uploading/uploaded/error`; сохранять успешно загруженные; повторять только ошибочные.

---

## 5. Визуальная иерархия и читаемость

### 5.1. Интерфейс принудительно светлый

**P1 · L** — [index.css:1](/D:/Приложения/Yelp/frontend/src/index.css:1), [index.css:5492](/D:/Приложения/Yelp/frontend/src/index.css:5492)

Большинство цветов жёстко заданы как белые/чёрные. Dark media query меняет лишь отдельные skeleton/caret и не образует полноценной темы.

Современные iOS-приложения используют semantic colors и синхронизируются с системной темой.

Рекомендация: слой semantic tokens `--surface`, `--surface-elevated`, `--text`, `--separator`, `--scrim`; светлые/тёмные значения и интеграция с Telegram `colorScheme/themeParams`.

### 5.2. Типографика мелкая и не масштабируется

**P0 · L** — [index.css:25](/D:/Приложения/Yelp/frontend/src/index.css:25), [index.css:92](/D:/Приложения/Yelp/frontend/src/index.css:92), [index.css:1814](/D:/Приложения/Yelp/frontend/src/index.css:1814), [index.css:5072](/D:/Приложения/Yelp/frontend/src/index.css:5072)

Основной размер — 15 px; многие подписи — 9–11 px. Все размеры фиксированные, без пользовательского масштаба.

Apple рекомендует проектировать вокруг системного body-текста и Dynamic Type; слишком мелкий вспомогательный текст должен либо масштабироваться, либо исчезать раньше, чем становится нечитаемым.

Рекомендация: базовый body 16–17 px, secondary минимум 12–13 px; `rem/clamp`; тесты при 200% text size; избегать передачи важного смысла девятипиксельными подписями.

### 5.3. Верхняя safe area не учитывается

**P1 · M** — [index.css:61](/D:/Приложения/Yelp/frontend/src/index.css:61), [index.css:4383](/D:/Приложения/Yelp/frontend/src/index.css:4383), [index.css:618](/D:/Приложения/Yelp/frontend/src/index.css:618)

Учитывается в основном нижний `safe-area-inset-bottom`; сверху используются фиксированные отступы. В Telegram добавляется собственная content-safe-area, которая может отличаться от CSS `env()`.

В iOS контент и tappable controls не должны попадать под Dynamic Island, навигационную область или home indicator.

Рекомендация: единые переменные, объединяющие `env(safe-area-inset-*)` и `--tg-content-safe-area-inset-*`; применить к app shell, map header, full-screen sheet и fixed controls.

### 5.4. Нижняя навигация может перекрыть контент

**P1 · S** — [index.css:61](/D:/Приложения/Yelp/frontend/src/index.css:61), [index.css:618](/D:/Приложения/Yelp/frontend/src/index.css:618)

Контент получает фиксированный `padding-bottom:76px`, а фактическая высота tab bar зависит от safe-area, текста и появления пятой вкладки. Длинный label может увеличить высоту.

В iOS safe-area content inset вычисляется от реального tab bar.

Рекомендация: экспортировать фактическую высоту nav через CSS custom property/ResizeObserver и использовать её для content inset.

### 5.5. Focus styles и reduced motion неполные

**P1 · M** — [index.css:97](/D:/Приложения/Yelp/frontend/src/index.css:97), [index.css:147](/D:/Приложения/Yelp/frontend/src/index.css:147), [index.css:3870](/D:/Приложения/Yelp/frontend/src/index.css:3870), [index.css:4993](/D:/Приложения/Yelp/frontend/src/index.css:4993)

У некоторых полей и категорий outline отключён без замены. `prefers-reduced-motion` затрагивает лишь часть анимаций, но не FAB pulse, sheet transitions, smooth scrolling и gesture transforms.

В iOS focus и Reduce Motion — системные пользовательские настройки.

Рекомендация: общий `:focus-visible` ring; в reduced-motion отключать декоративные pulse/nudge/celebration и сокращать transition до мгновенного состояния.

---

## 6. Производительность восприятия

### 6.1. Главный bundle остаётся тяжёлым

**P1 · L** — [Home.tsx:12](/D:/Приложения/Yelp/frontend/src/screens/Home.tsx:12), [People.tsx:6](/D:/Приложения/Yelp/frontend/src/components/People.tsx:6), [MapView.tsx:2](/D:/Приложения/Yelp/frontend/src/components/MapView.tsx:2)

Текущий основной JS в `dist` — около 594 KB raw / 184 KB gzip, CSS — около 95 KB / 22 KB gzip. Home статически затягивает People, а People — ListingDetail; это частично нейтрализует lazy loading. Leaflet также легко попадает в общий граф.

В нативном ощущении первый экран должен стать интерактивным раньше необязательных карт, профилей и модалок.

Рекомендация: разорвать cross-import цепочки, вынести People/Map/PhotoPost/detail-модалки в самостоятельные lazy chunks; prefetch после первого idle.

### 6.2. Home создаёт сетевой burst

**P1 · M** — [Home.tsx:249](/D:/Приложения/Yelp/frontend/src/screens/Home.tsx:249), [Home.tsx:414](/D:/Приложения/Yelp/frontend/src/screens/Home.tsx:414), [TrainingScale.tsx:18](/D:/Приложения/Yelp/frontend/src/components/TrainingScale.tsx:18)

При монтировании параллельно запускаются несколько feed/recommendation/user/community запросов. Это конкурирует за мобильную сеть и увеличивает время до полезного above-the-fold контента.

Рекомендация: один агрегирующий bootstrap endpoint или staged priority: профиль + первый hero/feed, затем события/community/дополнительные ленты.

### 6.3. Фото предзагружаются агрессивнее, чем пользователь успевает увидеть

**P1 · M** — [Home.tsx:212](/D:/Приложения/Yelp/frontend/src/screens/Home.tsx:212), [SmartImg.tsx:74](/D:/Приложения/Yelp/frontend/src/components/SmartImg.tsx:74), [FeedPost.tsx:63](/D:/Приложения/Yelp/frontend/src/components/FeedPost.tsx:63)

Home preloads десятки изображений из нескольких списков. `SmartImg` начинает загрузку за 1000 px до viewport, аватары feed грузятся eager.

В Instagram-подобной ленте high priority обычно получают hero и ближайший следующий media item, а остальные загружаются по мере приближения.

Рекомендация: priority только первому экрану; root margin 200–400 px; responsive image sizes/srcset; аватары и удалённые карточки — lazy; учитывать Save-Data.

### 6.4. Scroll tracking выполняет React-state работу на каждом событии

**P2 · S** — [Home.tsx:166](/D:/Приложения/Yelp/frontend/src/screens/Home.tsx:166), [analytics.ts:47](/D:/Приложения/Yelp/frontend/src/analytics.ts:47)

Home вызывает state logic на каждом scroll. Аналитика при этом измеряет document, хотя ListingDetail и другие sheet прокручиваются внутри собственных контейнеров.

Рекомендация: IntersectionObserver для порога feed/scroll-to-top; scroll-depth отслеживать на конкретном контейнере и throttle через `requestAnimationFrame`.

### 6.5. Проверка обновления bundle фактически не работает

**P1 · XS** — [App.tsx:64](/D:/Приложения/Yelp/frontend/src/App.tsx:64)

Regex `/index-[w-]+.js/` ищет буквальную `w`, а не `\w`; реальный hash вида `index-Dnm7uTdG.js` не определяется. Проверка freshness выходит раньше времени, поэтому открытая старая сессия не узнаёт о новом frontend.

Рекомендация: корректный escaped regex либо читать имя entry из manifest; тестом покрыть реальные Vite filenames.

---

## 7. Доступность

### 7.1. Отключены pinch zoom и пользовательское масштабирование

**P0 · XS** — [index.html:5](/D:/Приложения/Yelp/frontend/index.html:5), [main.tsx:68](/D:/Приложения/Yelp/frontend/src/main.tsx:68)

`maximum-scale=1`, `user-scalable=no` и глобальная блокировка gesture/double tap не позволяют слабовидящему пользователю увеличить интерфейс.

Это противоречит базовой iOS accessibility-модели.

Рекомендация: убрать ограничения viewport и глобальный preventDefault для zoom; блокировать жесты только локально там, где это действительно необходимо.

### 7.2. Модалки не являются доступными диалогами

**P0 · L** — [ReviewForm.tsx:220](/D:/Приложения/Yelp/frontend/src/components/ReviewForm.tsx:220), [ListingDetail.tsx:720](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:720), [People.tsx:88](/D:/Приложения/Yelp/frontend/src/components/People.tsx:88)

В коде нет `role="dialog"`, `aria-modal`, focus trap, `inert` для фона или восстановления focus на кнопку-источник. VoiceOver может уйти за sheet и продолжить читать невидимый фон.

Рекомендация: общий Dialog/Sheet primitive с labelled title, focus containment, первоначальным focus, inert backdrop и restore focus.

### 7.3. Интерактивные карточки реализованы как `div`

**P1 · L** — [ListingCard.tsx:31](/D:/Приложения/Yelp/frontend/src/components/ListingCard.tsx:31), [ListRow.tsx:45](/D:/Приложения/Yelp/frontend/src/components/ListRow.tsx:45), [FeedPost.tsx:53](/D:/Приложения/Yelp/frontend/src/components/FeedPost.tsx:53), [Alerts.tsx:59](/D:/Приложения/Yelp/frontend/src/screens/Alerts.tsx:59), [People.tsx:37](/D:/Приложения/Yelp/frontend/src/components/People.tsx:37)

Они доступны мыши/touch, но не получают нормальный keyboard focus и не объявляют роль действия.

В iOS accessibility tree интерактивный элемент обязан быть button/link с понятным именем.

Рекомендация: использовать `<button>`/`<a>`; если это невозможно — `role`, `tabIndex`, Enter/Space, но нативная семантика предпочтительнее.

### 7.4. Иконки, tabs и состояния не объявлены assistive technology

**P1 · M** — [ListingCard.tsx:126](/D:/Приложения/Yelp/frontend/src/components/ListingCard.tsx:126), [ListingDetail.tsx:731](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:731), [Filters.tsx:83](/D:/Приложения/Yelp/frontend/src/components/Filters.tsx:83), [ListingDetail.tsx:1028](/D:/Приложения/Yelp/frontend/src/components/ListingDetail.tsx:1028)

Favorite не использует `aria-pressed`; в Detail accessible label всегда «В избранное», даже когда действие удаляет. Tabs/chips не имеют `aria-selected`, `aria-controls` или `aria-expanded`.

Рекомендация: toggle button с актуальным действием и `aria-pressed`; tablist/tab/tabpanel для detail и профиля; disclosure-кнопки с `aria-expanded`.

### 7.5. Асинхронные статусы и изображения плохо озвучиваются

**P1 · M** — [Stars.tsx:3](/D:/Приложения/Yelp/frontend/src/components/Stars.tsx:3), [FeedPost.tsx:73](/D:/Приложения/Yelp/frontend/src/components/FeedPost.tsx:73), [PhotoPostModal.tsx:114](/D:/Приложения/Yelp/frontend/src/components/PhotoPostModal.tsx:114), [ScanFab.tsx:97](/D:/Приложения/Yelp/frontend/src/components/ScanFab.tsx:97)

Пять декоративных звёзд читаются по отдельности; важные фото получают пустой alt; loading/toast/error не используют `aria-live` или `aria-busy`.

Telegram отдельно рекомендует давать доступные названия input и image-контенту. [Telegram Mini Apps](https://core.telegram.org/bots/webapps)

Рекомендация: единый spoken label «Рейтинг 4,2 из 5», визуальные звёзды `aria-hidden`; содержательный alt для пользовательских фото; polite/assertive live regions для прогресса и ошибок.

---

## 8. Telegram Mini App

### 8.1. BackButton покрывает не все поверхности

**P0 · L** — [modalEsc.ts:30](/D:/Приложения/Yelp/frontend/src/lib/modalEsc.ts:30), [modalEsc.ts:74](/D:/Приложения/Yelp/frontend/src/lib/modalEsc.ts:74)

Есть хорошая основа для общего стека, но незарегистрированные sheet обходят её. Кроме того, если API BackButton недоступен при первой попытке bind, `bound` уже становится `true`, и повторной привязки не будет.

Telegram предоставляет BackButton именно для навигации внутри Mini App. [Telegram Mini Apps](https://core.telegram.org/bots/webapps)

Рекомендация: bind после `ready` с повторной проверкой; source-of-truth — единый modal/navigation stack; показывать BackButton только когда есть куда сделать pop.

### 8.2. Не используются Telegram viewport и content-safe-area

**P1 · L** — [telegram.ts:12](/D:/Приложения/Yelp/frontend/src/lib/telegram.ts:12), [index.css:677](/D:/Приложения/Yelp/frontend/src/index.css:677)

Приложение вызывает `ready/expand`, но не слушает `viewportChanged` и не использует `--tg-viewport-stable-height`/content safe area. Это особенно заметно при клавиатуре и частично раскрытом WebView.

Рекомендация: общий viewport adapter; высоту full-screen/sheet брать из Telegram stable height; safe-area вычислять из Telegram и CSS env.

### 8.3. Telegram MainButton не используется для основного действия формы

**P1 · M** — [ReviewForm.tsx:404](/D:/Приложения/Yelp/frontend/src/components/ReviewForm.tsx:404)

Publish находится внутри длинного sheet и может уйти под клавиатуру. Telegram BottomButton/MainButton умеет оставаться системно доступным, показывать progress и disabled state.

Рекомендация: при открытой ReviewForm синхронизировать MainButton с валидностью и отправкой; после закрытия гарантированно очищать handler и скрывать кнопку.

### 8.4. Telegram theme API игнорируется

**P1 · L** — [telegram.ts:12](/D:/Приложения/Yelp/frontend/src/lib/telegram.ts:12), [index.css:1](/D:/Приложения/Yelp/frontend/src/index.css:1)

Не читаются `themeParams`, `colorScheme`, `themeChanged`; не задаются header/background/bottom bar colors. Белая поверхность может конфликтовать с тёмным Telegram и давать резкий flash.

Рекомендация: маппинг Telegram theme tokens на semantic CSS variables; слушать `themeChanged`; синхронизировать header/background/bottom bar.

### 8.5. Vertical swipes отключаются глобально

**P2 · S** — [telegram.ts:18](/D:/Приложения/Yelp/frontend/src/lib/telegram.ts:18)

`disableVerticalSwipes()` действует на всё приложение. Это защищает собственные жесты, но отнимает у пользователя Telegram-жест сворачивания даже на обычных статичных экранах.

Telegram рекомендует сохранять вертикальные свайпы, если они не конфликтуют с интерфейсом приложения. [Telegram Mini Apps](https://core.telegram.org/bots/webapps)

Рекомендация: отключать vertical swipes только на карте, во время активного sheet drag или другого конфликтующего жеста; после завершения возвращать `enableVerticalSwipes()`.

### 8.6. Первый тап по FAB не соответствует иконке камеры

**P1 · S** — [ScanFab.tsx:282](/D:/Приложения/Yelp/frontend/src/components/ScanFab.tsx:282), [ScanFab.tsx:292](/D:/Приложения/Yelp/frontend/src/components/ScanFab.tsx:292)

Основная кнопка с камерой и label «Сканировать» сразу открывает gallery input. Выбор «Камера / Галерея» появляется только при пересъёмке.

В iOS камера означает открытие камеры, а комбинированный источник обычно показывается action sheet.

Рекомендация: на первом тапе показывать source sheet либо открывать камеру напрямую; если продуктово предпочтительна галерея — заменить иконку и accessible label.

---

# Приоритизированный TOP-15

| № | Улучшение | Приоритет | Трудозатраты |
|---:|---|:---:|:---:|
| 1 | Исправить scan-flow: Cancel VenuePicker, race upload/review, loading после выбора кандидата, отмена запросов | P0 | M |
| 2 | Убрать глобальный reload-PTR и разрешать refresh только активному scroll container без открытой модалки | P0 | M |
| 3 | Добавить error state ListingDetail и прекратить бесконечный RAF-поиск отсутствующего ref | P0 | S |
| 4 | Сделать настоящий detail navigation stack с back/pop, восстановлением scroll и привязанным `originVenue` | P0 | L |
| 5 | Ввести единый Modal/Sheet stack для Telegram BackButton, scroll lock и порядка закрытия | P0 | L |
| 6 | Убрать `user-scalable=no` и глобальную блокировку zoom | P0 | XS |
| 7 | Переделать рейтинг: пустое начальное значение, обязательный выбор, доступный StarInput | P0 | M |
| 8 | Добавить dialog semantics, focus trap, inert background и восстановление focus | P0/P1 | L |
| 9 | Привести touch targets к 44×44 и заменить кликабельные `div` на button/link | P1 | L |
| 10 | Использовать Telegram viewport/content-safe-area и MainButton в форме отзыва | P1 | L |
| 11 | Разделить loading/empty/error/offline, добавить отмену и упорядочивание поисковых запросов | P1 | L |
| 12 | Сохранять состояние и scroll каждой tab bar-вкладки; исключить геометрический сдвиг admin tab | P1 | M |
| 13 | Разрезать основной bundle, отложить Map/People/ListingDetail и снизить агрессивный preload фото | P1 | L |
| 14 | Ввести semantic colors, Telegram dark theme, масштабируемую типографику и полный reduced-motion | P1 | XL |
| 15 | Централизовать haptics и аналитику critical funnel: scan → candidate → venue → review → publish/error | P1 | M |

Код не изменялся.
