import { useRef, useState } from 'react';
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

function ScanDialog({
  busy,
  result,
  preview,
  onClose,
  onRetake,
  onRetryAnalysis,
  onPickCandidate,
}: {
  busy: boolean;
  result: RecognizeResult | null;
  preview: string | null;
  onClose: () => void;
  onRetake: () => void;
  onRetryAnalysis: () => void;
  onPickCandidate: (id: string, result: RecognizeResult) => void;
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
  const fileRef = useRef<HTMLInputElement>(null);
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
    fileRef.current?.click();
  };

  return (
    <>
      <button className="scan-fab" onClick={() => fileRef.current?.click()} aria-label="Сканировать блюдо или напиток">
        <CamIcon />
      </button>
      {/* no `capture` attr: iOS/Telegram then offers BOTH camera and gallery;
          on desktop (incl. Mac Photos) it opens the normal media picker */}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />

      {(busy || result) && (
        <ScanDialog
          busy={busy}
          result={result}
          preview={preview}
          onClose={reset}
          onRetake={retakePhoto}
          onRetryAnalysis={retryAnalysis}
          onPickCandidate={pickCandidate}
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
