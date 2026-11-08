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
  { id: 'whatsapp-business', label: 'WhatsApp Business', aliases: ['whatsapp business', 'business whatsapp'], webUrl: 'https://wa.me/', androidPackage: 'com.whatsapp.w4b' },
  { id: 'youtube', label: 'YouTube', aliases: ['youtube', 'you tube', 'yt'], webUrl: 'https://www.youtube.com/', androidPackage: 'com.google.android.youtube' },
  { id: 'instagram', label: 'Instagram', aliases: ['instagram', 'insta', 'ig'], webUrl: 'https://www.instagram.com/', androidPackage: 'com.instagram.android' },
  { id: 'facebook', label: 'Facebook', aliases: ['facebook', 'fb'], webUrl: 'https://www.facebook.com/', androidPackage: 'com.facebook.katana' },
  { id: 'telegram', label: 'Telegram', aliases: ['telegram', 'tg'], webUrl: 'https://web.telegram.org/', androidPackage: 'org.telegram.messenger' },
  { id: 'snapchat', label: 'Snapchat', aliases: ['snapchat', 'snap'], webUrl: 'https://web.snapchat.com/', androidPackage: 'com.snapchat.android' },
  { id: 'x', label: 'X', aliases: ['x', 'twitter', 'x app'], webUrl: 'https://x.com/', androidPackage: 'com.twitter.android' },
  { id: 'linkedin', label: 'LinkedIn', aliases: ['linkedin'], webUrl: 'https://www.linkedin.com/', androidPackage: 'com.linkedin.android' },
  { id: 'gmail', label: 'Gmail', aliases: ['gmail', 'mail', 'email'], webUrl: 'https://mail.google.com/', androidPackage: 'com.google.android.gm' },
  { id: 'maps', label: 'Google Maps', aliases: ['maps', 'google maps', 'gmaps'], webUrl: 'https://maps.google.com/', androidPackage: 'com.google.android.apps.maps' },
  { id: 'spotify', label: 'Spotify', aliases: ['spotify', 'music app'], webUrl: 'https://open.spotify.com/', androidPackage: 'com.spotify.music' },
  { id: 'netflix', label: 'Netflix', aliases: ['netflix'], webUrl: 'https://www.netflix.com/', androidPackage: 'com.netflix.mediaclient' },
  { id: 'hotstar', label: 'JioHotstar', aliases: ['hotstar', 'jio hotstar', 'jiohotstar', 'disney hotstar'], webUrl: 'https://www.hotstar.com/', androidPackage: 'in.startv.hotstar' },
  { id: 'amazon', label: 'Amazon', aliases: ['amazon'], webUrl: 'https://www.amazon.in/', androidPackage: 'in.amazon.mShop.android.shopping' },
  { id: 'flipkart', label: 'Flipkart', aliases: ['flipkart'], webUrl: 'https://www.flipkart.com/', androidPackage: 'com.flipkart.android' },
  { id: 'zomato', label: 'Zomato', aliases: ['zomato'], webUrl: 'https://www.zomato.com/', androidPackage: 'com.application.zomato' },
  { id: 'swiggy', label: 'Swiggy', aliases: ['swiggy'], webUrl: 'https://www.swiggy.com/', androidPackage: 'in.swiggy.android' },
  { id: 'paytm', label: 'Paytm', aliases: ['paytm'], webUrl: 'https://paytm.com/', androidPackage: 'net.one97.paytm' },
  { id: 'phonepe', label: 'PhonePe', aliases: ['phonepe', 'phone pe'], webUrl: 'https://www.phonepe.com/', androidPackage: 'com.phonepe.app' },
  { id: 'gpay', label: 'Google Pay', aliases: ['google pay', 'gpay', 'g pay'], webUrl: 'https://pay.google.com/', androidPackage: 'com.google.android.apps.nbu.paisa.user' },
  { id: 'uber', label: 'Uber', aliases: ['uber'], webUrl: 'https://m.uber.com/', androidPackage: 'com.ubercab' },
  { id: 'ola', label: 'Ola', aliases: ['ola', 'ola cabs'], webUrl: 'https://book.olacabs.com/', androidPackage: 'com.olacabs.customer' },
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
