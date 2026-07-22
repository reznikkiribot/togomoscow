// Clean line icons (premium, consistent stroke) — replaces emoji in the tab bar
// and category tiles. currentColor so they inherit active/inactive states.
type P = { size?: number };
const svg = (children: React.ReactNode, size = 24) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

// ---- tab bar ----
export const IcHome = ({ size }: P) => svg(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>, size);
export const IcBookmark = ({ size }: P) => svg(<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />, size);
export const IcUser = ({ size }: P) => svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>, size);
export const IcTools = ({ size }: P) => svg(<><path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3 18v3h3l6.5-6.5a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.1-.5-.5-2.1 2.7-2.5Z" /></>, size);
export const IcBell = ({ size }: P) => svg(<><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></>, size);

// ---- category tiles ----
export const IcRestaurant = ({ size }: P) => svg(<><path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10" /><path d="M17 3c-1.5 0-2.5 1.6-2.5 4s1 4 2.5 4v10" /></>, size);
export const IcCoffee = ({ size }: P) => svg(<><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" /><path d="M17 9h2.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 2c-.5 1 .5 1.5 0 2.5M12 2c-.5 1 .5 1.5 0 2.5" /></>, size);
export const IcCake = ({ size }: P) => svg(<><path d="M4 21h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7Z" /><path d="M4 16c1.5 1.4 2.5 1.4 4 0s2.5-1.4 4 0 2.5 1.4 4 0 2.5-1.4 4 0" /><path d="M12 5v4M12 3v.01" /></>, size);
export const IcBar = ({ size }: P) => svg(<><path d="M5 4h14l-7 8-7-8Z" /><path d="M12 12v7M8 21h8" /></>, size);
// served dish under a cloche (distinct from the fork/knife «Рестораны» icon)
export const IcDish = ({ size }: P) => svg(<><path d="M4 16a8 8 0 0 1 16 0" /><path d="M3 16h18" /><path d="M12 8V6" /></>, size);
export const IcWine = ({ size }: P) => svg(<><path d="M7 3h10c0 5-2 8-5 8s-5-3-5-8Z" /><path d="M12 11v7M8 21h8" /></>, size);

// ---- detail actions ----
// These replaced the bare text glyphs ↗ ✎ 🌐 ✈ 🅥 ☆: those are font characters,
// not colour emoji, so they inherited `color: var(--text)` and vanished into the
// white action circle in dark mode (reported: «Не погрузились значки»).
export const IcShare = ({ size }: P) => svg(<><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M12 15V3" /><path d="m8 7 4-4 4 4" /></>, size);
export const IcRate = ({ size }: P) => svg(<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />, size);
export const IcGlobe = ({ size }: P) => svg(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" /></>, size);
export const IcRoute = ({ size }: P) => svg(<><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></>, size);
export const IcTelegram = ({ size }: P) => svg(<><path d="M21 4 3 11l5 2 2 6 3-4 5 4 3-15Z" /><path d="m8 13 9-6-6 8" /></>, size);
export const IcVk = ({ size }: P) => svg(<><path d="M3 8c1 6 4.5 9 8 9h1.5v-3.5c1.8.4 3.4 2 4 3.5H20c-.7-2.3-2.3-3.9-3.6-4.6 1.2-.8 2.6-2.4 3.1-4.4h-3c-.6 1.8-1.9 3.2-3 3.7V8h-3v4.6C9.2 12 7.4 10.2 6.5 8H3Z" /></>, size);
