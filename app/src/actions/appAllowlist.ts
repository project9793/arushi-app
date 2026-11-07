export interface AppTarget {
  id: string;
  label: string;
  aliases: string[];
  webUrl: string;
  androidPackage?: string;
}

export const APP_ALLOWLIST: AppTarget[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    aliases: ['whatsapp', 'whats app', 'watsapp', 'wa', 'vatsapp'],
    webUrl: 'https://web.whatsapp.com/',
    androidPackage: 'com.whatsapp',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    aliases: ['youtube', 'you tube', 'yt'],
    webUrl: 'https://www.youtube.com/',
    androidPackage: 'com.google.android.youtube',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    aliases: ['instagram', 'insta', 'ig'],
    webUrl: 'https://www.instagram.com/',
    androidPackage: 'com.instagram.android',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    aliases: ['facebook', 'fb'],
    webUrl: 'https://www.facebook.com/',
    androidPackage: 'com.facebook.katana',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    aliases: ['telegram', 'tg'],
    webUrl: 'https://web.telegram.org/',
    androidPackage: 'org.telegram.messenger',
  },
  {
    id: 'gmail',
    label: 'Gmail',
    aliases: ['gmail', 'mail', 'email', 'google mail'],
    webUrl: 'https://mail.google.com/',
    androidPackage: 'com.google.android.gm',
  },
  {
    id: 'maps',
    label: 'Google Maps',
    aliases: ['maps', 'google maps', 'gmaps', 'map'],
    webUrl: 'https://maps.google.com/',
    androidPackage: 'com.google.android.apps.maps',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    aliases: ['spotify', 'music app'],
    webUrl: 'https://open.spotify.com/',
    androidPackage: 'com.spotify.music',
  },
  {
    id: 'x',
    label: 'X',
    aliases: ['x', 'twitter', 'x app'],
    webUrl: 'https://x.com/',
    androidPackage: 'com.twitter.android',
  },
  {
    id: 'chrome',
    label: 'Chrome',
    aliases: ['chrome', 'browser', 'google chrome'],
    webUrl: 'https://www.google.com/',
    androidPackage: 'com.android.chrome',
  },
  {
    id: 'phone',
    label: 'Phone',
    aliases: ['phone', 'dialer', 'dial pad', 'phone app'],
    webUrl: 'tel:',
    androidPackage: 'com.google.android.dialer',
  },
  {
    id: 'camera',
    label: 'Camera',
    aliases: ['camera'],
    webUrl: '',
    androidPackage: 'com.google.android.GoogleCamera',
  },
  {
    id: 'settings',
    label: 'Settings',
    aliases: ['settings', 'setting'],
    webUrl: '',
    androidPackage: 'com.android.settings',
  },
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
