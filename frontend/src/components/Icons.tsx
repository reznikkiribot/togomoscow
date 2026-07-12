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

// ---- category tiles ----
export const IcRestaurant = ({ size }: P) => svg(<><path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10" /><path d="M17 3c-1.5 0-2.5 1.6-2.5 4s1 4 2.5 4v10" /></>, size);
export const IcCoffee = ({ size }: P) => svg(<><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" /><path d="M17 9h2.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 2c-.5 1 .5 1.5 0 2.5M12 2c-.5 1 .5 1.5 0 2.5" /></>, size);
export const IcCake = ({ size }: P) => svg(<><path d="M4 21h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7Z" /><path d="M4 16c1.5 1.4 2.5 1.4 4 0s2.5-1.4 4 0 2.5 1.4 4 0 2.5-1.4 4 0" /><path d="M12 5v4M12 3v.01" /></>, size);
export const IcBar = ({ size }: P) => svg(<><path d="M5 4h14l-7 8-7-8Z" /><path d="M12 12v7M8 21h8" /></>, size);
// served dish under a cloche (distinct from the fork/knife «Рестораны» icon)
export const IcDish = ({ size }: P) => svg(<><path d="M4 16a8 8 0 0 1 16 0" /><path d="M3 16h18" /><path d="M12 8V6" /></>, size);
export const IcWine = ({ size }: P) => svg(<><path d="M7 3h10c0 5-2 8-5 8s-5-3-5-8Z" /><path d="M12 11v7M8 21h8" /></>, size);
