import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useEscClose } from '../modalEsc';
import { haptic } from '../telegram';
import { shareReviewToStory } from '../reviewStory';
import { loadCategoryProgress } from '../categoryGate';
import { tastingMotivation } from '../tastingMotivation';
import type { Listing, RecognizeResult } from '../types';
import { ReviewForm } from './ReviewForm';
import { TasteResult } from './TasteResult';
import { VenuePicker } from './VenuePicker';

function CamIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

// Search inside the recognition sheet: when the AI didn't guess it, the user finds
// the item manually — that correction is the strongest training signal we get.
function ScanSearch({ onPick, initial }: { onPick: (l: Listing) => void; initial?: string }) {
  const [q, setQ] = useState(initial ?? '');
  const [found, setFound] = useState<Listing[]>([]);
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) { setFound([]); return; }
    const t = setTimeout(() => {
      api.searchAll(query)
        .then((list) => setFound(list.filter((l) => l.type === 'DISH' || l.type === 'DRINK').slice(0, 5)))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="scan-search">
      <input
        placeholder="Не то? Найдите вручную…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {found.length > 0 && (
        <div className="scan-list">
          {found.map((l) => (
            <button key={l.id} className="scan-cand" onClick={() => onPick(l)}>
              <div className="scan-cand-thumb">
                {l.photoUrl ? <img src={l.photoUrl} alt="" loading="lazy" /> : <span>🍽</span>}
              </div>
              <div className="scan-cand-body">
                <b>{l.name}</b>
                <span className="scan-cand-meta">{l.category ?? ''}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ScanDialog({
  busy,
  busyText,
  error,
  result,
  preview,
  onClose,
  onRetake,
  onRetryAnalysis,
  onPickCandidate,
  onPickSearch,
}: {
  busy: boolean;
  busyText: string;
  error: string | null;
  result: RecognizeResult | null;
  preview: string | null;
  onClose: () => void;
  onRetake: () => void;
  onRetryAnalysis: () => void;
  onPickCandidate: (id: string, result: RecognizeResult) => void;
  onPickSearch: (l: Listing) => void;
}) {
  useEscClose(onClose);

  return (
    <div className="modal-backdrop scan-backdrop" style={{ zIndex: 3600 }} onClick={() => !busy && onClose()}>
      <div className="scan-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="scan-back" onClick={onClose} aria-label="Закрыть">
          <BackIcon />
        </button>
        {preview && <img className="scan-preview" src={preview} alt="" />}
        {busy ? (
          <div className="scan-loading">
            <span className="scan-spinner" />
            {busyText}
          </div>
        ) : result && result.candidates.length ? (
          <>
            {error && <div className="scan-error" role="alert">{error}</div>}
            {result.labelText && <div className="scan-label-badge">🍷 Этикетка: {result.labelText}</div>}
            <div className="scan-title">Что именно на фото? Подтвердите</div>
            <div className="scan-list">
              {result.candidates.map((c, i) => (
                <button
                  key={c.id}
                  className={'scan-cand' + (i === 0 && result.topConfident ? ' top' : '')}
                  onClick={() => onPickCandidate(c.id, result)}
                >
                  <div className="scan-cand-thumb">
                    {c.photoUrl ? <img src={c.photoUrl} alt="" /> : <span>🍽</span>}
                  </div>
                  <div className="scan-cand-body">
                    <b>{c.name}</b>
                    <span className="scan-cand-meta">
                      {i === 0 && result.topConfident ? '✓ скорее всего это' : c.reviewCount > 0 ? `★ ${c.avgRating.toFixed(1)} · ${c.reviewCount}` : 'Нет оценок'}
                    </span>
                  </div>
                  <span className="scan-conf">{Math.round(c.confidence * 100)}%</span>
                </button>
              ))}
            </div>
            <ScanSearch onPick={onPickSearch} initial={result.labelText} />
            <button className="scan-retry" onClick={onRetryAnalysis}>
              Попробовать еще раз
            </button>
            <button className="scan-retry scan-retake" onClick={onRetake}>
              Сделать фото заново
            </button>
          </>
        ) : (
          <div className="scan-empty">
            {error && <div className="scan-error" role="alert">{error}</div>}
            {result?.labelText ? (
              <div>🍷 Этикетка: <b>{result.labelText}</b></div>
            ) : (
              <div>Не удалось распознать 🤔</div>
            )}
            {result?.diagnostic && !result?.labelText && <small>{result.diagnostic}</small>}
            <ScanSearch onPick={onPickSearch} initial={result?.labelText} />
            <button className="scan-retry" onClick={onRetryAnalysis}>
              Попробовать еще раз
            </button>
            <button className="scan-retry scan-retake" onClick={onRetake}>
              Сделать фото заново
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScanFab() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [srcMenu, setSrcMenu] = useState(false);
  useEffect(() => {
    const open = () => galleryRef.current?.click();
    window.addEventListener('scan-open', open);
    return () => window.removeEventListener('scan-open', open);
  }, []);
  // one soft pulse per session draws the eye to the key action (UX Core: anchoring
  // attention with motion — once, not constantly)
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem('fabPulsed')) return;
    sessionStorage.setItem('fabPulsed', '1');
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 3600);
    return () => clearTimeout(t);
  }, []);
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState('ИИ анализирует фото...');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecognizeResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Listing | null>(null);
  const [venue, setVenue] = useState<{ id?: string; name: string; pending?: boolean } | null>(null);
  const [stage, setStage] = useState<'idle' | 'pickVenue' | 'rate'>('idle');
  const [success, setSuccess] = useState<{
    data: import('../types').TasteRanking | null;
    itemId: string;
    itemName: string;
    savedRating: number;
    totalRatings: number;
    next: { id: string; name: string } | null;
    motivation: string;
  } | null>(null);
  const uploadedUrl = useRef<string | undefined>(undefined);
  const uploadPromise = useRef<Promise<string | undefined> | null>(null);
  const lastFile = useRef<File | null>(null);
  const lastPhotoSource = useRef<'camera' | 'gallery'>('gallery');
  const flowToken = useRef(0);

  const reset = () => {
    flowToken.current += 1;
    setResult(null);
    setBusy(false);
    setError(null);
    setChosen(null);
    setVenue(null);
    setSuccess(null);
    setStage('idle');
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return null;
    });
    uploadedUrl.current = undefined;
    uploadPromise.current = null;
    lastFile.current = null;
  };

  const runRecognition = async (file: File, token = flowToken.current) => {
    setBusy(true);
    setBusyText('ИИ анализирует фото...');
    setError(null);
    setResult(null);
    try {
      const r = await api.recognize(file, 'auto');
      if (flowToken.current !== token) return;
      // NEVER auto-open (owner rule): always show the choices and let the user
      // confirm — even when the AI is 100% sure. The top match is pre-highlighted.
      setResult(r);
      setBusy(false);
    } catch (e) {
      if (flowToken.current !== token) return;
      setResult({
        caption: '',
        mode: 'auto',
        candidates: [],
        autoOpen: false,
        diagnostic: e instanceof Error ? e.message : 'recognize failed',
      });
      setBusy(false);
    }
  };

  const pickCandidate = async (id: string, r: RecognizeResult) => {
    if (busy) return;
    const token = flowToken.current;
    haptic('medium');
    setBusy(true);
    setBusyText('Готовим карточку и фото...');
    setError(null);
    try {
      const ensurePhoto = async () => {
        const existing = await (uploadPromise.current ?? Promise.resolve(uploadedUrl.current));
        if (existing) return existing;
        if (!lastFile.current) return undefined;
        const retry = api.upload(lastFile.current, lastPhotoSource.current).catch(() => undefined);
        uploadPromise.current = retry;
        return retry;
      };
      const [full, photoUrl] = await Promise.all([
        api.listing(id),
        ensurePhoto(),
      ]);
      if (flowToken.current !== token) return;
      if (!photoUrl) throw new Error('upload failed');
      uploadedUrl.current = photoUrl;
      api
        .visionFeedback({
          photoUrl,
          caption: r.caption,
          mode: r.mode,
          predictedIds: r.candidates.map((c) => c.id),
          topConfidence: r.candidates[0]?.confidence,
          chosenId: id,
        })
        .catch(() => {});
      setChosen(full as unknown as Listing);
      setBusy(false);
      setStage('pickVenue');
    } catch {
      if (flowToken.current !== token) return;
      setBusy(false);
      setError('Не удалось подготовить карточку или фото. Попробуйте выбрать позицию ещё раз.');
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const source = e.currentTarget === cameraRef.current ? 'camera' : 'gallery';
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const token = ++flowToken.current;
    lastFile.current = file;
    lastPhotoSource.current = source;
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    uploadedUrl.current = undefined;
    uploadPromise.current = api.upload(file, source)
      .then((u) => {
        if (flowToken.current === token) uploadedUrl.current = u;
        return u;
      })
      .catch(() => undefined);
    await runRecognition(file, token);
  };

  const retryAnalysis = () => {
    if (!lastFile.current || busy) return;
    void runRecognition(lastFile.current);
  };

  const retakePhoto = () => {
    if (busy) return;
    setResult(null);
    setSrcMenu(true);
  };

  // manual search pick = a CORRECTION: negative signal for the shown top-5,
  // positive for the chosen item — the strongest training example we get
  const pickFromSearch = (l: Listing) => {
    const r: RecognizeResult =
      result ?? { caption: '', mode: 'auto', candidates: [], autoOpen: false };
    void pickCandidate(l.id, r);
  };

  // "Скан" caption under the FAB for the first 2 sessions — after that the
  // camera icon is assumed learned (obviousness without permanent clutter)
  const [fabLabel] = useState(() => {
    try {
      const n = Number(localStorage.getItem('scanFabSeen') || '0');
      if (n < 2) { localStorage.setItem('scanFabSeen', String(n + 1)); return true; }
    } catch { /* private mode */ }
    return false;
  });

  return (
    <>
      <button className={'scan-fab' + (pulse ? ' pulse' : '')} onClick={() => setSrcMenu(true)} aria-label="Сканировать блюдо или напиток">
        <CamIcon />
        {fabLabel && <span className="scan-fab-label">Скан</span>}
      </button>
      {/* camera input: straight to the native camera.
          gallery input: `multiple` makes iOS SKIP its source menu and open the photo
          picker directly (we still use only the first file) — no "Файлы" step. */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={onPick} />

      {srcMenu && (
        <div className="modal-backdrop" style={{ zIndex: 3590 }} onClick={() => setSrcMenu(false)}>
          <div className="scan-src" onClick={(e) => e.stopPropagation()}>
            <button className="scan-src-btn" onClick={() => { setSrcMenu(false); cameraRef.current?.click(); }}>
              📷 Сделать фото
            </button>
            <button className="scan-src-btn" onClick={() => { setSrcMenu(false); galleryRef.current?.click(); }}>
              🖼 Из галереи
            </button>
            <button className="scan-src-btn cancel" onClick={() => setSrcMenu(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {stage === 'idle' && (busy || result) && (
        <ScanDialog
          busy={busy}
          busyText={busyText}
          error={error}
          result={result}
          preview={preview}
          onClose={reset}
          onRetake={retakePhoto}
          onRetryAnalysis={retryAnalysis}
          onPickCandidate={pickCandidate}
          onPickSearch={pickFromSearch}
        />
      )}

      {stage === 'pickVenue' && chosen && (
        <VenuePicker
          itemId={chosen.id}
          onPick={(v) => {
            setVenue({ id: v.id, name: v.name });
            setStage('rate');
          }}
          onAdded={(name) => {
            setVenue({ name, pending: true });
            setStage('rate');
          }}
          onClose={() => {
            setVenue(null);
            setStage('idle');
          }}
        />
      )}

      {stage === 'rate' && chosen && (
        <ReviewForm
          listing={chosen}
          venue={venue}
          initialPhotoUrls={uploadedUrl.current ? [uploadedUrl.current] : []}
          onClose={reset}
          onSaved={(media) => {
            const rated = chosen;
            haptic('medium');
            void shareReviewToStory(rated, media);
            reset();
            setSuccess({
              data: null,
              itemId: rated.id,
              itemName: rated.name,
              savedRating: media?.review?.rating ?? 0,
              totalRatings: 1,
              next: null,
              motivation: tastingMotivation(media?.review),
            });
            Promise.all([
              api.tasteRanking(rated.id).catch(() => null),
              loadCategoryProgress(true).catch(() => null),
              api.recsysFeed(8).catch(() => [] as Listing[]),
              api.gameState().catch(() => null),
            ]).then(([ranking, progress, recs, game]) => {
              const fallback = recs.find((l) => l.id !== rated.id);
              setSuccess((current) => current?.itemId === rated.id ? {
                ...current,
                data: ranking,
                totalRatings: progress?.total ?? current.totalRatings,
                next: ranking?.next ?? (fallback ? { id: fallback.id, name: fallback.name } : null),
                motivation: tastingMotivation(media?.review, game),
              } : current);
            });
          }}
        />
      )}
      {success && (
        <TasteResult
          data={success.data}
          itemId={success.itemId}
          itemName={success.itemName}
          savedRating={success.savedRating}
          totalRatings={success.totalRatings}
          motivation={success.motivation}
          next={success.next}
          onClose={() => setSuccess(null)}
          onCompareNext={(next) => {
            setSuccess(null);
            api.listing(next.id).then((listing) => {
              setChosen(listing as Listing);
              setStage('pickVenue');
            }).catch(() => {});
          }}
        />
      )}
    </>
  );
}
