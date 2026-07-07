// Maps raw OpenStreetMap tags to categorized, human-readable amenities (RU).
// Returns null when nothing useful is present, so we don't store empty objects.
export function extractAmenities(t = {}) {
  const accessibility = [];
  const payments = [];
  const features = [];
  const diet = [];

  const yes = (v) => v === 'yes' || v === 'only' || v === 'designated';

  // accessibility
  if (t.wheelchair === 'yes') accessibility.push('Доступно для колясок');
  else if (t.wheelchair === 'limited') accessibility.push('Частично доступно для колясок');
  if (yes(t['toilets:wheelchair'])) accessibility.push('Доступный туалет');

  // payments
  if (yes(t['payment:cards']) || yes(t['payment:visa']) || yes(t['payment:mastercard']))
    payments.push('Карты');
  if (yes(t['payment:cash'])) payments.push('Наличные');
  if (yes(t['payment:contactless'])) payments.push('Бесконтактная оплата');
  if (yes(t['payment:qr'])) payments.push('Оплата по QR');

  // features
  if (t.internet_access === 'wlan' || t.internet_access === 'yes' || yes(t['internet_access:fee']))
    features.push('Wi-Fi');
  if (yes(t.outdoor_seating)) features.push('Веранда / летняя зона');
  if (yes(t.air_conditioning)) features.push('Кондиционер');
  if (yes(t.takeaway) || t.takeaway === 'only') features.push('Навынос');
  if (yes(t.delivery)) features.push('Доставка');
  if (yes(t.reservation) || t.reservation === 'recommended') features.push('Бронирование');
  if (yes(t.live_music)) features.push('Живая музыка');
  if (t.smoking === 'no') features.push('Не курящие');
  else if (t.smoking === 'outside' || t.smoking === 'separated') features.push('Зона для курения');
  if (yes(t.dog)) features.push('Можно с собакой');
  if (yes(t.highchair)) features.push('Детские стульчики');
  if (yes(t.drive_through)) features.push('Авто-окно (drive-through)');

  // diet / eco
  if (yes(t['diet:vegetarian'])) diet.push('Вегетарианское меню');
  if (yes(t['diet:vegan'])) diet.push('Веганское меню');
  if (yes(t['diet:halal'])) diet.push('Халяль');
  if (yes(t['diet:kosher'])) diet.push('Кошерное');
  if (yes(t['diet:gluten_free'])) diet.push('Без глютена');

  const out = {};
  if (accessibility.length) out.accessibility = accessibility;
  if (payments.length) out.payments = payments;
  if (features.length) out.features = features;
  if (diet.length) out.diet = diet;
  return Object.keys(out).length ? out : null;
}
