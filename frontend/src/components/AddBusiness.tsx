import { useState } from 'react';
import { api } from '../api';

const CATEGORIES = ['Ресторан', 'Кафе', 'Бар', 'Паб', 'Фастфуд', 'Кофейня', 'Пекарня', 'Столовая'];
const COUNTRIES = ['Россия', 'Беларусь', 'Казахстан'];

export function AddBusiness({ onClose, initialName }: { onClose: () => void; initialName?: string }) {
  const [step, setStep] = useState<'choice' | 'form' | 'done'>('choice');
  const [rel, setRel] = useState<'customer' | 'owner'>('customer');
  const [country, setCountry] = useState('Россия');
  const [city, setCity] = useState('Москва');
  const [name, setName] = useState(initialName ?? '');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = rel === 'owner';
  const phoneRequired = isOwner;

  const start = (r: 'customer' | 'owner') => {
    setRel(r);
    setStep('form');
  };

  const submit = () => {
    if (!name.trim() || !city.trim() || !category) {
      setError('Заполните название, город и категорию');
      return;
    }
    if (phoneRequired && !phone.trim()) {
      setError('Для сотрудников телефон обязателен');
      return;
    }
    setBusy(true);
    setError(null);
    api
      .submitBusiness({
        relationship: rel,
        name: name.trim(),
        city: city.trim(),
        address: address.trim() || undefined,
        category,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        notes: notes.trim() || undefined,
        country,
      })
      .then(() => setStep('done'))
      .catch(() => {
        setError('Не удалось отправить');
        setBusy(false);
      });
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 3000 }} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {step === 'choice' && (
          <>
            <h3>Добавить заведение</h3>
            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, marginBottom: 14 }}>
              Кем вы приходитесь заведению, которое хотите добавить?
            </p>
            <button className="btn secondary" style={{ marginBottom: 10 }} onClick={() => start('customer')}>
              Я посетитель
            </button>
            <button className="btn secondary" onClick={() => start('owner')}>
              Я работаю в этом месте
            </button>
          </>
        )}

        {step === 'form' && (
          <>
            <h3>Добавить заведение</h3>
            <div className="meta" style={{ color: 'var(--hint)', fontSize: 13, marginBottom: 8 }}>
              {isOwner ? 'Вы сотрудник — станете владельцем после проверки' : 'Вы посетитель'}
            </div>

            <div className="field">
              <label>Страна</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="section-title">Обязательная информация</div>
            <div className="field">
              <label>Название</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Кофемания" />
            </div>
            <div className="field">
              <label>Город</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" />
            </div>
            <div className="field">
              <label>Адрес (необязательно)</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом" />
            </div>
            <div className="field">
              <label>Категория</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Выберите…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {phoneRequired && (
              <div className="field">
                <label>Телефон</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7…" />
              </div>
            )}

            <div className="section-title">Дополнительно</div>
            {!phoneRequired && (
              <div className="field">
                <label>Телефон</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7…" />
              </div>
            )}
            <div className="field">
              <label>Сайт</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
            </div>
            {!isOwner && (
              <div className="field">
                <label>Заметка для команды</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            )}

            {error && <p style={{ color: 'crimson', fontSize: 13 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn secondary" onClick={() => setStep('choice')} disabled={busy}>
                Назад
              </button>
              <button className="btn" onClick={submit} disabled={busy}>
                {busy ? 'Отправка…' : 'Отправить'}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <h3>Заявка отправлена</h3>
            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, margin: '8px 0 16px' }}>
              Мы проверим заведение и добавим его на платформу.
              {isOwner ? ' После одобрения оно появится в вашем кабинете.' : ''}
            </p>
            <button className="btn" onClick={onClose}>
              Готово
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
