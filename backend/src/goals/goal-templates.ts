// Phrase templates for the personal goal block. Kept OUT of the components so
// wording can be A/B-tested and edited from the admin cabinet without a deploy
// (DB rows under game_config key `goalTemplates` override this default set).
//
// Owner rules baked in here:
//  • the motivation is about the USER becoming a stronger, more authoritative
//    taster — never «помогите приложению» / «обучите рекомендации»;
//  • no invented numbers. A template may only reference placeholders the
//    generator actually filled from real data.

export type GoalTone = 'calm' | 'push' | 'proud';

export type GoalTemplate = {
  /** which goal family this belongs to */
  type: string;
  /** shown only when remaining <= this (goal-gradient copy); null = any distance */
  maxRemaining?: number | null;
  /** shown only when remaining >= this */
  minRemaining?: number | null;
  tone: GoalTone;
  icon: string;
  title: string;
  subtitle: string;
};

// Placeholders: {remaining} {current} {target} {name} {level} {plural:оценка}
export const DEFAULT_GOAL_TEMPLATES: GoalTemplate[] = [
  // ---- specialization: the flagship "become an expert" family ----
  {
    type: 'specialization', maxRemaining: 2, tone: 'push', icon: '🎖',
    title: 'Звание «{name}» почти ваше',
    subtitle: 'Осталось {remaining} {plural:дегустация} — и звание закреплено за вами.',
  },
  {
    type: 'specialization', maxRemaining: null, minRemaining: 3, tone: 'calm', icon: '🎖',
    title: 'Путь к званию «{name}»',
    subtitle: 'Ещё {remaining} {plural:дегустация} — и вы получите звание знатока.',
  },
  {
    type: 'specialization', maxRemaining: 1, tone: 'proud', icon: '🏅',
    title: 'Один шаг до звания «{name}»',
    subtitle: 'Одна дегустация отделяет вас от звания.',
  },

  // ---- level: overall taster rank ----
  {
    type: 'level', maxRemaining: 2, tone: 'push', icon: '⭐',
    title: 'До уровня «{name}» рукой подать',
    subtitle: 'Ещё {remaining} {plural:качественная дегустация} — и вы {level}.',
  },
  {
    type: 'level', maxRemaining: null, minRemaining: 3, tone: 'calm', icon: '⭐',
    title: 'Новый уровень дегустатора',
    subtitle: 'До уровня «{name}» осталось {remaining} {plural:дегустация}.',
  },

  // ---- achievement: rare rewards ----
  {
    type: 'achievement', maxRemaining: 1, tone: 'proud', icon: '🏆',
    title: 'Редкая награда рядом',
    subtitle: 'Одна дегустация — и достижение «{name}» ваше.',
  },
  {
    type: 'achievement', maxRemaining: null, minRemaining: 2, tone: 'calm', icon: '🏆',
    title: 'Достижение «{name}»',
    subtitle: 'Осталось {remaining} — и награда открыта.',
  },

  // ---- discovery: be the FIRST taster (unique status) ----
  {
    type: 'discovery', maxRemaining: null, tone: 'proud', icon: '🥇',
    title: 'Станьте первым дегустатором',
    subtitle: 'Эти блюда ещё никто не оценил. Ваша оценка станет первой.',
  },
  {
    type: 'discovery', maxRemaining: null, tone: 'push', icon: '🥇',
    title: 'Никем не открытые блюда',
    subtitle: 'Оцените первым — и ваше имя будет стоять на карточке.',
  },

  // ---- streak: momentum ----
  {
    type: 'streak', maxRemaining: 1, tone: 'push', icon: '🔥',
    title: 'Серия {current} {plural:день} подряд',
    subtitle: 'Одна дегустация сегодня — и серия продолжится.',
  },
  {
    type: 'streak', maxRemaining: null, minRemaining: 2, tone: 'calm', icon: '🔥',
    title: 'Серия дегустаций',
    subtitle: 'До {target}-дневной серии осталось {remaining} {plural:день}.',
  },

  // ---- reputation / influence: the weight of your opinion ----
  {
    type: 'reputation', maxRemaining: null, tone: 'proud', icon: '💎',
    title: 'Вес вашего мнения',
    subtitle: 'Ещё {remaining} {plural:качественная дегустация} — и ваши оценки будут влиять сильнее.',
  },

  // ---- exploration: new territory ----
  {
    type: 'exploration', maxRemaining: null, tone: 'calm', icon: '🗺',
    title: 'Неисследованная категория',
    subtitle: 'Вы ещё не оценивали «{name}». Откройте её для себя.',
  },

  // ---- comeback: a specialization losing ground ----
  {
    type: 'comeback', maxRemaining: null, tone: 'push', icon: '☕',
    title: 'Вы давно не оценивали «{name}»',
    subtitle: 'Одна дегустация вернёт вас в форму по этой категории.',
  },
];

const PLURAL_FORMS: Record<string, [string, string, string]> = {
  'дегустация': ['дегустация', 'дегустации', 'дегустаций'],
  'оценка': ['оценка', 'оценки', 'оценок'],
  'день': ['день', 'дня', 'дней'],
  'качественная дегустация': ['качественная дегустация', 'качественные дегустации', 'качественных дегустаций'],
  'заведение': ['заведение', 'заведения', 'заведений'],
};

function pluralRu(n: number, forms: [string, string, string]) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

/** Fill a template. Returns null when the text still contains an unresolved
 *  placeholder — better to show nothing than to invent a number. */
export function renderTemplate(
  text: string,
  vars: Record<string, string | number | undefined | null>,
): string | null {
  const remaining = Number(vars.remaining ?? 0);
  let missing = false;
  const filled = text
    .replace(/\{plural:([^}]+)\}/g, (_m, word: string) => {
      const forms = PLURAL_FORMS[word];
      return forms ? pluralRu(remaining, forms) : word;
    })
    .replace(/\{(\w+)\}/g, (_m, key: string) => {
      const value = vars[key];
      if (value == null || value === '') {
        missing = true; // an un-computable number -> drop this variant entirely
        return '';
      }
      return String(value);
    });
  return missing ? null : filled.replace(/\s+/g, ' ').trim();
}

/** Pick a template variant for this goal, biased by how close the goal is and
 *  varied by `seed` so the same goal is not always phrased identically. */
export function pickTemplate(
  templates: GoalTemplate[],
  type: string,
  remaining: number,
  seed: number,
): GoalTemplate | null {
  const eligible = templates.filter(
    (t) =>
      t.type === type &&
      (t.maxRemaining == null || remaining <= t.maxRemaining) &&
      (t.minRemaining == null || remaining >= t.minRemaining),
  );
  if (!eligible.length) return null;
  return eligible[Math.abs(Math.floor(seed)) % eligible.length];
}
