import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useEscClose } from '../modalEsc';
import { haptic } from '../telegram';
import type { Listing, RecognizeResult } from '../types';
import { ReviewForm } from './ReviewForm';
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
function ScanSearch({ onPick }: { onPick: (l: Listing) => void }) {
  const [q, setQ] = useState('');
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
  result,
  preview,
  onClose,
  onRetake,
  onRetryAnalysis,
  onPickCandidate,
  onPickSearch,
}: {
  busy: boolean;
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
            ИИ анализирует фото...
          </div>
        ) : result && result.candidates.length ? (
          <>
            <div className="scan-title">Похоже, это...</div>
            <div className="scan-list">
              {result.candidates.map((c) => (
                <button key={c.id} className="scan-cand" onClick={() => onPickCandidate(c.id, result)}>
                  <div className="scan-cand-thumb">
                    {c.photoUrl ? <img src={c.photoUrl} alt="" /> : <span>🍽</span>}
                  </div>
                  <div className="scan-cand-body">
                    <b>{c.name}</b>
                    <span className="scan-cand-meta">
                      {c.reviewCount > 0 ? `★ ${c.avgRating.toFixed(1)} · ${c.reviewCount}` : 'Нет оценок'}
                    </span>
                  </div>
                  <span className="scan-conf">{Math.round(c.confidence * 100)}%</span>
                </button>
              ))}
            </div>
            <ScanSearch onPick={onPickSearch} />
            <button className="scan-retry" onClick={onRetryAnalysis}>
              Попробовать еще раз
            </button>
            <button className="scan-retry scan-retake" onClick={onRetake}>
              Сделать фото заново
            </button>
          </>
        ) : (
          <div className="scan-empty">
            <div>Не удалось распознать 🤔</div>
            {result?.diagnostic && <small>{result.diagnostic}</small>}
            <ScanSearch onPick={onPickSearch} />
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
  const [result, setResult] = useState<RecognizeResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Listing | null>(null);
  const [venue, setVenue] = useState<{ id?: string; name: string; pending?: boolean } | null>(null);
  const [stage, setStage] = useState<'idle' | 'pickVenue' | 'rate'>('idle');
  const uploadedUrl = useRef<string | undefined>(undefined);
  const lastFile = useRef<File | null>(null);

  const reset = () => {
    setResult(null);
    setBusy(false);
    setChosen(null);
    setVenue(null);
    setStage('idle');
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return null;
    });
    uploadedUrl.current = undefined;
    lastFile.current = null;
  };

  const runRecognition = async (file: File) => {
    setBusy(true);
    setResult(null);
    try {
      const r = await api.recognize(file, 'auto');
      if (r.autoOpen && r.candidates[0]) {
        await pickCandidate(r.candidates[0].id, r);
      } else {
        setResult(r);
        setBusy(false);
      }
    } catch (e) {
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
    api
      .visionFeedback({
        photoUrl: uploadedUrl.current,
        caption: r.caption,
        mode: r.mode,
        predictedIds: r.candidates.map((c) => c.id),
        topConfidence: r.candidates[0]?.confidence,
        chosenId: id,
      })
      .catch(() => {});
    haptic('medium');
    setResult(null);
    setBusy(false);
    try {
      const full = await api.listing(id);
      setChosen(full as unknown as Listing);
      setStage('pickVenue');
    } catch {
      reset();
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    lastFile.current = file;
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    uploadedUrl.current = undefined;
    api.upload(file).then((u) => (uploadedUrl.current = u)).catch(() => {});
    await runRecognition(file);
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

  return (
    <>
      <button className={'scan-fab' + (pulse ? ' pulse' : '')} onClick={() => setSrcMenu(true)} aria-label="Сканировать блюдо или напиток">
        <CamIcon />
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

      {(busy || result) && (
        <ScanDialog
          busy={busy}
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
          onPick={(v) => {
            setVenue({ id: v.id, name: v.name });
            setStage('rate');
          }}
          onAdded={(name) => {
            setVenue({ name, pending: true });
            setStage('rate');
          }}
          onClose={() => setStage('rate')}
        />
      )}

      {stage === 'rate' && chosen && (
        <ReviewForm
          listing={chosen}
          venue={venue}
          initialPhotoUrls={uploadedUrl.current ? [uploadedUrl.current] : []}
          onClose={reset}
          onSaved={() => {
            haptic('medium');
            reset();
          }}
        />
      )}
    </>
  );
}
