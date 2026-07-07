import { useState } from 'react';
import { api } from '../api';
import type { TasteRanking } from '../types';

// Shown right after rating a dish/drink: gives instant meaning (your personal
// rank + delta) and a reason to taste the next one (compare). Not gamification —
// it's the user's own evolving taste, working from the first review.
export function TasteResult({
  data,
  itemId,
  onCompareNext,
  onClose,
  onShareStory,
  onShareFriend,
}: {
  data: TasteRanking;
  itemId: string;
  onCompareNext: (next: { id: string; name: string }) => void;
  onClose: () => void;
  onShareStory?: () => void; // share the rating to a Telegram story
  onShareFriend?: () => void; // send this check-in to a friend in Telegram chat
}) {
  const [winner, setWinner] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [compared, setCompared] = useState(false);

  const pick = (winnerId: string) => {
    if (!data.compareWith) return;
    setWinner(winnerId);
  };
  const saveCompare = () => {
    if (!winner || !data.compareWith) return;
    const loserId = winner === itemId ? data.compareWith.id : itemId;
    api.compare({ winnerId: winner, loserId, reason, category: data.category }).catch(() => {});
    setCompared(true);
  };

  const deltaLine =
    data.delta == null
      ? null
      : data.delta > 0.05
        ? `На +${data.delta.toFixed(1)} выше твоего среднего по «${data.category}»`
        : data.delta < -0.05
          ? `На ${Math.abs(data.delta).toFixed(1)} ниже твоего среднего по «${data.category}»`
          : `Ровно на уровне твоего среднего по «${data.category}»`;

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 3200 }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="tr-rank">
          Это твой <b>#{data.rank}</b> из {data.total} в категории «{data.category}»
        </div>
        {deltaLine && <div className="tr-delta">{deltaLine}</div>}

        <div className="tr-top-title">🏆 Твой топ «{data.category}»</div>
        <div className="tr-top">
          {data.top.map((t, i) => (
            <div key={t.id} className={'tr-row' + (t.id === itemId ? ' me' : '')}>
              <span className="tr-pos">{i + 1}</span>
              <span className="tr-name">{t.name}</span>
              <span className="tr-rating">{t.rating.toFixed(1)}★</span>
            </div>
          ))}
        </div>

        {data.compareWith && !compared && (
          <div className="tr-vs">
            <div className="tr-vs-q">Что вкуснее?</div>
            <div className="tr-vs-row">
              <button
                className={'tr-vs-btn' + (winner === itemId ? ' on' : '')}
                onClick={() => pick(itemId)}
              >
                {data.thisName}
              </button>
              <span className="tr-vs-or">vs</span>
              <button
                className={'tr-vs-btn' + (winner === data.compareWith.id ? ' on' : '')}
                onClick={() => pick(data.compareWith!.id)}
              >
                {data.compareWith.name}
              </button>
            </div>
            {winner && (
              <>
                <input
                  className="tr-vs-reason"
                  placeholder="Почему? кратко (необязательно)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={120}
                />
                <button className="btn" style={{ marginTop: 8 }} onClick={saveCompare}>
                  Сохранить выбор
                </button>
              </>
            )}
          </div>
        )}
        {compared && <div className="tr-delta" style={{ marginTop: 12 }}>Запомнили твой вкус ✓</div>}

        {data.next ? (
          <button className="btn" style={{ marginTop: 16 }} onClick={() => onCompareNext(data.next!)}>
            Сравни — попробуй «{data.next.name}»
          </button>
        ) : (
          <button className="btn" style={{ marginTop: 16 }} onClick={onClose}>
            Отлично
          </button>
        )}
        {onShareStory && (
          <button className="btn secondary" style={{ marginTop: 10 }} onClick={onShareStory}>
            📲 Поделиться в сторис
          </button>
        )}
        {onShareFriend && (
          <button className="btn secondary" style={{ marginTop: 10 }} onClick={onShareFriend}>
            📤 Отправить другу
          </button>
        )}
        <button className="btn secondary" style={{ marginTop: 10 }} onClick={onClose}>
          Позже
        </button>
      </div>
    </div>
  );
}
