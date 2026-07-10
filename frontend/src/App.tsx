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
    return () => {
      stop = true;
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
