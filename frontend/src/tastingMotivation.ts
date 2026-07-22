import type { GameState, Review } from './types';

export function tastingMotivation(review?: Review, game?: GameState | null): string {
  if (review?.saveContext?.firstTasting) return '🥇 Вы стали первым дегустатором';

  if (game?.level.nextAt != null) {
    const left = game.level.nextAt - (game.counters.quality ?? 0);
    if (left > 0 && left <= 3) return `📈 До нового уровня осталось ${left} дегустаций`;
  }

  if (game?.justEarned?.length) return '🎯 Алгоритм лучше понял ваш вкус';
  return '🤖 Теперь рекомендации стали точнее';
}
