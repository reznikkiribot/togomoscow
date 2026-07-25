// Single source of truth for the guided-first-tasting state.
//
// The "already seen" mark lives in localStorage, so the only way to replay the
// onboarding for EVERYONE is to bump this version: every stored mark from an
// older version stops counting and the coach runs once more for every user.
// Bump it whenever the onboarding flow itself changes materially.
export const ONBOARDING_VERSION = 2;

const SEEN_KEY = 'coachFirstRateDone';
const FORCE_KEY = 'forceOnboarding';

/** Has this user already been through the CURRENT onboarding version? */
export function onboardingSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === String(ONBOARDING_VERSION);
  } catch {
    return false; // private mode: treat as not seen, it's a one-screen coach
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(SEEN_KEY, String(ONBOARDING_VERSION));
  } catch { /* private mode */ }
}

/** Admin "replay onboarding" switch — survives one launch, then clears. */
export function onboardingForced(): boolean {
  try {
    return localStorage.getItem(FORCE_KEY) === '1';
  } catch {
    return false;
  }
}

export function forceOnboarding() {
  try {
    localStorage.removeItem(SEEN_KEY);
    localStorage.setItem(FORCE_KEY, '1');
  } catch { /* private mode */ }
}

export function clearForcedOnboarding() {
  try {
    localStorage.removeItem(FORCE_KEY);
  } catch { /* private mode */ }
}
