import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { telegramWebApp } from './telegram';
import { cachedTastingLocation, cacheTastingLocation } from './tastingGeo';

export type TastingLocation = { lat: number; lng: number; accuracy: number; capturedAt: string };

async function telegramLocation(requestPermission: boolean): Promise<{ point: TastingLocation | null; permission: string }> {
  const manager = telegramWebApp()?.LocationManager;
  if (!manager) return { point: null, permission: 'unavailable' };
  await new Promise<void>((resolve) => {
    if (manager.isInited) resolve();
    else manager.init(() => resolve());
  });
  if (!manager.isLocationAvailable) return { point: null, permission: 'unavailable' };
  if (!requestPermission && !manager.isAccessGranted) {
    return { point: null, permission: manager.isAccessRequested ? 'denied' : 'prompt' };
  }
  const data = await new Promise<TelegramLocationData | null>((resolve) => manager.getLocation(resolve));
  if (!data) return { point: null, permission: manager.isAccessGranted ? 'unknown' : 'denied' };
  return {
    point: {
      lat: data.latitude,
      lng: data.longitude,
      accuracy: data.horizontal_accuracy ?? Number.MAX_SAFE_INTEGER,
      capturedAt: new Date().toISOString(),
    },
    permission: 'granted',
  };
}

async function browserLocation(requestPermission: boolean): Promise<{ point: TastingLocation | null; permission: string }> {
  if (!navigator.geolocation) return { point: null, permission: 'unavailable' };
  if (!requestPermission && navigator.permissions?.query) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state !== 'granted') return { point: null, permission: permission.state };
    } catch { /* old WebView */ }
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => resolve({
        point: { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, capturedAt: new Date(timestamp || Date.now()).toISOString() },
        permission: 'granted',
      }),
      (error) => resolve({ point: null, permission: error.code === error.PERMISSION_DENIED ? 'denied' : 'unknown' }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  });
}

async function readLocation(requestPermission: boolean) {
  const telegram = await telegramLocation(requestPermission);
  if (telegram.permission !== 'unavailable') return telegram;
  return browserLocation(requestPermission);
}

export function useTastingLocation() {
  const [location, setLocation] = useState<TastingLocation | null>(() => cachedTastingLocation());
  const [showConsent, setShowConsent] = useState(false);
  const [consented, setConsented] = useState(false);
  const [textVersion, setTextVersion] = useState('geo-trust-v1');
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);
  useEffect(() => {
    api.locationConsent().then(async ({ consent, textVersion: version }) => {
      if (!mounted.current) return;
      setTextVersion(version);
      if (!consent) {
        setShowConsent(true);
        return;
      }
      setConsented(Boolean(consent.consented && !consent.revokedAt));
      if (consent.consented && !consent.revokedAt) {
        const result = await readLocation(false);
        if (mounted.current && result.point) {
          setLocation(result.point);
          cacheTastingLocation(result.point);
        }
      }
    }).catch(() => {
      // Trust verification is optional; API/Telegram failures never block a tasting.
    });
  }, []);

  const allow = useCallback(async () => {
    setShowConsent(false);
    const result = await readLocation(true);
    setConsented(true);
    if (result.point) {
      setLocation(result.point);
      cacheTastingLocation(result.point);
    }
    await api.setLocationConsent({ consented: true, textVersion, systemPermission: result.permission }).catch(() => {});
  }, [textVersion]);

  const continueWithout = useCallback(async () => {
    setShowConsent(false);
    setConsented(false);
    await api.setLocationConsent({ consented: false, textVersion, systemPermission: 'denied' }).catch(() => {});
  }, [textVersion]);

  const refreshBeforePublish = useCallback(async () => {
    if (!consented) return location;
    const result = await readLocation(false);
    if (result.point) {
      setLocation(result.point);
      cacheTastingLocation(result.point);
      return result.point;
    }
    return null;
  }, [consented, location]);

  return { location, showConsent, allow, continueWithout, refreshBeforePublish };
}

export function LocationConsentPrompt({ onAllow, onSkip }: { onAllow: () => void; onSkip: () => void }) {
  return (
    <div className="location-consent" role="dialog" aria-modal="true" aria-labelledby="location-consent-title">
      <div className="location-consent-card">
        <h3 id="location-consent-title">Достоверность дегустаций</h3>
        <p>
          Разрешите доступ к геопозиции, чтобы мы могли проверять достоверность дегустаций и защищать рейтинги от накрутки. Мы проверяем местоположение только во время создания дегустации и не сохраняем историю ваших перемещений.
        </p>
        <button className="btn" type="button" onClick={onAllow}>Разрешить</button>
        <button className="btn secondary" type="button" onClick={onSkip}>Продолжить без геопроверки</button>
      </div>
    </div>
  );
}
