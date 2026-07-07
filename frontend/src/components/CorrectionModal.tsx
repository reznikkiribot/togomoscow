import { useState } from 'react';
import { api } from '../api';

export function CorrectionModal({
  listingId,
  venueName,
  onClose,
}: {
  listingId: string;
  venueName: string;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!text.trim()) return;
    setBusy(true);
    api
      .sendCorrection(listingId, text.trim())
      .then(() => setSent(true))
      .catch(() => setBusy(false));
  };

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 3000 }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <h3>Спасибо!</h3>
            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, margin: '8px 0 16px' }}>
              Правка отправлена модератору и владельцу заведения.
            </p>
            <button className="btn" onClick={onClose}>
              Готово
            </button>
          </div>
        ) : (
          <>
            <h3>Предложить правку</h3>
            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, marginBottom: 10 }}>
              Что не так или чего не хватает в карточке «{venueName}»? Ваша правка придёт модератору
              и владельцу.
            </p>
            <div className="field">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Например: неверный адрес, нет телефона, закрылись…"
                rows={5}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn secondary" onClick={onClose} disabled={busy}>
                Отмена
              </button>
              <button className="btn" onClick={send} disabled={busy || !text.trim()}>
                {busy ? 'Отправка…' : 'Отправить'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
