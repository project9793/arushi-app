export interface AppTarget {
  id: string;
  label: string;
  aliases: string[];
  webUrl: string;
  androidPackage?: string;
}

/** The complete set of apps the assistant may open. Anything else is refused. */
export const APP_ALLOWLIST: AppTarget[] = [
  { id: 'whatsapp', label: 'WhatsApp', aliases: ['whatsapp', 'whats app', 'watsapp', 'wa'], webUrl: 'https://wa.me/', androidPackage: 'com.whatsapp' },
  { id: 'youtube', label: 'YouTube', aliases: ['youtube', 'you tube', 'yt'], webUrl: 'https://www.youtube.com/', androidPackage: 'com.google.android.youtube' },
  { id: 'telegram', label: 'Telegram', aliases: ['telegram', 'tg'], webUrl: 'https://web.telegram.org/', androidPackage: 'org.telegram.messenger' },
  { id: 'x', label: 'X', aliases: ['x', 'twitter', 'x app'], webUrl: 'https://x.com/', androidPackage: 'com.twitter.android' },
  { id: 'linkedin', label: 'LinkedIn', aliases: ['linkedin'], webUrl: 'https://www.linkedin.com/', androidPackage: 'com.linkedin.android' },
  { id: 'maps', label: 'Google Maps', aliases: ['maps', 'google maps', 'gmaps'], webUrl: 'https://maps.google.com/', androidPackage: 'com.google.android.apps.maps' },
  { id: 'spotify', label: 'Spotify', aliases: ['spotify', 'music app'], webUrl: 'https://open.spotify.com/', androidPackage: 'com.spotify.music' },
  { id: 'netflix', label: 'Netflix', aliases: ['netflix'], webUrl: 'https://www.netflix.com/', androidPackage: 'com.netflix.mediaclient' },
  { id: 'amazon', label: 'Amazon', aliases: ['amazon'], webUrl: 'https://www.amazon.in/', androidPackage: 'in.amazon.mShop.android.shopping' },
  { id: 'flipkart', label: 'Flipkart', aliases: ['flipkart'], webUrl: 'https://www.flipkart.com/', androidPackage: 'com.flipkart.android' },
  { id: 'chrome', label: 'Chrome', aliases: ['chrome', 'browser', 'google chrome'], webUrl: 'https://www.google.com/', androidPackage: 'com.android.chrome' },
  { id: 'phone', label: 'Phone', aliases: ['phone', 'dialer', 'dial pad'], webUrl: 'tel:', androidPackage: 'com.google.android.dialer' },
  { id: 'camera', label: 'Camera', aliases: ['camera'], webUrl: '', androidPackage: 'com.google.android.GoogleCamera' },
  { id: 'settings', label: 'Settings', aliases: ['settings', 'setting'], webUrl: '', androidPackage: 'com.android.settings' },
];

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveApp(spokenName: string): AppTarget | null {
  const query = normalise(spokenName);
  if (!query) return null;

  const exact = APP_ALLOWLIST.find(
    (app) => normalise(app.label) === query || app.aliases.some((alias) => normalise(alias) === query),
  );
  if (exact) return exact;

  const partial = APP_ALLOWLIST.find(
    (app) =>
      normalise(app.label).includes(query) ||
      query.includes(normalise(app.label)) ||
      app.aliases.some((alias) => query.includes(normalise(alias))),
  );
  return partial ?? null;
}

export function allowlistLabels(): string[] {
  return APP_ALLOWLIST.map((app) => app.label);
}
