import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { retryImageUrl, thumb } from '../img';

type StockPhoto = {
  type?: string | null;
  category?: string | null;
  name?: string | null;
  seed?: string | null;
  src?: string | null;
};

function colorFromName(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 42% 42%)`;
}

function stockUrl(stock?: StockPhoto): string | undefined {
  if (!stock) return undefined;
  if (stock.src) return stock.src;
  return (
    `/api/venue-stock?type=${encodeURIComponent(stock.type ?? '')}` +
    `&category=${encodeURIComponent(stock.category ?? '')}` +
    `&name=${encodeURIComponent(stock.name ?? '')}` +
    `&seed=${encodeURIComponent(stock.seed ?? stock.name ?? '')}`
  );
}

/** Resized thumbnail -> original -> cache-busted retries -> stock -> monogram. */
export function SmartImg({
  src,
  className,
  alt = '',
  width = 600,
  loading = 'lazy',
  draggable,
  stock,
  stockFallbacks = [],
  monogram,
  style,
}: {
  src?: string | null;
  className?: string;
  alt?: string;
  width?: 200 | 400 | 600 | 900;
  loading?: 'eager' | 'lazy';
  draggable?: boolean;
  stock?: StockPhoto;
  stockFallbacks?: Array<string | null | undefined>;
  monogram?: string | null;
  style?: CSSProperties;
}) {
  const [retryToken] = useState(() => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
  const fallbackSignature = stockFallbacks.join('|');
  const candidates = useMemo(() => {
    const result: string[] = [];
    const add = (value?: string | null) => {
      if (value && !result.includes(value)) result.push(value);
    };
    if (src) {
      const resized = thumb(src, width);
      // Keep the resize endpoint as an independent candidate. It buffers and
      // converts the object, so it can work even when raw streaming is flaky.
      add(resized);
      add(src);
      if (resized) add(retryImageUrl(resized, retryToken));
      add(retryImageUrl(src, retryToken));
    }
    for (const fallback of stockFallbacks) add(fallback);
    add(stockUrl(stock));
    return result;
  }, [src, width, retryToken, stock?.type, stock?.category, stock?.name, stock?.seed, stock?.src, fallbackSignature]);

  const signature = candidates.join('\n');
  const [idx, setIdx] = useState(0);
  const candidateKey = `${signature}:${idx}`;
  const [loadedKey, setLoadedKey] = useState('');
  const [nearViewport, setNearViewport] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => setIdx(0), [signature]);

  useEffect(() => {
    if (loading === 'eager') {
      setNearViewport(true);
      return;
    }
    const el = imgRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '1000px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, signature, idx]);

  useEffect(() => {
    if (!nearViewport || idx >= candidates.length || loadedKey === candidateKey) return;
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) return;
    const timeout = window.setTimeout(() => setIdx((current) => current + 1), 12_000);
    return () => window.clearTimeout(timeout);
  }, [nearViewport, idx, signature, candidates.length, candidateKey, loadedKey]);

  if (idx < candidates.length) {
    return (
      <img
        key={candidateKey}
        ref={imgRef}
        className={className}
        src={candidates[idx]}
        alt={alt}
        loading={nearViewport ? 'eager' : loading}
        decoding="async"
        draggable={draggable}
        style={style}
        onLoad={() => setLoadedKey(candidateKey)}
        onError={() => setIdx((current) => current + 1)}
      />
    );
  }

  const label = (monogram || alt || '?').trim();
  return (
    <div
      className={`${className ?? ''} ph mono smart-img-mono`.trim()}
      style={{ background: colorFromName(label), ...style }}
      role="img"
      aria-label={alt || label}
    >
      {(label[0] ?? '?').toUpperCase()}
    </div>
  );
}
